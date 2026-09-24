import React, { useEffect, useRef } from 'react';
import './MatrixBackground.css';

/**
 * Палитра «Матрицы» по мере прогресса (Этап 6: визуальная эволюция фона).
 * stage — текущий просмотренный этап (1–7): зелёный → циан (орбита) →
 * янтарный (Солнечная система) → фиолетовый (межзвёздная экспансия).
 */
const STAGE_COLORS: Record<number, string> = {
  1: '#0F0',
  2: '#0F0',
  3: '#0F0',
  4: '#00E5FF',
  5: '#00E5FF',
  6: '#FFB300',
  7: '#B388FF',
};

interface MatrixBackgroundProps {
  /** Текущий этап (viewChapter), влияет на цвет «дождя» (ТЗ Этап 6). */
  stage?: number;
}

const MatrixBackground: React.FC<MatrixBackgroundProps> = ({ stage = 1 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colorRef = useRef<string>(STAGE_COLORS[1]);

  useEffect(() => {
    colorRef.current = STAGE_COLORS[stage] ?? STAGE_COLORS[1];
  }, [stage]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Установка размеров canvas
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Символы для матрицы (катакана + латиница + цифры)
    const chars = 'アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン 0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const charArray = chars.split('');
    
    const fontSize = 14;
    const columns = Math.floor(canvas.width / fontSize);
    const drops: number[] = new Array(columns).fill(1);

    const draw = () => {
      // Полупрозрачный черный фон для эффекта шлейфа
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = colorRef.current; // Цвет «дождя» зависит от этапа (Этап 6)
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        // Случайный символ
        const text = charArray[Math.floor(Math.random() * charArray.length)];
        
        // Отрисовка символа
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        // Сброс капли наверх случайным образом после достижения низа экрана
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }

        // Увеличение координаты Y
        drops[i]++;
      }
    };

    // Анимация
    const interval = setInterval(draw, 33);

    // Очистка при размонтировании
    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return <canvas ref={canvasRef} className="matrix-canvas" />;
};

export default MatrixBackground;
