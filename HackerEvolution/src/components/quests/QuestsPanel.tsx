/**
 * QuestsPanel — панель ежедневных квестов (Этап 5, ТЗ 27.1, 31.5).
 * Показывает 3 квеста дня с прогресс-барами и кнопкой получения награды.
 */

import React from 'react';
import type { ActiveQuest } from '../../types';
import { formatNumber } from '../../utils/NumberFormatter';
import './QuestsPanel.css';

interface QuestsPanelProps {
  quests: ActiveQuest[];
  /** Забрать награду выполненного квеста. */
  onClaim: (questId: string) => void;
}

/** Человекочитаемое описание квеста по типу и цели (ТЗ 27.1). */
export function questDescription(quest: ActiveQuest): string {
  const t = quest.target;
  switch (quest.type) {
    case 'clicks':
      return `Совершите ${t} ручных взломов`;
    case 'buyGenerators':
      return `Купите ${t} генератор${t === 1 ? '' : t < 5 ? 'а' : 'ов'}`;
    case 'earnCompute':
      return `Заработайте ${formatNumber(t, 'compact')} вычислений`;
    case 'playMinigame':
      return `Завершите ${t} мини-игр${t > 1 ? 'у' : 'у'} с победой`;
    case 'buyUpgrade':
      return `Приобретите ${t} улучшение`;
  }
}

export const QuestsPanel: React.FC<QuestsPanelProps> = ({ quests, onClaim }) => {
  if (quests.length === 0) {
    return (
      <div className="quests-panel">
        <p className="quests-empty">Квесты на сегодня появятся в следующий игровой день.</p>
      </div>
    );
  }

  return (
    <div className="quests-panel">
      <h3 className="quests-title">📋 Ежедневные задания</h3>
      <p className="quests-hint">Обновляются каждый день. Награды: вычисления 🖥 и данные 📊.</p>
      <ul className="quests-list">
        {quests.map((q) => {
          const done = q.progress >= q.target;
          const pct = Math.min(100, Math.round((q.progress / q.target) * 100));
          return (
            <li key={q.id} className={`quest-card ${done ? 'quest-done' : ''} ${q.claimed ? 'quest-claimed' : ''}`}>
              <div className="quest-card-top">
                <span className="quest-desc">{questDescription(q)}</span>
                <span className="quest-progress-text">
                  {Math.floor(q.progress)} / {q.target}
                </span>
              </div>
              <div className="quest-bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                <div className="quest-bar-fill" style={{ width: `${pct}%` }} />
              </div>
              <div className="quest-card-bottom">
                <span className="quest-reward">
                  +{formatNumber(q.rewardCompute, 'compact')} 🖥 · +{q.rewardData} 📊
                </span>
                {q.claimed ? (
                  <span className="quest-claimed-label">Получено ✓</span>
                ) : (
                  <button
                    className="quest-claim-btn"
                    disabled={!done}
                    onClick={() => onClaim(q.id)}
                  >
                    Забрать
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
