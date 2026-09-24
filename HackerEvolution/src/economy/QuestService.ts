/**
 * QuestService — ежедневные квесты (Этап 5, ТЗ раздел 27.1).
 * Каждый день выбирается 3 квеста из пула; прогресс считается «за сегодня»
 * от базовых точек счётчиков на момент выдачи. Награды: Вычисления и Данные
 * (Данные из квестов не ограничены дневным капом мини-игр — ТЗ 23.2).
 */

import type { GameState, QuestDef, ActiveQuest } from '../types'
import { DAILY_QUEST_COUNT } from '../core/Constants'
import { dayKey } from './MinigameService'
import { eventBus, EVENTS } from '../core/EventBus'

/** Пул ежедневных квестов (ТЗ 27.1; «оффлайн-доход» и «реклама» — Этапы 8/13). */
export const QUEST_POOL: QuestDef[] = [
  { id: 'q_clicks_100', type: 'clicks', target: 100, rewardCompute: 500, rewardData: 3 },
  { id: 'q_generators_5', type: 'buyGenerators', target: 5, rewardCompute: 1000, rewardData: 4 },
  { id: 'q_earn_50k', type: 'earnCompute', target: 50_000, rewardCompute: 2500, rewardData: 5 },
  { id: 'q_minigame_1', type: 'playMinigame', target: 1, rewardCompute: 800, rewardData: 6 },
  { id: 'q_upgrade_1', type: 'buyUpgrade', target: 1, rewardCompute: 1200, rewardData: 5 },
]

/** Детерминированный ГПСЧ (mulberry32) — для воспроизводимого выбора квестов по seed. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Простой хэш строки дня → seed: один и тот же набор квестов в течение дня. */
function seedOfDay(date: string): number {
  let h = 2166136261
  for (let i = 0; i < date.length; i++) {
    h ^= date.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** Выбрать `count` разных квестов из пула для указанного дня. */
export function pickDailyQuests(date: string, count = DAILY_QUEST_COUNT): QuestDef[] {
  const rng = mulberry32(seedOfDay(date))
  const pool = [...QUEST_POOL]
  const picked: QuestDef[] = []
  while (picked.length < count && pool.length > 0) {
    const idx = Math.floor(rng() * pool.length)
    picked.push(pool.splice(idx, 1)[0])
  }
  return picked
}

/** Базовые точки счётчиков состояния на момент выдачи квестов. */
function baselinesOf(state: GameState) {
  return {
    totalClicks: state.totalClicksAllTime + state.clickCount,
    generatorsOwned: state.generatorsOwned,
    totalEarned: state.totalEarned,
    upgradesCount: state.upgrades.length,
    minigamesCompleted: state.minigamesCompleted,
  }
}

/** Текущее значение счётчика квеста с учётом базовой точки («за сегодня»). */
export function getQuestProgress(quest: ActiveQuest, state: GameState): number {
  const b = state.questBaselines
  switch (quest.type) {
    case 'clicks':
      return state.totalClicksAllTime + state.clickCount - b.totalClicks
    case 'buyGenerators':
      return state.generatorsOwned - b.generatorsOwned
    case 'earnCompute':
      return state.totalEarned - b.totalEarned
    case 'playMinigame':
      return state.minigamesCompleted - b.minigamesCompleted
    case 'buyUpgrade':
      return state.upgrades.length - b.upgradesCount
  }
}

/** Обновить прогресс активных квестов (вызывается из игрового хука). true — если что-то изменилось. */
export function refreshQuestProgress(state: GameState): GameState {
  let changed = false
  const quests = state.quests.map((q) => {
    if (q.claimed || q.progress >= q.target) return q
    const progress = Math.min(getQuestProgress(q, state), q.target)
    if (progress !== q.progress) {
      changed = true
      return { ...q, progress }
    }
    return q
  })
  return changed ? { ...state, quests } : state
}

/**
 * Обеспечить наличие актуальных ежедневных квестов: при смене дня
 * (или пустом списке у старых сейвов) — выдать новый набор из пула.
 */
export function ensureDailyQuests(state: GameState, now: number = Date.now()): GameState {
  const today = dayKey(now)
  if (state.questsDate === today && state.quests.length > 0) return state
  const fresh = pickDailyQuests(today).map<ActiveQuest>((q) => ({
    ...q,
    progress: 0,
    claimed: false,
  }))
  return {
    ...state,
    quests: fresh,
    questsDate: today,
    questBaselines: baselinesOf(state),
  }
}

export interface QuestClaimResult {
  state: GameState
  /** false — квест не найден, ещё не выполнен или уже получен. */
  claimed: boolean
  compute: number
  data: number
}

/** Забрать награду выполненного квеста (Вычисления + Данные, ТЗ 27.1). */
export function claimQuestReward(
  state: GameState,
  questId: string,
  now: number = Date.now(),
): QuestClaimResult {
  const quest = state.quests.find((q) => q.id === questId)
  const done = quest && !quest.claimed && getQuestProgress(quest, state) >= quest.target
  if (!quest || !done) {
    return { state, claimed: false, compute: 0, data: 0 }
  }
  const next: GameState = {
    ...state,
    money: state.money + quest.rewardCompute,
    totalEarned: state.totalEarned + quest.rewardCompute,
    totalEarnedThisRun: state.totalEarnedThisRun + quest.rewardCompute,
    data: state.data + quest.rewardData,
    questsCompleted: state.questsCompleted + 1,
    quests: state.quests.map((q) => (q.id === questId ? { ...q, claimed: true } : q)),
  }
  eventBus.emit(EVENTS.QUEST_COMPLETED, { questId })
  return { state: next, claimed: true, compute: quest.rewardCompute, data: quest.rewardData }
}
