import React, { useState } from 'react';
import { Users, Trophy, Award, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ComparisonChart } from '../components/charts/ComparisonChart';
import { COMMUNITY_CHALLENGES } from '../constants/mockData';
import { PhotoFrame } from '../components/common/PhotoFrame';
import { PHOTOS, CuratedPhoto } from '../constants/photos';

const CHALLENGE_PHOTOS: Record<number, CuratedPhoto> = {
  0: PHOTOS.communityGarden,
  1: PHOTOS.cyclingCity,
  2: PHOTOS.urbanPark,
};

export const CommunityPage: React.FC = () => {
  const {
    state,
    completedTasksCount,
    totalKgCo2eAvoided,
    toggleChallengeJoined,
  } = useApp();

  const [timeframe, setTimeframe] = useState<'Weekly' | 'Monthly'>('Weekly');

  const weeklyData = [
    { label: 'Mon', value: 18 },
    { label: 'Tue', value: 24 },
    { label: 'Wed', value: 31 },
    { label: 'Thu', value: 27 },
    { label: 'Fri', value: 35 },
    { label: 'Sat', value: 42 },
    { label: 'Sun', value: 38 },
  ];

  const monthlyData = [
    { label: 'Wk 1', value: 96 },
    { label: 'Wk 2', value: 118 },
    { label: 'Wk 3', value: 140 },
    { label: 'Wk 4', value: 171 },
  ];

  const activeChartData = timeframe === 'Weekly' ? weeklyData : monthlyData;
  const totalBaseAvoided = activeChartData.reduce((acc, curr) => acc + curr.value, 0);
  const totalCommunityKg = Math.round(totalBaseAvoided + totalKgCo2eAvoided);
  const totalUserWeeklyActions = completedTasksCount + 21;

  return (
    <div className="space-y-7">
      {/* Community Hero Banner */}
      <PhotoFrame
        photo={PHOTOS.communityGarden}
        className="rounded-3xl min-h-[200px] border border-line shadow-subtle"
        overlayClassName="bg-gradient-to-r from-[#173F35]/90 via-[#173F35]/65 to-[#173F35]/25"
      >
        <div className="relative z-10 p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 min-h-[200px]">
          <div className="max-w-xl text-[#F8F7F2]">
            <span className="badge bg-white/20 backdrop-blur-md text-white border border-white/20 mb-2">
              <Sparkles size={11} />
              Collective Action
            </span>
            <h1 className="text-white m-0">Community Impact</h1>
            <p className="text-sm text-[#E5EFE7]/90 mt-1.5 mb-0 leading-relaxed">
              Neighbourhoods thrive when everyday choices add up—from smoke-free streets to
              car-free Fridays across {state.loc}.
            </p>
          </div>
          <span className="badge bg-[#F8F7F2] text-[#173F35]">
            <Users size={12} />
            Simulated Benchmark
          </span>
        </div>
      </PhotoFrame>

      {/* Aggregate Metrics Grid */}
      <div className="grid g3">
        <div className="card pol">
          <span className="flex items-center gap-1.5 text-xs font-medium text-mute">
            <Trophy size={14} className="text-forest" />
            Your Actions This Week
          </span>
          <b className="text-3xl text-forest mt-1.5 tabular-nums">{totalUserWeeklyActions}</b>
          <span className="text-xs text-mute mt-1">Across 7 tracked sustainable routines</span>
        </div>

        <div className="card pol">
          <span className="flex items-center gap-1.5 text-xs font-medium text-mute">
            <Users size={14} className="text-terracotta" />
            Community Participants
          </span>
          <b className="text-3xl mt-1.5 tabular-nums">1,284</b>
          <span className="text-xs text-mute mt-1">Active citizens across your city cluster</span>
        </div>

        <div className="card pol">
          <span className="flex items-center gap-1.5 text-xs font-medium text-mute">
            <Award size={14} className="text-forest" />
            Est. CO₂e Avoided
          </span>
          <b className="text-3xl text-forest mt-1.5 tabular-nums">
            {totalCommunityKg.toLocaleString()} kg
          </b>
          <span className="text-xs text-mute mt-1">Cumulative greenhouse gas mitigation</span>
        </div>
      </div>

      {/* Avoided Emissions Chart */}
      <div className="card">
        <div className="row justify-between items-center mb-3">
          <div>
            <h2 className="m-0">Collective Carbon Avoidance (kg CO₂e)</h2>
            <div className="sub text-xs mt-0.5">
              Calculated via activity benchmarks across active participants
            </div>
          </div>
          <div className="tabs">
            {(['Weekly', 'Monthly'] as const).map(tab => (
              <button
                key={tab}
                type="button"
                className={timeframe === tab ? 'on' : ''}
                onClick={() => setTimeframe(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <ComparisonChart data={activeChartData} color="var(--g)" unit="kg CO₂e" />
      </div>

      {/* Active Community Challenges */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="m-0">City Environmental Challenges</h2>
          <span className="text-xs text-mute">Join a local pledge</span>
        </div>
        <div className="grid g3">
          {COMMUNITY_CHALLENGES.map(challenge => {
            const isJoined = Boolean(state.joined[challenge.id]);
            const participantsCount = challenge.participants + (isJoined ? 1 : 0);
            const progressPercent = isJoined ? 68 : 48;
            const photo = CHALLENGE_PHOTOS[challenge.id] || PHOTOS.urbanPark;

            return (
              <div
                key={challenge.id}
                className="rounded-2xl overflow-hidden bg-card border border-line shadow-subtle flex flex-col justify-between"
              >
                <div>
                  <PhotoFrame
                    photo={photo}
                    className="h-36 w-full"
                    overlayClassName="bg-gradient-to-t from-[#173F35]/65 via-transparent to-transparent"
                  >
                    <div className="absolute bottom-3 left-3 z-10">
                      <span className="badge bg-white/90 text-[#173F35] text-[11px]">
                        {participantsCount} joined
                      </span>
                    </div>
                  </PhotoFrame>

                  <div className="p-5">
                    <h3 className="text-base font-display font-semibold m-0">{challenge.title}</h3>
                    <p className="sub text-xs mt-1.5 leading-relaxed">{challenge.description}</p>

                    <div className="bar mt-4">
                      <i style={{ width: `${progressPercent}%` }} />
                    </div>

                    <div className="sub text-xs mt-2 flex justify-between items-center">
                      <span>Community momentum</span>
                      <b>{progressPercent}%</b>
                    </div>
                  </div>
                </div>

                <div className="px-5 pb-5 pt-3 border-t border-line/60">
                  <button
                    type="button"
                    className={`btn w-full ${isJoined ? 'o' : ''}`}
                    onClick={() => toggleChallengeJoined(challenge.id)}
                  >
                    {isJoined ? 'Joined (Click to Leave)' : 'Join Challenge'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <p className="sub text-xs leading-relaxed">
        <strong>Data Integrity & Simulation Disclosure:</strong> Community figures represent an
        illustrative simulation model for Challenge tracking. They reflect demonstration participant
        engagement rather than physical census-level emissions measurements.
      </p>
    </div>
  );
};
