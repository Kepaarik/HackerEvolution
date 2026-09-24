/**
 * PasswordHackGame — мини-игра «Взлом пароля» (Этап 5, ТЗ 21.2).
 * Угадать 4-значный код за 5 попыток; подсказки hot/warm/cold.
 */

import React, { useMemo, useState } from 'react';
import {
  MINIGAMES,
  generateSecretCode,
  getPasswordHint,
  isPasswordCracked,
} from '../../economy/MinigameService';
import type { RoundResult } from './types';

const MAX_ATTEMPTS = 5;
const HINT_LABELS: Record<string, string> = {
  hot: '🔥 Горячо',
  warm: '🌡 Тепло',
  cold: '❄ Холодно',
};

interface Props {
  onFinished: (result: RoundResult) => void;
  /** Смена ключа — новый секретный код. */
  roundKey: number;
}

export const PasswordHackGame: React.FC<Props> = ({ onFinished, roundKey }) => {
  const secret = useMemo(() => generateSecretCode(), [roundKey]);
  const [guess, setGuess] = useState('');
  const [attempts, setAttempts] = useState<{ code: string; hint: 'hot' | 'warm' | 'cold' }[]>([]);
  const finishedRef = React.useRef(false);

  const submit = () => {
    if (!/^\d{4}$/.test(guess) || finishedRef.current) return;
    const cracked = isPasswordCracked(secret, guess);
    const hint = getPasswordHint(secret, guess);
    const next = [...attempts, { code: guess, hint }];
    setAttempts(next);
    setGuess('');
    if (cracked) {
      finishedRef.current = true;
      setTimeout(() => onFinished({ won: true, score: MINIGAMES.password_hack.winThreshold }), 600);
    } else if (next.length >= MAX_ATTEMPTS) {
      finishedRef.current = true;
      setTimeout(() => onFinished({ won: false, score: 0 }), 600);
    }
  };

  return (
    <div>
      <div className="mg-hud">
        <span>🔑 Введите 4-значный код</span>
        <span>Попытки: {attempts.length} / {MAX_ATTEMPTS}</span>
      </div>
      <div className="mg-pass-input-row">
        <input
          className="mg-pass-input"
          value={guess}
          onChange={(e) => setGuess(e.target.value.replace(/\D/g, '').slice(0, 4))}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          inputMode="numeric"
          placeholder="0000"
          aria-label="Попытка взлома пароля"
        />
        <button className="minigame-btn minigame-btn-start" onClick={submit} disabled={guess.length !== 4}>
          →
        </button>
      </div>
      <ul className="mg-pass-attempts">
        {attempts.map((a, i) => (
          <li key={i} className="mg-pass-attempt">
            <span>{a.code}</span>
            <span className={`mg-hint-${a.hint}`}>{HINT_LABELS[a.hint]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
