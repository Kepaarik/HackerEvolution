/** Ветки апгрейдов из ТЗ (раздел 14) + ветка престиж-апгрейдов «Квантовые протоколы» (раздел 18, Этап 4). */
export type UpgradeBranch = "hardware" | "software" | "manual" | "prestige";

export interface GeneratorData {
  id: string;
  name: string;
  baseCost: number;
  baseIncome: number;
  count: number;
  chapter: number;
  /** Флейвор-текст из ТЗ (раздел 7). */
  description?: string;
  /** Условие появления: сколько всего нужно заработать, чтобы генератор стал виден (ТЗ: ~50% базовой цены). */
  unlockAtTotalEarned: number;
  /** Множитель роста цены (ТЗ: 1.15 для главы 1). */
  costGrowth: number;
  /** Условие появления по цепочке глав 2–4 (ТЗ 8–10): N генераторов-предшественников. */
  requiresGenerator?: { generatorId: string; count: number };
}

/** Требование для покупки апгрейда (Этап 3): N генераторов определённого типа. */
export interface UpgradeRequirement {
  generatorId: string;
  count: number;
}

export interface UpgradeData {
  id: string;
  name: string;
  cost: number;
  multiplier: number;
  target: "click" | string;
  purchased: boolean;
  description: string;
  /** Ветка: Железо / Софт / Ручной взлом. */
  branch: UpgradeBranch;
  /** Требование по количеству генераторов (для ветки «Железо»). */
  requirement?: UpgradeRequirement;
  /** Синергетический эффект (ветка «Софт»), применяется к доходу цели. */
  synergy?: SynergyEffect;
  /** Процент ручного клика от CPS (апгрейды «Рефакторинг» / «Нейроинтерфейс»). */
  clickCpsPercent?: number;
  /** Шанс крита, который открывает этот апгрейд (ТЗ: 5%, крит ×10). */
  critChance?: number;
  /** Стоимость в Данных 📊 вместо Вычислений (Этап 6: «Сбор телеметрии», ТЗ 8). */
  dataCost?: number;
  /** Глава, к доходу генераторов которой применяется бонус (Этап 6: «Распределённые вычисления», ТЗ 12). */
  chapter?: number;
  /** Процент к доходу всех генераторов указанной главы за каждые `per` генераторов этой главы (кап `cap`). */
  chapterIncomePerN?: { per: number; bonus: number; cap: number };
}

/** Типы синергий (ТЗ раздел 12). Все синергии имеют верхний предел. */
export type SynergyType =
  /** Каждые `per` генераторов `sourceId` дают +`bonus` к доходу `targetId`. */
  | "everyNToTarget"
  /** Каждые `per` генераторов любого типа дают +`bonus` к общему доходу. */
  | "everyNAnyToGlobal";

export interface SynergyEffect {
  type: SynergyType;
  sourceId?: string;
  targetId?: string;
  per: number;
  bonus: number;
  /** Верхний предел бонуса в виде доли (0.2 = максимум +200%). */
  cap: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  condition: (state: any) => boolean;
  unlocked: boolean;
  icon: string;
  /** Награда в Данных при разблокировке (Этап 5, ТЗ 28/19.1). */
  rewardData?: number;
  /** Награда во Фрагментах исходного кода (Этап 6, ТЗ 4.4/29.2). */
  rewardFragments?: number;
}

export interface ClickEffect {
  id: number;
  x: number;
  y: number;
  value: string;
  /** Флаг критического клика (Этап 3) — для отдельного стиля всплывающей цифры. */
  crit?: boolean;
}

/**
 * Престиж-апгрейд («Квантовые протоколы», ТЗ раздел 18, Этап 4).
 * Покупается за Квантовые ядра, имеет максимум уровней; цена следующего
 * уровня = baseCost × (текущий уровень + 1). Сохраняется после престижа.
 */
export interface PrestigeUpgradeData {
  id: string;
  name: string;
  /** Стоимость первого уровня в квантовых ядрах. */
  baseCost: number;
  maxLevel: number;
  description: string;
  branch: "prestige";
  /** true — механика откроется полностью на последующих этапах (рынок, разгон, оффлайн). */
  deferred?: boolean;
}

/* ===== Этап 5: Данные, мини-игры и ежедневные квесты (ТЗ разделы 4.2, 19–23, 27.1) ===== */

/** Статистика мини-игр за текущий день (лимиты ТЗ 23.2). */
export interface MinigameDailyStats {
  /** День в формате YYYY-MM-DD — при смене дня статистика обнуляется. */
  date: string;
  /** Сколько полных наград получено сегодня (максимум 5, ТЗ 23.2). */
  fullRewards: number;
  /** Сколько Данных получено из мини-игр сегодня (дневной кап, ТЗ 23.2). */
  dataEarned: number;
  /** id игры → была ли победа сегодня (повышенная первая награда, ТЗ 19.1). */
  wonByGame: Record<string, boolean>;
}

/** Результат завершённой мини-игры (для квеста «пройди мини-игру»). */
export interface MinigameRecord {
  minigameId: string;
  won: boolean;
  finishedAt: number;
}

