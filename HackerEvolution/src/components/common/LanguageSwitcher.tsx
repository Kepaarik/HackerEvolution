/**
 * LanguageSwitcher — переключатель языка интерфейса (Этап 1: локализация).
 * Компактный сегментированный контрол: RU / EN. Выбор сохраняется в localStorage
 * (см. src/i18n), все подписанные компоненты перерисовываются автоматически.
 */

import React, { useEffect, useState } from 'react'
import { useTranslation, availableLocales, type Locale } from '../../i18n'
import { eventBus, EVENTS } from '../../core/EventBus'
import './LanguageSwitcher.css'

/** Отображаемые названия и флаги локалей */
const LOCALE_META: Record<Locale, { label: string; flag: string }> = {
  ru: { label: 'Русский', flag: '🇷🇺' },
  en: { label: 'English', flag: '🇬🇧' },
}

interface LanguageSwitcherProps {
  className?: string
}

/**
 * Компактный переключатель языка RU / EN.
 * Перерисовывается по событию LOCALE_CHANGED (шина событий — единый источник).
 */
export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = () => {
  const { locale, setLocale } = useTranslation()
  // подписка на смену локали для актуальной перерисовки
  const [, bump] = useState(0)
  useEffect(() => eventBus.on(EVENTS.LOCALE_CHANGED, () => bump((n) => n + 1)), [])

  return (
    <div className="language-switcher">
      <div className="language-options">
        {availableLocales.map((code) => (
          <button
            key={code}
            className={`language-btn ${locale === code ? 'active' : ''}`}
            onClick={() => setLocale(code)}
            title={LOCALE_META[code].label}
          >
            <span className="language-flag">{LOCALE_META[code].flag}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default LanguageSwitcher
