import { GeneratorData } from '../types'
import { formatNumber } from '../utils/NumberFormatter'
import './GeneratorItem.css'

interface GeneratorItemProps {
  generator: GeneratorData
  owned: number
  cost: number
  money: number
  isUnlocked: boolean
  onBuy: () => void
}

/**
 * Карточка одного генератора
 */
export function GeneratorItem({
  generator,
  owned,
  cost,
  money,
  isUnlocked,
  onBuy,
}: GeneratorItemProps) {
  const canAfford = money >= cost && isUnlocked
  const incomePerUnit = generator.baseIncome
  const totalIncome = incomePerUnit * owned

  return (
    <div className={`generator-item ${!isUnlocked ? 'generator-locked' : ''}`}>
      {/* Иконка и информация */}
      <div className="generator-info">
        <div className="generator-icon">{getGeneratorIcon(generator.id)}</div>
        <div className="generator-details">
          <div className="generator-name-row">
            <span className="generator-name">{generator.name}</span>
            <span className="generator-count">x{owned}</span>
          </div>
          <div className="generator-income">
            {owned > 0 ? (
              <>
                <span className="income-per-sec">
                  +{formatNumber(totalIncome, 'money')}/сек
                </span>
                <span className="income-per-unit">
                  ({formatNumber(incomePerUnit, 'money')}/шт)
                </span>
              </>
            ) : (
              <span className="income-per-unit">
                +{formatNumber(incomePerUnit, 'money')}/сек за штуку
              </span>
            )}
          </div>
          {generator.description && (
            <p className="generator-description">{generator.description}</p>
          )}
        </div>
      </div>

      {/* Кнопка покупки */}
      <button
        className={`generator-buy-btn ${canAfford ? 'affordable' : 'not-affordable'}`}
        onClick={onBuy}
        disabled={!canAfford}
      >
        <span className="buy-cost">💻 {formatNumber(cost, 'money')}</span>
        <span className="buy-label">Купить</span>
      </button>
    </div>
  )
}

/** Иконки генераторов по ID */
function getGeneratorIcon(id: string): string {
  const icons: Record<string, string> = {
    old_laptop: '💻',
    server_rack: '🖥️',
    cloud_node: '☁️',
    botnet: '🤖',
    quantum_sim: '⚛️',
    spy_satellite: '🛰️',
    orbital_station: '🛸',
    lunar_datacenter: '🌙',
    mars_farm: '🔴',
    asteroid_mining: '☄️',
    dyson_swarm: '☀️',
    von_neumann_probe: '🚀',
    exoplanet_colony: '🪐',
  }
  return icons[id] || '⚙️'
}
