import { useEffect, useRef, useState } from 'react'
import { GameState, ClickEffect } from '../types'
import {
  GENERATORS,
  UPGRADES,
  ACHIEVEMENTS,
  CHAPTERS,
  MAX_CHAPTER,
  getChapterUnlockProgress,
  SPACE_STAGES,
} from '../gameData'
import { gameLoop } from '../core/GameLoop'
import { eventBus, EVENTS } from '../core/EventBus'
import {
  SAVE_KEY,
  OFFLINE_CAP_SECONDS,
  OFFLINE_MIN_SECONDS,
  CHAPTER_ORBIT,
  PASSIVE_DATA_GENERATORS_PER,
  PASSIVE_DATA_DAILY_CAP,
  STAGE_PROGRESS_MILESTONES,
  TOTAL_FRAGMENTS,
  PRESTIGE_THRESHOLD,
  MINIGAME_COOLDOWN_MS,
} from '../core/Constants'
import { clampElapsed } from '../utils/TimeUtils'
import { formatNumber } from '../utils/NumberFormatter'
import {
  getCps,
  getClickPower,
  computeManualClick,
  getGeneratorCost,
  getBulkCost,
  getMaxAffordable,
  isUpgradeAvailable,
} from '../economy/EconomyService'
import {
  canPrestige,
  getCoresPreview,
  applyPrestige,
  buyPrestigeUpgradeState,
  getPrestigeUpgradeCost,
  getEffectiveBaseCost,
  getPrestigePreview,
} from '../economy/PrestigeService'
import type { PrestigePreview } from '../economy/PrestigeService'
import { coresResource } from '../resources/CoresResource'
import { dataResource } from '../resources/DataResource'
import {
  MINIGAMES,
  calculateMinigameReward,
  applyMinigameResult,
  isMinigameAvailable,
  dayKey,
} from '../economy/MinigameService'
import type { MinigameReward } from '../economy/MinigameService'
import {
  ensureDailyQuests,
  refreshQuestProgress,
  claimQuestReward,
} from '../economy/QuestService'
import type { MinigameRecord } from '../types'
import { fragmentsResource } from '../resources/FragmentsResource'
import {
  buyTechnologyState,
  hasTechnology,
  isStageUnlockedForever,
} from '../economy/TechnologyService'
import { GENERATORS as ALL_GENERATORS } from '../gameData'
import {
  tickPassiveData,
  setViewChapterState,
  getPassiveDataRatePerHour,
} from '../economy/PassiveDataService'
import { saveService } from '../save/SaveService'
import { migrateState } from '../save/SaveMigration'
import { SaveValidation } from '../save/SaveValidation'

export type BuyAmount = 1 | 10 | 25 | 'MAX'

const INITIAL_STATE: GameState = {
  money: 0,
  totalEarned: 0,
  clickCount: 0,
  generators: {},
  upgrades: [],
  achievements: [],
  currentChapter: 1,
  lastSaveTime: Date.now(),
  generatorsOwned: 0,
  quantumCores: 0,
  totalEarnedThisRun: 0,
  prestigeCount: 0,
  prestigeUpgrades: {},
  totalClicksAllTime: 0,
  data: 0,
  minigameStats: { date: dayKey(), fullRewards: 0, dataEarned: 0, wonByGame: {} },
  lastMinigameAt: 0,
  minigamesPlayed: 0,
  minigamesCompleted: 0,
  quests: [],
  questsDate: '',
  questBaselines: {
    totalClicks: 0,
    generatorsOwned: 0,
    totalEarned: 0,
    upgradesCount: 0,
    minigamesCompleted: 0,
  },
  questsCompleted: 0,
  fragments: 0,
  technologies: [],
  chaptersUnlockedForever: [],
  viewChapter: 1,
  passiveData: { date: dayKey(), todayEarned: 0, fractional: 0 },
}

GENERATORS.forEach((g) => {
  if (!INITIAL_STATE.generators[g.id]) INITIAL_STATE.generators[g.id] = 0
})

/**
 * Расчёт офлайн-дохода: НЕ начисляем сразу, а сохраняем в sessionStorage
 * для показа модалки OfflineRewardModal (ТЗ 26.3)
 */
