/**
 * NumberFormatSettings — глобальная настройка системы сокращений чисел.
 *
 * Поддерживаются две системы (можно переключаться в UI, выбор сохраняется в localStorage):
 *  - 'classic'  — K / M / B / T / Qa / Qi / Sx / Sp / Oc (стандарт плана);
 *  - 'letters'  — a / b / c ... z / aa / ab ... (буквенная шкала, по 1000 на шаг).
 *
 * Модуль не зависит от React (используется и в node-тестах ядра); реактивность в UI
 * обеспечивает useNumberSuffixSystem из ./NumberFormatSettings.react.
 */

export type NumSuffixSystem = 'classic' | 'letters'

const SYSTEM_KEY = 'he_num_system'

let currentSystem: NumSuffixSystem = detectSystem()
const listeners = new Set<() => void>()

function detectSystem(): NumSuffixSystem {
  try {
    const saved = localStorage.getItem(SYSTEM_KEY)
    if (saved === 'classic' || saved === 'letters') return saved
  } catch {
    /* localStorage недоступен */
  }
  return 'classic'
}

/** Текущая система сокращений. */
export function getNumberSuffixSystem(): NumSuffixSystem {
  return currentSystem
}

/** Переключить систему сокращений (сохраняет выбор в localStorage). */
export function setNumberSuffixSystem(system: NumSuffixSystem): void {
  currentSystem = system
  try {
    localStorage.setItem(SYSTEM_KEY, system)
  } catch {
    /* ignore */
  }
  for (const l of listeners) l()
}

/** Подписка на смену системы (для useSyncExternalStore в React-слое). */
export function subscribeToNumberSuffixSystem(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Доступные системы с подписями для UI. */
export const AVAILABLE_SUFFIX_SYSTEMS: { code: NumSuffixSystem; label: string }[] = [
  { code: 'classic', label: 'K M B T' },
  { code: 'letters', label: 'a b c aa' },
]

