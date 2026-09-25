import { GameState } from '../../types'
import {
  GENERATORS,
  UPGRADES,
  PRESTIGE_UPGRADES,
  CHAPTER_NAMES,
  SPACE_STAGES,
} from '../../gameData'
import { GeneratorList } from '../generators/GeneratorList'
import { formatNumber } from '../../utils/NumberFormatter'
import type { TabType } from '../MobileNav'
import './TabContent.css'

interface TabContentProps {
  activeTab: TabType
  state: GameState
  buyGenerator: (genId: string, amount?: number) => void
  buyUpgrade: (upgradeId: string) => void
  getGenCost: (genId: string, amount?: number) => number
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
  // === Вкладка: ГЕНЕРАТОРЫ (МАГАЗИН) ===
  if (activeTab === 'generators' || activeTab === 'shop') {
    return (
      <div className="tab-content">
        <div className="tab-header">
          <h2 className="tab-title">🛒 Генераторы</h2>
          <div className="tab-resources">
            <span className="resource-money">
              💻 {formatNumber(state.money, 'money')}
            </span>
            {state.data > 0 && (
              <span className="resource-data">📊 {Math.floor(state.data)}</span>
            )}
            {state.quantumCores > 0 && (
              <span className="resource-cores">⚛ {state.quantumCores}</span>
            )}
          </div>
        </div>

        {/* Переключатель глав (если открыто несколько) */}
        <div className="chapter-tabs">
          {[1, 2, 3, 4].map((ch) => {
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

        {/* Список генераторов текущей просматриваемой главы */}
        <GeneratorList
          state={state}
          buyGenerator={buyGenerator}
          getGenCost={getGenCost}
        />

        {/* Кнопка перехода к следующей главе */}
        {state.currentChapter < 4 && (
          <button className="advance-chapter-btn" onClick={onAdvanceChapter}>
            Перейти к Главе {state.currentChapter + 1}:{' '}
            {CHAPTER_NAMES[state.currentChapter]}
          </button>
        )}
      </div>
    )
  }

  // === Вкладка: УЛУЧШЕНИЯ ===
  if (activeTab === 'upgrades') {
    const purchasedUpgrades = state.upgrades || []
    const purchasedPrestigeUpgrades = state.prestigeUpgrades || {}

    return (
      <div className="tab-content">
        <div className="tab-header">
          <h2 className="tab-title">⚡ Улучшения</h2>
          <div className="tab-resources">
            <span className="resource-money">
              💻 {formatNumber(state.money, 'money')}
            </span>
            {state.data > 0 && (
              <span className="resource-data">📊 {Math.floor(state.data)}</span>
            )}
            {state.quantumCores > 0 && (
              <span className="resource-cores">⚛ {state.quantumCores}</span>
            )}
          </div>
        </div>

        {/* Обычные апгрейды (Железо, Софт, Ручной взлом) */}
        <section className="upgrade-section">
          <h3 className="section-title">Обычные улучшения</h3>
          <div className="upgrade-list">
            {UPGRADES.filter((u) => !purchasedUpgrades.includes(u.id)).map((upgrade) => {
              const canAfford =
                upgrade.dataCost !== undefined
                  ? (state.data ?? 0) >= upgrade.dataCost
                  : state.money >= upgrade.cost

              return (
                <div key={upgrade.id} className="upgrade-item">
                  <div className="upgrade-info">
                    <span className="upgrade-name">{upgrade.name}</span>
                    <span className="upgrade-desc">{upgrade.description}</span>
                  </div>
                  <button
                    className={`upgrade-buy-btn ${canAfford ? 'affordable' : 'not-affordable'}`}
                    onClick={() => buyUpgrade(upgrade.id)}
                    disabled={!canAfford}
                  >
                    {upgrade.dataCost !== undefined
                      ? `📊 ${upgrade.dataCost}`
                      : `💻 ${formatNumber(upgrade.cost, 'money')}`}
                  </button>
                </div>
              )
            })}
          </div>
          {UPGRADES.every((u) => purchasedUpgrades.includes(u.id)) && (
            <p className="all-bought-msg">✅ Все обычные улучшения куплены!</p>
          )}
        </section>

        {/* Престиж-апгрейды (Квантовые протоколы) */}
        <section className="upgrade-section prestige-section">
          <h3 className="section-title">🔮 Квантовые протоколы</h3>
          {state.prestigeCount === 0 && (
            <p className="prestige-hint">
              Совершите первый престиж, чтобы открыть квантовые улучшения.
            </p>
          )}
          {state.prestigeCount > 0 && (
            <div className="upgrade-list">
              {PRESTIGE_UPGRADES.map((pUpgrade) => {
                const currentLevel = purchasedPrestigeUpgrades[pUpgrade.id] || 0
                const maxLevel = pUpgrade.maxLevel || 1
                const isMaxed = currentLevel >= maxLevel
                const canAfford = state.quantumCores >= pUpgrade.cost && !isMaxed

                return (
                  <div key={pUpgrade.id} className="upgrade-item prestige-upgrade">
                    <div className="upgrade-info">
                      <span className="upgrade-name">
                        {pUpgrade.name}
                        {maxLevel > 1 && ` (${currentLevel}/${maxLevel})`}
                      </span>
                      <span className="upgrade-desc">{pUpgrade.description}</span>
                    </div>
                    <button
                      className={`upgrade-buy-btn ${canAfford ? 'affordable' : 'not-affordable'}`}
                      onClick={() => buyPrestigeUpgrade(pUpgrade.id)}
                      disabled={!canAfford}
                    >
                      {isMaxed ? 'MAX' : `⚛ ${pUpgrade.cost}`}
                    </button>
                  </div>
                )
              })}
            </div>
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

  // === Вкладка: ЗАДАНИЯ ===
  if (activeTab === 'quests') {
    const quests = state.quests || []

    return (
      <div className="tab-content">
        <div className="tab-header">
          <h2 className="tab-title">🎯 Задания</h2>
          <div className="tab-resources">
            {state.data > 0 && (
              <span className="resource-data">📊 {Math.floor(state.data)}</span>
            )}
            {(state.fragments ?? 0) > 0 && (
              <span className="resource-fragments">🧩 {state.fragments}</span>
            )}
          </div>
        </div>

        {/* Ежедневные квесты */}
        <section className="quest-section">
          <h3 className="section-title">Ежедневные задания</h3>
          {quests.length === 0 ? (
            <p className="no-quests-msg">Квесты обновятся завтра. Возвращайтесь!</p>
          ) : (
            <div className="quest-list">
              {quests.map((quest) => (
                <div
                  key={quest.id}
                  className={`quest-item ${quest.completed ? 'completed' : ''}`}
                >
                  <div className="quest-info">
                    <span className="quest-name">{quest.name}</span>
                    <span className="quest-progress">
                      {quest.current}/{quest.target}
                    </span>
                    <span className="quest-reward">
                      Награда: {quest.rewardData > 0 && `📊 ${quest.rewardData}`}{' '}
                      {quest.rewardMoney > 0 &&
                        `💻 ${formatNumber(quest.rewardMoney, 'money')}`}
                    </span>
                  </div>
                  <button
                    className={`quest-claim-btn ${quest.completed && !quest.claimed ? 'claimable' : ''}`}
                    onClick={() => claimQuest(quest.id)}
                    disabled={!quest.completed || quest.claimed}
                  >
                    {quest.claimed
                      ? '✅'
                      : quest.completed
                        ? 'Забрать'
                        : `${Math.floor((quest.current / quest.target) * 100)}%`}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Технологии */}
        <section className="quest-section">
          <h3 className="section-title">🔬 Технологии</h3>
          <div className="tech-list">
            {SPACE_STAGES.map((tech) => {
              const isOwned = (state.technologies || []).includes(tech.id)
              const canAfford = (state.data ?? 0) >= tech.dataCost

              return (
                <div key={tech.id} className={`tech-item ${isOwned ? 'owned' : ''}`}>
                  <div className="tech-info">
                    <span className="tech-name">{tech.name}</span>
                    <span className="tech-desc">{tech.description}</span>
                  </div>
                  <button
                    className={`tech-buy-btn ${canAfford && !isOwned ? 'affordable' : ''}`}
                    onClick={() => buyTechnology(tech.id)}
                    disabled={isOwned || !canAfford}
                  >
                    {isOwned ? '✅ Изучено' : `📊 ${tech.dataCost}`}
                  </button>
                </div>
              )
            })}
          </div>
        </section>
      </div>
    )
  }

  // === Вкладка: МЕНЮ / ПРОЧЕЕ ===
  return (
    <div className="tab-content">
      <div className="tab-header">
        <h2 className="tab-title">⚙️ Меню</h2>
      </div>
      <div className="menu-section">
        <p className="menu-info">
          Глава: {CHAPTER_NAMES[(state.viewChapter ?? state.currentChapter) - 1]}
          <br />
          Престижей: {state.prestigeCount}
          <br />
          Всего заработано: {formatNumber(state.totalEarned, 'money')}
          <br />
          Фрагменты: {state.fragments ?? 0}/100
        </p>
      </div>
    </div>
  )
}
