/**
 * MinigameModal — модальное окно мини-игры (Этап 5, ТЗ 21.1–21.3).
 * Обёртка: заголовок, таймер раунда, стили, кнопки «Свернуть»/«Играть».
 */

import React from 'react';
import { MINIGAMES } from '../../economy/MinigameService';
import './MinigameModal.css';

export const MINIGAME_META: Record<string, { title: string; icon: string; rules: string }> = {
  packet_intercept: {
    title: 'Перехват пакетов',
    icon: '📦',
    rules: 'Ловите появляющиеся пакеты — успейте перехватить 10 за 20 секунд.',
  },
  password_hack: {
    title: 'Взлом пароля',
    icon: '🔑',
    rules: 'Угадайте 4-значный код за 5 попыток. Подсказки: горячо / тепло / холодно.',
  },
  traffic_sort: {
    title: 'Сортировка трафика',
    icon: '🚦',
    rules: 'Распределяйте пакеты по каналам: зелёные — влево, красные — вправо. 10 очков за 25 секунд.',
  },
};

interface MinigameModalProps {
  minigameId: string;
  /** true — раунд идёт (показывается игровое поле с обратным отсчётом). */
  started: boolean;
  secondsLeft: number;
  children: React.ReactNode;
  onStart: () => void;
  /** Закрыть без награды — пауза 5 минут (ТЗ 23.1). */
  onDismiss: () => void;
}

export const MinigameModal: React.FC<MinigameModalProps> = ({
  minigameId,
  started,
  secondsLeft,
  children,
  onStart,
  onDismiss,
}) => {
  const params = MINIGAMES[minigameId as keyof typeof MINIGAMES];
  const meta = MINIGAME_META[minigameId];
  if (!params || !meta) return null;

  return (
    <div className="minigame-overlay" role="dialog" aria-modal="true">
      <div className="minigame-modal glow-border">
        <div className="minigame-header">
          <h3>
            {meta.icon} {meta.title}
          </h3>
          {started && (
            <span className={`minigame-timer ${secondsLeft <= 5 ? 'minigame-timer-low' : ''}`}>
              ⏱ {Math.max(0, Math.ceil(secondsLeft))}с
            </span>
          )}
        </div>

        {!started ? (
          <p className="minigame-rules">{meta.rules}</p>
        ) : (
          <div className="minigame-field">{children}</div>
        )}

        <div className="minigame-actions">
          <button className="minigame-btn minigame-btn-dismiss" onClick={onDismiss}>
            Свернуть
          </button>
          {!started && (
            <button className="minigame-btn minigame-btn-start" onClick={onStart}>
              ИГРАТЬ
            </button>
          )}
        </div>
        <p className="minigame-note">Награда ≤ 10 минут пассивного дохода · провал не наказывает</p>
      </div>
    </div>
  );
};
