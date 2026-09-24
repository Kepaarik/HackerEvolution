/**
 * FragmentsResource — ресурс «Фрагменты исходного кода» (Этап 6, ТЗ разделы 4.4, 29).
 *
 * Роль: эндгейм-коллекция и условие финала.
 *  - Всего 100 фрагментов (ТЗ 29.1);
 *  - Не сбрасываются при престиже;
 *  - Источники: достижения и сюжетные этапы (ТЗ 29.2; корпорации и события — следующие циклы);
 *  - Траты: технологии «Межпланетная сеть» и «Протокол экспансии» (ТЗ 9–10), Сингулярность (ТЗ 29.4).
 *
 * Модуль чистый (без React): хранит целочисленный баланс и публикует изменения
 * через глобальный EventBus (событие FRAGMENTS_CHANGED).
 */

import { eventBus, EVENTS } from '../core/EventBus'

/** Всего фрагментов в игре (ТЗ 29.1). */
export const TOTAL_FRAGMENTS = 100

export class FragmentsResource {
  private balance = 0

  constructor(initial = 0) {
    this.balance = Math.max(0, Math.floor(initial))
  }

  /** Текущий баланс фрагментов. */
  get amount(): number {
    return this.balance
  }

  /** Прогресс коллекции 0..1 (для Сингулярности, ТЗ 29.4). */
  get progress(): number {
    return Math.min(1, this.balance / TOTAL_FRAGMENTS)
  }

  /** Синхронизировать баланс из состояния игры (загрузка сейва / награда). */
  setAmount(value: number): void {
    const next = Math.max(0, Math.floor(value))
    const delta = next - this.balance
    this.balance = next
    if (delta !== 0) {
      eventBus.emit(EVENTS.FRAGMENTS_CHANGED, { value: next, delta })
    }
  }

  /** Начислить фрагменты (достижение / сюжетный этап). Возвращает новый баланс. */
  add(amount: number): number {
    const gain = Math.floor(amount)
    if (gain <= 0) return this.balance
    this.setAmount(this.balance + gain)
    return this.balance
  }

  /** Можно ли потратить `cost` фрагментов. */
  canAfford(cost: number): boolean {
    return this.balance >= cost
  }

  /** Потратить фрагменты (покупка технологии). false — если не хватает. */
  spend(cost: number): boolean {
    const price = Math.floor(cost)
    if (price < 0 || !this.canAfford(price)) return false
    this.setAmount(this.balance - price)
    return true
  }
}

/** Глобальный синглтон ресурса «Фрагменты исходного кода». */
export const fragmentsResource = new FragmentsResource()
