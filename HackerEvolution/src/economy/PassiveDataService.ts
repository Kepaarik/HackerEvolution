/**
 * PassiveDataService — пассивная добыча Данных и навигация по этапам (Этап 6, ТЗ раздел 8).
 *
 * Чистые (без React) функции:
 *  - «Сбор телеметрии» (апгрейд telemetry_collection): +1 📊 в час за каждые 25
 *    генераторов главы «Орбита», максимум 12 📊 в сутки (ТЗ 8);
 *  - переключение просмотренного этапа (viewChapter) с проверкой доступности.
 */

import type { GameState } from '../types'
import { GENERATORS } from '../gameData'
import { UPGRADES } from '../gameData'
import {
  PASSIVE_DATA_GENERATORS_PER,
  PASSIVE_DATA_DAILY_CAP,
} from '../core/Constants'
import { dayKey } from './MinigameService'
import { getMaxAvailableStage } from './TechnologyService'

/** Куплен ли апгрейд «Сбор телеметрии» (единственный источник пассивных Данных, ТЗ 8). */
export function hasTelemetry(state: GameState): boolean {
  return (state.upgrades ?? []).includes('telemetry_collection')
}

/** Сколько генераторов главы «Орбита» (глава 5 по нумерации этапов) куплено суммарно. */
export function getOrbitGeneratorsCount(state: GameState): number {
  return GENERATORS.filter((g) => g.chapter >= 5).reduce(
    (sum, g) => sum + (state.generators[g.id] ?? 0),
    0,
  )
}

/** Скорость пассивной добычи, 📊 в час (ТЗ 8: +1 за каждые 25 генераторов гл. 2). */
export function getPassiveDataRatePerHour(state: GameState): number {
  if (!hasTelemetry(state)) return 0
  return Math.floor(getOrbitGeneratorsCount(state) / PASSIVE_DATA_GENERATORS_PER)
}

/**
 * Тик пассивной добычи Данных (вызывается экономическим тиком раз в секунду).
 * Возвращает новое состояние; если начислений не было — исходное (без перерисовки).
 * Дробные доли копятся до целой единицы; действует суточный лимит 12 📊 (ТЗ 8).
 */
export function tickPassiveData(state: GameState, deltaSec: number = 1): GameState {
  if (!hasTelemetry(state)) return state
  const ratePerHour = getPassiveDataRatePerHour(state)
  if (ratePerHour <= 0 || deltaSec <= 0) return state

  const today = dayKey()
  let stats = state.passiveData
  // Смена дня — сброс суточного лимита
  if (!stats || stats.date !== today) {
    stats = { date: today, todayEarned: 0, fractional: stats?.fractional ?? 0 }
  }
  if (stats.todayEarned >= PASSIVE_DATA_DAILY_CAP) return state

  let fractional = stats.fractional + (ratePerHour * deltaSec) / 3600
  let whole = 0
  while (fractional >= 1) {
    fractional -= 1
    whole += 1
  }
  const grant = Math.min(whole, PASSIVE_DATA_DAILY_CAP - stats.todayEarned)
  // Начислили меньше, чем накопили целых единиц (упёрлись в суточный лимит) —
  // «сгорающие» доли превращаем обратно в дробь, чтобы не терять прогресс внутри лимита
  const leftoverFractional = whole > grant ? fractional + (whole - grant) : fractional

  return {
    ...state,
    data: state.data + grant,
    passiveData: {
      date: today,
      todayEarned: stats.todayEarned + grant,
      fractional: leftoverFractional,
    },
  }
}

/**
 * Переключить просмотренный этап (вкладка «Генераторы»), если он доступен:
 * сюжетные 1–4 — пройдены в этом забеге, космические 5–7 — открыты навсегда.
 */
export function setViewChapterState(state: GameState, chapter: number): GameState {
  const max = getMaxAvailableStage(state)
  if (chapter < 1 || chapter > max) return state
  if (state.viewChapter === chapter) return state
  return { ...state, viewChapter: chapter }
}

/** Апгрейд «Сбор телеметрии» из справочника (для UI-подсказок). */
export const TELEMETRY_UPGRADE = UPGRADES.find((u) => u.id === 'telemetry_collection')
