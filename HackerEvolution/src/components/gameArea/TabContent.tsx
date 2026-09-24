import React, { useState } from 'react';
import { GameState } from '../../types';
import { GENERATORS, UPGRADES, ACHIEVEMENTS, ALL_STAGE_NAMES, MAX_STAGE } from '../../gameData';
import { GeneratorItem } from '../generators/GeneratorsList';
import { UpgradeItem, BRANCH_ORDER, BRANCH_LABELS } from '../upgrades/UpgradesList';
import { AchievementItem } from '../achievements/AchievementsList';
import { PrestigeUpgradesList } from '../prestige/PrestigeUpgradesList';
import { ChaptersTab } from '../chapters/ChaptersTab';
import { QuestsPanel } from '../quests/QuestsPanel';
import { TechnologiesTab } from '../technologies/TechnologiesTab';
import { formatNumber } from '../../utils/NumberFormatter';
import type { BuyAmount } from '../../hooks/useGameLogic';
import {
  getGeneratorIncome,
  isGeneratorVisible,
  isUpgradeAvailable,
  isUpgradeVisible,
  getMaxStage,
} from '../../economy/EconomyService';
import { hasTechnology } from '../../economy/TechnologyService';
import { SPACE_STAGES } from '../../gameData';
import '../technologies/TechnologiesTab.css';

/** Открыт ли космический этап навсегда (через свою технологию) — для подсказок в UI. */
function isStageTechBought(state: GameState, chapter: number): boolean {
  const stage = SPACE_STAGES.find((s) => s.chapter === chapter);
  return !!stage && hasTechnology(state, stage.technologyId);
}

interface TabContentProps {
  activeTab: string;
  state: GameState;
  buyGenerator: (genId: string, amount?: BuyAmount) => void;
  buyUpgrade: (upgradeId: string) => void;
  /** Стоимость покупки `amount` штук генератора. */
  getGenCost: (genId: string, amount: BuyAmount) => { count: number; cost: number };
  /** Покупка престиж-апгрейда «Квантовые протоколы» за ядра (Этап 4). */
  buyPrestigeUpgrade: (upgradeId: string) => void;
  /** Тизер/кнопка престижа на вкладке улучшений (Этап 4, ТЗ 24.5–24.6). */
  prestigeTeaserVisible: boolean;
  prestigeAvailable: boolean;
  prestigeCoresToGain: number;
  onOpenPrestige: () => void;
  /** Ручной переход в следующую главу (вкладка «Главы»). */
  onAdvanceChapter: () => void;
  /** Забрать награду выполненного ежедневного квеста (Этап 5, ТЗ 27.1). */
  claimQuest: (questId: string) => void;
  /** Покупка технологии за Данные/Фрагменты (Этап 6, ТЗ 8–10). */
  buyTechnology: (techId: string) => void;
  /** Переключение просмотренного этапа на вкладке «Генераторы» (Этап 6). */
  setViewChapter: (chapter: number) => void;
}

