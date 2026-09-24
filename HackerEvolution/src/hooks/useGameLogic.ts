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
import { PRESTIGE_THRESHOLD, MINIGAME_COOLDOWN_MS } from '../core/Constants'
import { coresResource } from '../resources/CoresResource'
// ===== Этап 5: Данные, мини-игры, ежедневные квесты (ТЗ 4.2, 19–23, 27.1) =====
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
// ===== Этап 6: Фрагменты, технологии, космические этапы (ТЗ 8–10, 29) =====
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
  // Этап 4: престиж-система
  quantumCores: 0,
  totalEarnedThisRun: 0,
  prestigeCount: 0,
  prestigeUpgrades: {},
  totalClicksAllTime: 0,
  // Этап 5: Данные, мини-игры, квесты
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
  // Этап 6: Фрагменты, технологии, космические этапы
  fragments: 0,
  technologies: [],
  chaptersUnlockedForever: [],
  viewChapter: 1,
  passiveData: { date: dayKey(), todayEarned: 0, fractional: 0 },
}

/**
 * Миграция сохранений: добавляет поля престижа (Этап 4) и полей Этапа 5
 * в сейвы предыдущих версий, инициализирует заработанное за забег.
 */
const migrateState = (saved: Partial<GameState>): GameState => ({
  ...INITIAL_STATE,
  ...saved,
  prestigeUpgrades: saved.prestigeUpgrades ?? {},
  quantumCores: saved.quantumCores ?? 0,
  prestigeCount: saved.prestigeCount ?? 0,
  totalClicksAllTime: saved.totalClicksAllTime ?? saved.clickCount ?? 0,
  totalEarnedThisRun: saved.totalEarnedThisRun ?? saved.totalEarned ?? 0,
  // Этап 5
  data: saved.data ?? 0,
  minigameStats: saved.minigameStats ?? INITIAL_STATE.minigameStats,
  lastMinigameAt: saved.lastMinigameAt ?? 0,
  minigamesPlayed: saved.minigamesPlayed ?? 0,
  minigamesCompleted: saved.minigamesCompleted ?? 0,
  quests: saved.quests ?? [],
  questsDate: saved.questsDate ?? '',
  questBaselines: saved.questBaselines ?? INITIAL_STATE.questBaselines,
  questsCompleted: saved.questsCompleted ?? 0,
  // Этап 6: Фрагменты, технологии, космические этапы (миграция старых сейвов)
  fragments: saved.fragments ?? 0,
  technologies: saved.technologies ?? [],
  chaptersUnlockedForever: saved.chaptersUnlockedForever ?? [],
  viewChapter: saved.viewChapter ?? 1,
  passiveData: saved.passiveData ?? INITIAL_STATE.passiveData,
})

GENERATORS.forEach((g) => {
  if (!INITIAL_STATE.generators[g.id]) INITIAL_STATE.generators[g.id] = 0
})

// Расчёт оффлайн-дохода по сохранению (Этап 8): CPS считается через EconomyService
const applyOfflineProgress = (saved: GameState): GameState => {
  const now = Date.now()
  // clampElapsed учитывает защиту от перемотки времени назад
  const elapsed = Math.min(
    clampElapsed(saved.lastSaveTime || now, OFFLINE_CAP_SECONDS),
    OFFLINE_CAP_SECONDS,
  )
  if (elapsed < OFFLINE_MIN_SECONDS) return { ...saved, lastSaveTime: now }

  // Крит и ручные клики в оффлайне не участвуют (ТЗ 13.3) — только пассивный доход
  const earned = getCps(saved) * elapsed
  if (earned <= 0) return { ...saved, lastSaveTime: now }

  return {
    ...saved,
    money: saved.money + earned,
    totalEarned: saved.totalEarned + earned,
    // Этап 4: оффлайн-доход тоже идёт в прогресс текущего забега (ТЗ 24.4)
    totalEarnedThisRun: saved.totalEarnedThisRun + earned,
    lastSaveTime: now,
  }
}

