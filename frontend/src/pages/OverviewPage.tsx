import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bot,
  Wind,
  ListTodo,
  House,
  Sparkles,
  MapPin,
  Clock,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AQICard } from '../components/common/AQICard';
import { PollutantGrid } from '../components/common/PollutantGrid';
import { TrendChart } from '../components/charts/TrendChart';
import { PhotoFrame } from '../components/common/PhotoFrame';
import { PHOTOS } from '../constants/photos';

export const OverviewPage: React.FC = () => {
  const {
    state,
    airData,
    completedTasksCount,
    totalKgCo2eAvoided,
  } = useApp();
  const navigate = useNavigate();

  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12
      ? 'Good morning'
      : currentHour < 17
      ? 'Good afternoon'
      : 'Good evening';

  const formattedDate = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const chartData = airData.hourly.map(h => ({
    label: h.hour,
    value: h.aqi,
  }));

  const recommendations = [
    {
      category: 'Outdoor',
      text:
        airData.aqi > 200
          ? 'Best window is early afternoon (12–3 PM); avoid dawn and evening traffic.'
          : 'Good outdoor conditions. Regular morning exercise is safe for all groups.',
    },
    {
      category: 'Commute',
      text: 'Prefer metro, bus or carpool; keep vehicle ventilation set to recirculate.',
    },
    {
      category: 'Indoor',
      text:
        airData.aqi > 150
          ? 'Keep windows shut during rush hours; run HEPA air purifier in bedroom.'
          : 'Brief natural ventilation is safe during late morning.',
    },
    {
      category: 'Family',
      text: `Household plan for ${state.fam} members: ${
        state.sens && state.sens !== 'None'
          ? `Special precaution for ${state.sens.toLowerCase()}.`
          : 'Standard clean-air precautions apply.'
      }`,
    },
  ];

  const quickCards = [
    {
      title: 'Air Quality Monitor',
      subtitle: 'Live pollutants & 7-day trends',
      path: '/monitor',
      icon: Wind,
      photo: PHOTOS.mistyHills,
    },
    {
      title: 'AI Air Assistant',
      subtitle: 'Ask tailored wellness questions',
      path: '/assistant',
      icon: Bot,
      photo: PHOTOS.morningForest,
    },
    {
      title: 'Daily Action Planner',
      subtitle: 'Low-emission routine windows',
      path: '/planner',
      icon: ListTodo,
      photo: PHOTOS.sunlitTrail,
    },
    {
      title: 'Indoor Air Care',
      subtitle: 'Plants, purifiers & ventilation',
      path: '/indoor',
      icon: House,
      photo: PHOTOS.livingRoomPlants,
    },
  ];

  const totalTasks = 10;
  const progressPercent = Math.min(100, Math.round((completedTasksCount / totalTasks) * 100));

  return (
    <div className="space-y-7">
      {/* Editorial Nature Hero Banner */}
      <PhotoFrame
        photo={PHOTOS.heroCanopy}
        className="rounded-3xl min-h-[220px] md:min-h-[250px] shadow-editorial border border-line/60"
        overlayClassName="bg-gradient-to-r from-[#173F35]/90 via-[#173F35]/70 to-[#173F35]/35"
      >
        <div className="relative z-10 p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 h-full min-h-[220px] md:min-h-[250px]">
          <div className="max-w-xl text-[#F8F7F2] space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-medium text-[#E5EFE7] border border-white/15">
              <MapPin size={12} />
              <span>{airData.loc}</span>
              <span>·</span>
              <span>{formattedDate}</span>
            </div>

            <h1 className="text-3xl md:text-4xl font-display font-bold text-[#F8F7F2] tracking-tight leading-tight">
              Breathe better. Live lighter.
            </h1>

            <p className="text-sm md:text-base text-[#E5EFE7]/90 leading-relaxed max-w-lg">
              {greeting}, <span className="font-semibold text-white">{state.name || 'Friend'}</span>.{' '}
              Welcome to Aireolifye — your intelligent urban air quality companion. Air in{' '}
              {airData.loc} is currently{' '}
              <span className="font-semibold text-white underline decoration-[#A9BFA8] underline-offset-4">
                {airData.category.name.toLowerCase()}
              </span>
              . {airData.category.advice}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-[#E5EFE7]/85">
              <span className="inline-flex items-center gap-1.5">
                <Clock size={13} />
                Last updated {airData.lastUpdated}
              </span>
              <span>·</span>
              <span>{airData.isLive ? 'Live Open-Meteo CAMS Feed' : 'Benchmark Baseline'}</span>
            </div>
          </div>

          {/* Floating Hero AQI Pill */}
          <div className="bg-[#F8F7F2]/95 dark:bg-[#162621]/95 backdrop-blur-md rounded-2xl p-5 min-w-[210px] shadow-elevated border border-white/40 text-ink self-stretch md:self-auto flex flex-col justify-between">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-mute">
                Current NAQI
              </span>
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: airData.category.color }}
              />
            </div>
            <div className="flex items-baseline gap-2.5 my-2">
              <span
                className="font-display text-5xl font-bold tabular-nums leading-none"
                style={{ color: airData.category.color }}
              >
                {airData.aqi}
              </span>
              <span
                className="badge text-xs"
                style={{ backgroundColor: airData.category.color, color: '#ffffff' }}
              >
                {airData.category.name}
              </span>
            </div>
            <div className="text-xs text-mute">
              Primary driver: <strong className="text-ink">{airData.dominantPollutant || 'PM2.5'}</strong>
            </div>
          </div>
        </div>
      </PhotoFrame>

      {/* AI Air Intelligence Summary */}
      <div className="card bg-forest-mint/60 border-sage/40">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-forest mb-1.5">
          <Sparkles size={15} strokeWidth={2.2} />
          <span>AI Air Intelligence Summary</span>
        </div>
        <p className="m-0 text-sm md:text-[15px] leading-relaxed text-ink">
          Air in <b>{airData.loc}</b> is categorized as{' '}
          <strong style={{ color: airData.category.color }}>
            {airData.category.name.toLowerCase()}
          </strong>{' '}
          (AQI {airData.aqi}), driven primarily by fine particulate {airData.dominantPollutant || 'PM2.5'}.{' '}
          {airData.category.advice}{' '}
          {state.sens && state.sens !== 'None' ? (
            <span className="font-semibold text-forest">
              Extra precautions active for: {state.sens.toLowerCase()}.
            </span>
          ) : null}
        </p>
      </div>

      {/* Quick-Access Visual Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="m-0">Explore Your Wellness Toolkit</h2>
          <span className="text-xs text-mute">Curated daily modules</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickCards.map(card => {
            const Icon = card.icon;
            return (
              <button
                key={card.path}
                type="button"
                onClick={() => navigate(card.path)}
                className="group text-left rounded-2xl overflow-hidden bg-card border border-line shadow-subtle hover:shadow-editorial hover:border-sage transition-all flex flex-col"
              >
                <PhotoFrame
                  photo={card.photo}
                  className="h-32 w-full"
                  imgClassName="group-hover:scale-105"
                  overlayClassName="bg-gradient-to-t from-[#173F35]/60 via-transparent to-transparent"
                >
                  <div className="absolute top-3 left-3 w-8 h-8 rounded-xl bg-[#F8F7F2]/90 text-[#173F35] grid place-items-center shadow-sm">
                    <Icon size={16} strokeWidth={2} />
                  </div>
                </PhotoFrame>
                <div className="p-4 flex items-center justify-between gap-2 w-full">
                  <div>
                    <h3 className="text-sm font-display font-semibold text-ink group-hover:text-forest transition-colors">
                      {card.title}
                    </h3>
                    <p className="text-xs text-mute mt-0.5">{card.subtitle}</p>
                  </div>
                  <ArrowUpRight
                    size={16}
                    className="text-mute group-hover:text-forest group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all flex-shrink-0"
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Primary AQI Card and 24-hr Trend */}
      <div className="grid big">
        <AQICard data={airData} />

        <div className="card">
          <div className="flex justify-between items-center mb-2">
            <div>
              <h2 className="m-0">24-Hour Air Quality Trend</h2>
              <span className="sub text-xs">Diurnal particulate curve · Updated hourly</span>
            </div>
            <span className="badge demo text-xs">NAQI Scale</span>
          </div>
          <TrendChart data={chartData} color="var(--g)" unit="AQI" />
        </div>
      </div>

      {/* Pollutants Breakdown */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="m-0">Key Atmospheric Pollutants</h2>
          <button
            type="button"
            onClick={() => navigate('/monitor')}
            className="text-xs font-semibold text-forest hover:underline"
          >
            Full monitor breakdown →
          </button>
        </div>
        <PollutantGrid data={airData} />
      </div>

      {/* Today's Recommended Actions & Environmental Progress */}
      <div className="grid g2">
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <h2 className="m-0">Today’s Recommended Actions</h2>
            <ShieldCheck size={18} className="text-forest" />
          </div>
          <div className="divide-y divide-line/70">
            {recommendations.map((r, i) => (
              <div key={i} className="chk">
                <span className="badge flex-shrink-0">{r.category}</span>
                <span className="text-sm leading-relaxed">{r.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card flex flex-col justify-between bg-cream/60">
          <div>
            <h2>Your Environmental Impact</h2>
            <div className="row mt-4 gap-8">
              <div className="pol">
                <b className="text-3xl text-forest tabular-nums">
                  {completedTasksCount} / {totalTasks}
                </b>
                <span>actions done today</span>
              </div>
              <div className="pol">
                <b className="text-3xl text-forest tabular-nums">
                  {totalKgCo2eAvoided.toFixed(1)} kg
                </b>
                <span>CO₂e avoided (est.)</span>
              </div>
            </div>

            <div className="bar mt-5">
              <i style={{ width: `${progressPercent}%` }} />
            </div>

            <div className="mt-4">
              <button
                type="button"
                className="btn o text-xs py-2 px-3.5"
                onClick={() => navigate('/planner')}
              >
                Open Daily Planner
              </button>
            </div>
          </div>

          <p className="sub text-xs mt-5 pt-3 border-t border-line/70">
            Transparent estimates based on verified emissions factors, not measured localized air filtration.
          </p>
        </div>
      </div>
    </div>
  );
};
