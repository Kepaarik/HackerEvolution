import { GameState } from '../../types'
import type { BuyAmount } from '../../hooks/useGameLogic'
import { UPGRADES, ACHIEVEMENTS, CHAPTER_NAMES, MAX_CHAPTER } from '../../gameData'
import { GeneratorList } from '../generators/GeneratorList'
import { PrestigeUpgradesList } from '../prestige/PrestigeUpgradesList'
import { TechnologiesTab } from '../technologies/TechnologiesTab'
import { ChaptersTab } from '../chapters/ChaptersTab'
import { AchievementItem } from '../achievements/AchievementsList'
import { formatNumber } from '../../utils/NumberFormatter'
import { isUpgradeAvailable, isUpgradeVisible } from '../../economy/EconomyService'
import { getQuestProgress } from '../../economy/QuestService'
import type { TabType } from '../MobileNav'
import './TabContent.css'

interface TabContentProps {
  activeTab: TabType
  state: GameState
  buyGenerator: (genId: string, amount?: BuyAmount) => void
  buyUpgrade: (upgradeId: string) => void
  getGenCost: (genId: string, amount: BuyAmount) => { count: number; cost: number }
  buyPrestigeUpgrade: (upgradeId: string) => void
  prestigeTeaserVisible: boolean
  prestigeAvailable: boolean
  prestigeCoresToGain: number
  onOpenPrestige: () => void
  onAdvanceChapter: () => void
  claimQuest: (questId: string) => void
  buyTechnology: (techId: string) => void
  setViewChapter: (chapter: number) => void
}

/** Шапка вкладки с текущими ресурсами. */
function TabHeader({ title, state }: { title: string; state: GameState }) {
  return (
    <div className="tab-header">
      <h2 className="tab-title">{title}</h2>
      <div className="tab-resources">
        <span className="resource-money">💻 {formatNumber(state.money, 'money')}</span>
        {state.data > 0 && <span className="resource-data">📊 {Math.floor(state.data)}</span>}
        {state.quantumCores > 0 && (
          <span className="resource-cores">⚛ {state.quantumCores}</span>
        )}
        {(state.fragments ?? 0) > 0 && (
          <span className="resource-fragments">🧩 {state.fragments}</span>
        )}
      </div>
    </div>
  )
}

/**
 * Контент вкладок нижней навигации. Каждая вкладка делегирует рендеринг
 * специализированному компоненту (GeneratorList, TechnologiesTab и т.д.) —
 * здесь только композиция и общие шапки.
 */
