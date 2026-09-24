/**
 * Локализация (Этап 1): минимальная собственная i18n-система.
 *
 * - Словари лежат в `src/i18n/locales/*.ts` (ru — источник истины, en — перевод).
 * - Язык сохраняется в localStorage, по умолчанию определяется по navigator.language.
 * - React-хук `useI18n()` даёт `t(key)` с реактивным перерисовыванием при смене языка.
 */

import { useSyncExternalStore } from 'react'
import ru from './locales/ru'
import en from './locales/en'

export type Locale = 'ru' | 'en'
export type TranslationKey = keyof typeof ru

const dictionaries: Record<Locale, Record<TranslationKey, string>> = {
  ru,
  en,
}

const LOCALE_KEY = 'he_locale'

function detectLocale(): Locale {
  try {
    const saved = localStorage.getItem(LOCALE_KEY)
    if (saved === 'ru' || saved === 'en') return saved
  } catch {
    /* localStorage недоступен */
  }
  const nav = navigator.language?.toLowerCase() ?? ''
  return nav.startsWith('ru') ? 'ru' : 'en'
}

let currentLocale: Locale = detectLocale()
const listeners = new Set<() => void>()

function notify(): void {
  for (const l of listeners) l()
}

/** Текущий язык интерфейса. */
export function getLocale(): Locale {
  return currentLocale
}

/** Переключить язык (сохраняет выбор в localStorage). */
export function setLocale(locale: Locale): void {
  currentLocale = locale
  try {
    localStorage.setItem(LOCALE_KEY, locale)
    document.documentElement.lang = locale
  } catch {
    /* ignore */
  }
  notify()
}

/** Доступные языки. */
export const AVAILABLE_LOCALES: { code: Locale; label: string }[] = [
  { code: 'ru', label: 'Русский' },
  { code: 'en', label: 'English' },
]

/**
 * Перевод строки по ключу с подстановкой параметров: t('generator.income', { value: '5' }).
 * При отсутствии ключа возвращает сам ключ (легко заметать в UI).
 */
export function t(key: TranslationKey, params?: Record<string, string | number>): string {
  let str = dictionaries[currentLocale][key] ?? dictionaries.ru[key] ?? String(key)
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      str = str.split(`{${k}}`).join(String(v))
    }
  }
  return str
}

/** Подписка на смену языка (для useSyncExternalStore). */
function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** React-хук: перевод + реактивная смена языка. */
export function useI18n() {
  const locale = useSyncExternalStore(subscribe, getLocale, getLocale)
  return { t, locale, setLocale, availableLocales: AVAILABLE_LOCALES }
}
