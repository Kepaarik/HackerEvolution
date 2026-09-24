import React, { createContext, useContext, ReactNode } from 'react';
import { GameState } from '../types';

interface GameContextType {
  state: GameState;
  setState: React.Dispatch<React.SetStateAction<GameState>>;
  getIncomePerSecond: () => number;
  getClickPower: () => number;
  handleHack: (e: React.MouseEvent<HTMLButtonElement>) => void;
  buyGenerator: (genId: string) => void;
  buyUpgrade: (upgradeId: string) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const useGameContext = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGameContext must be used within a GameProvider');
  }
  return context;
};

interface GameProviderProps {
  children: ReactNode;
  state: GameState;
  setState: React.Dispatch<React.SetStateAction<GameState>>;
  getIncomePerSecond: () => number;
  getClickPower: () => number;
  handleHack: (e: React.MouseEvent<HTMLButtonElement>) => void;
  buyGenerator: (genId: string) => void;
  buyUpgrade: (upgradeId: string) => void;
}

export const GameProvider: React.FC<GameProviderProps> = ({
  children,
  state,
  setState,
  getIncomePerSecond,
  getClickPower,
  handleHack,
  buyGenerator,
  buyUpgrade,
}) => {
  return (
    <GameContext.Provider
      value={{
        state,
        setState,
        getIncomePerSecond,
        getClickPower,
        handleHack,
        buyGenerator,
        buyUpgrade,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};
