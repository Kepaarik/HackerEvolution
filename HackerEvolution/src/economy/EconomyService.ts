/**
 * EconomyService — чистые (без React) функции экономики (Этап 3).
 * Реализует математику из ТЗ:
 *  - 11.1 цена одного генератора;
 *  - 11.2 цена пакета (x10 / x25);
 *  - 11.5 покупка на максимум (логарифмическая формула + проверка);
 *  - 11.3/11.4 доход генератора и CPS с учётом апгрейдов, синергий и лимитов;
 *  - 12 синергии с верхними пределами;
 *  - 13 клик с процентом от CPS и критические клики.
 */

import type { GameState, SynergyEffect } from "../types";
import { GENERATORS, UPGRADES } from "../gameData";
import { getPrestigeUpgradeLevel } from "./PrestigeService";
import {
  MAX_CLICK_CPS_PERCENT,
  CLICK_CPS_LIMIT_SECONDS,
  CRIT_CPS_LIMIT_SECONDS,
  CRIT_CHANCE,
  CRIT_MULTIPLIER,
} from "../core/Constants";

/** Цена одного следующего генератора (ТЗ 11.1): Base × Growth^count. */
export function getGeneratorCost(
  baseCost: number,
  growth: number,
  owned: number,
): number {
  return baseCost * Math.pow(growth, owned);
}

/** Цена пакета из `amount` генераторов (ТЗ 11.2) — сумма геометрической прогрессии. */
export function getBulkCost(
  baseCost: number,
  growth: number,
  owned: number,
  amount: number,
): number {
  if (amount <= 0) return 0;
  const first = baseCost * Math.pow(growth, owned);
  // first * (growth^amount - 1) / (growth - 1)
  return (first * (Math.pow(growth, amount) - 1)) / (growth - 1);
}

/**
 * Максимальное количество генераторов, которые можно купить на `money` (ТЗ 11.5).
 * Логарифмическая формула с последующей проверкой (корректировка на погрешность float).
 */
export function getMaxAffordable(
  baseCost: number,
  growth: number,
  owned: number,
  money: number,
): number {
  const first = baseCost * Math.pow(growth, owned);
  if (money < first) return 0;
  // n = log_g( money*(g-1)/first + 1 )
  let n = Math.floor(
    Math.log((money * (growth - 1)) / first + 1) / Math.log(growth),
  );
  // Проверка и коррекция: не переплатить и не недооценить
  while (n > 0 && getBulkCost(baseCost, growth, owned, n) > money) n -= 1;
  while (getBulkCost(baseCost, growth, owned, n + 1) <= money) n += 1;
  return n;
}

/** Синергетический множитель для конкретной цели (`targetId` или `"global"`). */
export function getSynergyMultiplier(
  targetId: string,
  state: GameState,
  purchasedSynergies: SynergyEffect[],
): number {
  let bonus = 0;
  for (const syn of purchasedSynergies) {
    if (syn.targetId !== targetId) continue;
    let count: number;
    if (syn.type === "everyNToTarget") {
      count = state.generators[syn.sourceId ?? ""] ?? 0;
    } else {
      // everyNAnyToGlobal — считаем все генераторы всех типов
      count = Object.values(state.generators).reduce((a, b) => a + b, 0);
    }
    // Каждые `per` штук дают +`bonus`, но не выше `cap` (верхний предел синергии)
    bonus = Math.min(
      bonus + Math.min(Math.floor(count / syn.per) * syn.bonus, syn.cap),
      syn.cap,
    );
  }
  return 1 + bonus;
}

/** Множители ветки «Железо» для генератора (удвоение конкретного генератора). */
function getHardwareMultiplier(genId: string, state: GameState): number {
  let multiplier = 1;
  for (const u of UPGRADES) {
    if (u.target === genId && state.upgrades.includes(u.id)) {
      multiplier *= u.multiplier;
    }
  }
  return multiplier;
}

/**
 * Бонус «Распределённые вычисления» (ТЗ 12, Этап 6): +bonus% к доходу всех
 * генераторов главы за каждые `per` генераторов этой же главы (кап `cap`).
 */
