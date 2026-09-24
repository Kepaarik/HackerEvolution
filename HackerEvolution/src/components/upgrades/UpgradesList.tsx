import React from 'react';
import { UpgradeData } from '../../types';
import { formatNumber } from '../../utils/NumberFormatter';
import { GENERATORS } from '../../gameData';

const BRANCH_LABELS: Record<UpgradeData['branch'], string> = {
  hardware: '⚙️ Железо',
  software: '🧩 Софт',
  manual: '✋ Ручной взлом',
  prestige: '⚛️ Квантовые протоколы',
};

export const BRANCH_ORDER: UpgradeData['branch'][] = ['manual', 'hardware', 'software'];

export { BRANCH_LABELS };

interface UpgradeItemProps {
  upgrade: UpgradeData;
  canAfford: boolean;
  /** Выполнено ли требование по генераторам. */
  requirementMet: boolean;
  onBuy: () => void;
}

export const UpgradeItem: React.FC<UpgradeItemProps> = ({
  upgrade,
  canAfford,
  requirementMet,
  onBuy,
}) => {
  const reqText = upgrade.requirement
    ? (() => {
        const gen = GENERATORS.find((g) => g.id === upgrade.requirement!.generatorId);
        return `Требование: ${upgrade.requirement!.count} × ${gen?.name ?? upgrade.requirement!.generatorId}`;
      })()
    : null;

  return (
    <div className={`upgrade-item ${!requirementMet ? 'locked' : ''}`}>
      <div className="upg-info">
        <h4>{upgrade.name}</h4>
        <p>{upgrade.description}</p>
        {reqText && (
          <p className={`upg-requirement ${requirementMet ? 'met' : 'unmet'}`}>
            {requirementMet ? '✅' : '🔒'} {reqText}
          </p>
        )}
      </div>
      <button
        className={`buy-btn ${canAfford && requirementMet ? 'active' : 'disabled'}`}
        onClick={onBuy}
        disabled={!canAfford || !requirementMet}
      >
        {/* Цена в Данных 📊 (Этап 6, ТЗ 8) или в деньгах */}
        {upgrade.dataCost !== undefined
          ? `📊 ${formatNumber(upgrade.dataCost, 'compact')}`
          : `$${formatNumber(upgrade.cost, 'compact')}`}
      </button>
    </div>
  );
};