/** Типы ежедневных квестов (пул ТЗ 27.1; оффлайн/реклама — Этапы 8/13). */
export type QuestType =
  | "clicks" // Кликают N раз
  | "buyGenerators" // Покупает N генераторов
  | "earnCompute" // Зарабатывает N вычислений
  | "playMinigame" // Проходит 1 мини-игру
  | "buyUpgrade"; // Покупает 1 апгрейд

/** Ежедневный квест (ТЗ 27.1): цель + награда (Вычисления и/или Данные). */
export interface QuestDef {
  id: string;
  type: QuestType;
  target: number;
  rewardCompute: number;
  rewardData: number;
}

/** Квест в состоянии игрока: прогресс считается от базовой точки на момент выдачи. */
export interface ActiveQuest extends QuestDef {
  progress: number;
  claimed: boolean;
}

/* ===== Этап 6: главы 2–4, Фрагменты исходного кода и Технологии за Данные (ТЗ 4.4, 8–10, 29) ===== */

/**
 * Технология — разблокировка за редкие ресурсы (Данные / Фрагменты),
 * покупаемая один раз навсегда. Открывает новые главы (ТЗ 8–10).
 */
export interface TechnologyData {
  id: string;
  name: string;
  description: string;
  /** Стоимость в Данных 📊. */
  dataCost: number;
  /** Стоимость во Фрагментах исходного кода 🧩 (ТЗ 4.4). */
  fragmentCost: number;
  /** Требуемое число завершённых престижей (ТЗ 8–10). */
  requiredPrestiges: number;
  /** Глава, которую открывает технология (номер из CHAPTERS). */
  unlocksChapter?: number;
}

/** Статистика пассивной добычи Данных «Сбор телеметрии» (ТЗ 8). */
export interface PassiveDataStats {
  /** День в формате YYYY-MM-DD — при смене дня счётчик суточного лимита обнуляется. */
  date: string;
  /** Сколько Данных получено пассивной добычей сегодня (лимит 12/сутки, ТЗ 8). */
  todayEarned: number;
  /** Накопленные доли данных (копление до целой единицы, +1/час за каждые 25 генераторов гл.2). */
  fractional: number;
}

export interface GameState {
  money: number;
  totalEarned: number;
  clickCount: number;
  generators: Record<string, number>;
  upgrades: string[];
  achievements: string[];
  currentChapter: number;
  lastSaveTime: number;
  generatorsOwned: number;

  // ===== Этап 4: престиж-система (ТЗ разделы 24, 18, 4.3) =====
  /** Текущие Квантовые ядра (тратятся на престиж-апгрейды, не сбрасываются). */
  quantumCores: number;
  /** Вычисления, заработанные с момента последнего престижа (для формулы ядер, ТЗ 24.4). */
  totalEarnedThisRun: number;
  /** Количество завершённых престижей. */
  prestigeCount: number;
  /** Уровни престиж-апгрейдов «Квантовые протоколы»: id → купленный уровень. */
  prestigeUpgrades: Record<string, number>;
  /** Клики за всё время (статистика сохраняется при престиже, ТЗ 24.3). */
  totalClicksAllTime: number;

  // ===== Этап 5: Данные, мини-игры, ежедневные квесты (ТЗ 4.2, 19–23, 27.1) =====
  /** Редкий мета-ресурс «Данные» 📊. Не сбрасываются при престиже (ТЗ 4.2). */
  data: number;
  /** Статистика мини-игр за текущий день (лимиты наград, ТЗ 23.2). */
  minigameStats: MinigameDailyStats;
  /** Момент завершения последней мини-игры, мс (доступность, ТЗ 23.1). 0 — ещё не было. */
  lastMinigameAt: number;
  /** Всего запущенных мини-игр (за всё время). */
  minigamesPlayed: number;
  /** Побеждённых мини-игр (за всё время). */
  minigamesCompleted: number;
  /** Активные ежедневные квесты (3 квеста в день выбираются из пула, ТЗ 27.1). */
  quests: ActiveQuest[];
  /** День, на который выданы квесты (YYYY-MM-DD). */
  questsDate: string;
  /** Базовые точки счётчиков на момент выдачи квестов (чтобы прогресс был «за сегодня»). */
  questBaselines: {
    totalClicks: number;
    generatorsOwned: number;
    totalEarned: number;
    upgradesCount: number;
    minigamesCompleted: number;
  };
  /** Завершённые квесты за всё время (для достижений/статистики). */
  questsCompleted: number;

  // ===== Этап 6: Фрагменты, Технологии, навигация по главам (ТЗ 4.4, 8–10, 29) =====
  /** Фрагменты исходного кода 🧩: эндгейм-коллекция, всего 100 (ТЗ 4.4, 29.1). Не сбрасываются при престиже. */
  fragments: number;
  /** id купленных технологий (навсегда; не сбрасываются при престиже, ТЗ 24.3). */
  technologies: string[];
  /** Номера навсегда открытых сюжетных этапов (не сбрасываются при престиже, ТЗ 24.3). */
  chaptersUnlockedForever: number[];
  /** Активный просмотренный этап (глава или космос-этап 5–7). */
  viewChapter: number;
  /** Пассивная добыча Данных после апгрейда «Сбор телеметрии» (ТЗ 8). */
  passiveData: PassiveDataStats;
}
