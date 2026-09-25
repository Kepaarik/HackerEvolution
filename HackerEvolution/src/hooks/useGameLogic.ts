import { useState, useEffect, useCallback, useRef } from 'react'
import type { GameState } from '../types'
import { GENERATORS, UPGRADES, PRESTIGE_UPGRADES, ACHIEVEMENTS } from '../gameData'
import {
  getCps,
  getGeneratorCost,
  getClickPower as calcClickPower,
} from '../economy/EconomyService'
import { getPrestigeUpgradeLevel } from '../economy/PrestigeService'
import { saveService } from '../save/SaveService'
import { migrateState, getDayKey, INITIAL_STATE } from '../save/SaveMigration'
import { SaveValidation } from '../save/SaveValidation'
import { EventBus } from '../core/EventBus'
import { EVENTS } from '../core/Constants'

export const eventBus = new EventBus()

const OFFLINE_CAP_SECONDS = 2 * 60 * 60 // 2 часа базовый лимит
const OFFLINE_MIN_SECONDS = 5 * 60 // 5 минут минимум для показа

// === ХУК: Управление состоянием игры ===
export const useGameState = () => {
  const [state, setState] = useState<GameState>(INITIAL_STATE)
  const [isLoaded, setIsLoaded] = useState(false)
  const stateRef = useRef(state)
  stateRef.current = state

  // Загрузка при монтировании
  useEffect(() => {
    const loadGame = async () => {
      try {
        await saveService.init()
        const loaded = await saveService.load()

        if (loaded) {
          const validated = SaveValidation.validateState(loaded)
          if (validated) {
            const withOffline = applyOfflineProgress(loaded)
            setState(withOffline)
          } else {
            console.warn('useGameState: Loaded state failed validation, using initial')
            setState(INITIAL_STATE)
          }
        } else {
          setState(INITIAL_STATE)
        }
      } catch (error) {
        console.error('useGameState: Load failed', error)
        // Fallback на localStorage
        const raw = localStorage.getItem('he_save')
        if (raw) {
          try {
            const parsed = JSON.parse(raw)
            setState(applyOfflineProgress(migrateState(parsed)))
          } catch {
            setState(INITIAL_STATE)
          }
        } else {
          setState(INITIAL_STATE)
        }
      } finally {
        setIsLoaded(true)
      }
    }

    loadGame()
  }, [])

  // Сохранение при изменении состояния
  useEffect(() => {
    if (!isLoaded) return

    saveService.save(state)
    eventBus.emit(EVENTS.SAVE_COMPLETED)
  }, [state, isLoaded])

  // Автосохранение каждые 30 секунд
  useEffect(() => {
    if (!isLoaded) return

    saveService.startAutosave(() => stateRef.current)

    return () => {
      saveService.stopAutosave()
    }
  }, [isLoaded])

  // Сохранение при закрытии/сворачивании
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveService.saveOnExit(stateRef.current)
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        saveService.saveOnExit(stateRef.current)
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  return { state, setState, isLoaded }
}

// === Расчёт оффлайн-дохода ===
const applyOfflineProgress = (saved: GameState): GameState => {
  const now = Date.now()
  const lastSave = saved.lastSaveTime || now

  // Защита от перемотки времени назад
  if (lastSave > now) {
    return { ...saved, lastSaveTime: now }
  }

  const elapsed = Math.min((now - lastSave) / 1000, OFFLINE_CAP_SECONDS)

  if (elapsed < OFFLINE_MIN_SECONDS) {
    return { ...saved, lastSaveTime: now }
  }

  const earned = getCps(saved) * elapsed
  if (earned <= 0) {
    return { ...saved, lastSaveTime: now }
  }

  // Сохраняем для модалки (не начисляем сразу)
  try {
    sessionStorage.setItem(
      'pending_offline_reward',
      JSON.stringify({ earnings: earned, time: elapsed }),
    )
  } catch (e) {}

  return { ...saved, lastSaveTime: now }
}

// === ХУК: Доход ===
export const useIncome = (state: GameState) => {
  const getIncomePerSecond = useCallback(() => getCps(state), [state])
  const getClickPower = useCallback(() => calcClickPower(state), [state])
  return { getIncomePerSecond, getClickPower }
}

