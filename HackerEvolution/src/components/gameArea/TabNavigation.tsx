import React from 'react';
import { TabButton } from '../common/TabButton';


type TabType = 'generators' | 'upgrades' | 'achievements';

interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const TabNavigation: React.FC<TabNavigationProps> = ({
  activeTab,
  onTabChange,
}) => {
  return (
    <div className="tabs">
      <TabButton
        isActive={activeTab === 'generators'}
        onClick={() => onTabChange('generators')}
      >
        Серверы
      </TabButton>
      <TabButton
        isActive={activeTab === 'upgrades'}
        onClick={() => onTabChange('upgrades')}
      >
        Апгрейды
      </TabButton>
      <TabButton
        isActive={activeTab === 'achievements'}
        onClick={() => onTabChange('achievements')}
      >
        Достижения
      </TabButton>
    </div>
  );
};
