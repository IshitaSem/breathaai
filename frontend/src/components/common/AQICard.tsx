import React from 'react';
import { Activity, Clock } from 'lucide-react';
import { AirQualityData } from '../../types';

interface AQICardProps {
  data: AirQualityData;
  className?: string;
}

export const AQICard: React.FC<AQICardProps> = ({ data, className = '' }) => {
  const { aqi, usAqi, category, loc, lastUpdated, isLive, source, indexStandard, dominantPollutant } = data;
  const percent = Math.min(100, Math.round((aqi / 500) * 100));

  return (
    <div className={`card flex flex-col justify-between ${className}`}>
      <div>
        <div className="flex justify-between items-start gap-2">
          <div className="text-xs font-medium text-mute">
            {indexStandard} · <span className="text-ink font-semibold">{loc}</span>
          </div>
          <span className={`badge flex-shrink-0 ${isLive ? 'live' : 'demo'}`}>
            <Activity size={11} />
            {isLive ? 'Live Telemetry' : 'Benchmark Demo'}
          </span>
        </div>

        <div className="flex items-baseline gap-4 mt-4">
          <div className="aqi tabular-nums" style={{ color: category.color }}>
            {aqi}
          </div>
          <div className="space-y-1">
            <span
              className="badge text-xs"
              style={{ backgroundColor: category.color, color: '#ffffff' }}
            >
              {category.name}
            </span>
            <div className="text-xs text-mute">
              Health risk: <strong className="text-ink">{category.healthRisk}</strong>
            </div>
          </div>
        </div>

        <div className="row mt-3 gap-2">
          {dominantPollutant && (
            <span className="badge text-[11px] bg-forest-mint text-forest">
              Primary Driver: {dominantPollutant}
            </span>
          )}
          {usAqi !== undefined && (
            <span className="badge demo text-[11px]">
              US EPA AQI: {usAqi}
            </span>
          )}
        </div>

        <p className="sub mt-3 text-sm leading-relaxed">{category.advice}</p>

        <div className="bar mt-4">
          <i
            style={{
              width: `${percent}%`,
              backgroundColor: category.color,
            }}
          />
        </div>
      </div>

      <div className="flex justify-between items-center text-xs text-mute mt-4 pt-3 border-t border-line/70">
        <span className="truncate max-w-[230px]" title={source}>
          {source}
        </span>
        <span className="inline-flex items-center gap-1 flex-shrink-0">
          <Clock size={11} />
          {lastUpdated}
        </span>
      </div>
    </div>
  );
};
