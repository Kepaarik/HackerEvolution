import { useState } from "react";
import { Header } from "./components/header/Header";
import { HackButton } from "./components/gameArea/HackButton";
import { TabContent } from "./components/gameArea/TabContent";
import MobileNav, { type TabType } from "./components/MobileNav";
import MatrixBackground from "./components/MatrixBackground";
import { MoneyDisplay } from "./components/common/MoneyDisplay";
import { PrestigeScreen } from "./components/prestige/PrestigeScreen";
import { MinigameLauncher } from "./components/minigames/MinigameLauncher";
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
} from "./hooks/useGameLogic";
import { formatNumber } from "./utils/NumberFormatter";
import "./App.css";

function App() {
  const { state, setState } = useGameState();
  const { getIncomePerSecond, getClickPower } = useIncome(state);
  const { clickEffects, handleHack, removeEffect } = useClickHandler(
    setState,
    getClickPower,
  );
  const [activeTab, setActiveTab] = useState<TabType>("hack");

  useAutoIncome(setState, getIncomePerSecond);
  useAchievements(state, setState);
  const chapters = useChapterProgression(state, setState);
  const { buyGenerator, getCost } = useGeneratorPurchase(state, setState);
  const { buyUpgrade } = useUpgradePurchase(state, setState);
  // Этап 4: престиж-система (ТЗ разделы 24, 18)
  const prestige = usePrestige(state, setState);
  const { buyPrestigeUpgrade } = usePrestigeUpgrades(state, setState);
  // Этап 5: ежедневные квесты и мини-игры (ТЗ 19–23, 27.1)
  const { claimQuest } = useQuests(state, setState);
  const minigames = useMinigames(state, setState);
  // Этап 6: главы 2–4 (ТЗ 8–10) — пассивные Данные, Технологии, навигация по этапам
  usePassiveData(setState);
  useStageFragmentMilestones(state, setState);
  const { buyTechnology } = useTechnologies(state, setState);
  const { setViewChapter } = useStageNavigation(setState);

  const incomePerSec = getIncomePerSecond();

  return (
    <div
      className={`app-container ${prestige.isAnimating ? "animate-glitch" : ""}`}
    >
      <MatrixBackground stage={state.viewChapter ?? state.currentChapter} />
      <Header
        money={state.money}
        incomePerSecond={incomePerSec}
        currentChapter={state.currentChapter}
        showStats={activeTab === "hack"}
        data={state.data}
        quantumCores={state.quantumCores}
        prestigeCount={state.prestigeCount}
        fragments={state.fragments ?? 0}
      />

      <main className="game-area">
        {activeTab === "hack" && (
          <>
            <div className="stats-section">
              <div className="stats-bar-inline">
                <MoneyDisplay amount={state.money} />
                <span className="income-display glow-text">+{formatNumber(incomePerSec, 'money')}/сек</span>
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
            {/* Этап 5: индикатор доступной мини-игры (ТЗ 23.1) */}
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

      {/* Экран престижа с предпросмотром наград и подтверждением (ТЗ 24.6) */}
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

      <MobileNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        generatorsOwned={state.generatorsOwned}
      />
    </div>
  );
}

export default App;