const applyOfflineProgress = (saved: GameState): GameState => {
  const now = Date.now()
  const elapsed = Math.min(
    clampElapsed(saved.lastSaveTime || now, OFFLINE_CAP_SECONDS),
    OFFLINE_CAP_SECONDS,
  )

  if (elapsed < OFFLINE_MIN_SECONDS) {
    return { ...saved, lastSaveTime: now }
  }

  const earned = getCps(saved) * elapsed
  if (earned <= 0) {
    return { ...saved, lastSaveTime: now }
  }

  // Сохраняем данные для модалки — начислит App.tsx при клике "Забрать"
  try {
    sessionStorage.setItem(
      'pending_offline_reward',
      JSON.stringify({ earnings: earned, time: elapsed }),
    )
  } catch {}

  return { ...saved, lastSaveTime: now }
}

// ===== ЭТАП 12: Сохранения через IndexedDB + SaveService =====
export const useGameState = () => {
  const [state, setState] = useState<GameState>(INITIAL_STATE)
  const [isLoaded, setIsLoaded] = useState(false)
  const stateRef = useRef(state)
  stateRef.current = state

  // Загрузка из IndexedDB при монтировании
  useEffect(() => {
    const loadGame = async () => {
      try {
        await saveService.init()
        const loaded = await saveService.load()

        if (loaded) {
          if (SaveValidation.validateState(loaded)) {
            setState(applyOfflineProgress(loaded))
          } else {
            console.warn('useGameState: Save validation failed, using initial state')
            setState(INITIAL_STATE)
          }
        } else {
          // Fallback: старый localStorage сейв
          const raw = localStorage.getItem(SAVE_KEY)
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
        }
      } catch (error) {
        console.error(
          'useGameState: IndexedDB load failed, fallback to localStorage',
          error,
        )
        const raw = localStorage.getItem(SAVE_KEY)
        if (raw) {
          try {
            const parsed = JSON.parse(raw)
            setState(applyOfflineProgress(migrateState(parsed)))
          } catch {
            setState(INITIAL_STATE)
          }
        }
      } finally {
        setIsLoaded(true)
      }
    }

    loadGame()
  }, [])

  // Сохранение через SaveService при каждом изменении state
  useEffect(() => {
    if (!isLoaded) return

    saveService.save(state)
    coresResource.setAmount(state.quantumCores)
    dataResource.setAmount(state.data)
    fragmentsResource.setAmount(state.fragments ?? 0)
    eventBus.emit(EVENTS.SAVE_COMPLETED)
  }, [state, isLoaded])

  // Автосохранение каждые 30 секунд
  useEffect(() => {
    if (!isLoaded) return
    saveService.startAutosave(() => stateRef.current)
    return () => saveService.stopAutosave()
  }, [isLoaded])

  // Сохранение при закрытии/сворачивании вкладки
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

export const useIncome = (state: GameState) => {
  const getIncomePerSecond = () => getCps(state)
  const getClickPowerValue = () => getClickPower(state)
  return { getIncomePerSecond, getClickPower: getClickPowerValue }
}

export const useClickHandler = (
  setState: React.Dispatch<React.SetStateAction<GameState>>,
  _getClickPower: () => number,
) => {
  const [clickEffects, setClickEffects] = useState<ClickEffect[]>([])
  const stateRef = useRef<GameState | null>(null)
  const nextEffectIdRef = useRef(1)

  const handleHack = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = Math.random() * (rect.width - 40)
    const y = Math.random() * (rect.height - 20)

    setState((prev) => {
      stateRef.current = prev
      const cps = getCps(prev)
      const { value, crit } = computeManualClick(prev, cps)

      const effectId = nextEffectIdRef.current++
      const newEffect: ClickEffect = {
        id: effectId,
        x,
        y,
        value: `${crit ? 'КРИТ ' : ''}+${formatNumber(value, 'compact')}`,
        crit,
      }
      setClickEffects((fx) => [...fx, newEffect])

      if (crit) {
        eventBus.emit(EVENTS.COMPUTE_CHANGED, { value, delta: value })
      }

      return {
        ...prev,
        money: prev.money + value,
        totalEarned: prev.totalEarned + value,
        totalEarnedThisRun: prev.totalEarnedThisRun + value,
        clickCount: prev.clickCount + 1,
      }
    })
  }

  const removeEffect = (id: number) => {
    setClickEffects((prev) => prev.filter((e) => e.id !== id))
  }

  return { clickEffects, handleHack, removeEffect }
}

export const useAutoIncome = (
  setState: React.Dispatch<React.SetStateAction<GameState>>,
  getIncomePerSecond: () => number,
) => {
  const incomeFnRef = useRef(getIncomePerSecond)
  incomeFnRef.current = getIncomePerSecond

  useEffect(() => {
    const unsubscribeTick = gameLoop.onTick(() => {
      const income = incomeFnRef.current()
      if (income > 0) {
        setState((prev) => ({
          ...prev,
          money: prev.money + income,
          totalEarned: prev.totalEarned + income,
          totalEarnedThisRun: prev.totalEarnedThisRun + income,
        }))
        eventBus.emit(EVENTS.COMPUTE_CHANGED, { value: income, delta: income })
      }
    })
    return unsubscribeTick
  }, [setState])
}

