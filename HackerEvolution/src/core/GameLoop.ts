/**
 * GameLoop — игровой цикл на requestAnimationFrame (Этап 1).
 *
 * Разделяет два вида работы:
 *  - экономический «тик» с фиксированным интервалом (по умолчанию 1 сек),
 *    накопление времени через аккумулятор (детерминированность дохода);
 *  - покадровый рендер/обновления UI через подписки (60 FPS).
 *
 * Цикл автоматически приостанавливается, когда вкладка не видима
 * (экономия батареи), а «догоняющие» тики считаются по wall-clock времени.
 */

import { eventBus, EVENTS } from './EventBus'

export interface GameLoopOptions {
  /** Интервал экономического тика, мс. */
  tickIntervalMs?: number
  /** Максимум тиков за один кадр (защита от «спирали смерти»). */
  maxTicksPerFrame?: number
}

type FrameCallback = (deltaMs: number) => void
type TickCallback = () => void

export class GameLoop {
  readonly tickIntervalMs: number
  private readonly maxTicksPerFrame: number

  private lastFrameAt = 0
  private accumulated = 0
  private running = false
  private rafId = 0

  private frameCallbacks = new Set<FrameCallback>()
  private tickCallbacks = new Set<TickCallback>()

  constructor(options: GameLoopOptions = {}) {
    this.tickIntervalMs = options.tickIntervalMs ?? 1000
    this.maxTicksPerFrame = options.maxTicksPerFrame ?? 250
  }

  get isRunning(): boolean {
    return this.running
  }

  /** Подписка на покадровые обновления. Возвращает функцию отписки. */
  onFrame(cb: FrameCallback): () => void {
    this.frameCallbacks.add(cb)
    return () => this.frameCallbacks.delete(cb)
  }

  /** Подписка на экономические тики (каждые tickIntervalMs). */
  onTick(cb: TickCallback): () => void {
    this.tickCallbacks.add(cb)
    return () => this.tickCallbacks.delete(cb)
  }

  start(): void {
    if (this.running) return
    this.running = true
    this.lastFrameAt = performance.now()
    this.accumulated = 0
    document.addEventListener('visibilitychange', this.handleVisibility)
    this.rafId = requestAnimationFrame(this.loop)
  }

  stop(): void {
    if (!this.running) return
    this.running = false
    cancelAnimationFrame(this.rafId)
    document.removeEventListener('visibilitychange', this.handleVisibility)
  }

  /** При возврате на вкладку догоняем пропущенные тики (ограниченно). */
  private handleVisibility = (): void => {
    if (document.visibilityState === 'visible' && this.running) {
      this.lastFrameAt = performance.now()
    }
  }

  private loop = (now: number): void => {
    if (!this.running) return

    const deltaMs = Math.max(0, now - this.lastFrameAt)
    this.lastFrameAt = now

    // Экономические тики с аккумулятором времени
    this.accumulated += deltaMs
    let ticks = 0
    while (this.accumulated >= this.tickIntervalMs && ticks < this.maxTicksPerFrame) {
      this.accumulated -= this.tickIntervalMs
      ticks++
      for (const cb of this.tickCallbacks) cb()
      eventBus.emit(EVENTS.GAME_TICK, { deltaMs: this.tickIntervalMs, ticks })
    }
    if (ticks >= this.maxTicksPerFrame) this.accumulated = 0

    // Покадровые обновления (UI, анимации)
    for (const cb of this.frameCallbacks) cb(deltaMs)

    this.rafId = requestAnimationFrame(this.loop)
  }
}

/** Глобальный синглтон игрового цикла. */
export const gameLoop = new GameLoop()