function getChapterIncomeBonus(genChapter: number, state: GameState): number {
  let bonus = 0;
  for (const u of UPGRADES) {
    if (!u.chapterIncomePerN || !state.upgrades.includes(u.id)) continue;
    if ((u.chapter ?? genChapter) !== genChapter) continue;
    const { per, bonus: b, cap } = u.chapterIncomePerN;
    const inChapter = GENERATORS.filter((g) => g.chapter === genChapter).reduce(
      (sum, g) => sum + (state.generators[g.id] ?? 0),
      0,
    );
    bonus += Math.min(Math.floor(inChapter / per) * b, cap);
  }
  return 1 + bonus;
}

/** Купленные синергии игрока. */
function getPurchasedSynergies(state: GameState): SynergyEffect[] {
  return UPGRADES.filter(
    (u) => u.synergy && state.upgrades.includes(u.id),
  ).map((u) => u.synergy as SynergyEffect);
}

/** Доход одного генератора в секунду с учётом купленных апгрейдов и синергий (ТЗ 11.3). */
export function getGeneratorIncome(genId: string, state: GameState): number {
  const gen = GENERATORS.find((g) => g.id === genId);
  if (!gen) return 0;
  const count = state.generators[genId] || 0;
  if (count === 0) return 0;

  const synergies = getPurchasedSynergies(state);

  let multiplier = getHardwareMultiplier(genId, state);
  // Синергии на конкретный генератор + глобальная синергия
  multiplier *= getSynergyMultiplier(genId, state, synergies);
  multiplier *= getSynergyMultiplier("global", state, synergies);
  // Главные бонусы («Распределённые вычисления», ТЗ 12) — по главе генератора
  multiplier *= getChapterIncomeBonus(gen.chapter, state);

  return gen.baseIncome * count * multiplier;
}

/** Общий доход в секунду (ТЗ 11.4): CPS = сумма доходов всех генераторов. */
export function getCps(state: GameState): number {
  const base = GENERATORS.reduce(
    (sum, gen) => sum + getGeneratorIncome(gen.id, state),
    0,
  );
  // Престиж-апгрейд «Эффективность ядер» (ТЗ 18): +2% к общему доходу за уровень.
  // «ИИ-автономия» (ТЗ 18): +1% к CPS за уровень — применяется здесь же.
  return (
    base *
    (1 + 0.02 * getPrestigeUpgradeLevel("cores_efficiency", state)) *
    (1 + 0.01 * getPrestigeUpgradeLevel("ai_autonomy", state))
  );
}

/** Суммарный процент клика от CPS (с ограничением 5% из ТЗ 13.2). */
export function getClickCpsPercent(state: GameState): number {
  let percent = 0;
  for (const u of UPGRADES) {
    if (!state.upgrades.includes(u.id) || !u.clickCpsPercent) continue;
    percent += u.clickCpsPercent;
  }
  return Math.min(percent, MAX_CLICK_CPS_PERCENT);
}

/** Есть ли у игрока разблокированный крит (апгрейд «Критический сбой»). */
export function hasCritUnlock(state: GameState): boolean {
  return UPGRADES.some(
    (u) => u.critChance !== undefined && state.upgrades.includes(u.id),
  );
}

export interface ClickResult {
  value: number;
  crit: boolean;
}

/**
 * Расчёт силы ручного клика (ТЗ 13.1–13.3).
 *  СилаКлика = БазовыйКлик × МножителиКлика
 *  РучнойКлик = СилаКлика + min(CPS × ПроцентОтCPS, ЛимитКлика)
 *  Крит (5%, ×10) работает только для ручных кликов; итог ограничен 120 сек пассивного дохода.
 * `rng` инжектируется для тестируемости (по умолчанию Math.random).
 */
