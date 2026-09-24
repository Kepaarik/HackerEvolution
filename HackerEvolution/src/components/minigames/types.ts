/** Общие типы мини-игр (Этап 5). */

/** Результат раунда мини-игры, передаваемый в useMinigames.finishMinigame. */
export interface RoundResult {
  /** Победа с учётом порога очков (проверяется в хуке повторно). */
  won: boolean;
  /** Очки за раунд (для password_hack: 1 при успехе). */
  score: number;
}
