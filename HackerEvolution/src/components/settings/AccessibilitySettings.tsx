import { useState } from 'react'
import './AccessibilitySettings.css'

interface AccessibilitySettingsProps {
  settings: {
    reduceEffects: boolean
    disableShake: boolean
    highContrast: boolean
    largeText: boolean
  }
  onSettingsChange: (settings: any) => void
  onClose: () => void
}

/**
 * Настройки доступности (ТЗ раздел 47)
 */
export function AccessibilitySettings({
  settings,
  onSettingsChange,
  onClose,
}: AccessibilitySettingsProps) {
  const toggle = (key: string) => {
    onSettingsChange({ ...settings, [key]: !settings[key] })
  }

  return (
    <div className="accessibility-overlay">
      <div className="accessibility-modal">
        <div className="accessibility-header">
          <h2>♿ Доступность</h2>
          <button className="accessibility-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="accessibility-options">
          <label className="accessibility-option">
            <input
              type="checkbox"
              checked={settings.reduceEffects}
              onChange={() => toggle('reduceEffects')}
            />
            <div className="option-info">
              <span className="option-name">Уменьшить эффекты</span>
              <span className="option-desc">
                Отключает анимации частиц и всплывающие цифры
              </span>
            </div>
          </label>

          <label className="accessibility-option">
            <input
              type="checkbox"
              checked={settings.disableShake}
              onChange={() => toggle('disableShake')}
            />
            <div className="option-info">
              <span className="option-name">Отключить тряску экрана</span>
              <span className="option-desc">
                Убирает вибрацию экрана при критах и престиже
              </span>
            </div>
          </label>

          <label className="accessibility-option">
            <input
              type="checkbox"
              checked={settings.highContrast}
              onChange={() => toggle('highContrast')}
            />
            <div className="option-info">
              <span className="option-name">Высокий контраст</span>
              <span className="option-desc">
                Увеличивает контрастность для слабовидящих
              </span>
            </div>
          </label>

          <label className="accessibility-option">
            <input
              type="checkbox"
              checked={settings.largeText}
              onChange={() => toggle('largeText')}
            />
            <div className="option-info">
              <span className="option-name">Крупный текст</span>
              <span className="option-desc">Увеличивает размер шрифта в интерфейсе</span>
            </div>
          </label>
        </div>

        <p className="accessibility-note">
          Настройки применяются немедленно и сохраняются между сессиями.
        </p>
      </div>
    </div>
  )
}
