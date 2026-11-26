import React, { useState } from 'react';
import { RotateCcw, Clock, CheckCircle2, Sun } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PLANNER_TASKS } from '../constants/mockData';
import { PhotoFrame } from '../components/common/PhotoFrame';
import { PHOTOS } from '../constants/photos';

export const PlannerPage: React.FC = () => {
  const {
    airData,
    state,
    toggleTaskDone,
    resetDayTasks,
    completedTasksCount,
    totalKgCo2eAvoided,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'All' | 'Morning' | 'Afternoon' | 'Evening'>('All');

  const outdoorWindow =
    airData.aqi > 300
      ? '1:00 PM – 4:00 PM (keep trips brief with N95)'
      : airData.aqi > 200
      ? '12:00 PM – 4:00 PM (exercise indoors; moderate exposure)'
      : '10:00 AM – 5:00 PM (optimal air quality window)';

  const totalTasks = PLANNER_TASKS.length;
  const progressPercent = Math.min(100, Math.round((completedTasksCount / totalTasks) * 100));

  const filteredTasks = PLANNER_TASKS.filter(
    t => activeTab === 'All' || t.timeOfDay === activeTab
  );

  const routineCards = [
    {
      title: 'Morning Walk & Errands',
      time: airData.aqi > 200 ? 'Shift to 12–3 PM' : '7:00 AM – 9:30 AM',
      alternative: 'Prefer shaded park paths away from arterial roads.',
      photo: PHOTOS.sunlitTrail,
    },
    {
      title: 'Daily Commute',
      time: 'Peak Traffic Hours',
      alternative: 'Metro, bus, or carpool saves ≈ 1.8 kg CO₂e per 15 km.',
      photo: PHOTOS.cyclingCity,
    },
    {
      title: 'Workout & Movement',
      time: airData.aqi > 200 ? 'Indoor Yoga / Home' : 'Afternoon Window',
      alternative: 'Move high-intensity cardio indoors when AQI exceeds 200.',
      photo: PHOTOS.livingRoomPlants,
    },
    {
      title: 'Evening Park & Wind-Down',
      time: 'Before 6:30 PM',
      alternative: 'Run bedroom HEPA purifier 30 min before sleep.',
      photo: PHOTOS.urbanPark,
    },
  ];

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="row justify-between items-start">
        <div>
          <h1>Daily Action Planner</h1>
          <div className="sub">
            Pollution-aware daily routines, clean-air windows, and low-emission alternatives
          </div>
        </div>
        <span className="badge">
          <Clock size={12} />
          Diurnal Schedule
        </span>
      </div>

      {/* Visual Routine Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {routineCards.map((item, idx) => (
          <div
            key={idx}
            className="rounded-2xl overflow-hidden bg-card border border-line shadow-subtle flex flex-col"
          >
            <PhotoFrame
              photo={item.photo}
              className="h-36 w-full"
              overlayClassName="bg-gradient-to-t from-[#173F35]/75 via-[#173F35]/20 to-transparent"
            >
              <div className="absolute bottom-3 left-3 right-3 z-10">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/90 text-[#173F35] text-[11px] font-semibold">
                  <Sun size={10} />
                  {item.time}
                </span>
              </div>
            </PhotoFrame>
            <div className="p-4 flex-1 flex flex-col justify-between">
              <h3 className="text-sm font-display font-semibold text-ink">{item.title}</h3>
              <p className="text-xs text-mute mt-1 leading-relaxed">{item.alternative}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid g2">
        {/* Clean Air Window & Summary Card */}
        <div className="card flex flex-col justify-between bg-cream/60">
          <div>
            <h2>Clean Air Exposure Window</h2>
            <div className="font-display text-xl md:text-2xl font-bold text-forest mt-2">
              {outdoorWindow}
            </div>
            <p className="sub text-xs mt-2 leading-relaxed">
              Calculated based on today’s thermal inversion patterns in <b>{airData.loc}</b>.
              Morning and late evening hours concentrate surface particulates.
            </p>

            <h2 className="mt-6 mb-2">Daily Progress</h2>
            <div className="bar">
              <i style={{ width: `${progressPercent}%` }} />
            </div>

            <div className="flex justify-between items-center text-sm font-medium mt-3">
              <span>
                {completedTasksCount} of {totalTasks} actions completed
              </span>
              <span className="text-forest font-semibold tabular-nums">
                ≈ {totalKgCo2eAvoided.toFixed(1)} kg CO₂e avoided
              </span>
            </div>
          </div>

          <div className="pt-6 border-t border-line/70 mt-6 flex justify-between items-center gap-3">
            <span className="sub text-xs">
              Actions reset daily at midnight or via manual reset.
            </span>
            <button type="button" className="btn o" onClick={resetDayTasks}>
              <RotateCcw size={15} />
              Reset Day
            </button>
          </div>
        </div>

        {/* Interactive Checklist Card */}
        <div className="card">
          <div className="row justify-between items-center mb-3">
            <h2 className="m-0">Action Checklist</h2>
            <div className="tabs">
              {(['All', 'Morning', 'Afternoon', 'Evening'] as const).map(tab => (
                <button
                  key={tab}
                  type="button"
                  className={activeTab === tab ? 'on' : ''}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-line/70">
            {filteredTasks.map(task => {
              const isDone = Boolean(state.done[task.id]);
              return (
                <label
                  key={task.id}
                  className={`chk cursor-pointer ${isDone ? 'd opacity-70' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={isDone}
                    onChange={e => toggleTaskDone(task.id, e.target.checked)}
                  />
                  <div className="flex-1">
                    <span className="t text-sm font-medium leading-snug">{task.description}</span>
                    <div className="sub text-xs flex items-center gap-2 mt-1">
                      <span className="font-semibold text-forest">{task.timeOfDay}</span>
                      {task.co2eKg > 0 && <span>· ≈ {task.co2eKg} kg CO₂e saved</span>}
                    </div>
                  </div>
                  {isDone && (
                    <CheckCircle2 size={16} className="text-forest mt-0.5 flex-shrink-0" />
                  )}
                </label>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
