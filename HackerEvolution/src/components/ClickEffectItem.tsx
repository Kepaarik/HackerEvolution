import React from "react";


interface ClickEffectItemProps {
  x: number;
  y: number;
  value: string;
  onComplete: (id: number) => void;
  id: number;
  /** Критический клик (Этап 3) — крупный оранжевый текст. */
  crit?: boolean;
}

const ClickEffectItem: React.FC<ClickEffectItemProps> = ({
  x,
  y,
  value,
  onComplete,
  id,
  crit,
}) => {
  React.useEffect(() => {
    const timer = setTimeout(() => onComplete(id), 1000);
    return () => clearTimeout(timer);
  }, [id, onComplete]);

  // Генерируем случайное смещение для каждой всплывающей суммы
  // (стабильно в течение жизни эффекта — вычисляется один раз через useState-инициализатор)
  const [randomOffset] = React.useState(() => ({
    x: (Math.random() - 0.5) * 60, // Случайное смещение по X от -30 до 30px
    rotation: (Math.random() - 0.5) * 30, // Случайный угол поворота от -15 до 15 градусов
  }));

  return (
    <div 
      className="click-effect" 
      style={{ 
        left: `${x + randomOffset.x}px`, 
        top: `${y}px`,
        transform: `rotate(${randomOffset.rotation}deg)`
      }}
    >
      +{value}
    </div>
  );
};

export default ClickEffectItem;
