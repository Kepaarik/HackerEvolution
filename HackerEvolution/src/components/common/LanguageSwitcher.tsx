/**
 * LanguageSwitcher — переключатель языка интерфейса (Этап 1: локализация).
 * Компактный сегментированный контрол: RU / EN. Выбор сохраняется в localStorage
 * (см. src/i18n), все подписанные компоненты перерисовываются автоматически.
 */

import React from 'react'
import { useI18n, type Locale } from '../../i18n'
import './LanguageSwitcher.css'

/** Список доступных языков */
const LANGUAGES: { code: Locale; label: string; flag: string }[] = [
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
]
interface LanguageSwitcherProps {
  className?: string
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ className }) => {
  const { locale, setLocale, availableLocales } = useI18n()

  return (
    <div className="language-switcher">
      <div className="language-options">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            className={`language-btn ${locale === lang.code ? 'active' : ''}`}
            onClick={() => setLocale(lang.code)}
            title={lang.label}
          >
            <span className="language-flag">{lang.flag}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default LanguageSwitcher
