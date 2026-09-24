import React from 'react';
import { CHAPTERS, MAX_CHAPTER } from '../../gameData';
import { formatNumber } from '../../utils/NumberFormatter';
import './ChaptersTab.css';

interface ChaptersTabProps {
  currentChapter: number;
  /** Заработок за текущий забег (сбрасывается при престиже). */
  totalEarnedThisRun: number;
  prestigeCount: number;
  /** Ручной переход в следующую главу. */
  onAdvance: () => void;
}

/**
 * Вкладка «Главы» — полный список сюжетных глав с пояснениями.
 * Переход только ручной (кнопкой), пороги проверяются по заработку
 * за текущий забег, поэтому после престижа главы открываются заново.
 */
export const ChaptersTab: React.FC<ChaptersTabProps> = ({
  currentChapter,
  totalEarnedThisRun,
  prestigeCount,
  onAdvance,
}) => {
  return (
    <div className="chapters-tab">
      <p className="chapters-hint">
        📖 Главы — это этапы сюжета. Каждой главе соответствуют свои серверы
        и улучшения. Переход в следующую главу выполняется вручную, когда
        заработано достаточно вычислений за этот забег. После «Перезагрузки
        системы» (престиж) забег начинается заново — главы нужно проходить
        снова, но с бонусами от квантовых ядер это быстрее.
      </p>

      <ul className="chapter-list">
        {CHAPTERS.map((ch, idx) => {
          const num = idx + 1;
          const unlocked = num <= currentChapter;
          const isCurrent = num === currentChapter;
          const isNext = num === currentChapter + 1;
          const canAdvance = isNext && totalEarnedThisRun >= ch.unlockAt;
          const progress = ch.unlockAt > 0
            ? Math.min(1, totalEarnedThisRun / ch.unlockAt)
            : 1;

          return (
            <li
              key={num}
              className={`chapter-card ${unlocked ? 'unlocked' : 'locked'} ${isCurrent ? 'current' : ''}`}
            >
              <div className="chapter-card-head">
                <span className="chapter-num">
                  {unlocked ? '📖' : '🔒'} Глава {num}
                </span>
                <span className="chapter-name">{ch.name}</span>
                {isCurrent && <span className="chapter-badge-cur">текущая</span>}
              </div>
              <p className="chapter-desc">
                {unlocked
                  ? ch.description
                  : `Откроется при {formatNumber(ch.unlockAt, 'compact')} вычислений за забег${
                      isNext
                        ? ` (заработано: ${formatNumber(totalEarnedThisRun, 'compact')})`
                        : ''
                    }`}
              </p>
              {!unlocked && (
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${Math.round(progress * 100)}%` }}
                  />
                </div>
              )}
              {isNext && (
                <button
                  type="button"
                  className="unlock-chapter-btn"
                  disabled={!canAdvance}
                  onClick={onAdvance}
                >
                  {canAdvance
                    ? `⚡ Открыть главу ${num}: ${ch.name}`
                    : `🔒 Нужно ещё ${formatNumber(Math.max(0, ch.unlockAt - totalEarnedThisRun), 'compact')} вычислений`}
                </button>
              )}
            </li>
          );
        })}
      </ul>

      {currentChapter >= MAX_CHAPTER && (
        <p className="chapter-final-note">
          ✅ Все главы пройдены в этом забеге. Дальше рост дают только
          престиж-бонусы («Перезагрузка системы»).
        </p>
      )}

      {prestigeCount > 0 && (
        <p className="chapter-prestige-note">
          ⟳ Перезагрузок системы: {prestigeCount}.
        </p>
      )}
    </div>
  );
};
