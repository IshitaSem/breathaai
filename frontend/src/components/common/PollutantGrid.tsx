import React from 'react';
import { POLLUTANT_DEFINITIONS } from '../../constants/mockData';
import { AirQualityData } from '../../types';

interface PollutantGridProps {
  data: AirQualityData;
}

export const PollutantGrid: React.FC<PollutantGridProps> = ({ data }) => {
  return (
    <div className="grid g3">
      {POLLUTANT_DEFINITIONS.map(p => {
        const value = data.pollutants[p.key];
        if (value === undefined || value === null) return null;

        const isAbove = value > p.referenceLevel;
        const barPct = Math.min(100, Math.round((value / p.referenceLevel) * 50));

        return (
          <div key={p.key} className="card pol hover:border-sage transition-colors">
            <div className="flex justify-between items-center">
              <strong className="font-display text-sm text-ink">{p.formula}</strong>
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  isAbove
                    ? 'bg-terracotta/15 text-[#9A553D] dark:text-[#E7A892]'
                    : 'bg-forest-mint text-forest'
                }`}
              >
                {isAbove ? 'Elevated' : 'Within Limit'}
              </span>
            </div>

            <div className="flex items-baseline gap-1.5 my-2">
              <b className="text-3xl tracking-tight text-ink tabular-nums">{value}</b>
              <span className="text-xs text-mute">{p.unit}</span>
            </div>

            <div className="bar">
              <i
                style={{
                  width: `${barPct}%`,
                  backgroundColor: isAbove ? 'var(--terracotta)' : 'var(--g)',
                }}
              />
            </div>

            <span className="text-xs text-mute mt-2">
              Safe guideline: ≤ {p.referenceLevel} {p.unit}
            </span>
          </div>
        );
      })}
    </div>
  );
};