// === ХУК: Клики ===
export const useClickHandler = (
  setState: React.Dispatch<React.SetStateAction<GameState>>,
  getClickPower: () => number,
) => {
  const [clickEffects, setClickEffects] = useState<
    Array<{ id: number; x: number; y: number; amount: number }>
  >([])

  const handleHack = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      const power = getClickPower()

      setState((prev) => ({
        ...prev,
        money: prev.money + power,
        totalEarned: prev.totalEarned + power,
        totalEarnedThisRun: prev.totalEarnedThisRun + power,
        clickCount: prev.clickCount + 1,
        totalClicksAllTime: prev.totalClicksAllTime + 1,
      }))

      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const id = Date.now() + Math.random()

      setClickEffects((prev) => [...prev.slice(-20), { id, x, y, amount: power }])
    },
    [setState, getClickPower],
  )

  const removeEffect = useCallback((id: number) => {
    setClickEffects((prev) => prev.filter((e) => e.id !== id))
  }, [])

  return { clickEffects, handleHack, removeEffect }
}

// === ХУК: Автодоход ===
export const useAutoIncome = (
  setState: React.Dispatch<React.SetStateAction<GameState>>,
  getIncomePerSecond: () => number,
) => {
  useEffect(() => {
    const interval = setInterval(() => {
      const income = getIncomePerSecond()
      if (income <= 0) return

      setState((prev) => ({
        ...prev,
        money: prev.money + income,
        totalEarned: prev.totalEarned + income,
        totalEarnedThisRun: prev.totalEarnedThisRun + income,
      }))
    }, 1000)

    return () => clearInterval(interval)
  }, [setState, getIncomePerSecond])
}

// === ХУК: Достижения ===
export const useAchievements = (
  state: GameState,
  setState: React.Dispatch<React.SetStateAction<GameState>>,
) => {
  useEffect(() => {
    const newAchievements: string[] = []

    for (const achievement of ACHIEVEMENTS) {
      if (state.achievements.includes(achievement.id)) continue

      let unlocked = false
      switch (achievement.condition.type) {
        case 'clicks':
          unlocked = state.totalClicksAllTime >= achievement.condition.value
          break
        case 'generators':
          unlocked = state.generatorsOwned >= achievement.condition.value
          break
        case 'money':
          unlocked = state.totalEarned >= achievement.condition.value
          break
        case 'prestige':
          unlocked = state.prestigeCount >= achievement.condition.value
          break
      }

      if (unlocked) {
        newAchievements.push(achievement.id)
      }
    }

    if (newAchievements.length > 0) {
      setState((prev) => ({
        ...prev,
        achievements: [...prev.achievements, ...newAchievements],
      }))
      eventBus.emit(EVENTS.ACHIEVEMENT_UNLOCKED, newAchievements)
    }
  }, [
    state.totalClicksAllTime,
    state.generatorsOwned,
    state.totalEarned,
    state.prestigeCount,
  ])
}

// === ХУК: Прогрессия глав ===
export const useChapterProgression = (
  state: GameState,
  setState: React.Dispatch<React.SetStateAction<GameState>>,
) => {
  const advanceChapter = useCallback(() => {
    setState((prev) => {
      const nextChapter = Math.min(prev.currentChapter + 1, 4)
      return { ...prev, currentChapter: nextChapter, viewChapter: nextChapter }
    })
  }, [setState])

  return { advanceChapter }
}

// === ХУК: Покупка генераторов ===
export const useGeneratorPurchase = (
  state: GameState,
  setState: React.Dispatch<React.SetStateAction<GameState>>,
) => {
  const buyGenerator = useCallback(
    (genId: string) => {
      setState((prev) => {
        const gen = GENERATORS.find((g) => g.id === genId)
        if (!gen) return prev

        const owned = prev.generators[genId] || 0
        const cost = getGeneratorCost(gen.baseCost, gen.costGrowth, owned)

        if (prev.money < cost) return prev

        const newGenerators = { ...prev.generators, [genId]: owned + 1 }
        const totalOwned = Object.values(newGenerators).reduce((a, b) => a + b, 0)

        return {
          ...prev,
          money: prev.money - cost,
          generators: newGenerators,
          generatorsOwned: totalOwned,
        }
      })
    },
    [setState],
  )

  const getCost = useCallback(
    (genId: string) => {
      const gen = GENERATORS.find((g) => g.id === genId)
      if (!gen) return Infinity
      const owned = state.generators[genId] || 0
      return getGeneratorCost(gen.baseCost, gen.costGrowth, owned)
    },
    [state.generators],
  )

  return { buyGenerator, getCost }
}

