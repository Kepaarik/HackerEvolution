import { GameState } from '../../types'
import { GENERATORS, CHAPTER_NAMES } from '../../gameData'
import { GeneratorItem } from '../GeneratorItem'
import './GeneratorList.css'

interface GeneratorListProps {
  state: GameState
  buyGenerator: (genId: string, amount?: any) => void
  getGenCost: (genId: string, amount?: any) => any
}

/**
 * Список генераторов текущей просматриваемой главы.
 * Табы глав переключаются в TabContent, здесь — только контент.
 */
export function GeneratorList({ state, buyGenerator, getGenCost }: GeneratorListProps) {
  const viewChapter = state.viewChapter ?? state.currentChapter
  const generators = GENERATORS.filter((gen) => gen.chapter === viewChapter)
  const isUnlockedChapter = viewChapter <= state.currentChapter

  if (generators.length === 0 || !isUnlockedChapter) {
    return (
      <div className="generator-list">
        <div className="chapter-locked-message">
          <p>
            {viewChapter === 2 &&
              'Совершите первый престиж и купите технологию «Орбитальные протоколы»'}
            {viewChapter === 3 &&
              'Совершите 3 престижа, соберите 30 Данных и 20 Фрагментов'}
            {viewChapter === 4 &&
              'Совершите 6 престижей, соберите 60 Данных и 60 Фрагментов'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="generator-list">
      <div className="chapter-section">
        <div className="chapter-header">
          <div className="chapter-header-info">
            <span className="chapter-number">Глава {viewChapter}</span>
            <h3 className="chapter-title">
              {CHAPTER_NAMES[viewChapter - 1] || `Глава ${viewChapter}`}
            </h3>
          </div>
        </div>

        <div className="chapter-generators">
          {generators.map((gen) => {
            const owned = state.generators[gen.id] || 0
            const isUnlocked =
              gen.unlockAtTotalEarned === 0 ||
              state.totalEarned >= gen.unlockAtTotalEarned

            // Показываем генератор, если он разблокирован или почти разблокирован (50% цены)
            const isVisible = isUnlocked || state.totalEarned >= gen.baseCost * 0.5

            if (!isVisible) return null

            // getGenCost возвращает { count, cost } в реальном useGameLogic
            const costResult = getGenCost(gen.id, 1)
            const cost = typeof costResult === 'object' ? costResult.cost : costResult

            return (
              <GeneratorItem
                key={gen.id}
                generator={gen}
                owned={owned}
                cost={cost}
                money={state.money}
                isUnlocked={isUnlocked}
                onBuy={() => buyGenerator(gen.id, 1)}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
