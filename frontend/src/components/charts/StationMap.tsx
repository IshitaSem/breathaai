import React from 'react';
import { StationReading } from '../../types';

interface StationMapProps {
  stations: StationReading[];
}

export const StationMap: React.FC<StationMapProps> = ({ stations }) => {
  return (
    <div className="card">
      <div className="flex justify-between items-center mb-3">
        <h2>Local Dispersion Zones</h2>
        <span className="badge demo">Spatial Model</span>
      </div>

      <div className="relative w-full rounded-2xl overflow-hidden mb-4 border border-line" style={{ height: 185, background: 'var(--mint)' }}>
        <svg viewBox="0 0 300 180" width="100%" height="100%" preserveAspectRatio="none">
          <path
            d="M 0 120 C 80 90, 160 150, 300 80"
            stroke="var(--sage)"
            strokeWidth="6"
            fill="none"
            opacity="0.55"
          />

          {stations.map(stn => {
            const cx = stn.x * 300;
            const cy = stn.y * 180;
            return (
              <g key={stn.name}>
                <circle
                  cx={cx}
                  cy={cy}
                  r="14"
                  fill={stn.color}
                  stroke="#FFFFFF"
                  strokeWidth="2.2"
                  opacity="0.92"
                >
                  <title>{`${stn.name}: AQI ${stn.aqi} (${stn.category})`}</title>
                </circle>
                <text
                  x={cx}
                  y={cy + 3.5}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontWeight="700"
                  fontSize="10"
                >
                  {stn.aqi}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <table>
        <thead>
          <tr>
            <th>Urban Grid Point</th>
            <th>AQI</th>
            <th>Category</th>
          </tr>
        </thead>
        <tbody>
          {stations.map(stn => (
            <tr key={stn.name}>
              <td className="font-medium">{stn.name}</td>
              <td className="font-display font-bold" style={{ color: stn.color }}>
                {stn.aqi}
              </td>
              <td>
                <span
                  className="badge text-xs"
                  style={{
                    backgroundColor: `${stn.color}22`,
                    color: stn.color,
                  }}
                >
                  {stn.category}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="sub text-xs mt-3 pt-3 border-t border-line/70">
        Attribution notice: Values represent regional spatial dispersion grid points, not physical CPCB monitoring stations.
      </p>
    </div>
  );
};
