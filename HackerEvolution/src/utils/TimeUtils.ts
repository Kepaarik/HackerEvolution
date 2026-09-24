/**
 * TimeUtils — работа со временем (Этап 1).
 */

/** Текущее время в секундах (epoch). */
export function nowSeconds(): number {
  return Date.now() / 1000
}

/** Текущее время в миллисекундах (epoch). */
export function nowMillis(): number {
  return Date.now()
}

/**
 * Форматирует длительность в человекочитаемый вид.
 * 90 -> "1м 30с", 3725 -> "1ч 2м", 90061 -> "1д 1ч"
 */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds))
  const days = Math.floor(s / 86400)
  const hours = Math.floor((s % 86400) / 3600)
  const minutes = Math.floor((s % 3600) / 60)
  const seconds = s % 60

  if (days > 0) return `${days}д ${hours}ч`
  if (hours > 0) return `${hours}ч ${minutes}м`
  if (minutes > 0) return `${minutes}м ${seconds}с`
  return `${seconds}с`
}

/**
 * Защита от перемотки времени (Этап 8): возвращает elapsed не меньше 0,
 * ограниченный сверху capSeconds. Если системное время «ушло назад»,
 * считаем, что прошло 0 секунд.
 */
export function clampElapsed(lastTimestampMs: number, capSeconds: number): number {
  const elapsedSec = (Date.now() - lastTimestampMs) / 1000
  if (elapsedSec < 0) return 0
  return Math.min(elapsedSec, capSeconds)
}
