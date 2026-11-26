import React, { useState } from 'react';
import { Leaf, Wind, ShieldCheck, Home, Sparkles, Droplets, Flame } from 'lucide-react';
import { INDOOR_ADVICE } from '../constants/mockData';
import { PhotoFrame } from '../components/common/PhotoFrame';
import { PHOTOS } from '../constants/photos';

const ROOMS = Object.keys(INDOOR_ADVICE);

const PURIFIER_GUIDELINES = [
  'Choose a True HEPA (H13) filter rated for the room size (CADR ≥ 2/3 of room area).',
  'Operate the purifier continuously with doors and windows firmly shut.',
  'Place unit at least 1–2 feet away from walls and curtains for unrestricted 360° airflow.',
  'Vacuum pre-filters monthly and replace main HEPA elements per manufacturer guidelines.',
];

const CARE_PILLARS = [
  {
    title: 'Smart Natural Ventilation',
    badge: 'Ventilation',
    icon: Wind,
    photo: PHOTOS.cleanBedroom,
    advice:
      'Open windows for a brief 10–15 minute cross-breeze between 1 PM and 3 PM when ambient AQI dips, and seal them during morning and night inversions.',
  },
  {
    title: 'Damp Cleaning Protocol',
    badge: 'Dust Control',
    icon: Droplets,
    photo: PHOTOS.modernKitchen,
    advice:
      'Replace dry broom sweeping with damp mops and microfiber cloths so settled PM₁₀ and allergens are captured instead of re-suspended.',
  },
  {
    title: 'Indoor Greenery & Botanicals',
    badge: 'Plants',
    icon: Leaf,
    photo: PHOTOS.indoorPlantsShelf,
    advice:
      'Snake plants, peace lilies, and areca palms bring calm to living spaces. Pair them with mechanical HEPA filtration on high-pollution days.',
  },
  {
    title: 'Zero Indoor Combustion',
    badge: 'Source Control',
    icon: Flame,
    photo: PHOTOS.pottedFoliage,
    advice:
      'Always run kitchen exhaust fans while cooking and avoid incense, mosquito coils, or scented candles when outdoor AQI is elevated.',
  },
];

export const IndoorPage: React.FC = () => {
  const [selectedRoom, setSelectedRoom] = useState<string>('Kitchen');

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="row justify-between items-start">
        <div>
          <h1>Indoor Air Care</h1>
          <div className="sub">
            Calm, breathable home interiors with practical room-by-room environmental guidance
          </div>
        </div>
        <span className="badge">
          <Home size={12} />
          Household Sanctuary
        </span>
      </div>

      {/* Pinterest-Inspired Interior & Plant Photography Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <PhotoFrame
          photo={PHOTOS.livingRoomPlants}
          className="col-span-2 row-span-2 rounded-3xl min-h-[240px] md:min-h-[320px] border border-line"
          overlayClassName="bg-gradient-to-t from-[#173F35]/75 via-transparent to-transparent"
        >
          <div className="absolute bottom-4 left-4 right-4 z-10 text-[#F8F7F2]">
            <span className="badge bg-white/20 backdrop-blur-md text-white border border-white/20 text-[11px]">
              <Sparkles size={11} />
              Clean Living Space
            </span>
            <h2 className="text-white text-lg md:text-xl font-display mt-1.5 mb-0">
              Create a low-particulate sanctuary indoors
            </h2>
          </div>
        </PhotoFrame>

        <PhotoFrame
          photo={PHOTOS.indoorPlantsShelf}
          className="rounded-2xl h-36 md:h-[152px] border border-line"
          overlayClassName="bg-gradient-to-t from-[#173F35]/55 via-transparent to-transparent"
        >
          <span className="absolute bottom-2.5 left-3 z-10 text-xs font-semibold text-white">
            Botanical Corners
          </span>
        </PhotoFrame>

        <PhotoFrame
          photo={PHOTOS.cleanBedroom}
          className="rounded-2xl h-36 md:h-[152px] border border-line"
          overlayClassName="bg-gradient-to-t from-[#173F35]/55 via-transparent to-transparent"
        >
          <span className="absolute bottom-2.5 left-3 z-10 text-xs font-semibold text-white">
            Restful Bedroom Air
          </span>
        </PhotoFrame>

        <PhotoFrame
          photo={PHOTOS.pottedFoliage}
          className="rounded-2xl h-36 md:h-[152px] border border-line"
          overlayClassName="bg-gradient-to-t from-[#173F35]/55 via-transparent to-transparent"
        >
          <span className="absolute bottom-2.5 left-3 z-10 text-xs font-semibold text-white">
            Natural Foliage
          </span>
        </PhotoFrame>

        <PhotoFrame
          photo={PHOTOS.modernKitchen}
          className="rounded-2xl h-36 md:h-[152px] border border-line"
          overlayClassName="bg-gradient-to-t from-[#173F35]/55 via-transparent to-transparent"
        >
          <span className="absolute bottom-2.5 left-3 z-10 text-xs font-semibold text-white">
            Ventilated Kitchen
          </span>
        </PhotoFrame>
      </div>

      {/* 4 Visual Indoor Care Pillars */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {CARE_PILLARS.map((pillar, idx) => {
          const Icon = pillar.icon;
          return (
            <div
              key={idx}
              className="rounded-2xl overflow-hidden bg-card border border-line shadow-subtle flex flex-col"
            >
              <PhotoFrame
                photo={pillar.photo}
                className="h-32 w-full"
                overlayClassName="bg-gradient-to-t from-[#173F35]/60 via-transparent to-transparent"
              >
                <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 text-[#173F35] text-[11px] font-semibold">
                  <Icon size={12} />
                  {pillar.badge}
                </div>
              </PhotoFrame>
              <div className="p-4 flex-1">
                <h3 className="text-sm font-display font-semibold text-ink">{pillar.title}</h3>
                <p className="text-xs text-mute mt-1.5 leading-relaxed">{pillar.advice}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Room-wise & Purifier Sections */}
      <div className="grid g2">
        {/* Room-wise Guidance */}
        <div className="card">
          <div className="row justify-between items-center mb-3">
            <h2 className="m-0">Room-wise Interventions</h2>
            <div className="tabs">
              {ROOMS.map(room => (
                <button
                  key={room}
                  type="button"
                  className={selectedRoom === room ? 'on' : ''}
                  onClick={() => setSelectedRoom(room)}
                >
                  {room}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-line/70">
            {INDOOR_ADVICE[selectedRoom].map((tip, idx) => (
              <div key={idx} className="chk items-center">
                <Leaf size={16} className="text-forest flex-shrink-0" />
                <span className="text-sm font-medium leading-relaxed">{tip}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Air Purifier Guidance */}
        <div className="card flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Wind size={18} className="text-forest" />
              <h2 className="m-0">Air Purifier Best Practices</h2>
            </div>
            <div className="divide-y divide-line/70">
              {PURIFIER_GUIDELINES.map((tip, idx) => (
                <div key={idx} className="chk items-center">
                  <ShieldCheck size={16} className="text-forest flex-shrink-0" />
                  <span className="text-sm font-medium leading-relaxed">{tip}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="sub text-xs mt-4 pt-3 border-t border-line/70">
            Disclaimer: Household air mitigation reduces exposure risks but does not replace medical
            treatment for respiratory ailments.
          </p>
        </div>
      </div>
    </div>
  );
};
