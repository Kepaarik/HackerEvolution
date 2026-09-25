/**
 * Constants — централизованные константы игры (Этап 1).
 * Все балансировочные значения экономики вынесены сюда,
 * чтобы их можно было менять в одном месте (и в будущем отдавать через Remote Config).
 */

/** Версия схемы сохранения. Используется для миграций (Этап 12). */
export const SAVE_VERSION = 1

/** Ключ localStorage для основного сейва. */
export const SAVE_KEY = 'hackerSave'

/** Ключ localStorage для резервной копии сейва. */
export const SAVE_BACKUP_KEY = 'he_backup'

/** Интервал автосохранения, мс (Этап 12: 30–60 секунд). */
export const AUTOSAVE_INTERVAL_MS = 30_000

/** Игровой тик, мс. */
export const TICK_INTERVAL_MS = 1000

/** Множитель роста цены каждого следующего генератора. */
export const GENERATOR_COST_GROWTH = 1.15

/** Лимит оффлайн-дохода без престиж-апгрейдов, сек (8 часов). */
export const OFFLINE_CAP_SECONDS = 8 * 3600

/** Минимальный порог оффлайн-прогресса, меньше которого доход не начисляется, сек. */
export const OFFLINE_MIN_SECONDS = 10

/** Шанс критического клика (Этап 3, ТЗ раздел 13.3). */
export const CRIT_CHANCE = 0.05

/** Множитель критического клика (Этап 3, ТЗ раздел 13.3). */
export const CRIT_MULTIPLIER = 10

/** Максимальный суммарный процент клика от CPS (ТЗ раздел 13.2). */
export const MAX_CLICK_CPS_PERCENT = 0.05

/** Лимит обычного ручного клика: не более 30 секунд пассивного дохода (ТЗ 13.2). */
export const CLICK_CPS_LIMIT_SECONDS = 30

/** Лимит критического клика: не более 120 секунд пассивного дохода (ТЗ 13.2). */
export const CRIT_CPS_LIMIT_SECONDS = 120

/** Множитель дохода при просмотре вознаграждаемой рекламы (Этап 13). */
export const AD_REWARD_MULTIPLIER = 2

// ===== Этап 4: престиж-система (ТЗ разделы 24, 18, 4.3) =====

/** Минимальный порог престижа: заработано вычислений за забег (ТЗ 24.5). */
export const PRESTIGE_THRESHOLD = 1_000_000

/** Делитель формулы ядер: Ядра = floor(sqrt(заработаноЗаЗабег / 1M)) (ТЗ 24.4). */
export const PRESTIGE_CORES_DIVISOR = 1_000_000

/** «Мульти-старт» (ТЗ 18): вычислений после престижа. */
export const MULTI_START_COMPUTATIONS = 1_000

/** «Мульти-старт» (ТЗ 18): старых ноутбуков после престижа. */
export const MULTI_START_LAPTOPS = 5

/** «Холодный старт» (ТЗ 18): цена первого генератора после престижа. */
export const COLD_START_BASE_COST = 15

/** Ссылки на ресурсы PWA. */
export const MANIFEST_URL = '/manifest.json'

// ===== Этап 5: Данные, мини-игры и ежедневные квесты (ТЗ разделы 4.2, 19–23, 27.1) =====

/** Лимит полных наград мини-игр в день (ТЗ 23.2). */
export const MINIGAME_DAILY_FULL_REWARD_LIMIT = 5

/** Множитель награды после лимита полных наград (ТЗ 23.2: «до 25%»). */
export const MINIGAME_REPEAT_MULTIPLIER = 0.25

/** Дневной лимит Данных из мини-игр (сверх — не выдаются; квесты/достижения вне лимита, ТЗ 23.2). */
export const MINIGAME_DAILY_DATA_CAP = 20

/** Пауза после закрытия мини-игры без награды, мс (ТЗ 23.1: 5 минут). */
export const MINIGAME_COOLDOWN_MS = 5 * 60_000

/** Минимальный интервал между предложениями мини-игр, мс (ТЗ 23.1: 12–18 минут, берём нижнюю границу). */
export const MINIGAME_AVAILABLE_INTERVAL_MS = 12 * 60_000

/** Сколько ежедневных квестов выбирается из пула (ТЗ 27.1). */
export const DAILY_QUEST_COUNT = 3

// ===== Этап 6: главы 2–4, Фрагменты и Технологии (ТЗ 4.4, 8–10, 29) =====

/** Всего Фрагментов исходного кода в игре (ТЗ 29.1; 100% открывают Сингулярность). */
export const TOTAL_FRAGMENTS = 100

/** Глава «Орбита» по нумерации этапов игры (сюжетные этапы — 1–4, космические — 5–7). */
export const CHAPTER_ORBIT = 5

/** Пассивная добыча Данных: каждые N генераторов главы «Орбита» дают +1 📊/час (ТЗ 8). */
export const PASSIVE_DATA_GENERATORS_PER = 25

/** Суточный лимит пассивной добычи Данных (ТЗ 8: максимум 12 📊 в сутки). */
export const PASSIVE_DATA_DAILY_CAP = 12

/** Прогресс-награды за навсегда открытые космические этапы (по главному генератору этапа, ТЗ 29.2). */
export const STAGE_PROGRESS_MILESTONES: { count: number; fragments: number }[] = [
  { count: 10, fragments: 1 },
  { count: 25, fragments: 2 },
  { count: 50, fragments: 3 },
  { count: 100, fragments: 4 },
]

/** Остальные соотношения валют и ресурсов (Фрагменты) будут добавлены на Этапе 7. */
export const SAVE_KEY = 'he_save'

export const EVENTS = {
  COMPUTE_CHANGED: 'computeChanged',
  DATA_CHANGED: 'dataChanged',
  CORES_CHANGED: 'coresChanged',
  CPS_CHANGED: 'cpsChanged',
  GENERATOR_BOUGHT: 'generatorBought',
  UPGRADE_BOUGHT: 'upgradeBought',
  PRESTIGE_COMPLETED: 'prestigeCompleted',
  MINIGAME_STARTED: 'minigameStarted',
  MINIGAME_COMPLETED: 'minigameCompleted',
  QUEST_COMPLETED: 'questCompleted',
  ACHIEVEMENT_UNLOCKED: 'achievementUnlocked',
  OFFLINE_REWARD: 'offlineReward',
  SETTINGS_CHANGED: 'settingsChanged',
  SAVE_COMPLETED: 'saveCompleted',
}
