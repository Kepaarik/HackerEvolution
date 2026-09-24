/**
 * MinigameLauncher — панель-запускатель мини-игр (Этап 5, ТЗ 23.1).
 * Кнопка «Мини-игра» появляется на главном экране, когда игра доступна;
 * при запуске выбирает случайную из трёх MVP-мини-игр и открывает модалку.
 */

import React, { useState } from 'react';
import { MINIGAMES } from '../../economy/MinigameService';
import { MinigameModal, MINIGAME_META } from './MinigameModal';
import { PacketInterceptGame } from './PacketInterceptGame';
import { PasswordHackGame } from './PasswordHackGame';
import { TrafficSortGame } from './TrafficSortGame';
import type { RoundResult } from './types';
import './MinigameLauncher.css';

interface MinigameLauncherProps {
  /** Доступна ли мини-игра сейчас (ТЗ 23.1: интервал 12 мин / пауза 5 мин). */
  available: boolean;
  activeId: string | null;
  onStart: (id: string) => void;
  onDismiss: () => void;
  /** Завершение раунда: расчёт и выдача наград (useMinigames.finishMinigame). */
  onFinish: (won: boolean, score: number) => void;
}

const GAME_IDS = Object.keys(MINIGAMES) as (keyof typeof MINIGAMES)[];

export const MinigameLauncher: React.FC<MinigameLauncherProps> = ({
  available,
  activeId,
  onStart,
  onDismiss,
  onFinish,
}) => {
  /** Ключ перезапуска раунда (новый секрет/новая волна пакетов). */
  const [roundKey, setRoundKey] = useState(0);
  /** Идёт ли раунд внутри модалки (контент сам управляет таймером). */
  const [playing, setPlaying] = useState(false);

  if (!available && !activeId) return null;

  const handleFinish = (result: RoundResult) => {
    setPlaying(false);
    onFinish(result.won, result.score);
  };

  const handleStartInside = () => {
    setRoundKey((k) => k + 1);
    setPlaying(true);
  };

  const handleDismiss = () => {
    setPlaying(false);
    onDismiss();
  };

  const renderGame = () => {
    switch (activeId) {
      case 'packet_intercept':
        return <PacketInterceptGame key={roundKey} roundKey={roundKey} onFinished={handleFinish} />;
      case 'password_hack':
        return <PasswordHackGame key={roundKey} roundKey={roundKey} onFinished={handleFinish} />;
      case 'traffic_sort':
        return <TrafficSortGame key={roundKey} roundKey={roundKey} onFinished={handleFinish} />;
      default:
        return null;
    }
  };

  return (
    <>
      {/* Индикатор доступной мини-игры на главном экране */}
      {!activeId && (
        <button
          className="minigame-teaser animate-pulse"
          title="Доступна мини-игра! Нажмите, чтобы выбрать."
          onClick={() => {
            const id = GAME_IDS[Math.floor(Math.random() * GAME_IDS.length)];
            setPlaying(false);
            onStart(id);
          }}
        >
          🎮 Мини-игра доступна!
        </button>
      )}

      {activeId && (
        <MinigameModal
          minigameId={activeId}
          started={playing}
          secondsLeft={MINIGAMES[activeId as keyof typeof MINIGAMES]?.durationSec ?? 0}
          onStart={handleStartInside}
          onDismiss={handleDismiss}
        >
          {renderGame()}
        </MinigameModal>
      )}
    </>
  );
};

export { MINIGAME_META };
