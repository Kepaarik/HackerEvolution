import {
  GeneratorData,
  UpgradeData,
  Achievement,
  PrestigeUpgradeData,
  TechnologyData,
} from './types'
import { GENERATOR_COST_GROWTH, CHAPTER_ORBIT } from './core/Constants'

/**
 * Генераторы Главы 1 «Земля» — баланс из ТЗ (раздел 7).
 * Условие появления: ~50% базовой цены (ТЗ 6.1).
 */
export const GENERATORS: GeneratorData[] = [
  {
    id: 'old_laptop',
    name: 'Старый ноутбук',
    baseCost: 15,
    baseIncome: 0.7,
    count: 0,
    chapter: 1,
    description: 'Дышит на ладан, но ещё походит. Главное — не чихнуть рядом.',
    unlockAtTotalEarned: 0,
    costGrowth: GENERATOR_COST_GROWTH,
  },
  {
    id: 'server_rack',
    name: 'Серверная стойка',
    baseCost: 120,
    baseIncome: 5,
    count: 0,
    chapter: 1,
    description: 'Греется так, что может поджарить яичницу. Зато считает быстро.',
    unlockAtTotalEarned: 60,
    costGrowth: GENERATOR_COST_GROWTH,
  },
  {
    id: 'cloud_node',
    name: 'Облачный узел',
    baseCost: 1300,
    baseIncome: 55,
    count: 0,
    chapter: 1,
    description: 'Чужой компьютер, но платим мы. Справедливо.',
    unlockAtTotalEarned: 650,
    costGrowth: GENERATOR_COST_GROWTH,
  },
  {
    id: 'botnet',
    name: 'Ботнет',
    baseCost: 15000,
    baseIncome: 620,
    count: 0,
    chapter: 1,
    description: 'Армия тостеров и холодильников готова к бою.',
    unlockAtTotalEarned: 7500,
    costGrowth: GENERATOR_COST_GROWTH,
  },
  {
    id: 'quantum_sim',
    name: 'Квантовый симулятор',
    baseCost: 170000,
    baseIncome: 7200,
    count: 0,
    chapter: 1,
    description: 'Он либо считает, либо притворяется. Проверять дорого.',
    unlockAtTotalEarned: 85000,
    costGrowth: GENERATOR_COST_GROWTH,
  },
  // ===== Этап 6: Глава 2 «Орбита» (ТЗ раздел 8). Рост цены 1.16 =====
  {
    id: 'spy_satellite',
    name: 'Спутник-шпион',
    baseCost: 2_000_000,
    baseIncome: 25_000,
    count: 0,
    chapter: 5,
    description: 'Смотрит на Землю сверху вниз. Буквально.',
    unlockAtTotalEarned: 0,
    costGrowth: 1.16,
  },
  {
    id: 'orbital_station',
    name: 'Орбитальная станция',
    baseCost: 25_000_000,
    baseIncome: 300_000,
    count: 0,
    chapter: 5,
    description: 'Невесомость экономит на кондиционерах.',
    unlockAtTotalEarned: 0,
    costGrowth: 1.16,
    /** Условие появления по ТЗ 8: 10 спутников-шпионов. */
    requiresGenerator: { generatorId: 'spy_satellite', count: 10 },
  },
  {
    id: 'moon_datacenter',
    name: 'Лунный дата-центр',
    baseCost: 320_000_000,
    baseIncome: 3_800_000,
    count: 0,
    chapter: 5,
    description: 'Идеальное охлаждение — минус 173 в тени. Кредит доверия уже взяли.',
    unlockAtTotalEarned: 0,
    costGrowth: 1.16,
    requiresGenerator: { generatorId: 'orbital_station', count: 10 },
  },
  // ===== Этап 6: Глава 3 «Солнечная система» (ТЗ раздел 9). Рост цены 1.17 =====
  {
    id: 'mars_farm',
    name: 'Марсианская серверная ферма',
    baseCost: 6_000_000_000,
    baseIncome: 55_000_000,
    count: 0,
    chapter: 6,
    description: 'Пыль попадает везде. Даже в сокет.',
    unlockAtTotalEarned: 0,
    costGrowth: 1.17,
  },
  {
    id: 'asteroid_mining',
    name: 'Астероидный майнинг',
    baseCost: 85_000_000_000,
    baseIncome: 750_000_000,
    count: 0,
    chapter: 6,
    description: 'Буква M в «майнинг» означает «металлы», а не «маржа». Наверное.',
    unlockAtTotalEarned: 0,
    costGrowth: 1.17,
    requiresGenerator: { generatorId: 'mars_farm', count: 10 },
  },
  {
    id: 'dyson_swarm',
    name: 'Дайсоновский рой',
    baseCost: 1_200_000_000_000,
    baseIncome: 12_000_000_000,
    count: 0,
    chapter: 6,
    description:
      'Солнце теперь работает на вас. Профсоюз звонил, просило не комментировать.',
    unlockAtTotalEarned: 0,
    costGrowth: 1.17,
    requiresGenerator: { generatorId: 'asteroid_mining', count: 10 },
  },
  // ===== Этап 6: Глава 4 «Межзвёздная экспансия» (ТЗ раздел 10). Рост цены 1.18 =====
  {
    id: 'von_neumann_probe',
    name: 'Зонд фон Неймана',
    baseCost: 25_000_000_000_000,
    baseIncome: 250_000_000_000,
    count: 0,
    chapter: 7,
    description: 'Строит копии себя. Извините за масштабирование.',
    unlockAtTotalEarned: 0,
    costGrowth: 1.18,
  },
  {
    id: 'exoplanet_colony',
    name: 'Колония экзопланеты',
    baseCost: 600_000_000_000_000,
    baseIncome: 6_000_000_000_000,
    count: 0,
    chapter: 7,
    description: 'Локальное время +8 к МСК. Пинг хуже, зато вид.',
    unlockAtTotalEarned: 0,
    costGrowth: 1.18,
    requiresGenerator: { generatorId: 'von_neumann_probe', count: 10 },
  },
]

