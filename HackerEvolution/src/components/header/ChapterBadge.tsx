import React from 'react';
import { CHAPTER_NAMES } from '../../gameData';


interface ChapterBadgeProps {
  currentChapter: number;
}

export const ChapterBadge: React.FC<ChapterBadgeProps> = ({ currentChapter }) => {
  return (
    <div
      className="chapter-badge animate-float"
      title={`Главы открываются вручную на вкладке «Взлом» (панель «Прогресс»). После престижа забег начинается заново.`}
    >
      <span>⚡</span>
      <span>Глава {currentChapter}: {CHAPTER_NAMES[currentChapter - 1]}</span>
    </div>
  );
};
