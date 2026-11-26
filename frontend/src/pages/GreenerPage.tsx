import React, { useState } from 'react';
import { Leaf, PlusCircle, Check, Sparkles } from 'lucide-react';
import { GREENER_CHOICES } from '../constants/mockData';
import { useApp } from '../context/AppContext';
import { PhotoFrame } from '../components/common/PhotoFrame';
import { PHOTOS, CuratedPhoto } from '../constants/photos';

const CHOICE_PHOTOS: Record<string, CuratedPhoto> = {
  'Metro / bus': PHOTOS.publicTransit,
  'Walk or cycle': PHOTOS.cyclingCity,
  Carpool: PHOTOS.activeCycling,
  'Energy-efficient appliances': PHOTOS.livingRoomPlants,
  'Cleaner cooking': PHOTOS.modernKitchen,
  'Sustainable habits': PHOTOS.ecoHabits,
};

export const GreenerPage: React.FC = () => {
  const { showToast } = useApp();
  const [filter, setFilter] = useState<'All' | 'Transport' | 'Home'>('All');
  const [addedGoals, setAddedGoals] = useState<Record<string, boolean>>({});

  const filteredChoices = GREENER_CHOICES.filter(
    item => filter === 'All' || item.category === filter
  );

  const handleAddGoal = (title: string) => {
    setAddedGoals(prev => ({ ...prev, [title]: true }));
    showToast(`Added "${title}" to your personal sustainability goals`);
  };

  return (
    <div className="space-y-7">
      {/* Editorial Inspiration Banner */}
      <PhotoFrame
        photo={PHOTOS.outdoorLake}
        className="rounded-3xl min-h-[190px] border border-line shadow-subtle"
        overlayClassName="bg-gradient-to-r from-[#173F35]/88 via-[#173F35]/65 to-[#173F35]/25"
      >
        <div className="relative z-10 p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 min-h-[190px]">
          <div className="max-w-xl text-[#F8F7F2]">
            <span className="badge bg-white/20 backdrop-blur-md text-white border border-white/20 mb-2">
              <Sparkles size={11} />
              Sustainable Living
            </span>
            <h1 className="text-white m-0">Explore Greener Choices</h1>
            <p className="text-sm text-[#E5EFE7]/90 mt-1.5 mb-0 leading-relaxed">
              Every low-emission commute and cleaner household habit contributes to clearer urban
              skies and measurable carbon savings.
            </p>
          </div>

          <span className="badge bg-[#F8F7F2] text-[#173F35]">
            <Leaf size={12} />
            Climate Actions
          </span>
        </div>
      </PhotoFrame>

      {/* Category Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="tabs">
          {(['All', 'Transport', 'Home'] as const).map(tab => (
            <button
              key={tab}
              type="button"
              className={filter === tab ? 'on' : ''}
              onClick={() => setFilter(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
        <span className="text-xs text-mute">
          Showing {filteredChoices.length} practical eco-actions
        </span>
      </div>

      {/* Photographic Choices Grid */}
      <div className="grid g3">
        {filteredChoices.map((choice, idx) => {
          const isAdded = Boolean(addedGoals[choice.title]);
          const photo = CHOICE_PHOTOS[choice.title] || PHOTOS.sunlitTrail;

          return (
            <div
              key={idx}
              className="rounded-2xl overflow-hidden bg-card border border-line shadow-subtle hover:shadow-editorial transition-all flex flex-col justify-between"
            >
              <div>
                <PhotoFrame
                  photo={photo}
                  className="h-44 w-full"
                  overlayClassName="bg-gradient-to-t from-[#173F35]/70 via-transparent to-transparent"
                >
                  <div className="absolute top-3 left-3 z-10">
                    <span className="badge bg-white/90 text-[#173F35] text-[11px]">
                      {choice.category}
                    </span>
                  </div>
                </PhotoFrame>

                <div className="p-5">
                  <h2 className="m-0 text-lg font-display">{choice.title}</h2>
                  <p className="sub text-xs mt-1.5 leading-relaxed">{choice.description}</p>

                  <div className="mt-4 p-3 rounded-xl bg-forest-mint/70 border border-sage/30">
                    <p className="text-xs font-medium text-forest leading-snug m-0">
                      <b>Estimated Benefit:</b> {choice.benefit}
                    </p>
                  </div>

                  <p className="sub text-xs mt-3 mb-0 leading-relaxed">
                    <b>Action Tip:</b> {choice.tip}
                  </p>
                </div>
              </div>

              <div className="px-5 pb-5 pt-3 border-t border-line/60">
                <button
                  type="button"
                  className={`btn w-full ${isAdded ? 'o' : ''}`}
                  onClick={() => handleAddGoal(choice.title)}
                >
                  {isAdded ? (
                    <>
                      <Check size={16} />
                      Goal Active
                    </>
                  ) : (
                    <>
                      <PlusCircle size={16} />
                      Add to My Goals
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card bg-cream/60 text-xs text-mute leading-relaxed">
        <strong>Transparency Note:</strong> Emission abatement values represent verified lifestyle
        benchmarks (IPCC and Bureau of Energy Efficiency standard factors) and distinguish
        estimated carbon reductions from local real-time air quality measurements.
      </div>
    </div>
  );
};