/**
 * Апгрейды Этапа 3: три ветки из ТЗ (разделы 15–17).
 *  - hardware — «Железо»: удвоение конкретных генераторов, требования по количеству;
 *  - software — «Софт»: синергии с верхними пределами;
 *  - manual   — «Ручной взлом»: сила клика, процент от CPS, крит.
 * Покупка за Вычисления (cost). Апгрейды за Данные появятся на Этапе 5.
 */
export const UPGRADES: UpgradeData[] = [
  // ===== Ветка «Ручной взлом» (ТЗ раздел 17) =====
  {
    id: 'macros',
    name: 'Макросы',
    cost: 200,
    multiplier: 2,
    target: 'click',
    purchased: false,
    description: 'Сила клика ×2',
    branch: 'manual',
  },
  {
    id: 'fast_typing',
    name: 'Быстрый ввод',
    cost: 2500,
    multiplier: 3,
    target: 'click',
    purchased: false,
    description: 'Сила клика ×3',
    branch: 'manual',
  },
  {
    id: 'hacker_glove',
    name: 'Перчатка хакера',
    cost: 50000,
    multiplier: 5,
    target: 'click',
    purchased: false,
    description: 'Сила клика ×5',
    branch: 'manual',
  },
  {
    id: 'refactoring',
    name: 'Рефакторинг',
    cost: 10000,
    multiplier: 1,
    target: 'click',
    purchased: false,
    description: 'Ручной клик получает +1% от CPS',
    branch: 'manual',
    clickCpsPercent: 0.01,
  },
  {
    id: 'critical_glitch',
    name: 'Критический сбой',
    cost: 25000,
    multiplier: 1,
    target: 'click',
    purchased: false,
    description: '5% шанс крита, крит ×10 (только ручные клики)',
    branch: 'manual',
    critChance: 0.05,
  },

  // ===== Ветка «Железо» (ТЗ раздел 15) =====
  {
    id: 'ssd_boost',
    name: 'SSD-разгон',
    cost: 300,
    multiplier: 2,
    target: 'old_laptop',
    purchased: false,
    description: 'Старые ноутбуки ×2',
    branch: 'hardware',
    requirement: { generatorId: 'old_laptop', count: 10 },
  },
  {
    id: 'liquid_cooling',
    name: 'Жидкостное охлаждение',
    cost: 5000,
    multiplier: 2,
    target: 'server_rack',
    purchased: false,
    description: 'Серверные стойки ×2',
    branch: 'hardware',
    requirement: { generatorId: 'server_rack', count: 25 },
  },
  {
    id: 'cloud_orchestration',
    name: 'Оркестрация облака',
    cost: 60000,
    multiplier: 2,
    target: 'cloud_node',
    purchased: false,
    description: 'Облачные узлы ×2',
    branch: 'hardware',
    requirement: { generatorId: 'cloud_node', count: 25 },
  },
  {
    id: 'botnet_mirror',
    name: 'Зеркалирование ботнета',
    cost: 700000,
    multiplier: 2,
    target: 'botnet',
    purchased: false,
    description: 'Ботнеты ×2',
    branch: 'hardware',
    requirement: { generatorId: 'botnet', count: 25 },
  },
  {
    id: 'quantum_correction',
    name: 'Коррекция квантовых ошибок',
    cost: 8000000,
    multiplier: 2,
    target: 'quantum_sim',
    purchased: false,
    description: 'Квантовые симуляторы ×2',
    branch: 'hardware',
    requirement: { generatorId: 'quantum_sim', count: 25 },
  },

  // ===== Ветка «Софт» — синергии с лимитами (ТЗ разделы 12, 16) =====
  {
    id: 'code_optimization',
    name: 'Оптимизация кода',
    cost: 10000,
    multiplier: 1,
    target: 'global',
    purchased: false,
    description: '+1% к общему доходу за каждые 10 генераторов (макс +100%)',
    branch: 'software',
    synergy: {
      type: 'everyNAnyToGlobal',
      targetId: 'global',
      per: 10,
      bonus: 0.01,
      cap: 1.0,
    },
  },
  {
    id: 'server_synergy',
    name: 'Масштабирование стоек',
    cost: 30000,
    multiplier: 1,
    target: 'server_rack',
    purchased: false,
    description: 'Каждые 25 серверных стоек: +10% к их доходу (макс +200%)',
    branch: 'software',
    synergy: {
      type: 'everyNToTarget',
      sourceId: 'server_rack',
      targetId: 'server_rack',
      per: 25,
      bonus: 0.1,
      cap: 2.0,
    },
  },
  {
    id: 'systems_symbiosis',
    name: 'Симбиоз систем',
    cost: 100000,
    multiplier: 1,
    target: 'botnet',
    purchased: false,
    description: 'Каждые 10 облачных узлов дают +5% ботнету (макс +150%)',
    branch: 'software',
    synergy: {
      type: 'everyNToTarget',
      sourceId: 'cloud_node',
      targetId: 'botnet',
      per: 10,
      bonus: 0.05,
      cap: 1.5,
    },
  },
  // ===== Этап 6: апгрейды за Данные и глав-2–4 (ТЗ 8, 12) =====
  {
    id: 'telemetry_collection',
    name: 'Сбор телеметрии',
    cost: 0,
    /** Покупается за Данные 📊 (ТЗ 8: пассивная добыча Данных после этого апгрейда). */
    dataCost: 5,
    multiplier: 1,
    target: 'none',
    purchased: false,
    description:
      'Открывает пассивную добычу Данных: +1 📊 в час за каждые 25 генераторов главы «Орбита» (максимум 12 📊 в сутки).',
    branch: 'software',
    requirement: { generatorId: 'spy_satellite', count: 1 },
  },
  {
    id: 'distributed_computing',
    name: 'Распределённые вычисления',
    cost: 50_000_000,
    multiplier: 1,
    target: 'none',
    purchased: false,
    description:
      'Каждые 50 генераторов «Орбиты» дают +1% к доходу всех генераторов «Орбиты» (макс +50%).',
    branch: 'software',
    chapter: CHAPTER_ORBIT,
    chapterIncomePerN: { per: 50, bonus: 0.01, cap: 0.5 },
    requirement: { generatorId: 'spy_satellite', count: 25 },
  },
  {
    id: 'orbital_uplink',
    name: 'Орбитальный канал',
    cost: 80_000_000,
    multiplier: 2,
    target: 'spy_satellite',
    purchased: false,
    description: 'Удваивает доход спутников-шпионов.',
    branch: 'hardware',
    requirement: { generatorId: 'spy_satellite', count: 10 },
  },
  {
    id: 'station_expansion',
    name: 'Расширение станции',
    cost: 900_000_000,
    multiplier: 2,
    target: 'orbital_station',
    purchased: false,
    description: 'Удваивает доход орбитальных станций.',
    branch: 'hardware',
    requirement: { generatorId: 'orbital_station', count: 25 },
  },
  {
    id: 'lunar_cooling',
    name: 'Лунное охлаждение',
    cost: 12_000_000_000,
    multiplier: 2,
    target: 'moon_datacenter',
    purchased: false,
    description: 'Удваивает доход лунных дата-центров.',
    branch: 'hardware',
    requirement: { generatorId: 'moon_datacenter', count: 25 },
  },
  {
    id: 'red_dust_filters',
    name: 'Пылевые фильтры',
    cost: 200_000_000_000,
    multiplier: 2,
    target: 'mars_farm',
    purchased: false,
    description: 'Удваивает доход марсианских серверных ферм.',
    branch: 'hardware',
    requirement: { generatorId: 'mars_farm', count: 25 },
  },
  {
    id: 'gravity_contracts',
    name: 'Гравитационные контракты',
    cost: 3_000_000_000_000,
    multiplier: 2,
    target: 'asteroid_mining',
    purchased: false,
    description: 'Удваивает доход астероидного майнинга.',
    branch: 'hardware',
    requirement: { generatorId: 'asteroid_mining', count: 25 },
  },
  {
    id: 'swarm_coordination',
    name: 'Координация роя',
    cost: 40_000_000_000_000,
    multiplier: 2,
    target: 'dyson_swarm',
    purchased: false,
    description: 'Удваивает доход Дайсоновского роя.',
    branch: 'hardware',
    requirement: { generatorId: 'dyson_swarm', count: 25 },
  },
  {
    id: 'self_replication',
    name: 'Саморепликация',
    cost: 800_000_000_000_000,
    multiplier: 2,
    target: 'von_neumann_probe',
    purchased: false,
    description: 'Удваивает доход зондов фон Неймана.',
    branch: 'hardware',
    requirement: { generatorId: 'von_neumann_probe', count: 25 },
  },
  {
    id: 'terraforming',
    name: 'Терраформирование',
    cost: 20_000_000_000_000_000,
    multiplier: 2,
    target: 'exoplanet_colony',
    purchased: false,
    description: 'Удваивает доход колоний экзопланет.',
    branch: 'hardware',
    requirement: { generatorId: 'exoplanet_colony', count: 25 },
  },
]

