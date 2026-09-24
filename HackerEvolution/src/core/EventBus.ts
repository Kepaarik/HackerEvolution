/**
 * EventBus — лёгкая типизированная система событий (Этап 1).
 * Используется для развязки игровой логики и UI:
 * логика публикует события, компоненты подписываются на них.
 */

export type EventHandler<T = unknown> = (payload: T) => void

/** Отписка от события — функция, возвращаемая методом `on`. */
export type Unsubscribe = () => void

export class EventBus<Events extends Record<string, unknown> = Record<string, unknown>> {
  private listeners = new Map<keyof Events, Set<EventHandler<any>>>()

  /** Подписаться на событие. Возвращает функцию отписки. */
  on<K extends keyof Events>(event: K, handler: EventHandler<Events[K]>): Unsubscribe {
    let handlers = this.listeners.get(event)
    if (!handlers) {
      handlers = new Set()
      this.listeners.set(event, handlers)
    }
    handlers.add(handler as EventHandler<any>)
    return () => this.off(event, handler)
  }

  /** Подписаться на событие только на одно срабатывание. */
  once<K extends keyof Events>(event: K, handler: EventHandler<Events[K]>): Unsubscribe {
    const wrapped: EventHandler<Events[K]> = (payload) => {
      this.off(event, wrapped)
      handler(payload)
    }
    return this.on(event, wrapped)
  }

  /** Отписаться от события (без handler — удалить всех слушателей события). */
  off<K extends keyof Events>(event: K, handler?: EventHandler<Events[K]>): void {
    const handlers = this.listeners.get(event)
    if (!handlers) return
    if (handler) {
      handlers.delete(handler as EventHandler<any>)
      if (handlers.size === 0) this.listeners.delete(event)
    } else {
      this.listeners.delete(event)
    }
  }

  /** Опубликовать событие всем слушателям. */
  emit<K extends keyof Events>(event: K, payload?: Events[K]): void {
    const handlers = this.listeners.get(event)
    if (!handlers || handlers.size === 0) return
    // Копия множества, чтобы безопасно поддерживать on/off внутри обработчиков
    for (const handler of [...handlers]) {
      try {
        ;(handler as EventHandler<any>)(payload)
      } catch (err) {
        console.error(`[EventBus] ошибка в обработчике события "${String(event)}":`, err)
      }
    }
  }

  /** Количество слушателей события (для тестов/отладки). */
  listenerCount(event: keyof Events): number {
    return this.listeners.get(event)?.size ?? 0
  }

  /** Удалить всех слушателей всех событий. */
  clear(): void {
    this.listeners.clear()
  }
}

/** Имена игровых событий (согласно разделу 5.3 плана разработки). */
export const EVENTS = {
  GAME_TICK: 'gameTick',
  COMPUTE_CHANGED: 'computeChanged',
  DATA_CHANGED: 'dataChanged',
  CORES_CHANGED: 'coresChanged',
  FRAGMENTS_CHANGED: 'fragmentsChanged',
  CPS_CHANGED: 'cpsChanged',
  GENERATOR_BOUGHT: 'generatorBought',
  UPGRADE_BOUGHT: 'upgradeBought',
  PRESTIGE_COMPLETED: 'prestigeCompleted',
  CHAPTER_CHANGED: 'chapterChanged',
  MINIGAME_STARTED: 'minigameStarted',
  MINIGAME_COMPLETED: 'minigameCompleted',
  QUEST_COMPLETED: 'questCompleted',
  ACHIEVEMENT_UNLOCKED: 'achievementUnlocked',
  TECHNOLOGY_PURCHASED: 'technologyPurchased',
  OFFLINE_REWARD: 'offlineReward',
  SETTINGS_CHANGED: 'settingsChanged',
  SAVE_COMPLETED: 'saveCompleted',
} as const

/** Payload-ы ключевых событий. */
export interface GameEvents {
  [EVENTS.GAME_TICK]: { deltaMs: number; ticks: number }
  [EVENTS.COMPUTE_CHANGED]: { value: number; delta: number }
  [EVENTS.DATA_CHANGED]: { value: number; delta: number }
  [EVENTS.CORES_CHANGED]: { value: number; delta: number }
  [EVENTS.FRAGMENTS_CHANGED]: { value: number; delta: number }
  [EVENTS.CPS_CHANGED]: { cps: number }
  [EVENTS.GENERATOR_BOUGHT]: { generatorId: string; count: number; cost: number }
  [EVENTS.UPGRADE_BOUGHT]: { upgradeId: string; currency?: 'money' | 'cores' | 'data' }
  [EVENTS.TECHNOLOGY_PURCHASED]: { technologyId: string }
  [EVENTS.PRESTIGE_COMPLETED]: { coresGained: number }
  [EVENTS.MINIGAME_STARTED]: { minigameId: string }
  [EVENTS.MINIGAME_COMPLETED]: { minigameId: string; reward: number }
  [EVENTS.QUEST_COMPLETED]: { questId: string }
  [EVENTS.ACHIEVEMENT_UNLOCKED]: { id: string; name: string }
  [EVENTS.OFFLINE_REWARD]: { seconds: number; amount: number }
  [EVENTS.SETTINGS_CHANGED]: { key: string; value: unknown }
  [EVENTS.SAVE_COMPLETED]: undefined
}

/** Глобальный синглтон шины событий игры. */
export const eventBus = new EventBus<GameEvents & Record<string, unknown>>()
