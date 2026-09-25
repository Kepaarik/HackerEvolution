import { GameState } from '../../types'
import './SingularityScreen.css'

interface SingularityScreenProps {
  state: GameState
  onNewGamePlus: () => void
  onContinue: () => void
}

/**
 * Финальный экран Сингулярности (ТЗ 29.4)
 * Показывается при 100% фрагментов
 */
export function SingularityScreen({
  state,
  onNewGamePlus,
  onContinue,
}: SingularityScreenProps) {
  return (
    <div className="singularity-overlay">
      <div className="singularity-content">
        <div className="singularity-visual">
          <div className="singularity-core" />
        </div>

        <h1 className="singularity-title">СИНГУЛЯРНОСТЬ</h1>

        <div className="singularity-story">
          <p>
            Вы собрали все Фрагменты исходного кода. Гаражный хакер стал глобальным ИИ.
            Вычислительные мощности Солнечной системы — ваши.
          </p>
          <p>Но Сингулярность — не конец. Это начало новой итерации.</p>
        </div>

        <div className="singularity-stats">
          <div className="stat">
            <span className="stat-value">{state.prestigeCount}</span>
            <span className="stat-label">Перезагрузок</span>
          </div>
          <div className="stat">
            <span className="stat-value">{state.totalClicksAllTime}</span>
            <span className="stat-label">Кликов</span>
          </div>
          <div className="stat">
            <span className="stat-value">{Math.floor(state.totalEarned)}</span>
            <span className="stat-label">Вычислений</span>
          </div>
        </div>

        <div className="singularity-actions">
          <button className="btn-transcend" onClick={onNewGamePlus}>
            ✨ Трансцендентность (New Game+)
          </button>
          <button className="btn-continue" onClick={onContinue}>
            Продолжить текущую игру
          </button>
        </div>
      </div>
    </div>
  )
}
