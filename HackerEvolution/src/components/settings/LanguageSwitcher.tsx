import { useI18n, type Locale } from '../../i18n'
import './LanguageSwitcher.css'

/** Список доступных языков */
const LANGUAGES: { code: Locale; label: string; flag: string }[] = [
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
]

/**
 * Переключатель языка (ТЗ раздел 46)
 */
export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n()

  return (
    <div className="language-switcher">
      <span className="language-label">🌐 Язык:</span>
      <div className="language-options">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            className={`language-btn ${locale === lang.code ? 'active' : ''}`}
            onClick={() => setLocale(lang.code)}
          >
            <span className="language-flag">{lang.flag}</span>
            <span className="language-name">{lang.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
