import React from 'react';
import ClickEffectItem from '../ClickEffectItem';


interface HackButtonProps {
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  clickEffects: Array<{
    id: number;
    x: number;
    y: number;
    value: string;
  }>;
  removeEffect: (id: number) => void;
}

export const HackButton: React.FC<HackButtonProps> = ({
  onClick,
  clickEffects,
  removeEffect,
}) => {
  return (
    <button className="hack-button glow-button" onClick={onClick}>
      <div className="button-content">
        <span className="button-icon">💻</span>
        <span className="button-text glow-text">ВЗЛОМАТЬ</span>
      </div>
      {clickEffects.map((effect) => (
        <ClickEffectItem
          key={effect.id}
          {...effect}
          onComplete={removeEffect}
        />
      ))}
    </button>
  );
};
