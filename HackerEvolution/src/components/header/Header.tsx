import React from 'react';
import { MoneyDisplay } from '../common/MoneyDisplay';
import { ChapterBadge } from './ChapterBadge';
import { LanguageSwitcher } from '../common/LanguageSwitcher';
import { NumberFormatSwitcher } from '../common/NumberFormatSwitcher';
import { formatNumber } from '../../utils/NumberFormatter';


interface HeaderProps {
  money: number;
  incomePerSecond: number;
  currentChapter: number;
  showStats?: boolean;
  /** Редкий ресурс «Данные» (Этап 5, ТЗ 4.2) — показывается, если > 0. */
  data?: number;
  /** Квантовые ядра (Этап 4, ТЗ 4.3) — показываются, если > 0. */
  quantumCores?: number;
  /** Совершённые престижи (Этап 4). */
  prestigeCount?: number;
  /** Фрагменты исходного кода (Этап 6, ТЗ 4.4) — показываются, если > 0. */
  fragments?: number;
}

export const Header: React.FC<HeaderProps> = ({
  money,
  incomePerSecond,
  currentChapter,
  showStats = true,
  data = 0,
  quantumCores = 0,
  prestigeCount = 0,
  fragments = 0,
}) => {
  return (
    <header className="cyber-header glow-border">
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' }}>
        <LanguageSwitcher />
        <NumberFormatSwitcher />
      </div>
      <h1 className="glow-text animate-pulse">HACKER EVOLUTION</h1>
      {showStats && (
        <div className="stats-bar-inline">
          <MoneyDisplay amount={money} />
          <span className="income-display glow-text">+{formatNumber(incomePerSecond, 'money')}/сек</span>
          {data > 0 && (
            <span className="data-display" title="Данные — редкий ресурс из мини-игр и квестов">
              📊 {Math.floor(data)}
            </span>
          )}
          {quantumCores > 0 && (
            <span className="cores-display" title="Квантовые ядра">
              ⚛ {quantumCores}
            </span>
          )}
          {prestigeCount > 0 && (
            <span className="prestige-count" title="Перезагрузок системы">
              ⟳ {prestigeCount}
            </span>
          )}
          {fragments > 0 && (
            <span className="fragments-display" title="Фрагменты исходного кода">
              🧩 {fragments}
            </span>
          )}
        </div>
      )}
      <ChapterBadge currentChapter={currentChapter} />
    </header>
  );
};
