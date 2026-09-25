import { useState } from 'react'
import './OfflineRewardModal.css'
import { formatNumber } from '../utils/NumberFormatter'

interface OfflineRewardModalProps {
  offlineEarnings: number
  offlineTime: number // в секундах
  onClaim: (multiplier: 1 | 2) => void
  onClose: () => void
}

/**
 * Экран офлайн-дохода (ТЗ 26.3)
 */
export function OfflineRewardModal({
  offlineEarnings,
  offlineTime,
  onClaim,
  onClose,
}: OfflineRewardModalProps) {
  const [claimed, setClaimed] = useState(false)

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)

    if (hours > 0) {
      return `${hours} ч. ${minutes} мин.`
    }
    return `${minutes} мин.`
  }

  const handleClaim = (multiplier: 1 | 2) => {
    setClaimed(true)
    onClaim(multiplier)
  }

  if (claimed) return null

  return (
    <div className="offline-overlay">
      <div className="offline-modal glow-border">
        <h2 className="offline-title glow-text">С возвращением!</h2>

        <div className="offline-time">
          Вы отсутствовали: <strong>{formatTime(offlineTime)}</strong>
        </div>

        <div className="offline-reward">
          Заработано офлайн:{' '}
          <strong className="earnings-amount">
            💻 {formatNumber(offlineEarnings, 'money')}
          </strong>
        </div>

        <div className="offline-info">
          <p>Ваши генераторы работали, пока вас не было.</p>
        </div>

        <div className="offline-actions">
          <button className="btn-primary" onClick={() => handleClaim(1)}>
            Забрать
          </button>
          <button className="btn-secondary offline-btn-x2" onClick={() => handleClaim(2)}>
            Забрать ×2
            <span className="btn-hint">Посмотреть рекламу</span>
          </button>
        </div>

        <p className="offline-note">
          Базовый лимит офлайна: 2 часа. Улучшения доступны в престиж-апгрейдах.
        </p>
      </div>
    </div>
  )
}