/**
 * Престиж-апгрейды «Квантовые протоколы» (ТЗ раздел 18, Этап 4).
 * Покупаются за Квантовые ядра, сохраняются после престижа.
 * Цена следующего уровня = baseCost × (уровень + 1).
 */
export const PRESTIGE_UPGRADES: PrestigeUpgradeData[] = [
  {
    id: 'ai_autonomy',
    name: 'ИИ-автономия',
    baseCost: 3,
    maxLevel: 5,
    description: '+1% к CPS за уровень',
    branch: 'prestige',
  },
  {
    id: 'offline_8h',
    name: 'Расширение оффлайна: 8 часов',
    baseCost: 5,
    maxLevel: 1,
    description: 'Лимит оффлайн-дохода — 8 часов',
    branch: 'prestige',
    deferred: true, // применяется на Этапе 8 (оффлайн-прогресс)
  },
  {
    id: 'offline_24h',
    name: 'Расширение оффлайна: 24 часа',
    baseCost: 20,
    maxLevel: 1,
    description: 'Лимит оффлайн-дохода — 24 часа',
    branch: 'prestige',
    deferred: true,
  },
  {
    id: 'multi_start',
    name: 'Мульти-старт',
    baseCost: 7,
    maxLevel: 1,
    description: 'После престижа: 1 000 вычислений и 5 старых ноутбуков',
    branch: 'prestige',
  },
  {
    id: 'shadow_market',
    name: 'Теневой рынок',
    baseCost: 10,
    maxLevel: 1,
    description: 'Открывает рисковые контракты (Этап 9)',
    branch: 'prestige',
    deferred: true,
  },
  {
    id: 'overdrive_module',
    name: 'Модуль разгона',
    baseCost: 5,
    maxLevel: 1,
    description: 'Открывает перегрев и разгон (Этап 9)',
    branch: 'prestige',
    deferred: true,
  },
  {
    id: 'cores_efficiency',
    name: 'Эффективность ядер',
    baseCost: 2,
    maxLevel: 10,
    description: '+2% к общему доходу за уровень',
    branch: 'prestige',
  },
  {
    id: 'data_collector',
    name: 'Сборщик Данных',
    baseCost: 4,
    maxLevel: 5,
    description: '+10% к наградам Данных за уровень (Этап 5)',
    branch: 'prestige',
    deferred: true,
  },
  {
    id: 'cold_start',
    name: 'Холодный старт',
    baseCost: 6,
    maxLevel: 1,
    description: 'Первый генератор после престижа стоит 15 вычислений',
    branch: 'prestige',
  },
]

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_blood',
    name: 'Первая кровь',
    description: 'Заработайте первые $100',
    condition: (s) => s.totalEarned >= 100,
    unlocked: false,
    icon: '🩸',
  },
  {
    id: 'hacker',
    name: 'Хакер',
    description: 'Заработайте $1,000',
    condition: (s) => s.totalEarned >= 1000,
    unlocked: false,
    icon: '💻',
  },
  {
    id: 'cyber_lord',
    name: 'Кибер-лорд',
    description: 'Заработайте $1,000,000',
    condition: (s) => s.totalEarned >= 1000000,
    unlocked: false,
    icon: '👑',
  },
  {
    id: 'clicker',
    name: 'Кликер',
    description: 'Сделайте 1000 кликов',
    condition: (s) => s.clickCount >= 1000,
    unlocked: false,
    icon: '🖱️',
  },
  // ===== Этап 5: достижения с наградой в Данных (ТЗ 28, 19.1) =====
  {
    id: 'data_runner',
    name: 'Пакетный перехватчик',
    description: 'Победите в мини-играх 5 раз (+3 📊)',
    condition: (s) => s.minigamesCompleted >= 5,
    unlocked: false,
    icon: '📦',
    rewardData: 3,
  },
  {
    id: 'quest_master',
    name: 'Оперативник',
    description: 'Завершите 5 ежедневных квестов (+4 📊)',
    condition: (s) => s.questsCompleted >= 5,
    unlocked: false,
    icon: '📋',
    rewardData: 4,
  },
  {
    id: 'tunnel_channel',
    name: 'Туннельный канал',
    description: 'Сделайте 1 000 кликов за всё время (+5 📊)',
    condition: (s) => s.totalClicksAllTime + s.clickCount >= 1000,
    unlocked: false,
    icon: '🕳️',
    rewardData: 5,
  },
  // ===== Этап 6: награды Фрагментами исходного кода (ТЗ 4.4, 29.2) =====
  // Источники фрагментов в MVP: достижения и сюжетные этапы (главы).
  // Корпорации (ТЗ 29.2) — следующий цикл контента.
  {
    id: 'orbit_rookie',
    name: 'Орбитальный новичок',
    description: 'Купите первый спутник-шпион (+1 🧩)',
    condition: (s) => (s.generators?.spy_satellite ?? 0) >= 1,
    unlocked: false,
    icon: '🛰️',
    rewardFragments: 1,
  },
  {
    id: 'sky_is_limit',
    name: 'Небо — не предел',
    description: '25 генераторов главы «Орбита» суммарно (+3 🧩)',
    condition: (s) =>
      (s.generators?.spy_satellite ?? 0) +
        (s.generators?.orbital_station ?? 0) +
        (s.generators?.moon_datacenter ?? 0) >=
      25,
    unlocked: false,
    icon: '🌍',
    rewardFragments: 3,
  },
  {
    id: 'lunar_admin',
    name: 'Администратор Луны',
    description: 'Купите лунный дата-центр (+2 🧩)',
    condition: (s) => (s.generators?.moon_datacenter ?? 0) >= 1,
    unlocked: false,
    icon: '🌙',
    rewardFragments: 2,
  },
  {
    id: 'martian_sysadmin',
    name: 'Марсианский сисадмин',
    description: 'Купите марсианскую серверную ферму (+3 🧩)',
    condition: (s) => (s.generators?.mars_farm ?? 0) >= 1,
    unlocked: false,
    icon: '🔴',
    rewardFragments: 3,
  },
  {
    id: 'star_colonist',
    name: 'Звёздный колонист',
    description: 'Купите колонию экзопланеты (+5 🧩)',
    condition: (s) => (s.generators?.exoplanet_colony ?? 0) >= 1,
    unlocked: false,
    icon: '🪐',
    rewardFragments: 5,
  },
  {
    id: 'code_archaeologist',
    name: 'Археолог кода',
    description: 'Соберите 10 Фрагментов исходного кода (+2 🧩)',
    condition: (s) => (s.fragments ?? 0) >= 10,
    unlocked: false,
    icon: '🦴',
    rewardFragments: 2,
  },
]

