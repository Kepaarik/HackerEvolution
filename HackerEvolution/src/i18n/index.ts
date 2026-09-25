import ru from './ru.json'
import en from './en.json'

export type Locale = 'ru' | 'en'

const translations: Record<Locale, any> = { ru, en }

let currentLocale: Locale = 'ru'

/**
 * Установить текущую локаль
 */
export function setLocale(locale: Locale): void {
  currentLocale = locale
  localStorage.setItem('he_locale', locale)
}

/**
 * Получить текущую локаль
 */
export function getLocale(): Locale {
  return currentLocale
}

/**
 * Инициализация локали из сохранения
 */
export function initLocale(): void {
  const saved = localStorage.getItem('he_locale') as Locale
  if (saved && translations[saved]) {
    currentLocale = saved
  }
}

/**
 * Получить перевод по ключу (например, 'offline.title')
 */
export function t(key: string): string {
  const keys = key.split('.')
  let result: any = translations[currentLocale]

  for (const k of keys) {
    if (result && typeof result === 'object' && k in result) {
      result = result[k]
    } else {
      // Fallback на русский
      let fallback: any = translations['ru']
      for (const fk of keys) {
        if (fallback && typeof fallback === 'object' && fk in fallback) {
          fallback = fallback[fk]
        } else {
          return key // Возвращаем ключ если перевод не найден
        }
      }
      return fallback as string
    }
  }

  return result as string
}

/**
 * Хук для использования в React
 */
export function useTranslation() {
  return { t, locale: currentLocale, setLocale }
}

// Инициализация при импорте
initLocale()
