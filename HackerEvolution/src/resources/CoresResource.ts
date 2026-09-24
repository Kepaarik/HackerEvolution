/**
 * CoresResource — ресурс «Квантовые ядра» (Этап 4, ТЗ раздел 4.3).
 *
 * Роль: валюта престижа.
 *  - Получаются при престиже («Перезагрузка системы», ТЗ 24.4).
 *  - Тратятся на престиж-апгрейды «Квантовые протоколы» (ТЗ раздел 18).
 *  - НЕ сбрасываются при престиже и не конвертируются обратно в вычисления.
 *
 * Модуль чистый (без React): хранит целочисленный баланс и публикует
 * изменения через глобальный EventBus (событие CORES_CHANGED).
 */

import { eventBus, EVENTS } from '../core/EventBus'

export class CoresResource {
  private balance = 0

  constructor(initial = 0) {
    // Ядра — целая валюта (формула ТЗ 24.4 даёт floor), приводим к int.
    this.balance = Math.max(0, Math.floor(initial))
  }

  /** Текущий баланс ядер. */
  get amount(): number {
    return this.balance
  }

  /** Синхронизировать баланс из состояния игры (загрузка сейва / применение престижа). */
  setAmount(value: number): void {
    const next = Math.max(0, Math.floor(value))
    const delta = next - this.balance
    this.balance = next
    if (delta !== 0) {
      eventBus.emit(EVENTS.CORES_CHANGED, { value: next, delta })
    }
  }

  /** Начислить ядра (престиж-бонусы, достижения). Возвращает новый баланс. */
  add(amount: number): number {
    const gain = Math.floor(amount)
    if (gain <= 0) return this.balance
    this.setAmount(this.balance + gain)
    return this.balance
  }

  /** Можно ли потратить `cost` ядер. */
  canAfford(cost: number): boolean {
    return this.balance >= cost
  }

  /** Потратить ядра (покупка престиж-апгрейда). false — если не хватает. */
  spend(cost: number): boolean {
    const price = Math.floor(cost)
    if (price < 0 || !this.canAfford(price)) return false
    this.setAmount(this.balance - price)
    return true
  }
}

/** Глобальный синглтон ресурса «Квантовые ядра». */
export const coresResource = new CoresResource()
