import React from 'react';
import { MapPin, Clock } from 'lucide-react';
import { AirQualityData } from '../../types';
import { PhotoFrame } from '../common/PhotoFrame';
import { PHOTOS } from '../../constants/photos';

interface OverviewHeroProps {
  airData: AirQualityData;
  userName: string;
  greeting: string;
  formattedDate: string;
}

export const OverviewHero: React.FC<OverviewHeroProps> = ({
  airData,
  userName,
  greeting,
  formattedDate,
}) => {
  return (
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
            {greeting}, <span className="font-semibold text-white">{userName || 'Friend'}</span>.{' '}
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
  );
};
