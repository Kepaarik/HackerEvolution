import React from 'react';
import { formatNumber } from '../../utils/NumberFormatter';


interface MoneyDisplayProps {
  amount: number;
  label?: string;
}

/** Отображение денег с сокращениями (K/M/B... или a/b/c... — в зависимости от настройки). */
export const MoneyDisplay: React.FC<MoneyDisplayProps> = ({ amount, label }) => {
  return (
    <span className="money-display glow-text">
      {label ? `${label}: ` : ''}<span>$</span>{formatNumber(amount, 'money')}
    </span>
  );
};
