import { useState } from 'react'
import { GameState } from '../../types'
import { TOTAL_FRAGMENTS } from '../../core/Constants'
import { formatNumber } from '../../utils/NumberFormatter'
import './FragmentsCollection.css'

interface FragmentsCollectionProps {
  state: GameState
  onClose: () => void
}

/**
 * Экран коллекции Фрагментов исходного кода (ТЗ 29)
 * Показывает прогресс к Сингулярности (100/100)
 */
export function FragmentsCollection({ state, onClose }: FragmentsCollectionProps) {
  const fragments = state.fragments ?? 0
  const progress = Math.min(100, fragments) / TOTAL_FRAGMENTS
  const isSingularity = fragments >= TOTAL_FRAGMENTS

  return (
    <div className="fragments-overlay">
      <div className="fragments-modal">
        <div className="fragments-header">
          <h2 className="fragments-title">🧩 Фрагменты исходного кода</h2>
          <button className="fragments-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Прогресс-бар */}
        <div className="fragments-progress">
          <div className="fragments-progress-bar">
            <div
              className="fragments-progress-fill"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          <span className="fragments-progress-label">
            {fragments} / {TOTAL_FRAGMENTS}
          </span>
        </div>

        {/* Сетка фрагментов */}
        <div className="fragments-grid">
          {Array.from({ length: TOTAL_FRAGMENTS }, (_, i) => {
            const isCollected = i < fragments
            return (
              <div
                key={i}
                className={`fragment-cell ${isCollected ? 'collected' : 'empty'}`}
                title={isCollected ? `Фрагмент #${i + 1}` : 'Не найден'}
              >
                {isCollected ? '🧩' : '?'}
              </div>
            )
          })}
        </div>

        {/* Источники фрагментов */}
        <div className="fragments-sources">
          <h3>Источники фрагментов:</h3>
          <ul>
            <li>📖 Сюжетные этапы Глав 1-4 (10 шт)</li>
            <li>🛰️ Корпорации Главы 2 (20 шт)</li>
            <li>🔴 Корпорации Главы 3 (30 шт)</li>
            <li>🚀 Корпорации Главы 4 (20 шт)</li>
            <li>🏆 Достижения (10 шт)</li>
            <li>📅 Еженедельные события (10 шт)</li>
          </ul>
        </div>

        {/* Сингулярность */}
        {isSingularity ? (
          <div className="singularity-banner">
            <h3>✨ СИНГУЛЯРНОСТЬ ДОСТИГНУТА</h3>
            <p>Вы собрали 100% Фрагментов исходного кода.</p>
            <button className="singularity-btn">Войти в Трансцендентность</button>
          </div>
        ) : (
          <div className="fragments-hint">
            <p>
              Соберите все {TOTAL_FRAGMENTS} фрагментов, чтобы достичь Сингулярности и
              открыть New Game+.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
