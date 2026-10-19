/**
 * i18n — единая локализация интерфейса (RU / EN).
 * Словари: ./ru.json и ./en.json. Выбор языка сохраняется в localStorage
 * и рассылается подписчикам через eventBus (EVENTS.LOCALE_CHANGED),
 * поэтому все компоненты перерисовываются при смене языка.
 */

import { eventBus, EVENTS } from '../core/EventBus'
import ru from './ru.json'
import en from './en.json'

export type Locale = 'ru' | 'en'

const translations: Record<Locale, Record<string, unknown>> = { ru, en }

/** Список доступных локалей (для UI-переключателей). */
export const availableLocales: Locale[] = ['ru', 'en']

const LOCALE_KEY = 'he_locale'

let currentLocale: Locale = 'ru'

/** Установить текущую локаль (сохраняет выбор и уведомляет подписчиков). */
export function setLocale(locale: Locale): void {
  if (!translations[locale] || locale === currentLocale) return
  currentLocale = locale
  try {
    localStorage.setItem(LOCALE_KEY, locale)
  } catch {
    /* localStorage недоступен */
  }
  eventBus.emit(EVENTS.LOCALE_CHANGED, { locale })
}

/** Текущая локаль. */
export function getLocale(): Locale {
  return currentLocale
}

/** Инициализация локали из сохранения (вызывается при импорте модуля). */
export function initLocale(): void {
  let saved: string | null = null
  try {
    saved = localStorage.getItem(LOCALE_KEY)
  } catch {
    /* ignore */
  }
  if (saved === 'ru' || saved === 'en') currentLocale = saved
}

function lookup(dict: Record<string, unknown>, keys: string[]): string | null {
  let result: unknown = dict
  for (const k of keys) {
    if (result && typeof result === 'object' && k in result) {
      result = (result as Record<string, unknown>)[k]
    } else {
      return null
    }
  }
  return typeof result === 'string' ? result : null
}

/**
 * Перевод по составному ключу (например, 'offline.title').
 * При отсутствии перевода — fallback на русский, затем — сам ключ.
 */
export function t(key: string): string {
  const keys = key.split('.')
  return lookup(translations[currentLocale], keys) ?? lookup(translations.ru, keys) ?? key
}

/** Простая интерполяция параметров: t('tabs.chapter', { n: 2 }). */
export function tf(key: string, params: Record<string, string | number>): string {
  return t(key).replace(/\{(\w+)\}/g, (_, name) =>
    name in params ? String(params[name]) : `{${name}}`,
  )
}

/** Хук для использования в React. */
export function useI18n() {
  return { t, tf, locale: currentLocale, setLocale, getLocale, availableLocales }
}

/** Алиас для совместимости со старыми импортами. */
export const useTranslation = useI18n

// Инициализация при импорте
initLocale()