// === ХУК: Покупка апгрейдов ===
export const useUpgradePurchase = (
  state: GameState,
  setState: React.Dispatch<React.SetStateAction<GameState>>,
) => {
  const buyUpgrade = useCallback(
    (upgradeId: string) => {
      setState((prev) => {
        const upgrade = UPGRADES.find((u) => u.id === upgradeId)
        if (!upgrade || prev.upgrades.includes(upgradeId)) return prev

        if (upgrade.dataCost !== undefined) {
          if ((prev.data ?? 0) < upgrade.dataCost) return prev
          return {
            ...prev,
            data: (prev.data ?? 0) - upgrade.dataCost,
            upgrades: [...prev.upgrades, upgradeId],
          }
        }

        if (prev.money < upgrade.cost) return prev

        return {
          ...prev,
          money: prev.money - upgrade.cost,
          upgrades: [...prev.upgrades, upgradeId],
        }
      })
    },
    [setState],
  )

  return { buyUpgrade }
}

// === ХУК: Престиж ===
export const usePrestige = (
  state: GameState,
  setState: React.Dispatch<React.SetStateAction<GameState>>,
) => {
  const [screenOpen, setScreenOpen] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  const coresToGain = Math.floor(Math.sqrt(state.totalEarnedThisRun / 1_000_000))
  const available = coresToGain >= 1 && state.totalEarnedThisRun >= 1_000_000
  const teaserVisible = state.totalEarnedThisRun >= 500_000

  const openPrestigeScreen = () => setScreenOpen(true)
  const closePrestigeScreen = () => setScreenOpen(false)

  const doPrestige = useCallback(() => {
    if (!available) return

    setIsAnimating(true)
    setScreenOpen(false)

    setTimeout(() => {
      setState((prev) => ({
        ...INITIAL_STATE,
        // Сохраняем мета-прогресс
        quantumCores: prev.quantumCores + coresToGain,
        prestigeCount: prev.prestigeCount + 1,
        prestigeUpgrades: prev.prestigeUpgrades,
        totalClicksAllTime: prev.totalClicksAllTime,
        totalEarned: prev.totalEarned,
        achievements: prev.achievements,
        data: prev.data,
        fragments: prev.fragments,
        technologies: prev.technologies,
        chaptersUnlockedForever: prev.chaptersUnlockedForever,
        minigameStats: prev.minigameStats,
        questsCompleted: prev.questsCompleted,
        lastSaveTime: Date.now(),
        currentChapter: Math.max(1, prev.currentChapter),
      }))

      setIsAnimating(false)
      eventBus.emit(EVENTS.PRESTIGE_COMPLETED, { cores: coresToGain })
    }, 2000)
  }, [available, coresToGain, setState])

  return {
    screenOpen,
    isAnimating,
    available,
    teaserVisible,
    preview: {
      coresToGain,
      progress: Math.min(1, state.totalEarnedThisRun / 1_000_000),
      keeps: ['Данные', 'Ядра', 'Фрагменты', 'Достижения', 'Престиж-апгрейды'],
      resets: ['Генераторы', 'Вычисления', 'Обычные апгрейды'],
      unlocks: state.prestigeCount === 0 ? ['Глава 2', 'Квантовые протоколы'] : [],
    },
    openPrestigeScreen,
    closePrestigeScreen,
    doPrestige,
  }
}

// === ХУК: Престиж-апгрейды ===
export const usePrestigeUpgrades = (
  state: GameState,
  setState: React.Dispatch<React.SetStateAction<GameState>>,
) => {
  const buyPrestigeUpgrade = useCallback(
    (upgradeId: string) => {
      setState((prev) => {
        const upgrade = PRESTIGE_UPGRADES.find((u) => u.id === upgradeId)
        if (!upgrade) return prev

        const currentLevel = prev.prestigeUpgrades[upgradeId] || 0
        const maxLevel = upgrade.maxLevel || 1
        if (currentLevel >= maxLevel) return prev
        if (prev.quantumCores < upgrade.cost) return prev

        return {
          ...prev,
          quantumCores: prev.quantumCores - upgrade.cost,
          prestigeUpgrades: {
            ...prev.prestigeUpgrades,
            [upgradeId]: currentLevel + 1,
          },
        }
      })
    },
    [setState],
  )

  return { buyPrestigeUpgrade }
}