export const useAchievements = (
  state: GameState,
  setState: React.Dispatch<React.SetStateAction<GameState>>,
) => {
  useEffect(() => {
    const newAchievements = [...state.achievements]
    let changed = false
    let dataReward = 0
    let fragmentReward = 0

    ACHIEVEMENTS.forEach((ach) => {
      if (!newAchievements.includes(ach.id) && ach.condition(state)) {
        newAchievements.push(ach.id)
        changed = true
        dataReward += ach.rewardData ?? 0
        fragmentReward += ach.rewardFragments ?? 0
        eventBus.emit(EVENTS.ACHIEVEMENT_UNLOCKED, { id: ach.id, name: ach.name })
      }
    })

    if (changed) {
      setState((prev) => ({
        ...prev,
        achievements: newAchievements,
        data: prev.data + dataReward,
        fragments: Math.min(TOTAL_FRAGMENTS, (prev.fragments ?? 0) + fragmentReward),
      }))
      if (fragmentReward > 0) {
        eventBus.emit(EVENTS.FRAGMENTS_CHANGED, {
          value: Math.min(TOTAL_FRAGMENTS, state.fragments + fragmentReward),
          delta: fragmentReward,
        })
      }
    }
  }, [
    state.totalEarned,
    state.clickCount,
    state.money,
    state.achievements,
    state.generators,
    state.fragments,
    setState,
  ])
}

export const useChapterProgression = (
  state: GameState,
  setState: React.Dispatch<React.SetStateAction<GameState>>,
) => {
  const nextChapter = state.currentChapter + 1
  const nextInfo = nextChapter <= MAX_CHAPTER ? CHAPTERS[nextChapter - 1] : null
  const canAdvance = !!nextInfo && state.totalEarnedThisRun >= nextInfo.unlockAt
  const unlockProgress = getChapterUnlockProgress(state.totalEarnedThisRun)

  const advanceChapter = () => {
    setState((prev) => {
      if (prev.currentChapter >= MAX_CHAPTER) return prev
      const info = CHAPTERS[prev.currentChapter]
      if (!info || prev.totalEarnedThisRun < info.unlockAt) return prev
      const next = { ...prev, currentChapter: prev.currentChapter + 1 }
      eventBus.emit(EVENTS.CHAPTER_CHANGED, { chapter: next.currentChapter })
      return next
    })
  }

  return { canAdvance, unlockProgress, advanceChapter }
}

export const useGeneratorPurchase = (
  state: GameState,
  setState: React.Dispatch<React.SetStateAction<GameState>>,
) => {
  const getCost = (genId: string, amount: BuyAmount): { count: number; cost: number } => {
    const gen = GENERATORS.find((g) => g.id === genId)
    if (!gen) return { count: 0, cost: Infinity }
    const owned = state.generators[genId] || 0
    const baseCost = getEffectiveBaseCost(genId, gen.baseCost, state)
    if (amount === 'MAX') {
      const count = getMaxAffordable(baseCost, gen.costGrowth, owned, state.money)
      return { count, cost: getBulkCost(baseCost, gen.costGrowth, owned, count) }
    }
    return {
      count: amount,
      cost: getBulkCost(baseCost, gen.costGrowth, owned, amount),
    }
  }

  const buyGenerator = (genId: string, amount: BuyAmount = 1) => {
    const gen = GENERATORS.find((g) => g.id === genId)
    if (!gen) return

    const owned = state.generators[genId] || 0
    const baseCost = getEffectiveBaseCost(genId, gen.baseCost, state)
    let count: number
    let cost: number

    if (amount === 'MAX') {
      count = getMaxAffordable(baseCost, gen.costGrowth, owned, state.money)
      cost = getBulkCost(baseCost, gen.costGrowth, owned, count)
    } else {
      count = amount
      cost = getBulkCost(baseCost, gen.costGrowth, owned, count)
    }

    if (count <= 0 || state.money < cost) return

    setState((prev) => ({
      ...prev,
      money: prev.money - cost,
      generators: { ...prev.generators, [genId]: owned + count },
      generatorsOwned: prev.generatorsOwned + count,
    }))
    eventBus.emit(EVENTS.GENERATOR_BOUGHT, { generatorId: genId, count, cost })
  }

  return {
    buyGenerator,
    getCost,
    getSingleCost: (genId: string) => {
      const gen = GENERATORS.find((g) => g.id === genId)
      if (!gen) return Infinity
      return getGeneratorCost(
        getEffectiveBaseCost(genId, gen.baseCost, state),
        gen.costGrowth,
        state.generators[genId] || 0,
      )
    },
  }
}

