import React from "react";
import { GeneratorData } from "../types";
import { formatNumber } from "../utils/NumberFormatter";


interface GeneratorItemProps {
  data: GeneratorData;
  count: number;
  incomePerSecond: number;
  cost: number;
  onBuy: () => void;
  canAfford: boolean;
}

const GeneratorItem: React.FC<GeneratorItemProps> = ({
  data,
  count,
  incomePerSecond,
  cost,
  onBuy,
  canAfford,
}) => {
  return (
    <div className="generator-item">
      <div className="gen-info">
        <h3>{data.name}</h3>
        <p>Доход: ${formatNumber(incomePerSecond, 'money')}/сек</p>
        <p className="count">Количество: {count}</p>
      </div>
      <button
        className={`buy-btn ${canAfford ? "active" : "disabled"}`}
        onClick={onBuy}
        disabled={!canAfford}
      >
        Купить за ${Math.floor(cost)}
      </button>
    </div>
  );
};

export default GeneratorItem;
