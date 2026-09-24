import React, { useState } from 'react';
import type { GameState } from '../../types';
import type { PrestigePreview } from '../../economy/PrestigeService';
import { formatNumber } from '../../utils/NumberFormatter';
import './PrestigeScreen.css';

interface PrestigeScreenProps {
  state: GameState;
  preview: PrestigePreview;
  /** Доступен ли престиж прямо сейчас (ТЗ 24.5). */
  available: boolean;
  isAnimating: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

/**
 * Экран престижа «Перезагрузка системы» (Этап 4, ТЗ 24.6).
 * Показывает: сколько ядер будет получено, что сохранится / сбросится /
 * откроется, какие апгрейды можно купить после престижа,
 * и подтверждение с обязательным чекбоксом (ТЗ 24.6 п.6).
 */
export const PrestigeScreen: React.FC<PrestigeScreenProps> = ({
  state,
  preview,
  available,
  isAnimating,
  onConfirm,
  onClose,
}) => {
  // Подтверждение с чекбоксом (ТЗ 24.6 п.6) — без него кнопка недоступна
  const [confirmed, setConfirmed] = useState(false);

  return (
    <div className={`prestige-overlay ${isAnimating ? 'prestige-glitching' : ''}`}>
      <div className="prestige-modal glow-border">
        <h2 className="prestige-title glow-text">ПЕРЕЗАГРУЗКА СИСТЕМЫ</h2>

        {/* П.1: сколько ядер будет получено (ТЗ 24.6) */}
        <div className="prestige-reward">
          Вы получите:{' '}
          <strong className="cores-amount">⚛ {preview.coresToGain}</strong>{' '}
          {preview.coresToGain === 1 ? 'Квантовое ядро' : 'Квантовых ядер'}
        </div>

        {/* Прогресс до порога забега 1M (ТЗ 24.5) */}
        <div className="prestige-progress">
          <div className="prestige-progress-bar">
            <div
              className="prestige-progress-fill"
              style={{ width: `${Math.round(preview.progress * 100)}%` }}
            />
          </div>
          <span className="prestige-progress-label">
            Забег: {formatNumber(state.totalEarnedThisRun, 'compact')} /{' '}
            {formatNumber(1_000_000, 'compact')} вычислений
          </span>
        </div>

        {!available && (
          <p className="prestige-warning">
            ⚠ Престиж станет доступен при 1 000 000 заработанных вычислений за
            забег (минимум 1 ядро). Кнопку показывают заранее — чтобы вы могли
            спланировать перезагрузку.
          </p>
        )}

        {/* П.3 и п.4 экрана: что сбросится и что сохранится (ТЗ 24.2–24.3) */}
        <div className="prestige-columns">
          <div className="prestige-col prestige-col-keeps">
            <h4>✔ Сохранится</h4>
            <ul>
              {preview.keeps.map((k) => (
                <li key={k}>{k}</li>
              ))}
            </ul>
          </div>
          <div className="prestige-col prestige-col-resets">
            <h4>✘ Сбросится</h4>
            <ul>
              {preview.resets.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* П.5: какие главы или механики откроются (ТЗ 24.6) */}
        <div className="prestige-unlocks">
          <h4>★ Откроется</h4>
          <ul>
            {preview.unlocks.map((u) => (
              <li key={u}>{u}</li>
            ))}
          </ul>
        </div>

        {/* П.2: какие апгрейды можно купить после престижа (ТЗ 24.6) */}
        <p className="prestige-shop-hint">
          После престижа ядра тратятся в ветке «Квантовые протоколы» на вкладке
          «Улучшения»: ИИ-автономия, Эффективность ядер, Мульти-старт, Холодный
          старт и другие.
        </p>

        <label className="prestige-confirm">
          <input
            type="checkbox"
            checked={confirmed}
            disabled={!available || isAnimating}
            onChange={(e) => setConfirmed(e.target.checked)}
          />
          Я понимаю: генераторы, вычисления и обычные апгрейды будут сброшены.
        </label>

        <div className="prestige-actions">
          <button
            className="btn-secondary"
            onClick={onClose}
            disabled={isAnimating}
          >
            Отмена
          </button>
          <button
            className="prestige-btn"
            onClick={onConfirm}
            disabled={!available || !confirmed || isAnimating}
          >
            {isAnimating ? 'ПЕРЕЗАГРУЗКА…' : 'ПЕРЕЗАГРУЗИТЬ СИСТЕМУ'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrestigeScreen;