export const CHAPTER_NAMES = [
  'Земля',
  'Орбита',
  'Солнечная система',
  'Межзвёздная экспансия',
]

/**
 * Пояснения к главам (что дают и как открыть). Открываются вручную
 * в панели «Прогресс» на вкладке «Взлом», когда выполнен порог по
 * вычислениям, заработанным за текущий забег (totalEarnedThisRun —
 * сбрасывается при престиже, поэтому после перезагрузки систему главу
 * нужно проходить заново).
 */
export interface ChapterInfo {
  name: string
  description: string
  /** Порог заработка за забег для ручного перехода (0 — стартовая глава). */
  unlockAt: number
  /** Какие генераторы открывает глава (id из GENERATORS). */
  unlocksGenerators: string[]
}

export const CHAPTERS: ChapterInfo[] = [
  {
    name: CHAPTER_NAMES[0],
    description:
      'Старт: старый ноутбук и первые скрипты. Вы взламываете соседский Wi-Fi и копите первые байты.',
    unlockAt: 0,
    unlocksGenerators: ['old_laptop'],
  },
  {
    name: CHAPTER_NAMES[1],
    description:
      'Выход в тёмную сеть: серверные стойки и облачные узлы. Доход растёт быстрее, открываются новые апгрейды.',
    unlockAt: 1_000,
    unlocksGenerators: ['server_rack', 'cloud_node'],
  },
  {
    name: CHAPTER_NAMES[2],
    description:
      'Квантовые вычисления: собственный ботнет и симулятор квантовых состояний. Серьёзные мощности для серьёзных задач.',
    unlockAt: 50_000,
    unlocksGenerators: ['botnet'],
  },
  {
    name: CHAPTER_NAMES[3],
    description:
      'Финальная глава: доступ к Матрице. Квантовый симулятор и путь к первой перезагрузке системы (престижу).',
    unlockAt: 1_000_000,
    unlocksGenerators: ['quantum_sim'],
  },
]

