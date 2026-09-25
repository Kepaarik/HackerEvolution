import type { GameState } from '../types'

const CURRENT_VERSION = 2

/**
 * Начальное состояние для новых игроков
 */
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
  minigameStats: { date: getDayKey(), fullRewards: 0, dataEarned: 0, wonByGame: {} },
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
  passiveData: { date: getDayKey(), todayEarned: 0, fractional: 0 },
}

/**
 * Миграция сохранений между версиями.
 * Вызывается при загрузке для обеспечения совместимости.
 */
export function migrateState(saved: Partial<GameState>): GameState {
  if (!saved || typeof saved !== 'object') {
    return { ...INITIAL_STATE }
  }

  // Версия 0 → 1: добавление полей престижа
  let state = migrateV0toV1(saved)

  // Версия 1 → 2: добавление полей данных, мини-игр, квестов, фрагментов
  state = migrateV1toV2(state)

  // Гарантируем что все обязательные поля присутствуют
  return ensureComplete(state)
}

/**
 * Миграция с версии 0 на 1 (добавление престижа)
 */
function migrateV0toV1(saved: Partial<GameState>): Partial<GameState> {
  return {
    ...saved,
    quantumCores: saved.quantumCores ?? 0,
    totalEarnedThisRun: saved.totalEarnedThisRun ?? saved.totalEarned ?? 0,
    prestigeCount: saved.prestigeCount ?? 0,
    prestigeUpgrades: saved.prestigeUpgrades ?? {},
    totalClicksAllTime: saved.totalClicksAllTime ?? saved.clickCount ?? 0,
  }
}

/**
 * Миграция с версии 1 на 2 (данные, мини-игры, квесты, фрагменты)
 */
function migrateV1toV2(saved: Partial<GameState>): Partial<GameState> {
  return {
    ...saved,
    data: saved.data ?? 0,
    minigameStats: saved.minigameStats ?? INITIAL_STATE.minigameStats,
    lastMinigameAt: saved.lastMinigameAt ?? 0,
    minigamesPlayed: saved.minigamesPlayed ?? 0,
    minigamesCompleted: saved.minigamesCompleted ?? 0,
    quests: saved.quests ?? [],
    questsDate: saved.questsDate ?? '',
    questBaselines: saved.questBaselines ?? INITIAL_STATE.questBaselines,
    questsCompleted: saved.questsCompleted ?? 0,
    fragments: saved.fragments ?? 0,
    technologies: saved.technologies ?? [],
    chaptersUnlockedForever: saved.chaptersUnlockedForever ?? [],
    viewChapter: saved.viewChapter ?? 1,
    passiveData: saved.passiveData ?? INITIAL_STATE.passiveData,
  }
}

/**
 * Гарантирует что все поля state присутствуют
 */
function ensureComplete(state: Partial<GameState>): GameState {
  return {
    ...INITIAL_STATE,
    ...state,
    generators: state.generators ?? {},
    upgrades: Array.isArray(state.upgrades) ? state.upgrades : [],
    achievements: Array.isArray(state.achievements) ? state.achievements : [],
    prestigeUpgrades: state.prestigeUpgrades ?? {},
    technologies: Array.isArray(state.technologies) ? state.technologies : [],
    chaptersUnlockedForever: Array.isArray(state.chaptersUnlockedForever)
      ? state.chaptersUnlockedForever
      : [],
    quests: Array.isArray(state.quests) ? state.quests : [],
    minigameStats: state.minigameStats ?? INITIAL_STATE.minigameStats,
    questBaselines: state.questBaselines ?? INITIAL_STATE.questBaselines,
    passiveData: state.passiveData ?? INITIAL_STATE.passiveData,
  }
}

/**
 * Получить ключ текущего дня (для ежедневных квестов и лимитов)
 */
export function getDayKey(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

export { INITIAL_STATE, CURRENT_VERSION }
