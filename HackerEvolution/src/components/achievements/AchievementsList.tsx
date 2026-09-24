import React from 'react';
import { Achievement } from '../../types';


interface AchievementItemProps {
  achievement: Achievement;
  isUnlocked: boolean;
}

export const AchievementItem: React.FC<AchievementItemProps> = ({
  achievement,
  isUnlocked,
}) => {
  return (
    <div
      className={`achievement-item ${isUnlocked ? 'unlocked' : 'locked'}`}
    >
      <span className="ach-icon">{achievement.icon}</span>
      <div className="ach-info">
        <h4>{achievement.name}</h4>
        <p>{achievement.description}</p>
      </div>
    </div>
  );
};
