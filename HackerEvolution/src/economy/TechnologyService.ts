/**
 * TechnologyService — технологии за Данные/Фрагменты (Этап 6, ТЗ разделы 8–10).
 *
 * Чистые (без React) функции:
 *  - проверка условий покупки (престижи, Данные, Фрагменты);
 *  - покупка технологии навсегда открывает космический этап (главу 2–4 ТЗ):
 *    покупается его первый генератор (условие ТЗ «Открыта глава N»);
 *  - технологии НЕ сбрасываются при престиже (ТЗ 24.3).
 */

import type { GameState, TechnologyData } from '../types'
import { TECHNOLOGIES, SPACE_STAGES, GENERATORS } from '../gameData'
import { getGeneratorCost } from './EconomyService'

export { TECHNOLOGIES }

/** Технология по id или null. */
export function getTechnology(id: string): TechnologyData | null {
  return TECHNOLOGIES.find((t) => t.id === id) ?? null
}

/** Куплена ли технология. */
export function hasTechnology(state: GameState, id: string): boolean {
  return state.technologies?.includes(id) ?? false
}

/** Выполнены ли требования технологии (престижи + ресурсы), без учёта покупки. */
export function canBuyTechnology(state: GameState, id: string): boolean {
  const tech = getTechnology(id)
  if (!tech || hasTechnology(state, id)) return false
  if ((state.prestigeCount ?? 0) < tech.requiredPrestiges) return false
  return (state.data ?? 0) >= tech.dataCost && (state.fragments ?? 0) >= tech.fragmentCost
}

/** Открыт ли космический этап (навсегда, через технологию). */
export function isStageUnlockedForever(state: GameState, chapter: number): boolean {
  return state.chaptersUnlockedForever?.includes(chapter) ?? false
}

/**
 * Купить технологию за Данные и Фрагменты.
 * Возвращает новое состояние или null, если покупка невозможна.
 * Побочный эффект: навсегда открывается связанный этап и покупается
 * его первый генератор по базовой цене (условие ТЗ «Открыта глава N»).
 */
export function buyTechnologyState(state: GameState, id: string): GameState | null {
  const tech = getTechnology(id)
  if (!canBuyTechnology(state, id) || !tech) return null

  let next: GameState = {
    ...state,
    data: state.data - tech.dataCost,
    fragments: (state.fragments ?? 0) - tech.fragmentCost,
    technologies: [...(state.technologies ?? []), id],
  }

  if (tech.unlocksChapter !== undefined) {
    const stage = SPACE_STAGES.find((s) => s.chapter === tech.unlocksChapter)
    if (stage && !isStageUnlockedForever(next, stage.chapter)) {
      // Открываем ВСЕ этапы до нового включительно (навсегда)
      const forever = new Set([...(next.chaptersUnlockedForever ?? []), stage.chapter])
      for (const s of SPACE_STAGES) {
        if (s.chapter <= stage.chapter && hasTechnology(next, s.technologyId)) {
          forever.add(s.chapter)
        }
      }
      next = { ...next, chaptersUnlockedForever: [...forever].sort((a, b) => a - b) }

      // Первый генератор этапа покупается автоматически по базовой цене (ТЗ 8–10)
      const owned = next.generators[stage.starterGeneratorId] ?? 0
      if (owned === 0) {
        const starter = GENERATORS.find((g) => g.id === stage.starterGeneratorId)
        if (starter) {
          const cost = getGeneratorCost(starter.baseCost, starter.costGrowth, 0)
          next = {
            ...next,
            money: Math.max(0, next.money - cost),
            generators: { ...next.generators, [stage.starterGeneratorId]: 1 },
            generatorsOwned: next.generatorsOwned + 1,
            viewChapter: stage.chapter,
          }
        }
      } else {
        next = { ...next, viewChapter: stage.chapter }
      }
    }
  }

  return next
}

/**
 * Максимальный доступный игроку номер этапа:
 * сюжетные главы (1–4) определяются currentChapter, космические (5–7) —
 * навсегда открытыми технологиями.
 */
export function getMaxAvailableStage(state: GameState): number {
  let max = state.currentChapter
  for (const ch of state.chaptersUnlockedForever ?? []) {
    if (ch > max) max = ch
  }
  return max
}
