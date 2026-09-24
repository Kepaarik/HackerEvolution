import React from 'react';


interface ButtonProps {
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  onClick,
  disabled = false,
  className = '',
  children,
}) => {
  return (
    <button
      className={`buy-btn ${disabled ? 'disabled' : 'active'} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};