export const useUpgradePurchase = (
  state: GameState,
  setState: React.Dispatch<React.SetStateAction<GameState>>,
) => {
  const buyUpgrade = (upgradeId: string) => {
    const upgrade = UPGRADES.find((u) => u.id === upgradeId)
    if (!upgrade) return
    if (!isUpgradeAvailable(upgradeId, state)) return

    if (upgrade.dataCost !== undefined) {
      setState((prev) => ({
        ...prev,
        data: prev.data - (upgrade.dataCost ?? 0),
        upgrades: [...prev.upgrades, upgradeId],
        passiveData: { date: dayKey(), todayEarned: 0, fractional: 0 },
      }))
      eventBus.emit(EVENTS.UPGRADE_BOUGHT, { upgradeId, currency: 'data' })
      return
    }

    if (state.money >= upgrade.cost) {
      setState((prev) => ({
        ...prev,
        money: prev.money - upgrade.cost,
        upgrades: [...prev.upgrades, upgradeId],
      }))
      eventBus.emit(EVENTS.UPGRADE_BOUGHT, { upgradeId })
    }
  }

  return { buyUpgrade }
}

export const usePrestige = (
  state: GameState,
  setState: React.Dispatch<React.SetStateAction<GameState>>,
) => {
  const [isAnimating, setIsAnimating] = useState(false)
  const [screenOpen, setScreenOpen] = useState(false)

  const coresPreview = getCoresPreview(state)
  const preview: PrestigePreview = getPrestigePreview(state)
  const available = canPrestige(state)
  const teaserVisible = state.totalEarnedThisRun >= PRESTIGE_THRESHOLD * 0.5

  const openPrestigeScreen = () => setScreenOpen(true)
  const closePrestigeScreen = () => {
    if (!isAnimating) setScreenOpen(false)
  }

  const doPrestige = () => {
    if (!available || isAnimating) return
    setIsAnimating(true)
    const gained = coresPreview.total
    window.setTimeout(() => {
      setState((prev) => {
        if (!canPrestige(prev)) return prev
        const next = applyPrestige(prev)
        eventBus.emit(EVENTS.CORES_CHANGED, {
          value: next.quantumCores,
          delta: gained,
        })
        return next
      })
      eventBus.emit(EVENTS.PRESTIGE_COMPLETED, { coresGained: gained })
      setIsAnimating(false)
      setScreenOpen(false)
    }, 1500)
  }

  return {
    coresPreview,
    preview,
    available,
    teaserVisible,
    doPrestige,
    isAnimating,
    screenOpen,
    openPrestigeScreen,
    closePrestigeScreen,
  }
}

export const usePrestigeUpgrades = (
  state: GameState,
  setState: React.Dispatch<React.SetStateAction<GameState>>,
) => {
  const buyPrestigeUpgrade = (upgradeId: string) => {
    let purchased = false
    setState((prev) => {
      const next = buyPrestigeUpgradeState(upgradeId, prev)
      if (!next) return prev
      purchased = true
      return next
    })
    if (purchased) {
      eventBus.emit(EVENTS.UPGRADE_BOUGHT, { upgradeId, currency: 'cores' })
      eventBus.emit(EVENTS.CORES_CHANGED, {
        value: state.quantumCores - getPrestigeUpgradeCost(upgradeId, state),
        delta: -getPrestigeUpgradeCost(upgradeId, state),
      })
    }
  }

  return { buyPrestigeUpgrade }
}

export const useQuests = (
  state: GameState,
  setState: React.Dispatch<React.SetStateAction<GameState>>,
) => {
  useEffect(() => {
    setState((prev) => ensureDailyQuests(prev))
  }, [setState])

  useEffect(() => {
    const unsubscribe = gameLoop.onTick(() => {
      setState((prev) => refreshQuestProgress(prev))
    })
    return unsubscribe
  }, [setState])

  const claimQuest = (questId: string) => {
    setState((prev) => claimQuestReward(prev, questId).state)
  }

  return { claimQuest }
}

export interface ActiveMinigame {
  id: string
}