/** Максимальный номер главы. */
export const MAX_CHAPTER = CHAPTERS.length

/* ===== Этап 6: Технологии за Данные/Фрагменты и космические этапы (ТЗ 8–10) ===== */

/**
 * Технологии — разблокировки за редкие ресурсы, покупаются один раз навсегда
 * (не сбрасываются при престиже). Открывают этапы «Орбита», «Солнечная
 * система» и «Межзвёздная экспансия» (ТЗ разделы 8–10).
 */
export const TECHNOLOGIES: TechnologyData[] = [
  {
    id: 'orbital_protocols',
    name: 'Орбитальные протоколы',
    description:
      'Канал связи со спутниками. Открывает этап «Орбита»: спутники-шпионы, орбитальные станции и лунные дата-центры.',
    dataCost: 10,
    fragmentCost: 0,
    requiredPrestiges: 1,
    unlocksChapter: 5,
  },
  {
    id: 'interplanetary_net',
    name: 'Межпланетная сеть',
    description:
      'Ретрансляторы между планетами. Открывает этап «Солнечная система»: марсианские фермы, астероидный майнинг и Дайсоновский рой.',
    dataCost: 30,
    fragmentCost: 20,
    requiredPrestiges: 3,
    unlocksChapter: 6,
  },
  {
    id: 'expansion_protocol',
    name: 'Протокол экспансии',
    description:
      'Самовоспроизводящиеся зонды летят к другим звёздам. Открывает этап «Межзвёздная экспансия».',
    dataCost: 60,
    fragmentCost: 60,
    requiredPrestiges: 6,
    unlocksChapter: 7,
  },
]

