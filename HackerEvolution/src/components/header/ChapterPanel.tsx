import React from 'react';
import { CHAPTERS, MAX_CHAPTER } from '../../gameData';
import { formatNumber } from '../../utils/NumberFormatter';

interface ChapterPanelProps {
  currentChapter: number;
  /** Заработок за текущий забег (сбрасывается при престиже). */
  totalEarnedThisRun: number;
  prestigeCount: number;
  /** Ручной переход в следующую главу. */
  onAdvance: () => void;
}

/**
 * Панель «Прогресс по главам» (вкладка «Взлом»).
 * Показывает пояснение текущей главы, прогресс до следующей и кнопку
 * ручного перехода. Пороги проверяются по заработку за забег, поэтому
 * после престижа («Перезагрузка системы») главы открываются заново.
 */
export const ChapterPanel: React.FC<ChapterPanelProps> = ({
  currentChapter,
  totalEarnedThisRun,
  prestigeCount,
  onAdvance,
}) => {
  const current = CHAPTERS[currentChapter - 1];
  const next = currentChapter < MAX_CHAPTER ? CHAPTERS[currentChapter] : null;
  const canAdvance = !!next && totalEarnedThisRun >= next.unlockAt;
  const progress = next
    ? Math.min(1, totalEarnedThisRun / next.unlockAt)
    : 1;

  return (
    <div className="chapter-progress">
      <h3>
        📖 Глава {currentChapter}: {current?.name}
      </h3>
      <p className="chapter-description">{current?.description}</p>

      {next ? (
        <>
          <div className="progress-item">
            <span>
              Следующая глава: {next.name} — нужно {formatNumber(next.unlockAt, 'compact')}{' '}
              вычислений за этот забег (заработано: {formatNumber(totalEarnedThisRun, 'compact')})
            </span>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
          </div>
          <button
            type="button"
            className="unlock-chapter-btn"
            disabled={!canAdvance}
            onClick={onAdvance}
          >
            {canAdvance
              ? `⚡ Открыть главу ${currentChapter + 1}: ${next.name}`
              : `🔒 Глава ${currentChapter + 1} заблокирована`}
          </button>
        </>
      ) : (
        <p className="chapter-final-note">
          ✅ Все главы пройдены. Дальше рост даёт только «Перезагрузка системы» (престиж).
        </p>
      )}

      {prestigeCount > 0 && (
        <p className="chapter-prestige-note">
          ⟳ Перезагрузок: {prestigeCount}. После перезагрузки забег начинается заново —
          главы нужно открывать снова, но с бонусами от ядер это быстрее.
        </p>
      )}
    </div>
  );
};