export const useGameState = () => {
  const [state, setState] = useState<GameState>(() => {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return INITIAL_STATE
    try {
      return applyOfflineProgress(migrateState(JSON.parse(raw) as Partial<GameState>))
    } catch {
      return INITIAL_STATE
    }
  })

  useEffect(() => {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state))
    // Синхронизируем ресурс «Квантовые ядра» (Этап 4) с сохранённым состоянием:
    // автосохранение каждые 30–60 секунд обеспечивается экономическим тиком GameLoop.
    coresResource.setAmount(state.quantumCores)
    // Ресурс «Данные» (Этап 5, ТЗ 4.2) — синхронно с сейвом, публикует DATA_CHANGED
    dataResource.setAmount(state.data)
    // Ресурс «Фрагменты исходного кода» (Этап 6, ТЗ 4.4) — публикует FRAGMENTS_CHANGED
    fragmentsResource.setAmount(state.fragments ?? 0)
    eventBus.emit(EVENTS.SAVE_COMPLETED)
  }, [state])

  // Обновляем lastSaveTime при уходе со страницы, чтобы оффлайн-таймер был точным
  useEffect(() => {
    const onLeave = () => {
      setState((prev) => ({ ...prev, lastSaveTime: Date.now() }))
    }
    window.addEventListener('beforeunload', onLeave)
    document.addEventListener('visibilitychange', onLeave)
    return () => {
      window.removeEventListener('beforeunload', onLeave)
      document.removeEventListener('visibilitychange', onLeave)
    }
  }, [])

  return { state, setState }
}

/**
 * useIncome — доход и сила клика через чистый EconomyService (Этап 3):
 * апгрейды «Железо», синергии «Софт» с лимитами, глобальные множители.
 * Принимает полное состояние игры: с Этапа 4 CPS зависит от престиж-апгрейдов
 * («Эффективность ядер», «ИИ-автономия»), поэтому передавать частичный объект
 * ({ generators, upgrades }) больше нельзя — это вызывало краш в getPrestigeUpgradeLevel.
 */
export const useIncome = (state: GameState) => {
  const getIncomePerSecond = () => getCps(state)

  const getClickPowerValue = () => getClickPower(state)

  return { getIncomePerSecond, getClickPower: getClickPowerValue }
}

/**
 * useClickHandler — ручной клик с критом (Этап 3, ТЗ 13):
 *  - СилаКлика + процент от CPS (лимит 30 сек дохода);
 *  - 5% шанс крита ×10 после апгрейда «Критический сбой»;
 *  - итог крита ограничен 120 сек пассивного дохода.
 */
