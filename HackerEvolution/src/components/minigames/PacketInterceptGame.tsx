/**
 * PacketInterceptGame — мини-игра «Перехват пакетов» (Этап 5, ТЗ 21.1).
 * 20 секунд; по полю появляются пакеты, нужно нажать 10 из них.
 */

import React, { useEffect, useRef, useState } from 'react';
import { MINIGAMES } from '../../economy/MinigameService';
import type { RoundResult } from './types';

const DURATION = MINIGAMES.packet_intercept.durationSec; // 20
const WIN_THRESHOLD = MINIGAMES.packet_intercept.winThreshold; // 10
const SPAWN_MS = 900;
const PACKET_LIFETIME_MS = 2200;
const MAX_PACKETS = 4;

interface Packet {
  id: number;
  x: number; // % от ширины поля
  y: number; // % от высоты поля
}

interface Props {
  onFinished: (result: RoundResult) => void;
  /** Сброс раунда (смена ключа). */
  roundKey: number;
}

export const PacketInterceptGame: React.FC<Props> = ({ onFinished, roundKey }) => {
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [packets, setPackets] = useState<Packet[]>([]);
  const [score, setScore] = useState(0);
  const nextIdRef = useRef(1);
  const scoreRef = useRef(0);
  scoreRef.current = score;

  // Обратный отсчёт и завершение раунда
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

  // Спавн пакетов после старта
  useEffect(() => {
    if (startedAt === null) return;
    const spawner = setInterval(() => {
      setPackets((prev) => {
        if (prev.length >= MAX_PACKETS) return prev;
        const p: Packet = {
          id: nextIdRef.current++,
          x: 5 + Math.random() * 80,
          y: 8 + Math.random() * 74,
        };
        setTimeout(() => {
          setPackets((cur) => cur.filter((q) => q.id !== p.id));
        }, PACKET_LIFETIME_MS);
        return [...prev, p];
      });
    }, SPAWN_MS);
    return () => clearInterval(spawner);
  }, [startedAt]);

  const secondsLeft = startedAt === null ? DURATION : Math.max(0, DURATION - (Date.now() - startedAt) / 1000);

  if (startedAt === null) {
    return (
      <div className="mg-result">
        <h4>📦 Перехват пакетов</h4>
        <p className="minigame-rules">
          Нажимайте на появляющиеся пакеты. Успейте перехватить {WIN_THRESHOLD} за {DURATION} секунд!
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
        <span>Перехвачено: {score} / {WIN_THRESHOLD}</span>
      </div>
      {packets.map((p) => (
        <button
          key={p.id}
          className="mg-target mg-target-good"
          style={{ left: `${p.x}%`, top: `${p.y}%` }}
          onPointerDown={() => {
            setScore((s) => s + 1);
            setPackets((cur) => cur.filter((q) => q.id !== p.id));
          }}
        >
          📦
        </button>
      ))}
    </>
  );
};
