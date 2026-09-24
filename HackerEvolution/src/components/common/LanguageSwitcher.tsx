/**
 * LanguageSwitcher — переключатель языка интерфейса (Этап 1: локализация).
 * Компактный сегментированный контрол: RU / EN. Выбор сохраняется в localStorage
 * (см. src/i18n), все подписанные компоненты перерисовываются автоматически.
 */

import React from 'react'
import { useI18n, type Locale } from '../../i18n'

interface LanguageSwitcherProps {
  className?: string
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ className }) => {
  const { locale, setLocale, availableLocales } = useI18n()

  return (
    <div
      className={className ?? 'language-switcher'}
      role="group"
      aria-label="Language"
      style={{
        display: 'inline-flex',
        gap: 4,
        border: '1px solid rgba(0, 255, 0, 0.35)',
        borderRadius: 6,
        padding: 2,
      }}
    >
      {availableLocales.map(({ code, label }) => (
        <button
          key={code}
          type="button"
          onClick={() => setLocale(code as Locale)}
          aria-pressed={locale === code}
          style={{
            background: locale === code ? 'rgba(0, 255, 0, 0.15)' : 'transparent',
            color: locale === code ? '#00ff00' : 'rgba(0, 255, 0, 0.6)',
            border: 'none',
            borderRadius: 4,
            padding: '2px 8px',
            fontFamily: 'inherit',
            fontSize: 12,
            cursor: 'pointer',
          }}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

export default LanguageSwitcher
