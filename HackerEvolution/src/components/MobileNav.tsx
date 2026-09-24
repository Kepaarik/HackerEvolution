import React, { useState } from 'react';
import './MobileNav.css';

export type TabType = 'hack' | 'generators' | 'upgrades' | 'technologies' | 'chapters' | 'achievements';

interface MobileNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  generatorsOwned: number;
}

interface TabDef {
  id: TabType;
  label: string;
  icon: string;
}

const MobileNav: React.FC<MobileNavProps> = ({ activeTab, onTabChange, generatorsOwned }) => {
  const [moreOpen, setMoreOpen] = useState(false);

  // 4 основные вкладки всегда видны в навбаре
  const primaryTabs: TabDef[] = [
    { id: 'hack', label: 'Взлом', icon: '💻' },
    { id: 'generators', label: 'Генераторы', icon: '⚙️' },
    { id: 'upgrades', label: 'Улучшения', icon: '🚀' },
    { id: 'technologies', label: 'Технологии', icon: '🧬' },
  ];

  // Остальные вкладки — во всплывающем меню "Ещё"
  const moreTabs: TabDef[] = [
    { id: 'chapters', label: 'Главы', icon: '📖' },
    { id: 'achievements', label: 'Достижения', icon: '🏆' },
  ];

  const isMoreActive = moreTabs.some((t) => t.id === activeTab);

  const handleMoreSelect = (tab: TabType) => {
    onTabChange(tab);
    setMoreOpen(false);
  };

  return (
    <nav className="mobile-nav">
      {/* Затемнение фона при открытом меню */}
      {moreOpen && (
        <div className="mobile-nav-backdrop" onClick={() => setMoreOpen(false)} />
      )}

      {/* Всплывающее меню с остальными вкладками */}
      {moreOpen && (
        <div className="mobile-nav-popup" role="menu">
          {moreTabs.map((tab) => (
            <button
              key={tab.id}
              role="menuitem"
              className={`popup-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => handleMoreSelect(tab.id)}
            >
              <span className="popup-icon">{tab.icon}</span>
              <span className="popup-label">{tab.label}</span>
            </button>
          ))}
        </div>
      )}

      {primaryTabs.map((tab) => (
        <button
          key={tab.id}
          className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id as TabType)}
        >
          <span className="nav-icon">{tab.icon}</span>
          <span className="nav-label">{tab.label}</span>
          {tab.id === 'generators' && generatorsOwned > 0 && (
            <span className="nav-badge">{generatorsOwned}</span>
          )}
        </button>
      ))}

      <button
        className={`nav-item nav-more ${isMoreActive || moreOpen ? 'active' : ''}`}
        onClick={() => setMoreOpen((v) => !v)}
        aria-expanded={moreOpen}
      >
        <span className="nav-icon">{moreOpen ? '✕' : '☰'}</span>
        <span className="nav-label">Ещё</span>
        {isMoreActive && !moreOpen && <span className="nav-dot" />}
      </button>
    </nav>
  );
};

export default MobileNav;