export function computeManualClick(
  state: GameState,
  cps: number,
  rng: () => number = Math.random,
): ClickResult {
  const power = getClickPower(state);

  // Процент от CPS, ограниченный 30 секундами пассивного дохода
  const cpsPart = Math.min(
    cps * getClickCpsPercent(state),
    cps * CLICK_CPS_LIMIT_SECONDS,
  );
  let value = power + cpsPart;
  let crit = false;

  if (hasCritUnlock(state) && rng() < CRIT_CHANCE) {
    crit = true;
    value *= CRIT_MULTIPLIER;
  }

  // Жёсткие лимиты ТЗ 13.2: обычный клик ≤ 30 сек дохода, крит ≤ 120 сек дохода
  const limitSeconds = crit ? CRIT_CPS_LIMIT_SECONDS : CLICK_CPS_LIMIT_SECONDS;
  value = Math.min(value, Math.max(power, cps * limitSeconds));

  return { value, crit };
}

/** Сила клика без процента от CPS: БазовыйКлик × МножителиКлика (ТЗ 13.1). */
export function getClickPower(state: GameState): number {
  let power = 1;
  for (const u of UPGRADES) {
    if (u.target === "click" && state.upgrades.includes(u.id)) {
      power *= u.multiplier;
    }
  }
  return power;
}

/** Максимальный навсегда открытый этап (сюжетные 1–4 + космические 5–7, Этап 6). */
export function getMaxStage(state: GameState): number {
  let max = state.currentChapter ?? 1;
  for (const ch of state.chaptersUnlockedForever ?? []) {
    if (ch > max) max = ch;
  }
  return max;
}

/**
 * Видимость генератора (Этап 3 + Этап 6):
 *  - сюжетные главы 1–4: глава пройдена в этом забеге и заработан ~50% базовой цены (ТЗ 6.1);
 *  - космические этапы 5–7: этап открыт навсегда технологией; следующий генератор
 *    цепочки появляется после 10 штук предшественника (ТЗ 8–10).
 */
export function isGeneratorVisible(genId: string, state: GameState): boolean {
  const gen = GENERATORS.find((g) => g.id === genId);
  if (!gen) return false;
  // Уже купленный генератор всегда виден
  if ((state.generators[genId] ?? 0) > 0) return true;

  if (gen.chapter <= 4) {
    if (gen.chapter > state.currentChapter) return false;
    return state.totalEarned >= gen.unlockAtTotalEarned;
  }

  // Космический этап: доступен, если открыт навсегда (технология, ТЗ 8–10)
  if (!(state.chaptersUnlockedForever ?? []).includes(gen.chapter)) return false;
  // Цепочка появления: нужен N генераторов-предшественников (ТЗ 8–10)
  if (gen.requiresGenerator) {
    return (state.generators[gen.requiresGenerator.generatorId] ?? 0) >= gen.requiresGenerator.count;
  }
  return true;
}

/**
 * Доступен ли апгрейд для отображения (Этап 6): апгрейды космических глав
 * скрыты, пока соответствующий этап не открыт навсегда.
 */
export function isUpgradeVisible(upgradeId: string, state: GameState): boolean {
  const upg = UPGRADES.find((u) => u.id === upgradeId);
  if (!upg) return false;
  if (!upg.requirement) return true;
  const gen = GENERATORS.find((g) => g.id === upg.requirement!.generatorId);
  if (!gen || gen.chapter <= 4) return true;
  return (state.chaptersUnlockedForever ?? []).includes(gen.chapter);
}

/** Условие покупки апгрейда: выполнены требования по генераторам (ТЗ раздел 15). */
export function isUpgradeAvailable(upgradeId: string, state: GameState): boolean {
  const upg = UPGRADES.find((u) => u.id === upgradeId);
  if (!upg || state.upgrades.includes(upgradeId)) return false;
  if (!isUpgradeVisible(upgradeId, state)) return false;
  if (upg.requirement && (state.generators[upg.requirement.generatorId] || 0) < upg.requirement.count) {
    return false;
  }
  // Апгрейды за Данные 📊 (Этап 6, ТЗ 8): цена — dataCost, а не Вычисления
  if (upg.dataCost !== undefined) {
    return (state.data ?? 0) >= upg.dataCost;
  }
  return state.money >= upg.cost;
}