export const useClickHandler = (
  setState: React.Dispatch<React.SetStateAction<GameState>>,
  _getClickPower: () => number,
) => {
  const [clickEffects, setClickEffects] = useState<ClickEffect[]>([])

  // Актуальное состояние нужно внутри обработчика клика для расчёта крита/процента от CPS
  const stateRef = useRef<GameState | null>(null)

  // Монотонный счётчик ID для эффектов клика.
  // Нельзя использовать Date.now()/performance.now(): их разрешение ограничено
  // (~1970.1000000005588 в Chrome), и два быстрых клика дают одинаковый id,
  // что приводит к дубликату ключа в React-списке clickEffects.
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
        // Этап 4: прогресс текущего забега для формулы ядер (ТЗ 24.4)
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
  // Держим актуальную функцию дохода в ref, чтобы подписка на тики создавалась один раз
  const incomeFnRef = useRef(getIncomePerSecond)
  incomeFnRef.current = getIncomePerSecond

  // Пассивный доход начисляется экономическими тиками глобального GameLoop (Этап 1).
  // Крит сюда НЕ применяется (ТЗ 13.3: крит только для ручных кликов).
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
    // Этап 6 (ТЗ 4.4, 29.2): часть достижений награждает Фрагментами исходного кода
    let fragmentReward = 0

    ACHIEVEMENTS.forEach((ach) => {
      if (!newAchievements.includes(ach.id) && ach.condition(state)) {
        newAchievements.push(ach.id)
        changed = true
        // Этап 5 (ТЗ 28, 19.1): достижения могут награждать Данными —
        // этот источник НЕ ограничен дневным капом мини-игр (ТЗ 23.2).
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
  }, [state.totalEarned, state.clickCount, state.money, state.achievements, state.generators, state.fragments, setState])
}

/**
 * Прогресс глав (ручной переход).
 * Пороги проверяются по totalEarnedThisRun (заработок за текущий забег),
 * который сбрасывается при престиже — поэтому после «Перезагрузки системы»
 * главы нужно проходить заново. Переход выполняется только по нажатию
 * кнопки «Открыть главу» в панели прогресса (см. ChapterPanel).
 */
export const useChapterProgression = (
  state: GameState,
  setState: React.Dispatch<React.SetStateAction<GameState>>,
) => {
  /** Доступен ли ручной переход в следующую главу. */
  const nextChapter = state.currentChapter + 1
  const nextInfo = nextChapter <= MAX_CHAPTER ? CHAPTERS[nextChapter - 1] : null
  const canAdvance = !!nextInfo && state.totalEarnedThisRun >= nextInfo.unlockAt

  /** Прогресс (0..1) до открытия следующей главы. */
  const unlockProgress = getChapterUnlockProgress(state.totalEarnedThisRun)

  /** Ручной переход в следующую главу (кнопкой в UI). */
  const advanceChapter = () => {
    setState((prev) => {
      if (prev.currentChapter >= MAX_CHAPTER) return prev
      const info = CHAPTERS[prev.currentChapter] // следующая глава (индекс n-1)
      if (!info || prev.totalEarnedThisRun < info.unlockAt) return prev
      const next = { ...prev, currentChapter: prev.currentChapter + 1 }
      eventBus.emit(EVENTS.CHAPTER_CHANGED, { chapter: next.currentChapter })
      return next
    })
  }

  return { canAdvance, unlockProgress, advanceChapter }
}

/**
 * useGeneratorPurchase — покупка генераторов 1/10/25/MAX (Этапы 2–3).
 * Математика роста цен — из ТЗ 11.1/11.2/11.5 (EconomyService).
 */
export const useGeneratorPurchase = (
  state: GameState,
  setState: React.Dispatch<React.SetStateAction<GameState>>,
) => {
  /** Стоимость покупки `amount` штук (или MAX — сколько можем позволить). */
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

/**
 * useUpgradePurchase — покупка апгрейдов с проверкой условий разблокировки
 * (требования по генераторам из ТЗ раздел 15).
 */
export const useUpgradePurchase = (
  state: GameState,
  setState: React.Dispatch<React.SetStateAction<GameState>>,
) => {
  const buyUpgrade = (upgradeId: string) => {
    const upgrade = UPGRADES.find((u) => u.id === upgradeId)
    if (!upgrade) return
    if (!isUpgradeAvailable(upgradeId, state)) return

    // Этап 6 (ТЗ 8): апгрейд «Сбор телеметрии» покупается за Данные 📊
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

/**
 * usePrestige — престиж «Перезагрузка системы» (Этап 4, ТЗ раздел 24).
 *  - предпросмотр наград (сколько ядер будет получено);
 *  - условие доступности: ≥1M за забег и ≥1 ядро (ТЗ 24.5);
 *  - сброс обычных ресурсов с сохранением ядер, достижений и престиж-апгрейдов;
 *  - визуальный эффект глитча/распада через CSS-класс на время анимации (ТЗ 24.7).
 */
export const usePrestige = (
  state: GameState,
  setState: React.Dispatch<React.SetStateAction<GameState>>,
) => {
  /** true во время анимации престижа — накладывается глитч-эффект на приложение. */
  const [isAnimating, setIsAnimating] = useState(false)
  /** Открыт ли экран престижа с предпросмотром наград (ТЗ 24.6). */
  const [screenOpen, setScreenOpen] = useState(false)

  const coresPreview = getCoresPreview(state)
  /** Полные данные экрана престижа: награда, прогресс, «сохранится / сбросится / откроется». */
  const preview: PrestigePreview = getPrestigePreview(state)
  const available = canPrestige(state)
  /** Кнопка престижа показывается заранее, но с предупреждением (ТЗ 24.5). */
  const teaserVisible = state.totalEarnedThisRun >= PRESTIGE_THRESHOLD * 0.5

  /** Открыть/закрыть экран престижа (можно заранее — с предупреждением, ТЗ 24.5). */
  const openPrestigeScreen = () => setScreenOpen(true)
  const closePrestigeScreen = () => {
    if (!isAnimating) setScreenOpen(false)
  }

  const doPrestige = () => {
    if (!available || isAnimating) return
    // ТЗ 24.7: экран «разбирается» на пиксели, короткий глитч, ≤3–5 секунд
    setIsAnimating(true)
    const gained = coresPreview.total
    window.setTimeout(() => {
      setState((prev) => {
        if (!canPrestige(prev)) return prev
        const next = applyPrestige(prev)
        // Ядра начислены — публикуем изменение ресурса (Этап 4, ТЗ 4.3)
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

/**
 * usePrestigeUpgrades — покупка престиж-апгрейдов «Квантовые протоколы»
 * за Квантовые ядра (Этап 4, ТЗ раздел 18). Ядра не возвращаются при сбросе.
 */
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

/**
 * useQuests — ежедневные квесты (Этап 5, ТЗ 27.1):
 *  - при смене дня выбирается 3 квеста из пула (детерминированно по дате);
 *  - прогресс обновляется экономическим тиком раз в секунду;
 *  - награда: Вычисления + Данные (Данные квестов вне дневного капа мини-игр).
 */
export const useQuests = (
  state: GameState,
  setState: React.Dispatch<React.SetStateAction<GameState>>,
) => {
  // Выдача/обновление набора квестов при смене дня (в т.ч. для старых сейвов)
  useEffect(() => {
    setState((prev) => ensureDailyQuests(prev))
  }, [setState])

  // Прогресс квестов обновляется экономическими тиками GameLoop (раз в секунду)
  const stateRef = useRef(state)
  stateRef.current = state
  useEffect(() => {
    const unsubscribe = gameLoop.onTick(() => {
      setState((prev) => refreshQuestProgress(prev))
    })
    return unsubscribe
  }, [setState])

  /** Забрать награду выполненного квеста. */
  const claimQuest = (questId: string) => {
    setState((prev) => claimQuestReward(prev, questId).state)
  }

  return { claimQuest }
}

/** Открытая мини-игра (состояние модального окна). */
export interface ActiveMinigame {
  id: string
}

/**
 * useMinigames — три MVP мини-игры (Этап 5, ТЗ 21–23):
 *  - запуск вручную из панели (кнопка появляется по доступности, ТЗ 23.1);
 *  - награды считает MinigameService (лимиты 5 полных наград/день, кап Данных,
 *    бюджет ≤ 10 минут CPS, утешительные 20% за провал);
 *  - события MINIGAME_STARTED / MINIGAME_COMPLETED публикуются в EventBus.
 */
export const useMinigames = (
  state: GameState,
  setState: React.Dispatch<React.SetStateAction<GameState>>,
) => {
  const [active, setActive] = useState<ActiveMinigame | null>(null)
  /** Момент последнего закрытия без награды — пауза 5 минут (ТЗ 23.1). */
  const dismissedAtRef = useRef(0)
  const stateRef = useRef(state)
  stateRef.current = state

  // Тик раз в секунду — чтобы кнопка «Мини-игра» появилась точно по таймеру
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

  /** Игрок закрыл игру, не завершив — повторное предложение не раньше чем через 5 минут. */
  const dismissMinigame = () => {
    setActive(null)
    dismissedAtRef.current = Date.now()
  }

  /** Завершение раунда: расчёт наград по правилам ТЗ 19.1/23.2/23.3 и начисление. */
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

/* ===== Этап 6: пассивная добыча Данных, технологии и навигация по этапам (ТЗ 8–10) ===== */

/**
 * usePassiveData — «Сбор телеметрии» (ТЗ 8): +1 📊 в час за каждые 25 генераторов
 * главы «Орбита», максимум 12 📊 в сутки. Начисление идёт экономическим тиком;
 * при доходе ≥1 📊/сек публикуется DATA_CHANGED для индикаторов интерфейса.
 */
export const usePassiveData = (
  setState: React.Dispatch<React.SetStateAction<GameState>>,
) => {
  useEffect(() => {
    const unsubscribe = gameLoop.onTick(() => {
      setState((prev) => {
        const next = tickPassiveData(prev, 1)
        if (next !== prev && getPassiveDataRatePerHour(prev) >= 3600) {
          eventBus.emit(EVENTS.DATA_CHANGED, { value: next.data, delta: next.data - prev.data })
        }
        return next
      })
    })
    return unsubscribe
  }, [setState])
}

/**
 * useTechnologies — покупки за Данные/Фрагменты (Этап 6, ТЗ 8–10):
 * технология навсегда открывает космический этап и покупает его первый генератор.
 */
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

/**
 * useStageNavigation — переключение просмотренного этапа на вкладке «Генераторы»
 * (сюжетные 1–4 + навсегда открытые космические 5–7).
 */
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

/**
 * useStageFragmentMilestones — Фрагменты за прогресс по космическим этапам (ТЗ 29.2):
 * за 10/25/50/100 главных генераторов навсегда открытого этапа дают 1/2/3/4 🧩.
 * Флаг `milestone:<stage>:<count>` хранится в achievements — так награда
 * выдаётся один раз навсегда и не сбрасывается престижем (ТЗ 24.3).
 */
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.generators, state.chaptersUnlockedForever, state.achievements])
}
