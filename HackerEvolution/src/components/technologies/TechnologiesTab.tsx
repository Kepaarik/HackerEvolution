import React from 'react';
import type { GameState } from '../../types';
import { TECHNOLOGIES, SPACE_STAGES, ALL_STAGE_NAMES, GENERATORS } from '../../gameData';
import { canBuyTechnology, hasTechnology } from '../../economy/TechnologyService';
import { getPassiveDataRatePerHour, hasTelemetry } from '../../economy/PassiveDataService';
import { PASSIVE_DATA_DAILY_CAP, TOTAL_FRAGMENTS } from '../../core/Constants';
import './TechnologiesTab.css';

interface TechnologiesTabProps {
  state: GameState;
  buyTechnology: (techId: string) => void;
}

/**
 * Вкладка «Технологии» (Этап 6, ТЗ 8–10): разблокировки космических этапов
 * за Данные 📊 и Фрагменты исходного кода 🧩 + индикатор пассивной добычи Данных.
 */
export const TechnologiesTab: React.FC<TechnologiesTabProps> = ({ state, buyTechnology }) => {
  const passiveRate = getPassiveDataRatePerHour(state);
  const telemetryBought = hasTelemetry(state);
  const fragments = state.fragments ?? 0;

  return (
    <div className="list-container technologies-tab">
      {/* Пассивная добыча Данных (ТЗ 8) */}
      <div className={`passive-data-card ${telemetryBought ? 'active' : 'inactive'}`}>
        <h4>📡 Сбор телеметрии</h4>
        {telemetryBought ? (
          <p>
            {passiveRate > 0
              ? `Пассивно: +${passiveRate} 📊/час · сегодня ${state.passiveData?.todayEarned ?? 0}/${PASSIVE_DATA_DAILY_CAP} 📊`
              : `Активно, но нужно ≥25 генераторов этапа «Орбита» для +1 📊/час`}
          </p>
        ) : (
          <p>Купите апгрейд «Сбор телеметрии» во вкладке «Улучшения», чтобы открыть пассивную добычу Данных.</p>
        )}
      </div>

      {/* Счётчик фрагментов (ТЗ 4.4) */}
      <div className="fragments-summary">
        <span className="fragments-count">🧩 {fragments} / {TOTAL_FRAGMENTS}</span>
        <span className="fragments-hint">Фрагменты исходного кода — награда за достижения и прогресс этапов</span>
      </div>

      {TECHNOLOGIES.map((tech) => {
        const owned = hasTechnology(state, tech.id);
        const affordable = canBuyTechnology(state, tech.id);
        const stage = SPACE_STAGES.find((s) => s.chapter === tech.unlocksChapter);
        const starter = stage ? GENERATORS.find((g) => g.id === stage.starterGeneratorId) : null;

        return (
          <div key={tech.id} className={`technology-item ${owned ? 'owned' : ''}`}>
            <div className="tech-info">
              <h3>{tech.name}{stage ? ` → ${ALL_STAGE_NAMES[stage.chapter]}` : ''}</h3>
              <p className="tech-flavor">{tech.description}</p>
              {starter && !owned && (
                <p className="tech-bonus">При покупке вы получаете 1 × «{starter.name}» бесплатно</p>
              )}
              {!owned && (
                <ul className="tech-reqs">
                  <li className={(state.data ?? 0) >= tech.dataCost ? 'met' : 'unmet'}>
                    📊 {tech.dataCost} Данных
                  </li>
                  {tech.fragmentCost > 0 && (
                    <li className={fragments >= tech.fragmentCost ? 'met' : 'unmet'}>
                      🧩 {tech.fragmentCost} Фрагментов
                    </li>
                  )}
                  <li className={(state.prestigeCount ?? 0) >= tech.requiredPrestiges ? 'met' : 'unmet'}>
                    ⟳ Престижей: {tech.requiredPrestiges} (сейчас {state.prestigeCount ?? 0})
                  </li>
                </ul>
              )}
            </div>
            {owned ? (
              <span className="tech-owned-badge">✅ Открыто навсегда</span>
            ) : (
              <button
                className={`buy-btn tech-buy ${affordable ? 'active' : 'disabled'}`}
                disabled={!affordable}
                onClick={() => buyTechnology(tech.id)}
              >
                Изучить технологию
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default TechnologiesTab;
