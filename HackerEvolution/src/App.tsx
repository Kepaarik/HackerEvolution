import { useState, useEffect } from 'react'
import { Header } from './components/header/Header'
import { HackButton } from './components/gameArea/HackButton'
import { TabContent } from './components/gameArea/TabContent'
import MobileNav, { type TabType } from './components/MobileNav'
import MatrixBackground from './components/MatrixBackground'
import { MoneyDisplay } from './components/common/MoneyDisplay'
import { PrestigeScreen } from './components/prestige/PrestigeScreen'
import { MinigameLauncher } from './components/minigames/MinigameLauncher'
import { OfflineRewardModal } from './components/OfflineRewardModal'
import {
  useGameState,
  useIncome,
  useClickHandler,
  useAutoIncome,
  useAchievements,
  useChapterProgression,
  useGeneratorPurchase,
  useUpgradePurchase,
  usePrestige,
  usePrestigeUpgrades,
  useQuests,
  useMinigames,
  usePassiveData,
  useTechnologies,
  useStageNavigation,
  useStageFragmentMilestones,
} from './hooks/useGameLogic'
import { formatNumber } from './utils/NumberFormatter'
import './App.css'

function App() {
  const { state, setState } = useGameState()
  const { getIncomePerSecond, getClickPower } = useIncome(state)
  const { clickEffects, handleHack, removeEffect } = useClickHandler(
    setState,
    getClickPower,
  )
  const [activeTab, setActiveTab] = useState<TabType>('hack')
  const [offlineReward, setOfflineReward] = useState<{
    earnings: number
    time: number
  } | null>(null)

  useAutoIncome(setState, getIncomePerSecond)
  useAchievements(state, setState)
  const chapters = useChapterProgression(state, setState)
  const { buyGenerator, getCost } = useGeneratorPurchase(state, setState)
  const { buyUpgrade } = useUpgradePurchase(state, setState)
  const prestige = usePrestige(state, setState)
  const { buyPrestigeUpgrade } = usePrestigeUpgrades(state, setState)
  const { claimQuest } = useQuests(state, setState)
  const minigames = useMinigames(state, setState)
  usePassiveData(setState)
  useStageFragmentMilestones(state, setState)
  const { buyTechnology } = useTechnologies(state, setState)
  const { setViewChapter } = useStageNavigation(setState)

  const incomePerSec = getIncomePerSecond()

  // Эффект для проверки офлайн-награды при загрузке
  useEffect(() => {
    const pending = sessionStorage.getItem('pending_offline_reward')
    if (pending) {
      try {
        const data = JSON.parse(pending)
        if (data.earnings > 0) setOfflineReward(data)
        sessionStorage.removeItem('pending_offline_reward')
      } catch (e) {
        console.error('Failed to parse offline reward', e)
      }
    }
  }, [])

  const handleClaimOffline = (multiplier: 1 | 2) => {
    if (!offlineReward) return
    const finalEarnings = offlineReward.earnings * multiplier

    setState((prev) => ({
      ...prev,
      money: prev.money + finalEarnings,
      totalEarned: prev.totalEarned + finalEarnings,
      totalEarnedThisRun: prev.totalEarnedThisRun + finalEarnings,
    }))

    setOfflineReward(null)
  }

  return (
    <div className={`app-container ${prestige.isAnimating ? 'animate-glitch' : ''}`}>
      <MatrixBackground stage={state.viewChapter ?? state.currentChapter} />
      <Header
        money={state.money}
        incomePerSecond={incomePerSec}
        currentChapter={state.currentChapter}
        showStats={activeTab === 'hack'}
        data={state.data}
        quantumCores={state.quantumCores}
        prestigeCount={state.prestigeCount}
        fragments={state.fragments ?? 0}
      />

      <main className="game-area">
        {activeTab === 'hack' && (
          <>
            <div className="stats-section">
              <div className="stats-bar-inline">
                <MoneyDisplay amount={state.money} />
                <span className="income-display glow-text">
                  +{formatNumber(incomePerSec, 'money')}/сек
                </span>
                {state.data > 0 && (
                  <span className="data-display" title="Данные">
                    📊 {Math.floor(state.data)}
                  </span>
                )}
                {state.quantumCores > 0 && (
                  <span className="cores-display" title="Квантовые ядра">
                    ⚛ {state.quantumCores}
                  </span>
                )}
                {(state.fragments ?? 0) > 0 && (
                  <span className="fragments-display" title="Фрагменты исходного кода">
                    🧩 {state.fragments}
                  </span>
                )}
              </div>
            </div>
            <HackButton
              onClick={handleHack}
              clickEffects={clickEffects}
              removeEffect={removeEffect}
            />
            <MinigameLauncher
              available={minigames.available && state.currentChapter >= 1}
              activeId={minigames.active?.id ?? null}
              onStart={minigames.startMinigame}
              onDismiss={minigames.dismissMinigame}
              onFinish={minigames.finishMinigame}
            />
          </>
        )}

        <TabContent
          activeTab={activeTab}
          state={state}
          buyGenerator={buyGenerator}
          buyUpgrade={buyUpgrade}
          getGenCost={getCost}
          buyPrestigeUpgrade={buyPrestigeUpgrade}
          prestigeTeaserVisible={prestige.teaserVisible}
          prestigeAvailable={prestige.available}
          prestigeCoresToGain={prestige.preview.coresToGain}
          onOpenPrestige={prestige.openPrestigeScreen}
          onAdvanceChapter={chapters.advanceChapter}
          claimQuest={claimQuest}
          buyTechnology={buyTechnology}
          setViewChapter={setViewChapter}
        />
      </main>

      {prestige.screenOpen && (
        <PrestigeScreen
          state={state}
          preview={prestige.preview}
          available={prestige.available}
          isAnimating={prestige.isAnimating}
          onConfirm={prestige.doPrestige}
          onClose={prestige.closePrestigeScreen}
        />
      )}

      {/* Экран офлайн-награды */}
      {offlineReward && (
        <OfflineRewardModal
          offlineEarnings={offlineReward.earnings}
          offlineTime={offlineReward.time}
          onClaim={handleClaimOffline}
          onClose={() => setOfflineReward(null)}
        />
      )}

      <MobileNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        generatorsOwned={state.generatorsOwned}
      />
    </div>
  )
}

export default App
