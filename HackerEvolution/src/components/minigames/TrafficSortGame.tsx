/**
 * TrafficSortGame — мини-игра «Сортировка трафика» (Этап 5, ТЗ 21.3).
 * 25 секунд; текущий пакет — «легитимный» или «вредоносный»; игрок
 * направляет его в нужный канал кнопками (или стрелками ←/→). +1 за верное, −1 за ошибку.
 */

import React, { useEffect, useRef, useState } from 'react';
import { MINIGAMES } from '../../economy/MinigameService';
import type { RoundResult } from './types';

const DURATION = MINIGAMES.traffic_sort.durationSec; // 25
const WIN_THRESHOLD = MINIGAMES.traffic_sort.winThreshold; // 10

interface Props {
  onFinished: (result: RoundResult) => void;
  roundKey: number;
}

const newPacket = () => Math.random() < 0.5; // true — легитимный (зелёный)

export const TrafficSortGame: React.FC<Props> = ({ onFinished, roundKey }) => {
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [isGood, setIsGood] = useState<boolean>(newPacket);
  const [score, setScore] = useState(0);
  const [flash, setFlash] = useState<'ok' | 'bad' | null>(null);
  const scoreRef = useRef(0);
  scoreRef.current = score;
  const goodRef = useRef(isGood);
  goodRef.current = isGood;

  const sort = (toGoodLane: boolean) => {
    if (startedAt === null) return;
    const correct = toGoodLane === goodRef.current;
    setScore((s) => Math.max(0, s + (correct ? 1 : -1)));
    setFlash(correct ? 'ok' : 'bad');
    setTimeout(() => setFlash(null), 180);
    setIsGood(newPacket());
  };

  // Стрелки клавиатуры
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') sort(true);
      else if (e.key === 'ArrowRight') sort(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // Завершение по таймеру
  useEffect(() => {
    if (startedAt === null) return;
    const t = setInterval(() => {
      const left = DURATION - (Date.now() - startedAt) / 1000;
      if (left <= 0) {
        clearInterval(t);
        onFinished({ won: scoreRef.current >= WIN_THRESHOLD, score: scoreRef.current });
      }
    }, 200);
    return () => clearInterval(t);
  }, [startedAt, onFinished]);

  void roundKey;

  const secondsLeft = startedAt === null ? DURATION : Math.max(0, DURATION - (Date.now() - startedAt) / 1000);

  if (startedAt === null) {
    return (
      <div className="mg-result">
        <h4>🚦 Сортировка трафика</h4>
        <p className="minigame-rules">
          Зелёные (легитимные) пакеты — в левый канал, красные (вредоносные) — в правый.
          Наберите {WIN_THRESHOLD} очков за {DURATION} секунд. Управление: кнопки или ←/→.
        </p>
        <button className="minigame-btn minigame-btn-start" onClick={() => setStartedAt(Date.now())}>
          НАЧАТЬ
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="mg-hud">
        <span>⏱ {Math.ceil(secondsLeft)}с</span>
        <span>Очки: {score} / {WIN_THRESHOLD}</span>
      </div>
      <div style={{ textAlign: 'center', padding: '26px 0' }}>
        <span
          className={`mg-target ${isGood ? 'mg-target-good' : 'mg-target-bad'}`}
          style={{ position: 'static', width: 64, height: 64, fontSize: '1.6rem', cursor: 'default' }}
        >
          {isGood ? '✅' : '☠️'}
        </span>
        {flash && (
          <div style={{ marginTop: 6, fontSize: '0.8rem', color: flash === 'ok' ? '#7dff7d' : '#ff8080' }}>
            {flash === 'ok' ? '+1' : '−1'}
          </div>
        )}
      </div>
      <div className="mg-lane-buttons">
        <button className="mg-lane-btn" onPointerDown={() => sort(true)}>⬅ Легитимный</button>
        <button className="mg-lane-btn" onPointerDown={() => sort(false)}>Вредоносный ➡</button>
      </div>
    </>
  );
};
