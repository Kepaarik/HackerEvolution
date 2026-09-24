/**
 * PrestigeService — чистые (без React) функции престиж-системы (Этап 4).
 * Реализует ТЗ раздел 24 «Престиж» и раздел 18 «Квантовые протоколы»:
 *  - 24.4 формула ядер: floor(sqrt(заработаноЗаЗабег / 1_000_000)) + бонусные ядра;
 *  - 24.5 условия: минимум 1 000 000 за забег и минимум 1 ядро;
 *  - 24.2/24.3 сброс и сохранение при престиже;
 *  - покупка престиж-апгрейдов («Квантовые протоколы») за Квантовые ядра.
 */

import type { GameState, PrestigeUpgradeData } from '../types'
import { PRESTIGE_UPGRADES } from '../gameData'
import {
  PRESTIGE_THRESHOLD,
  PRESTIGE_CORES_DIVISOR,
  MULTI_START_COMPUTATIONS,
  MULTI_START_LAPTOPS,
  COLD_START_BASE_COST,
} from '../core/Constants'

/** Ре-экспорт списка престиж-апгрейдов (ТЗ 18), чтобы UI-компоненты обращались к сервису. */
export { PRESTIGE_UPGRADES }

export interface CoresPreview {
  /** Ядра по основной формуле (без бонусов). */
  base: number
  /** Бонусные ядра (достижения, сюжетные этапы — Этапы 5–7). */
  bonus: number
  /** Итого ядер при престиже прямо сейчас. */
  total: number
}

/**
 * Предпросмотр наград: сколько ядер игрок получит при престиже сейчас (ТЗ 24.6 п.1).
 * Формула ТЗ 24.4: Ядра = floor(sqrt(ЗаработаноЗаЗабег / 1 000 000)) + БонусныеЯдра.
 */
export function getCoresPreview(state: GameState): CoresPreview {
  const earned = state.totalEarnedThisRun
  const base = Math.floor(Math.sqrt(earned / PRESTIGE_CORES_DIVISOR))
  return { base, bonus: 0, total: base }
}

/** Престиж доступен: порог 1M за забег и минимум 1 ядро (ТЗ 24.5). */
export function canPrestige(state: GameState): boolean {
  if (state.totalEarnedThisRun < PRESTIGE_THRESHOLD) return false
  return getCoresPreview(state).total >= 1
}

/**
 * Применить престиж («Перезагрузка системы», ТЗ 24.2–24.3).
 * Сбрасывается: генераторы, вычисления, обычные апгрейды, прогресс забега.
 * Сохраняется: ядра, достижения, престиж-апгрейды, статистика, текущая глава.
 * «Мульти-старт»: после престижа выдаёт 1 000 вычислений и 5 старых ноутбуков.
 */
export function applyPrestige(state: GameState): GameState {
  const gained = getCoresPreview(state).total
  const multiStart = hasPrestigeUpgrade(state, 'multi_start')
  return {
    ...state,
    money: multiStart ? MULTI_START_COMPUTATIONS : 0,
    generators: multiStart ? { old_laptop: MULTI_START_LAPTOPS } : {},
    generatorsOwned: multiStart ? MULTI_START_LAPTOPS : 0,
    upgrades: [], // обычные апгрейды сбрасываются (ТЗ 24.2)
    totalEarnedThisRun: 0,
    currentChapter: 1, // главы сбрасываются — забег начинается заново (ТЗ 24.2)
    // Этап 6: после перезагрузки системы просмотр возвращается на первый этап;
    // навсегда открытые космические этапы (chaptersUnlockedForever) сохраняются (ТЗ 24.3)
    viewChapter: 1,
    quantumCores: state.quantumCores + gained,
    prestigeCount: state.prestigeCount + 1,
    totalClicksAllTime: state.totalClicksAllTime + state.clickCount,
    clickCount: 0,
  }
}

/** Все престиж-апгрейды. */
export function getPrestigeUpgrades(): readonly PrestigeUpgradeData[] {
  return PRESTIGE_UPGRADES
}

/**
 * Сколько уровней престиж-апгрейда куплено игроком.
 * Поле `prestigeUpgrades` может отсутствовать в частичных/старых состояниях
 * (например, при вызовах с неполным объектом), поэтому читаем его безопасно.
 */
export function getPrestigeUpgradeLevel(id: string, state: Pick<GameState, 'prestigeUpgrades'> | Partial<GameState>): number {
  return state?.prestigeUpgrades?.[id] ?? 0
}

/** Есть ли у игрока хотя бы один уровень престиж-апгрейда. */
export function hasPrestigeUpgrade(state: GameState, id: string): boolean {
  return getPrestigeUpgradeLevel(id, state) > 0
}

