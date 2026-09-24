import React from 'react';
import type { GameState } from '../../types';
import {
  PRESTIGE_UPGRADES,
  getPrestigeUpgradeLevel,
  getPrestigeUpgradeCost,
  canBuyPrestigeUpgrade,
} from '../../economy/PrestigeService';
import { formatNumber } from '../../utils/NumberFormatter';

interface PrestigeUpgradesListProps {
  state: GameState;
  buyPrestigeUpgrade: (upgradeId: string) => void;
}

/**
 * Ветка «Квантовые протоколы» — престиж-апгрейды за Квантовые ядра
 * (Этап 4, ТЗ раздел 18). Покупается на вкладке «Улучшения»,
 * сохраняются после престижа. Цена следующего уровня = baseCost × (уровень + 1).
 */
export const PrestigeUpgradesList: React.FC<PrestigeUpgradesListProps> = ({
  state,
  buyPrestigeUpgrade,
}) => {
  return (
    <div className="upgrade-branch prestige-upgrades">
      <h4 className="branch-title">⚛ Квантовые протоколы</h4>
      {PRESTIGE_UPGRADES.map((upg) => {
        const level = getPrestigeUpgradeLevel(upg.id, state);
        const cost = getPrestigeUpgradeCost(upg.id, state);
        const maxed = !Number.isFinite(cost);
        const affordable = canBuyPrestigeUpgrade(upg.id, state);

        return (
          <div
            key={upg.id}
            className={`upgrade-card prestige-upgrade-card ${maxed ? 'purchased' : ''}`}
          >
            <div className="upgrade-info">
              <span className="upgrade-name">
                {upg.name}
                {upg.maxLevel > 1 && (
                  <span className="prestige-level">
                    {' '}
                    {level}/{upg.maxLevel}
                  </span>
                )}
              </span>
              <span className="upgrade-desc">
                {upg.description}
                {upg.deferred && (
                  <em className="prestige-deferred"> — откроется позже</em>
                )}
              </span>
            </div>
            <button
              className="upgrade-buy-btn"
              disabled={!affordable}
              onClick={() => buyPrestigeUpgrade(upg.id)}
            >
              {maxed ? 'МАКС' : `⚛ ${formatNumber(cost)}`}
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default PrestigeUpgradesList;
