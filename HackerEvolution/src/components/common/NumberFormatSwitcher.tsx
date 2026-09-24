/**
 * NumberFormatSwitcher — переключатель системы сокращения чисел (K/M/B... ↔ a/b/c...).
 * Компактный сегментированный контрол, выбор сохраняется в localStorage
 * (см. src/utils/NumberFormatSettings), все форматированные числа обновляются автоматически.
 */

import React from 'react'
import { useNumberSuffixSystem } from '../../utils/NumberFormatSettings.react'
import {
  type NumSuffixSystem,
  setNumberSuffixSystem,
  AVAILABLE_SUFFIX_SYSTEMS,
} from '../../utils/NumberFormatSettings'

interface NumberFormatSwitcherProps {
  className?: string
}

export const NumberFormatSwitcher: React.FC<NumberFormatSwitcherProps> = ({
  className,
}) => {
  const system = useNumberSuffixSystem()

  return (
    <div
      className={className ?? 'number-format-switcher'}
      role="group"
      aria-label="Number format"
      title="Система сокращения чисел"
      style={{
        display: 'inline-flex',
        gap: 4,
        border: '1px solid rgba(0, 255, 0, 0.35)',
        borderRadius: 6,
        padding: 2,
      }}
    >
      {AVAILABLE_SUFFIX_SYSTEMS.map(({ code, label }) => (
        <button
          key={code}
          type="button"
          onClick={() => setNumberSuffixSystem(code as NumSuffixSystem)}
          aria-pressed={system === code}
          style={{
            background: system === code ? 'rgba(0, 255, 0, 0.15)' : 'transparent',
            color: system === code ? '#00ff00' : 'rgba(0, 255, 0, 0.6)',
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

export default NumberFormatSwitcher