/** Цена следующего уровня престиж-апгрейда (ТЗ 18: стоимость × уровень). Infinity если максимум достигнут. */
export function getPrestigeUpgradeCost(id: string, state: GameState): number {
  const upg = PRESTIGE_UPGRADES.find((u) => u.id === id)
  if (!upg) return Infinity
  const level = getPrestigeUpgradeLevel(id, state)
  if (level >= upg.maxLevel) return Infinity
  return upg.baseCost * (level + 1)
}

/** Можно ли купить следующий уровень: хватает ядер и не достигнут максимум. */
export function canBuyPrestigeUpgrade(id: string, state: GameState): boolean {
  const cost = getPrestigeUpgradeCost(id, state)
  return Number.isFinite(cost) && state.quantumCores >= cost
}

/** Купить уровень престиж-апгрейда за ядра. Возвращает новое состояние или null, если покупка невозможна. */
export function buyPrestigeUpgradeState(id: string, state: GameState): GameState | null {
  if (!canBuyPrestigeUpgrade(id, state)) return null
  const cost = getPrestigeUpgradeCost(id, state)
  return {
    ...state,
    quantumCores: state.quantumCores - cost,
    prestigeUpgrades: {
      ...state.prestigeUpgrades,
      [id]: getPrestigeUpgradeLevel(id, state) + 1,
    },
  }
}

/** Множитель дохода ветки «Эффективность ядер»: +2% за уровень (ТЗ 18). */
export function getCoresEfficiencyMultiplier(state: GameState): number {
  return 1 + 0.02 * getPrestigeUpgradeLevel('cores_efficiency', state)
}

/** Множитель наград Данных ветки «Сборщик Данных»: +10% за уровень (ТЗ 18; применяется на Этапе 5). */
export function getDataCollectorMultiplier(state: GameState): number {
  return 1 + 0.1 * getPrestigeUpgradeLevel('data_collector', state)
}

/**
 * «ИИ-автономия» (ТЗ 18): +1% к CPS за уровень.
 * Реализация через рост силы клика (ТЗ 13.1: базовый клик растёт с престиж-прогрессом),
 * чтобы не нарушать лимиты ручного клика из ТЗ 13.2.
 */
export function getAiAutonomyClickBonus(state: GameState): number {
  return getPrestigeUpgradeLevel('ai_autonomy', state)
}

/**
 * Эффективная базовая цена генератора с учётом «Холодного старта» (ТЗ 18):
 * первый генератор («Старый ноутбук») стоит дешевле после престижа.
 */
export function getEffectiveBaseCost(
  genId: string,
  defaultBaseCost: number,
  state: GameState,
): number {
  if (genId === 'old_laptop' && hasPrestigeUpgrade(state, 'cold_start')) {
    return Math.min(defaultBaseCost, COLD_START_BASE_COST)
  }
  return defaultBaseCost
}

/** Лимит оффлайна с учётом престиж-апгрейдов «Расширение оффлайна» (ТЗ 18, Этап 8). */
export function getOfflineCapSeconds(state: GameState): number {
  if (hasPrestigeUpgrade(state, 'offline_24h')) return 24 * 3600
  if (hasPrestigeUpgrade(state, 'offline_8h')) return 8 * 3600
  return 2 * 3600 // базовый лимит без апгрейдов
}

/* ===== Экран престижа (ТЗ 24.6) ===== */

export interface PrestigePreview {
  /** Сколько ядер будет получено (ТЗ 24.6 п.1). */
  coresToGain: number
  /** Прогресс до минимального порога забега 1M (0..1). */
  progress: number
  /** Что сохранится после престижа (ТЗ 24.3, п.4 экрана). */
  keeps: string[]
  /** Что будет сброшено (ТЗ 24.2, п.3 экрана). */
  resets: string[]
  /** Какие механики откроются после престижа (ТЗ 24.6 п.5): глава 2 + ветка «Квантовые протоколы». */
  unlocks: string[]
  /** Доступен ли престиж прямо сейчас (ТЗ 24.5). */
  available: boolean
}

/**
 * Данные для экрана престижа «Перезагрузка системы» (ТЗ 24.6):
 * награда, прогресс до порога, списки «сохранится / сбросится / откроется».
 */
export function getPrestigePreview(state: GameState): PrestigePreview {
  const preview = getCoresPreview(state)
  return {
    coresToGain: preview.total,
    progress: Math.min(1, state.totalEarnedThisRun / PRESTIGE_THRESHOLD),
    keeps: [
      'Квантовые ядра',
      'Достижения',
      'Престиж-апгрейды («Квантовые протоколы»)',
      'Статистика',
      'Открытые главы',
    ],
    resets: [
      'Все генераторы',
      'Текущие вычисления',
      'Обычные апгрейды (Железо / Софт / Ручной взлом)',
      'Прогресс текущего забега',
    ],
    unlocks: ['Глава 2: Орбита', 'Ветка «Квантовые протоколы»'],
    available: canPrestige(state),
  }
}
