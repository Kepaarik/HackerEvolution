import { GameState } from '../../types'
import { GENERATORS, CHAPTER_NAMES } from '../../gameData'
import { GeneratorItem } from '../GeneratorItem'
import './GeneratorList.css'

interface GeneratorListProps {
  state: GameState
  buyGenerator: (genId: string, amount?: number) => void
  getGenCost: (genId: string, amount?: number) => number
}

/**
 * Список генераторов, сгруппированных по главам (ТЗ разделы 7-10)
 */
export function GeneratorList({ state, buyGenerator, getGenCost }: GeneratorListProps) {
  // Определяем максимальную доступную главу
  const maxUnlockedChapter = state.currentChapter

  // Группируем генераторы по главам
  const chapters = [1, 2, 3, 4]
    .map((chapterNum) => {
      const generators = GENERATORS.filter((gen) => gen.chapter === chapterNum)
      return {
        chapterNum,
        name: CHAPTER_NAMES[chapterNum - 1] || `Глава ${chapterNum}`,
        generators,
        isUnlocked: chapterNum <= maxUnlockedChapter,
      }
    })
    .filter((ch) => ch.generators.length > 0)

  return (
    <div className="generator-list">
      {chapters.map((chapter) => (
        <div key={chapter.chapterNum} className="chapter-section">
          {/* Заголовок главы */}
          <div className={`chapter-header ${!chapter.isUnlocked ? 'locked' : ''}`}>
            <div className="chapter-header-info">
              <span className="chapter-number">Глава {chapter.chapterNum}</span>
              <h3 className="chapter-title">{chapter.name}</h3>
            </div>
            {!chapter.isUnlocked && (
              <span className="chapter-lock-badge">🔒 Заблокировано</span>
            )}
          </div>

          {/* Генераторы главы */}
          {chapter.isUnlocked ? (
            <div className="chapter-generators">
              {chapter.generators.map((gen) => {
                const owned = state.generators[gen.id] || 0
                const isUnlocked =
                  gen.unlockAtTotalEarned === 0 ||
                  state.totalEarned >= gen.unlockAtTotalEarned

                // Показываем генератор, если он разблокирован или почти разблокирован (50% цены)
                const isVisible = isUnlocked || state.totalEarned >= gen.baseCost * 0.5

                if (!isVisible) return null

                return (
                  <GeneratorItem
                    key={gen.id}
                    generator={gen}
                    owned={owned}
                    cost={getGenCost(gen.id)}
                    money={state.money}
                    isUnlocked={isUnlocked}
                    onBuy={() => buyGenerator(gen.id)}
                  />
                )
              })}
            </div>
          ) : (
            <div className="chapter-locked-message">
              <p>
                {chapter.chapterNum === 2 &&
                  'Совершите первый престиж и купите технологию «Орбитальные протоколы»'}
                {chapter.chapterNum === 3 &&
                  'Совершите 3 престижа, соберите 30 Данных и 20 Фрагментов'}
                {chapter.chapterNum === 4 &&
                  'Совершите 6 престижей, соберите 60 Данных и 60 Фрагментов'}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
