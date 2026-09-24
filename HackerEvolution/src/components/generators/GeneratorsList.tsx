import React from 'react';
import { GeneratorData } from '../../types';
import type { BuyAmount } from '../../hooks/useGameLogic';
import { formatNumber } from '../../utils/NumberFormatter';

const BUY_OPTIONS: BuyAmount[] = [1, 10, 25, 'MAX'];

interface GeneratorItemProps {
  data: GeneratorData;
  count: number;
  incomePerSecond: number;
  /** Стоимость выбранного объёма покупки. */
  cost: number;
  /** Отображаемое количество в кнопке (для MAX — сколько реально купим). */
  buyCount: number;
  canAfford: boolean;
  onBuy: (amount: BuyAmount) => void;
  selectedAmount: BuyAmount;
  onAmountChange: (amount: BuyAmount) => void;
  /** Текст условия разблокировки, если генератор ещё не открыт (Этап 3). */
  lockedHint?: string | null;
}

export const GeneratorItem: React.FC<GeneratorItemProps> = ({
  data,
  count,
  incomePerSecond,
  cost,
  buyCount,
  canAfford,
  onBuy,
  selectedAmount,
  onAmountChange,
  lockedHint,
}) => {
  const perUnit = count > 0 ? incomePerSecond / count : 0;

  return (
    <div className={`generator-item ${lockedHint ? 'locked' : ''}`}>
      <div className="gen-info">
        <h3>
          {data.name} <span className="count">×{count}</span>
        </h3>
        {data.description && <p className="gen-flavor">{data.description}</p>}
        <p>Доход: {formatNumber(perUnit, 'compact')}/сек за штуку</p>
        {count > 0 && <p className="gen-total">Итого: {formatNumber(incomePerSecond, 'compact')}/сек</p>}
        {lockedHint && <p className="gen-lock">🔒 {lockedHint}</p>}
      </div>
      {!lockedHint && (
        <>
          <div className="buy-amounts" role="group" aria-label="Объём покупки">
            {BUY_OPTIONS.map((opt) => (
              <button
                key={String(opt)}
                className={`amount-btn ${selectedAmount === opt ? 'active' : ''}`}
                onClick={() => onAmountChange(opt)}
              >
                {opt === 'MAX' ? 'MAX' : `×${opt}`}
              </button>
            ))}
          </div>
          <button
            className={`buy-btn ${canAfford ? 'active' : 'disabled'}`}
            onClick={() => onBuy(selectedAmount)}
            disabled={!canAfford}
          >
            Купить {selectedAmount === 'MAX' ? `×${buyCount}` : `×${buyCount}`} за $
            {formatNumber(cost, 'compact')}
          </button>
        </>
      )}
    </div>
  );
};
