/**
 * MinigameService — чистые (без React) функции системы мини-игр (Этап 5).
 * Реализует ТЗ разделы 20–23:
 *  - 20.1 награда ≤ 10–15 минут пассивного дохода, провал не наказывает жёстко,
 *    повторные прохождения дают уменьшенную награду, длительность ≤ 40 сек;
 *  - 21.1–21.3 параметры трёх MVP-мини-игр (Перехват пакетов, Взлом пароля,
 *    Сортировка трафика);
 *  - 23.1 доступность: кнопка появляется раз в 12–18 минут активной игры,
 *    после закрытия без награды — пауза 5 минут;
 *  - 23.2 лимиты: не более 5 полных наград в день, дальше награда ×0.25,
 *    Данные сверх дневного лимита (20) не выдаются (квесты и достижения — вне лимита);
 *  - 19.1 первая победа за день даёт повышенные Данные.
 */

import type { GameState, MinigameRecord } from '../types'
import { getDataCollectorMultiplier } from './PrestigeService'
import {
  MINIGAME_DAILY_FULL_REWARD_LIMIT,
  MINIGAME_DAILY_DATA_CAP,
  MINIGAME_REPEAT_MULTIPLIER,
  MINIGAME_COOLDOWN_MS,
  MINIGAME_AVAILABLE_INTERVAL_MS,
} from '../core/Constants'

/* ===== Параметры мини-игр (ТЗ 21.1–21.3) ===== */

export interface MinigameParams {
  id: string
  /** Длительность раунда, сек (все ≤ 40 — требование ТЗ 20.1). */
  durationSec: number
  /** Порог победы в очках. */
  winThreshold: number
  /** Данные при первой победе за день (ТЗ 19.1: 2–5). */
  firstWinData: number
  /** Данные при обычной победе (ТЗ 19.1: 1–2). */
  winData: number
  /** Верхняя граница награды вычислениями как доля от «10 минут CPS» (≤ 1 по ТЗ 23.3). */
  computeBudgetShare: number
}

export const MINIGAMES: Record<'packet_intercept' | 'password_hack' | 'traffic_sort', MinigameParams> = {
  /** 21.1 Перехват пакетов: 20 сек, порог 10 очков, награда 2–4 Данных + вычисления. */
  packet_intercept: {
    id: 'packet_intercept',
    durationSec: 20,
    winThreshold: 10,
    firstWinData: 4,
    winData: 2,
    computeBudgetShare: 0.5,
  },
  /** 21.2 Взлом пароля: 5 попыток, 30 сек, награда 1–3 Данных. */
  password_hack: {
    id: 'password_hack',
    durationSec: 30,
    winThreshold: 1, // успех = угаданный код (булево, порог условный)
    firstWinData: 3,
    winData: 1,
    computeBudgetShare: 0.35,
  },
  /** 21.3 Сортировка трафика: 25 сек, порог 10 очков, награда 1–3 Данных. */
  traffic_sort: {
    id: 'traffic_sort',
    durationSec: 25,
    winThreshold: 10,
    firstWinData: 3,
    winData: 1,
    computeBudgetShare: 0.4,
  },
}

/* ===== Логика «Взлома пароля» (ТЗ 21.2: hot/warm/cold-подсказки) ===== */

export type HotLevel = 'hot' | 'warm' | 'cold'

/** Суммарная «температура» совпадений guessed с secret по позициям. */
function heatScore(secret: string, guessed: string): number {
  let score = 0
  for (let i = 0; i < 4; i++) {
    const d = Math.abs(Number(secret[i]) - Number(guessed[i]))
    score += Math.min(d, 10 - d) // круговая разница цифр: 0..5 на позицию
  }
  return score // 0 = точное совпадение, максимум 20
}

/**
 * Подсказка для попытки: «горячо» / «тепло» / «холодно» (ТЗ 21.2).
 * Пороги подобраны под диапазон суммы 0–20.
 */
export function getPasswordHint(secret: string, guessed: string): HotLevel {
  if (secret === guessed) return 'hot'
  const s = heatScore(secret, guessed)
  if (s <= 5) return 'hot'
  if (s <= 11) return 'warm'
  return 'cold'
}

/** Проверка успеха попытки взлома пароля. */
export function isPasswordCracked(secret: string, guessed: string): boolean {
  return secret === guessed
}

/** Генерация случайного 4-значного кода (rng инжектируется для тестов). */
export function generateSecretCode(rng: () => number = Math.random): string {
  return Array.from({ length: 4 }, () => Math.floor(rng() * 10)).join('')
}

/* ===== Награды (ТЗ 20.1, 23.2, 23.3, 19.1) ===== */