export const TabContent: React.FC<TabContentProps> = ({
  activeTab,
  state,
  buyGenerator,
  buyUpgrade,
  getGenCost,
  buyPrestigeUpgrade,
  prestigeTeaserVisible,
  prestigeAvailable,
  prestigeCoresToGain,
  onOpenPrestige,
  onAdvanceChapter,
  claimQuest,
  buyTechnology,
  setViewChapter,
}) => {
  // Общий выбранный объём покупки для всех генераторов (1/10/25/MAX)
  const [buyAmount, setBuyAmount] = useState<BuyAmount>(1);

  if (activeTab === 'hack') {
    return null;
  }

  return (
    <div className="tab-content">
      {activeTab === 'generators' && (
        <div className="list-container">
          {/* Навигация по этапам (Этап 6): сюжетные 1–4 + навсегда открытые космические 5–7 */}
          {MAX_STAGE > 1 && (
            <div className="stage-nav" role="group" aria-label="Этапы">
              {Array.from({ length: MAX_STAGE }, (_, i) => i + 1).map((ch) => {
                const spaceStage = ch >= 5;
                const unlocked = spaceStage
                  ? (state.chaptersUnlockedForever ?? []).includes(ch)
                  : ch <= (state.currentChapter ?? 1);
                const isActive = (state.viewChapter ?? 1) === ch;
                return (
                  <button
                    key={ch}
                    className={`stage-btn ${isActive ? 'active' : ''} ${unlocked ? '' : 'locked'}`}
                    disabled={!unlocked}
                    onClick={() => setViewChapter(ch)}
                    title={unlocked ? ALL_STAGE_NAMES[ch] : '🔒 Этап ещё не открыт'}
                  >
                    {unlocked ? ALL_STAGE_NAMES[ch] : `🔒 Этап ${ch}`}
                  </button>
                );
              })}
            </div>
          )}
          {GENERATORS.filter((gen) => {
            const view = state.viewChapter ?? 1;
            // На выбранном этапе показываем его генераторы; если этап недоступен — все
            return gen.chapter === view || getMaxStage(state) < 1;
          }).map((gen) => {
            const visible = isGeneratorVisible(gen.id, state);
            const count = state.generators[gen.id] || 0;
            const income = getGeneratorIncome(gen.id, state);
            const { count: buyCount, cost } = getGenCost(gen.id, buyAmount);
            const canAfford = buyAmount === 'MAX' ? buyCount > 0 : state.money >= cost;

            let lockedHint: string | null = null;
            if (!visible) {
              if (gen.chapter >= 5) {
                const techRequired = !isStageTechBought(state, gen.chapter);
                lockedHint = techRequired
                  ? `Изучите технологию этапа «${ALL_STAGE_NAMES[gen.chapter]}» во вкладке «Технологии»`
                  : `Нужно 10 шт. предыдущего генератора этапа`;
              } else if (gen.chapter > state.currentChapter) {
                lockedHint = `Откроется в главе ${gen.chapter}`;
              } else {
                lockedHint = `Заработайте $${formatNumber(gen.unlockAtTotalEarned, 'compact')} всего`;
              }
            }

            return (
              <GeneratorItem
                key={gen.id}
                data={gen}
                count={count}
                incomePerSecond={income}
                cost={cost}
                buyCount={buyCount}
                canAfford={canAfford}
                onBuy={(amount) => buyGenerator(gen.id, amount)}
                selectedAmount={buyAmount}
                onAmountChange={setBuyAmount}
                lockedHint={lockedHint}
              />
            );
          })}
        </div>
      )}

      {activeTab === 'upgrades' && (
        <div className="list-container">
          {BRANCH_ORDER.map((branch) => {
            const items = UPGRADES.filter(
              (u) => u.branch === branch && !state.upgrades.includes(u.id) && isUpgradeVisible(u.id, state),
            );
            if (items.length === 0) return null;
            return (
              <div key={branch} className="upgrade-branch">
                <h4 className="branch-title">{BRANCH_LABELS[branch]}</h4>
                {items.map((upgrade) => {
                  const requirementMet = upgrade.requirement
                    ? (state.generators[upgrade.requirement.generatorId] || 0) >= upgrade.requirement.count
                    : true;
                  // Цена в Данных 📊 (Этап 6, ТЗ 8) или в деньгах
                  const canAfford = upgrade.dataCost !== undefined
                    ? (state.data ?? 0) >= upgrade.dataCost
                    : state.money >= upgrade.cost;
                  return (
                    <UpgradeItem
                      key={upgrade.id}
                      upgrade={upgrade}
                      canAfford={canAfford}
                      requirementMet={requirementMet}
                      onBuy={() => buyUpgrade(upgrade.id)}
                    />
                  );
                })}
              </div>
            );
          })}
          {UPGRADES.every((u) => state.upgrades.includes(u.id)) && (
            <p>Все апгрейды куплены!</p>
          )}

          {/* Ветка «Квантовые протоколы» — престиж-апгрейды за ядра (Этап 4, ТЗ 18).
              Показывается всегда: игрок видит цель престижа заранее. */}
          <PrestigeUpgradesList state={state} buyPrestigeUpgrade={buyPrestigeUpgrade} />

          {/* Тизер престижа: кнопка появляется заранее, но с предупреждением (ТЗ 24.5) */}
          {prestigeTeaserVisible && (
            <div className="prestige-section">
              <h3>⚛ Перезагрузка системы</h3>
              {prestigeAvailable ? (
                <>
                  <p>
                    Готово к перезагрузке: вы получите{' '}
                    <strong>{prestigeCoresToGain}</strong>{' '}
                    {prestigeCoresToGain === 1 ? 'квантовое ядро' : 'квантовых ядер'}
                  </p>
                  <button className="prestige-btn" onClick={onOpenPrestige}>
                    ПЕРЕЗАГРУЗИТЬ СИСТЕМУ
                  </button>
                </>
              ) : (
                <>
                  <p className="prestige-requirement">
                    Ещё немного! Престиж откроется при 1M вычислений за забег
                    (сейчас: {formatNumber(state.totalEarnedThisRun, 'compact')} / 1M)
                  </p>
                  <button
                    className="prestige-btn prestige-btn-preview"
                    onClick={onOpenPrestige}
                  >
                    ПРЕДПРОСМОТР ПЕРЕЗАГРУЗКИ
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'technologies' && (
        <TechnologiesTab state={state} buyTechnology={buyTechnology} />
      )}

      {activeTab === 'chapters' && (
        <>
          <ChaptersTab
            currentChapter={state.currentChapter}
            totalEarnedThisRun={state.totalEarnedThisRun}
            prestigeCount={state.prestigeCount}
            onAdvance={onAdvanceChapter}
          />
          {/* Ежедневные квесты (Этап 5, ТЗ 27.1) — под списком глав */}
          <QuestsPanel quests={state.quests} onClaim={claimQuest} />
        </>
      )}

      {activeTab === 'achievements' && (
        <div className="list-container">
          {ACHIEVEMENTS.map((ach) => {
            const isUnlocked = state.achievements.includes(ach.id);
            return (
              <AchievementItem
                key={ach.id}
                achievement={ach}
                isUnlocked={isUnlocked}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};
