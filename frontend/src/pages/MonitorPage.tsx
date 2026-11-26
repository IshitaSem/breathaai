import React, { useState } from 'react';
import { Info, ShieldAlert, Activity } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AQICard } from '../components/common/AQICard';
import { PollutantGrid } from '../components/common/PollutantGrid';
import { TrendChart } from '../components/charts/TrendChart';
import { ComparisonChart } from '../components/charts/ComparisonChart';
import { StationMap } from '../components/charts/StationMap';
import { PhotoFrame } from '../components/common/PhotoFrame';
import { PHOTOS } from '../constants/photos';
import { POLLUTANT_DEFINITIONS, DEMO_LOCS } from '../constants/mockData';

export const MonitorPage: React.FC = () => {
  const { airData } = useApp();
  const [trendTab, setTrendTab] = useState<'Hourly' | 'Daily' | 'Compare'>('Hourly');

  const hourlyData = airData.hourly.map(h => ({
    label: h.hour,
    value: h.aqi,
  }));

  const dailyData = airData.daily.map(d => ({
    label: d.day,
    value: d.aqi,
  }));

  const compareData = Object.entries(DEMO_LOCS).map(([city, vals]) => ({
    label: city,
    value: city === airData.loc ? airData.aqi : vals.aqi,
  }));

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="row justify-between items-start">
        <div>
          <h1>Air Quality Monitor</h1>
          <div className="sub">
            Modelled atmospheric telemetry and CPCB-method AQI analysis for {airData.loc}
          </div>
        </div>
        <span className={`badge ${airData.isLive ? 'live' : 'demo'}`}>
          <Activity size={12} />
          {airData.isLive ? 'Live CAMS Model Feed' : 'Benchmark Demo'}
        </span>
      </div>

      {/* Model-Based Estimation Disclosure */}
      <div className="card bg-cream/70 border-sage/40 py-4 px-5 flex items-start gap-3">
        <Info size={18} className="text-forest flex-shrink-0 mt-0.5" />
        <div className="text-xs md:text-sm leading-relaxed text-ink">
          <strong className="font-semibold text-forest">Model-Based Estimates:</strong>{' '}
          Concentrations are sourced from{' '}
          <span className="font-medium">{airData.source}</span> and converted to Indian NAQI using
          CPCB breakpoint tables. Where physical ground-station sensors are unavailable, these
          values represent regional atmospheric dispersion estimates.
        </div>
      </div>

      {/* Main AQI and Trends */}
      <div className="grid big">
        <AQICard data={airData} />

        <div className="card">
          <div className="row justify-between items-center mb-3">
            <div>
              <h2 className="m-0">Atmospheric Trends</h2>
              <span className="sub text-xs">Explore diurnal, weekly, and regional patterns</span>
            </div>
            <div className="tabs">
              {(['Hourly', 'Daily', 'Compare'] as const).map(tab => (
                <button
                  key={tab}
                  type="button"
                  className={trendTab === tab ? 'on' : ''}
                  onClick={() => setTrendTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {trendTab === 'Hourly' && (
            <div>
              <TrendChart data={hourlyData} color="var(--g)" unit="AQI" />
              <div className="sub text-xs mt-2">
                24-hour diurnal curve showing early morning and evening thermal inversions.
              </div>
            </div>
          )}

          {trendTab === 'Daily' && (
            <div>
              <TrendChart data={dailyData} color="var(--sky)" unit="AQI" />
              <div className="sub text-xs mt-2">
                7-day synoptic forecast model based on meteorological wind vectors.
              </div>
            </div>
          )}

          {trendTab === 'Compare' && (
            <div>
              <ComparisonChart data={compareData} color="var(--g)" unit="AQI" />
              <div className="sub text-xs mt-2">
                Comparative urban baseline across major monitored metro regions.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pollutant Breakdown */}
      <div>
        <h2 className="mb-3">Pollutant Breakdown</h2>
        <PollutantGrid data={airData} />
      </div>

      {/* Stations and Definitions */}
      <div className="grid g2">
        <StationMap stations={airData.stations} />

        <div className="card">
          <h2>What the Pollutants Mean</h2>
          <div className="divide-y divide-line/70">
            {POLLUTANT_DEFINITIONS.map(p => (
              <div key={p.key} className="py-3">
                <div className="flex justify-between items-center">
                  <b className="font-display text-sm text-ink">
                    {p.name} ({p.formula})
                  </b>
                  <span className="text-xs text-mute font-medium bg-cream px-2 py-0.5 rounded-full">
                    Safe: ≤ {p.referenceLevel} {p.unit}
                  </span>
                </div>
                <div className="sub text-xs mt-1 leading-relaxed">{p.description}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Editorial Pollution Awareness & Health Guidance Split Card */}
      <div className="rounded-3xl overflow-hidden bg-card border border-line shadow-subtle grid grid-cols-1 md:grid-cols-5">
        <PhotoFrame
          photo={PHOTOS.smogSkyline}
          className="md:col-span-2 min-h-[210px]"
          overlayClassName="bg-gradient-to-t from-[#26332E]/70 via-transparent to-transparent"
        >
          <div className="absolute bottom-4 left-4 right-4 z-10 text-[#F8F7F2]">
            <span className="badge terra text-[11px] bg-[#C98268] text-white">
              Pollution Awareness
            </span>
            <p className="text-xs mt-1.5 text-white/90">
              Urban haze traps fine PM₂.₅ near street level during calm winter mornings.
            </p>
          </div>
        </PhotoFrame>

        <div className="md:col-span-3 p-6 md:p-8 flex flex-col justify-center">
          <div className="flex items-center gap-2.5 mb-2">
            <ShieldAlert size={18} className="text-terracotta" />
            <h2 className="m-0">Health Guidance</h2>
            <span
              className="badge"
              style={{ backgroundColor: airData.category.color, color: '#ffffff' }}
            >
              {airData.category.name}
            </span>
          </div>
          <p className="leading-relaxed text-sm md:text-[15px] text-ink mb-3">
            {airData.category.advice}
          </p>
          <p className="sub text-xs leading-relaxed">
            General environmental health advisory. Individuals with pre-existing cardiopulmonary
            disorders, pregnant individuals, or severe respiratory conditions should consult
            qualified physicians for tailored medical guidance.
          </p>
        </div>
      </div>
    </div>
  );
};