/**
 * Космические этапы (главы 2–4 по ТЗ 8–10). Нумеруются с 5: этапы 1–4 —
 * сюжетные главы Главы 1 («Локальная сеть» … «Матрица»). В отличие от них,
 * космические этапы открываются НАВСЕГДА технологией + покупкой первого
 * генератора этапа (ТЗ: «Открыта глава N») и не сбрасываются престижем.
 */
export interface SpaceStageInfo {
  chapter: number
  /** Отображаемый номер главы по ТЗ (2, 3, 4). */
  specChapter: number
  name: string
  description: string
  /** Технология, открывающая этап (id из TECHNOLOGIES). */
  technologyId: string
  /** Первый генератор этапа — покупается сразу после открытия (условие ТЗ). */
  starterGeneratorId: string
}

export const SPACE_STAGES: SpaceStageInfo[] = [
  {
    chapter: 5,
    specChapter: 2,
    name: 'Орбита',
    description:
      'После первой перезагрузки системы вы выходите на орбиту: шпионские спутники, станции и дата-центры на Луне. Здесь же открывается пассивная добыча Данных.',
    technologyId: 'orbital_protocols',
    starterGeneratorId: 'spy_satellite',
  },
  {
    chapter: 6,
    specChapter: 3,
    name: 'Солнечная система',
    description:
      'Межпланетная сеть связывает Землю с Марсом и поясом астероидов. Масштабы вычислений измеряются в тераваттах.',
    technologyId: 'interplanetary_net',
    starterGeneratorId: 'mars_farm',
  },
  {
    chapter: 7,
    specChapter: 4,
    name: 'Межзвёздная экспансия',
    description:
      'Зонды фон Неймана несут вашу империю к другим звёздам. Каждая колония — это дата-центр размером с планету.',
    technologyId: 'expansion_protocol',
    starterGeneratorId: 'von_neumann_probe',
  },
]