export function TabContent({
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
}: TabContentProps) {
  // === Вкладка: ГЕНЕРАТОРЫ ===
  if (activeTab === 'generators') {
    return (
      <div className="tab-content">
        <TabHeader title="🛒 Генераторы" state={state} />

        {/* Переключатель сюжетных глав (космические этапы — во «Технологиях») */}
        <div className="chapter-tabs">
          {Array.from({ length: MAX_CHAPTER }, (_, i) => i + 1).map((ch) => {
            const isUnlocked = ch <= state.currentChapter
            const isViewing = (state.viewChapter ?? 1) === ch
            return (
              <button
                key={ch}
                className={`chapter-tab ${isViewing ? 'active' : ''} ${!isUnlocked ? 'locked' : ''}`}
                onClick={() => isUnlocked && setViewChapter(ch)}
                disabled={!isUnlocked}
              >
                {CHAPTER_NAMES[ch - 1] || `Глава ${ch}`}
                {!isUnlocked && ' 🔒'}
              </button>
            )
          })}
        </div>

        <GeneratorList
          state={state}
          buyGenerator={buyGenerator}
          getGenCost={getGenCost}
        />

        {state.currentChapter < MAX_CHAPTER && (
          <button className="advance-chapter-btn" onClick={onAdvanceChapter}>
            Перейти к Главе {state.currentChapter + 1}: {CHAPTER_NAMES[state.currentChapter]}
          </button>
        )}
      </div>
    )
  }

  // === Вкладка: УЛУЧШЕНИЯ ===
  if (activeTab === 'upgrades') {
    const purchased = state.upgrades || []
    const visibleUpgrades = UPGRADES.filter(
      (u) => !purchased.includes(u.id) && isUpgradeVisible(u.id, state),
    )

    return (
      <div className="tab-content">
        <TabHeader title="⚡ Улучшения" state={state} />

        <section className="upgrade-section">
          <h3 className="section-title">Обычные улучшения</h3>
          <div className="upgrade-list">
            {visibleUpgrades.map((upgrade) => {
              const canAfford = isUpgradeAvailable(upgrade.id, state)
              const requirementMet =
                !upgrade.requirement ||
                (state.generators[upgrade.requirement.generatorId] || 0) >=
                  upgrade.requirement.count

              return (
                <div key={upgrade.id} className="upgrade-item">
                  <div className="upgrade-info">
                    <span className="upgrade-name">{upgrade.name}</span>
                    <span className="upgrade-desc">{upgrade.description}</span>
                  </div>
                  <button
                    className={`upgrade-buy-btn ${canAfford && requirementMet ? 'affordable' : 'not-affordable'}`}
                    onClick={() => buyUpgrade(upgrade.id)}
                    disabled={!canAfford || !requirementMet}
                  >
                    {upgrade.dataCost !== undefined
                      ? `📊 ${upgrade.dataCost}`
                      : `💻 ${formatNumber(upgrade.cost, 'money')}`}
                  </button>
                </div>
              )
            })}
          </div>
          {visibleUpgrades.length === 0 && (
            <p className="all-bought-msg">✅ Все доступные улучшения куплены!</p>
          )}
        </section>

        {/* Престиж-апгрейды («Квантовые протоколы», ТЗ 18) */}
        <section className="upgrade-section prestige-section">
          <h3 className="section-title">🔮 Квантовые протоколы</h3>
          {state.prestigeCount === 0 ? (
            <p className="prestige-hint">
              Совершите первый престиж, чтобы открыть квантовые улучшения.
            </p>
          ) : (
            <PrestigeUpgradesList state={state} buyPrestigeUpgrade={buyPrestigeUpgrade} />
          )}
        </section>

        {/* Тизер престижа */}
        {prestigeTeaserVisible && (
          <section className="prestige-teaser">
            <div className="prestige-teaser-content">
              <h3>⚛ Перезагрузка системы</h3>
              <p>
                {prestigeAvailable
                  ? `Вы можете получить ${prestigeCoresToGain} квантовых ядер!`
                  : 'Наберите 1 000 000 вычислений за забег для престижа.'}
              </p>
              <button
                className="prestige-open-btn"
                onClick={onOpenPrestige}
                disabled={!prestigeAvailable}
              >
                {prestigeAvailable ? 'Открыть экран престижа' : 'Ещё рано...'}
              </button>
            </div>
          </section>
        )}
      </div>
    )
  }

  // === Вкладка: ТЕХНОЛОГИИ (Этап 6, ТЗ 8–10) ===
  if (activeTab === 'technologies') {
    return (
      <div className="tab-content">
        <TabHeader title="🧬 Технологии" state={state} />
        <TechnologiesTab state={state} buyTechnology={buyTechnology} />
      </div>
    )
  }

  // === Вкладка: ГЛАВЫ ===
  if (activeTab === 'chapters') {
    return (
      <div className="tab-content">
        <TabHeader title="📖 Главы" state={state} />
        <ChaptersTab
          currentChapter={state.currentChapter}
          totalEarnedThisRun={state.totalEarnedThisRun}
          prestigeCount={state.prestigeCount}
          onAdvance={onAdvanceChapter}
        />
      </div>
    )
  }

  // === Вкладка: ДОСТИЖЕНИЯ ===
  if (activeTab === 'achievements') {
    const unlocked = new Set(state.achievements || [])
    return (
      <div className="tab-content">
        <TabHeader title="🏆 Достижения" state={state} />
        <div className="achievement-list">
          {ACHIEVEMENTS.map((ach) => (
            <AchievementItem
              key={ach.id}
              achievement={ach}
              isUnlocked={unlocked.has(ach.id)}
            />
          ))}
        </div>
      </div>
    )
  }

  // === Вкладка: ВЗЛОМ (основной экран — контент рендерится в App) ===
  return null
}

/**
 * Панель ежедневных заданий (используется внутри вкладки «Взлом»):
 * прогресс считается от базовых точек на момент выдачи квестов (ТЗ 27.1).
 */
export function QuestsSection({
  state,
  claimQuest,
}: {
  state: GameState
  claimQuest: (questId: string) => void
}) {
  const quests = state.quests || []
  return (
    <section className="quest-section">
      <h3 className="section-title">🎯 Ежедневные задания</h3>
      {quests.length === 0 ? (
        <p className="no-quests-msg">Квесты обновятся завтра. Возвращайтесь!</p>
      ) : (
        <div className="quest-list">
          {quests.map((quest) => {
            const progress = Math.min(getQuestProgress(quest, state), quest.target)
            const completed = progress >= quest.target
            return (
              <div key={quest.id} className={`quest-item ${completed ? 'completed' : ''}`}>
                <div className="quest-info">
                  <span className="quest-name">{quest.type}</span>
                  <span className="quest-progress">
                    {progress}/{quest.target}
                  </span>
                  <span className="quest-reward">
                    Награда: {quest.rewardData > 0 && `📊 ${quest.rewardData}`}{' '}
                    {quest.rewardCompute > 0 &&
                      `💻 ${formatNumber(quest.rewardCompute, 'money')}`}
                  </span>
                </div>
                <button
                  className={`quest-claim-btn ${completed && !quest.claimed ? 'claimable' : ''}`}
                  onClick={() => claimQuest(quest.id)}
                  disabled={!completed || quest.claimed}
                >
                  {quest.claimed
                    ? '✅'
                    : completed
                      ? 'Забрать'
                      : `${Math.floor((progress / quest.target) * 100)}%`}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
