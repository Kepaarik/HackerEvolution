/**
 * DataResource — ресурс «Данные» (Этап 5, ТЗ раздел 4.2).
 *
 * Роль: редкий мета-ресурс.
 *  - Источники: мини-игры, ежедневные квесты, достижения, престиж-бонусы (ТЗ 19.1).
 *  - Траты: технологии, часть софт-апгрейдов, новые главы (ТЗ 19.2 — Этапы 6+).
 *  - НЕ сбрасываются при престиже; потраченные Данные не возвращаются (ТЗ 19.3).
 *
 * Модуль чистый (без React): хранит числовой баланс и публикует изменения
 * через глобальный EventBus (событие DATA_CHANGED).
 */

import { eventBus, EVENTS } from '../core/EventBus'

export class DataResource {
  private balance = 0

  constructor(initial = 0) {
    this.balance = Math.max(0, initial)
  }

  /** Текущий баланс Данных. */
  get amount(): number {
    return this.balance
  }

  /** Синхронизировать баланс из состояния игры (загрузка сейва / награда). */
  setAmount(value: number): void {
    const next = Math.max(0, value)
    const delta = next - this.balance
    this.balance = next
    if (delta !== 0) {
      eventBus.emit(EVENTS.DATA_CHANGED, { value: next, delta })
    }
  }

  /** Начислить Данные (награда мини-игры / квеста / достижения). */
  add(amount: number): number {
    if (amount <= 0) return this.balance
    this.setAmount(this.balance + amount)
    return this.balance
  }

  /** Можно ли потратить `cost` Данных. */
  canAfford(cost: number): boolean {
    return this.balance >= cost
  }

  /** Потратить Данные. false — если не хватает. */
  spend(cost: number): boolean {
    if (cost < 0 || !this.canAfford(cost)) return false
    this.setAmount(this.balance - cost)
    return true
  }
}

/** Глобальный синглтон ресурса «Данные». */
export const dataResource = new DataResource()