export const useMinigames = (
  state: GameState,
  setState: React.Dispatch<React.SetStateAction<GameState>>,
) => {
  const [active, setActive] = useState<ActiveMinigame | null>(null)
  const dismissedAtRef = useRef(0)
  const stateRef = useRef(state)
  stateRef.current = state

  const [, forceRender] = useState(0)
  useEffect(() => {
    const unsubscribe = gameLoop.onTick(() => forceRender((n) => n + 1))
    return unsubscribe
  }, [])

  const available =
    active === null &&
    isMinigameAvailable(state) &&
    Date.now() - dismissedAtRef.current >= MINIGAME_COOLDOWN_MS

  const startMinigame = (id: string) => {
    if (!MINIGAMES[id as keyof typeof MINIGAMES]) return
    setActive({ id })
    eventBus.emit(EVENTS.MINIGAME_STARTED, { minigameId: id })
  }

  const dismissMinigame = () => {
    setActive(null)
    dismissedAtRef.current = Date.now()
  }

  const finishMinigame = (won: boolean, score = 0) => {
    const id = active?.id
    if (!id) return
    const prev = stateRef.current
    const cps = getCps(prev)
    const params = MINIGAMES[id as keyof typeof MINIGAMES]
    const actualWon = won && score >= params.winThreshold
    const reward = calculateMinigameReward(id, actualWon, prev, cps)
    const record: MinigameRecord = {
      minigameId: id,
      won: actualWon,
      finishedAt: Date.now(),
    }
    setState((s) => applyMinigameResult(s, id, reward, record))
    eventBus.emit(EVENTS.MINIGAME_COMPLETED, { minigameId: id, reward: reward.data })
    if (reward.compute > 0) {
      eventBus.emit(EVENTS.COMPUTE_CHANGED, {
        value: reward.compute,
        delta: reward.compute,
      })
    }
    setActive(null)
  }

  return { active, available, startMinigame, dismissMinigame, finishMinigame }
}

export const usePassiveData = (
  setState: React.Dispatch<React.SetStateAction<GameState>>,
) => {
  useEffect(() => {
    const unsubscribe = gameLoop.onTick(() => {
      setState((prev) => {
        const next = tickPassiveData(prev, 1)
        if (next !== prev && getPassiveDataRatePerHour(prev) >= 3600) {
          eventBus.emit(EVENTS.DATA_CHANGED, {
            value: next.data,
            delta: next.data - prev.data,
          })
        }
        return next
      })
    })
    return unsubscribe
  }, [setState])
}

export const useTechnologies = (
  state: GameState,
  setState: React.Dispatch<React.SetStateAction<GameState>>,
) => {
  const buyTechnology = (techId: string) => {
    let purchased = false
    setState((prev) => {
      const next = buyTechnologyState(prev, techId)
      if (!next) return prev
      purchased = true
      return next
    })
    if (purchased) {
      eventBus.emit(EVENTS.TECHNOLOGY_PURCHASED, { technologyId: techId })
    }
  }

  return { buyTechnology, hasTechnology }
}

export const useStageNavigation = (
  setState: React.Dispatch<React.SetStateAction<GameState>>,
) => {
  const setViewChapter = (chapter: number) => {
    setState((prev) => {
      const next = setViewChapterState(prev, chapter)
      if (next !== prev) {
        eventBus.emit(EVENTS.CHAPTER_CHANGED, { chapter })
      }
      return next
    })
  }
  return { setViewChapter }
}

export const useStageFragmentMilestones = (
  state: GameState,
  setState: React.Dispatch<React.SetStateAction<GameState>>,
) => {
  useEffect(() => {
    const earned = new Set(state.achievements ?? [])
    const newFlags: string[] = []
    let reward = 0

    for (const stage of SPACE_STAGES) {
      if (!(state.chaptersUnlockedForever ?? []).includes(stage.chapter)) continue
      const owned = state.generators[stage.starterGeneratorId] ?? 0
      STAGE_PROGRESS_MILESTONES.forEach((m) => {
        const flag = `milestone:${stage.chapter}:${m.count}`
        if (owned >= m.count && !earned.has(flag)) {
          newFlags.push(flag)
          reward += m.fragments
        }
      })
    }

    if (reward > 0) {
      setState((prev) => ({
        ...prev,
        achievements: [...prev.achievements, ...newFlags],
        fragments: Math.min(TOTAL_FRAGMENTS, (prev.fragments ?? 0) + reward),
      }))
      eventBus.emit(EVENTS.FRAGMENTS_CHANGED, {
        value: Math.min(TOTAL_FRAGMENTS, state.fragments + reward),
        delta: reward,
      })
    }
  }, [state.generators, state.chaptersUnlockedForever, state.achievements, setState])
}