/** Все этапы (сюжетные 1–4 + космические 5–7), отсортированные по номеру. */
export const ALL_STAGE_NAMES: Record<number, string> = {
  1: CHAPTER_NAMES[0],
  2: CHAPTER_NAMES[1],
  3: CHAPTER_NAMES[2],
  4: CHAPTER_NAMES[3],
  5: `Глава 2: ${SPACE_STAGES[0].name}`,
  6: `Глава 3: ${SPACE_STAGES[1].name}`,
  7: `Глава 4: ${SPACE_STAGES[2].name}`,
}

/** Максимальный номер этапа (включая космические главы 2–4 ТЗ). */
export const MAX_STAGE = MAX_CHAPTER + SPACE_STAGES.length

/** Космический этап по его номеру (5–7) или null. */
export function getSpaceStage(chapter: number): SpaceStageInfo | null {
  return SPACE_STAGES.find((s) => s.chapter === chapter) ?? null
}

/** Минимальный прогресс (0..1) до ручной «разблокировки» следующей главы. */
export function getChapterUnlockProgress(totalEarnedThisRun: number): number {
  for (const ch of CHAPTERS) {
    if (ch.unlockAt > 0 && totalEarnedThisRun < ch.unlockAt) {
      return Math.min(1, totalEarnedThisRun / ch.unlockAt)
    }
  }
  return 1
}