/** Ключ дня в локальном часовом поясе: YYYY-MM-DD. */
export function dayKey(now: number = Date.now()): string {
  const d = new Date(now)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

/** Запись статистики мини-игр за текущий день (или пустая, если день сменился). */
export function getTodayStats(state: GameState): { fullRewards: number; dataEarned: number; wonByGame: Record<string, boolean> } {
  const stats = state.minigameStats
  if (!stats || stats.date !== dayKey()) {
    return { fullRewards: 0, dataEarned: 0, wonByGame: {} }
  }
  return { fullRewards: stats.fullRewards, dataEarned: stats.dataEarned, wonByGame: stats.wonByGame }
}

export interface MinigameReward {
  /** Начисленные Данные (с учётом лимитов ТЗ 23.2 и множителя «Сборщик Данных»). */
  data: number
  /** Начисленные вычисления (≤ 10–15 минут CPS, ТЗ 23.3). */
  compute: number
  /** true — засчитана как «полная награда» (лимит 5/день, ТЗ 23.2). */
  full: boolean
}

/**
 * Рассчитать награду за завершение мини-игры.
 *  - победа: полные награды; после 5 полных в день — ×0.25 (ТЗ 23.2);
 *  - провал: утешительные 20% (ТЗ 21.1 — «провал не наказывает слишком жёстко»);
 *  - первая победа за день в конкретной игре даёт повышенные Данные (ТЗ 19.1);
 *  - Данные сверх дневного лимита не выдаются (ТЗ 23.2);
 *  - престиж-апгрейд «Сборщик Данных»: +10%/уровень к наградам Данных (ТЗ 18);
 *  - вычисления ограничены бюджетом 10 минут текущего CPS (ТЗ 23.3).
 */
export function calculateMinigameReward(
  minigameId: string,
  won: boolean,
  state: GameState,
  cps: number,
  now: number = Date.now(),
): MinigameReward {
  const params = MINIGAMES[minigameId as keyof typeof MINIGAMES]
  if (!params) return { data: 0, compute: 0, full: false }

  const stats = getTodayStats(state)
  const firstWinToday = won && !stats.wonByGame[minigameId]
  const full = won && stats.fullRewards < MINIGAME_DAILY_FULL_REWARD_LIMIT

  // Базовые Данные: первая победа за день — повышенные, иначе обычные (ТЗ 19.1)
  let data = won ? (firstWinToday ? params.firstWinData : params.winData) : 0
  // Повтор после лимита полных наград — 25% (ТЗ 23.2)
  if (won && !full) data *= MINIGAME_REPEAT_MULTIPLIER
  // Провал — утешительно 20% от минимальной награды (ТЗ 21.1), но не больше остатка лимита
  if (!won) data = Math.round(params.winData * 0.2 * 10) / 10

  // Множитель престиж-апгрейда «Сборщик Данных» (ТЗ 18)
  data *= getDataCollectorMultiplier(state)

  // Дневной лимит Данных из мини-игр (ТЗ 23.2): сверх лимита не выдаются
  const remainingDataCap = Math.max(0, MINIGAME_DAILY_DATA_CAP - stats.dataEarned)
  data = Math.min(Math.round(data * 10) / 10, remainingDataCap)

  // Вычисления: не более 10 минут CPS × доля бюджета игры (ТЗ 23.3)
  let compute = cps * 600 * params.computeBudgetShare
  if (!won) compute *= 0.2
  else if (!full) compute *= MINIGAME_REPEAT_MULTIPLIER

  return { data, compute, full }
}

/* ===== Доступность (ТЗ 23.1) ===== */

/**
 * Можно ли запустить мини-игру сейчас:
 *  - первая игра доступна всегда (нет принудительного ожидания);
 *  - между предложениями ≥ 12 минут активной игры;
 *  - если игру закрыли без награды — повтор не раньше чем через 5 минут.
 */
export function isMinigameAvailable(state: GameState, now: number = Date.now()): boolean {
  const last = state.lastMinigameAt
  if (last === 0) return true
  if (now - last < MINIGAME_COOLDOWN_MS) return false
  return now - last >= 0 && state.minigamesPlayed > 0
    ? now - last >= MINIGAME_AVAILABLE_INTERVAL_MS
    : true
}

/** Применить результат мини-игры к состоянию игры (награды уже рассчитаны). */
export function applyMinigameResult(
  state: GameState,
  minigameId: string,
  reward: MinigameReward,
  record: MinigameRecord,
  now: number = Date.now(),
): GameState {
  const key = dayKey(now)
  const today = getTodayStats(state)
  const wonByGame = record.won
    ? { ...today.wonByGame, [minigameId]: true }
    : today.wonByGame

  return {
    ...state,
    money: state.money + reward.compute,
    totalEarned: state.totalEarned + reward.compute,
    totalEarnedThisRun: state.totalEarnedThisRun + reward.compute,
    data: Math.round((state.data + reward.data) * 100) / 100,
    minigamesCompleted: state.minigamesCompleted + (record.won ? 1 : 0),
    minigamesPlayed: state.minigamesPlayed + 1,
    lastMinigameAt: now,
    minigameStats: {
      date: key,
      fullRewards: today.fullRewards + (reward.full ? 1 : 0),
      dataEarned: Math.round((today.dataEarned + reward.data) * 10) / 10,
      wonByGame,
    },
  }
}
