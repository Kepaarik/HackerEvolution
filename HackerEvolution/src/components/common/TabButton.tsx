import React from 'react';


interface TabButtonProps {
  isActive: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

export const TabButton: React.FC<TabButtonProps> = ({
  isActive,
  onClick,
  children,
}) => {
  return (
    <button className={isActive ? 'active' : ''} onClick={onClick}>
      {children}
    </button>
  );
};