// === ХУК: Квесты ===
export const useQuests = (
  state: GameState,
  setState: React.Dispatch<React.SetStateAction<GameState>>,
) => {
  const claimQuest = useCallback(
    (questId: string) => {
      setState((prev) => {
        const quest = prev.quests.find((q) => q.id === questId)
        if (!quest || !quest.completed || quest.claimed) return prev

        return {
          ...prev,
          money: prev.money + (quest.rewardMoney || 0),
          data: (prev.data ?? 0) + (quest.rewardData || 0),
          quests: prev.quests.map((q) =>
            q.id === questId ? { ...q, claimed: true } : q,
          ),
          questsCompleted: prev.questsCompleted + 1,
        }
      })
    },
    [setState],
  )

  return { claimQuest }
}

// === ХУК: Мини-игры ===
export const useMinigames = (
  state: GameState,
  setState: React.Dispatch<React.SetStateAction<GameState>>,
) => {
  const [active, setActive] = useState<any>(null)
  const available = Date.now() - state.lastMinigameAt > 12 * 60 * 1000

  const startMinigame = useCallback((id: string) => {
    setActive({ id })
  }, [])

  const dismissMinigame = useCallback(() => {
    setActive(null)
  }, [])

  const finishMinigame = useCallback(
    (result: { won: boolean; reward: number }) => {
      setState((prev) => ({
        ...prev,
        data:
          (prev.data ?? 0) +
          (result.won ? result.reward : Math.floor(result.reward * 0.2)),
        lastMinigameAt: Date.now(),
        minigamesPlayed: prev.minigamesPlayed + 1,
        minigamesCompleted: prev.minigamesCompleted + (result.won ? 1 : 0),
      }))
      setActive(null)
    },
    [setState],
  )

  return { available, active, startMinigame, dismissMinigame, finishMinigame }
}

// === ХУК: Пассивные данные ===
export const usePassiveData = (
  setState: React.Dispatch<React.SetStateAction<GameState>>,
) => {
  useEffect(() => {
    const interval = setInterval(() => {
      setState((prev) => {
        if (prev.currentChapter < 2) return prev
        // Пассивная добыча данных в главе 2+
        const rate = 0.001 // ~1 данные за ~16 минут
        return { ...prev, data: (prev.data ?? 0) + rate }
      })
    }, 60000) // Каждую минуту

    return () => clearInterval(interval)
  }, [setState])
}

// === ХУК: Технологии ===
export const useTechnologies = (
  state: GameState,
  setState: React.Dispatch<React.SetStateAction<GameState>>,
) => {
  const buyTechnology = useCallback(
    (techId: string) => {
      setState((prev) => {
        if ((prev.technologies || []).includes(techId)) return prev
        // Стоимость технологии (упрощённо)
        const cost = 10
        if ((prev.data ?? 0) < cost) return prev

        return {
          ...prev,
          data: (prev.data ?? 0) - cost,
          technologies: [...(prev.technologies || []), techId],
        }
      })
    },
    [setState],
  )

  return { buyTechnology }
}

// === ХУК: Навигация по этапам ===
export const useStageNavigation = (
  setState: React.Dispatch<React.SetStateAction<GameState>>,
) => {
  const setViewChapter = useCallback(
    (chapter: number) => {
      setState((prev) => ({ ...prev, viewChapter: chapter }))
    },
    [setState],
  )

  return { setViewChapter }
}

// === ХУК: Фрагменты-майлстоуны ===
export const useStageFragmentMilestones = (
  state: GameState,
  setState: React.Dispatch<React.SetStateAction<GameState>>,
) => {
  // Автоматическая выдача фрагментов при достижении порогов
  useEffect(() => {
    const milestones = [
      { at: 100_000, fragments: 1 },
      { at: 1_000_000, fragments: 2 },
      { at: 10_000_000, fragments: 3 },
      { at: 100_000_000, fragments: 5 },
      { at: 1_000_000_000, fragments: 10 },
    ]

    for (const milestone of milestones) {
      if (
        state.totalEarned >= milestone.at &&
        (state.fragments ?? 0) < milestone.fragments
      ) {
        setState((prev) => ({
          ...prev,
          fragments: Math.min(100, milestone.fragments),
        }))
        break
      }
    }
  }, [state.totalEarned])
}
