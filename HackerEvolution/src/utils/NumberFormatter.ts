/**
 * NumberFormatter — форматирование (в т.ч. больших) чисел (Этап 1).
 *
 * Поддерживает две системы сокращений (переключаются в UI, см. NumberFormatSettings):
 *  - 'classic' (стандарт плана): K/M/B/T/Qa/Qi/Sx/Sp/Oc, далее — экспоненциальная запись;
 *  - 'letters': a/b/c/.../z/aa/ab/... (шаг ×1000 на букву, как в Cookie-Clicker-подобных играх).
 */

import { getNumberSuffixSystem, type NumSuffixSystem } from './NumberFormatSettings'

const CLASSIC_SUFFIXES = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc'] as const

/** Максимальный tier для classic-системы (выше — экспонента). */
const CLASSIC_MAX_TIER = CLASSIC_SUFFIXES.length - 1

export type NumFormatStyle = 'money' | 'plain' | 'compact'

/**
 * Буквенный суффикс для tier (tier=1 -> 'a', 26 -> 'z', 27 -> 'aa', ...).
 * Система счисления по основанию 26 без нуля (bijective base-26).
 */
export function lettersSuffix(tier: number): string {
  if (tier <= 0) return ''
  let n = tier
  let s = ''
  while (n > 0) {
    n--
    s = String.fromCharCode(97 + (n % 26)) + s
    n = Math.floor(n / 26)
  }
  return s
}

/** Суффикс для tier в выбранной системе. Для classic выше Oc возвращает null (нужна экспонента). */
function suffixFor(tier: number, system: NumSuffixSystem): string | null {
  if (system === 'letters') return lettersSuffix(tier)
  return tier <= CLASSIC_MAX_TIER ? CLASSIC_SUFFIXES[tier] : null
}

/**
 * Форматирует число для отображения в UI.
 *  - < 1000: обычное число (для денег — с двумя знаками после запятой);
 *  - далее: суффиксная запись в активной системе (12.34K или 12.34a);
 *  - классическая система ограничена Oc — выше экспоненциальная запись (1.23e34);
 *    буквенная система масштабируется неограниченно.
 */
export function formatNumber(num: number, style: NumFormatStyle = 'plain'): string {
  return formatNumberWith(num, style, getNumberSuffixSystem())
}

/** Чистая (без глобального состояния) версия formatNumber — удобно для тестов. */
export function formatNumberWith(
  num: number,
  style: NumFormatStyle = 'plain',
  system: NumSuffixSystem = 'classic',
): string {
  if (!Number.isFinite(num)) return '∞'
  if (Number.isNaN(num)) return '0'

  const sign = num < 0 ? '-' : ''
  const abs = Math.abs(num)

  if (abs < 1000) {
    if (style === 'money') return `${sign}${abs.toFixed(2)}`
    if (style === 'compact') return `${sign}${trimZeros(abs.toFixed(abs < 10 && abs % 1 !== 0 ? 1 : 0))}`
    return `${sign}${Math.floor(abs).toLocaleString('ru-RU')}`
  }

  const tier = Math.floor(Math.log10(abs) / 3)
  const scaled = abs / Math.pow(1000, tier)
  const suffix = suffixFor(tier, system)

  // Число слишком велико даже для суффиксов — экспоненциальная запись
  if (suffix === null) {
    return `${sign}${abs.toExponential(2).replace('+', '')}`
  }

  return `${sign}${scaled.toFixed(2)}${suffix}`
}

/** Короткая версия для денег: $12.34 / $1.25K (или $1.25b в буквенной системе) */
export function formatMoney(num: number): string {
  return `$${formatNumber(num, 'money')}`
}

/** Убирает лишние нули в дробной части: "1.50" -> "1.5", "2.00" -> "2" */
function trimZeros(s: string): string {
  return s.includes('.') ? s.replace(/\.?0+$/, '') : s
}

/** Парсит суффикс (обе системы) обратно в tier; null — если суффикс неизвестен. */
function parseSuffixTier(suffix: string): number | null {
  const lower = suffix.toLowerCase()
  const classicIndex = CLASSIC_SUFFIXES.findIndex((s) => s.toLowerCase() === lower)
  if (classicIndex > 0) return classicIndex
  if (/^[a-z]+$/.test(lower)) {
    let tier = 0
    for (const ch of lower) {
      tier = tier * 26 + (ch.charCodeAt(0) - 96)
    }
    return tier
  }
  return null
}

/** Парсит форматированное число обратно (для отладки/валидации сейвов). Понимает обе системы. */
export function parseFormatted(value: string): number {
  const match = /^(-?\d+(?:\.\d+)?)\s*([A-Za-z]*)$/.exec(value.trim())
  if (!match) return NaN
  const base = parseFloat(match[1])
  if (!match[2]) return base
  const tier = parseSuffixTier(match[2])
  if (tier === null) return NaN
  return base * Math.pow(1000, tier)
}
