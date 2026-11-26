import { AirQualityData, DailyForecast, HourlyReading, StationReading } from '../types';
import {
  CityCoords,
  DEMO_LOCS,
  getAQICategory,
  STATIONS_OFFSET,
  generateSyntheticHourly,
  generateSyntheticDaily,
  HOURS_24,
  DAYS_7,
} from '../constants/mockData';

type Breakpoint = [number, number, number, number];

export interface OpenMeteoPayload {
  current?: {
    time?: string;
    pm2_5?: number | null;
    pm10?: number | null;
    nitrogen_dioxide?: number | null;
    sulphur_dioxide?: number | null;
    carbon_monoxide?: number | null;
    ozone?: number | null;
    us_aqi?: number | null;
  };
  hourly?: {
    time?: string[];
    pm2_5?: (number | null)[];
    pm10?: (number | null)[];
  };
}

const CPCB_BREAKPOINTS: Record<string, Breakpoint[]> = {
  pm25: [
    [0, 30, 0, 50],
    [30, 60, 51, 100],
    [60, 90, 101, 200],
    [90, 120, 201, 300],
    [120, 250, 301, 400],
    [250, 500, 401, 500],
  ],
  pm10: [
    [0, 50, 0, 50],
    [50, 100, 51, 100],
    [100, 250, 101, 200],
    [250, 350, 201, 300],
    [350, 430, 301, 400],
    [430, 600, 401, 500],
  ],
  no2: [
    [0, 40, 0, 50],
    [40, 80, 51, 100],
    [80, 180, 101, 200],
    [180, 280, 201, 300],
    [280, 400, 301, 400],
    [400, 500, 401, 500],
  ],
  so2: [
    [0, 40, 0, 50],
    [40, 80, 51, 100],
    [80, 380, 101, 200],
    [380, 800, 201, 300],
    [800, 1600, 301, 400],
    [1600, 2000, 401, 500],
  ],
  co: [
    [0, 1.0, 0, 50],
    [1.0, 2.0, 51, 100],
    [2.0, 10.0, 101, 200],
    [10.0, 17.0, 201, 300],
    [17.0, 34.0, 301, 400],
    [34.0, 50.0, 401, 500],
  ],
  o3: [
    [0, 50, 0, 50],
    [50, 100, 51, 100],
    [100, 168, 101, 200],
    [168, 208, 201, 300],
    [208, 748, 301, 400],
    [748, 1000, 401, 500],
  ],
};

function calcSubIndex(c: number | undefined | null, breaks: Breakpoint[]): number | null {
  if (c === undefined || c === null || Number.isNaN(c) || c < 0) return null;
  for (const [bLow, bHigh, iLow, iHigh] of breaks) {
    if (bLow <= c && c <= bHigh) {
      if (bHigh === bLow) return iLow;
      return Math.round(iLow + ((iHigh - iLow) / (bHigh - bLow)) * (c - bLow));
    }
  }
  const last = breaks[breaks.length - 1];
  if (c > last[1]) {
    return 500;
  }
  return 0;
}

/**
 * Compute Indian National AQI (CPCB Standard) and dominant pollutant from available readings.
 */
export function calculateIndianNAQI(pollutants: {
  pm25?: number | null;
  pm10?: number | null;
  no2?: number | null;
  so2?: number | null;
  co?: number | null;
  o3?: number | null;
}): { aqi: number; dominant: string; sufficient: boolean } {
  const subIndices: Record<string, number | null> = {
    'PM2.5': calcSubIndex(pollutants.pm25, CPCB_BREAKPOINTS.pm25),
    'PM10': calcSubIndex(pollutants.pm10, CPCB_BREAKPOINTS.pm10),
    'NO2': calcSubIndex(pollutants.no2, CPCB_BREAKPOINTS.no2),
    'SO2': calcSubIndex(pollutants.so2, CPCB_BREAKPOINTS.so2),
    'CO': calcSubIndex(pollutants.co, CPCB_BREAKPOINTS.co),
    'O3': calcSubIndex(pollutants.o3, CPCB_BREAKPOINTS.o3),
  };

  const validEntries = Object.entries(subIndices).filter(
    (entry): entry is [string, number] => entry[1] !== null
  );
  const hasParticulate = subIndices['PM2.5'] !== null || subIndices['PM10'] !== null;
  const sufficient = hasParticulate && validEntries.length >= 3;

  if (validEntries.length === 0) {
    return { aqi: 50, dominant: 'PM2.5', sufficient: false };
  }

  let maxAqi = -1;
  let dominant = 'PM2.5';
  for (const [key, val] of validEntries) {
    if (val >= maxAqi) {
      maxAqi = val;
      dominant = key;
    }
  }

  return { aqi: maxAqi, dominant, sufficient };
}

function roundOpt(value: number | null | undefined): number | null {
  return value !== null && value !== undefined ? Math.round(value) : null;
}

function buildStationReadings(baseAqi: number): StationReading[] {
  return STATIONS_OFFSET.map(([name, mult, x, y]) => {
    const sAqi = Math.round(baseAqi * mult);
    const cat = getAQICategory(sAqi);
    return {
      name,
      aqi: sAqi,
      category: cat.name,
      color: cat.color,
      x,
      y,
    };
  });
}

function findCurrentHourIndex(allTimes: string[], currTime?: string): number {
  let startIdx = currTime ? allTimes.indexOf(currTime) : -1;
  if (startIdx < 0 && currTime) {
    const prefix = currTime.slice(0, 13);
    startIdx = allTimes.findIndex(t => t.startsWith(prefix));
  }
  if (startIdx < 0) {
    startIdx = Math.min(24, Math.max(0, allTimes.length - 1));
  }
  return startIdx;
}

function buildDailyForecastFromHourly(
  allTimes: string[],
  allPm25: (number | null)[],
  allPm10: (number | null)[],
  startIdx: number,
  fallbackAqi: number
): DailyForecast[] {
  const byDate = new Map<string, { pm25: number[]; pm10: number[] }>();
  for (let i = startIdx; i < allTimes.length; i++) {
    const dKey = allTimes[i].slice(0, 10);
    if (!byDate.has(dKey)) {
      if (byDate.size >= 7) break;
      byDate.set(dKey, { pm25: [], pm10: [] });
    }
    const bucket = byDate.get(dKey)!;
    const v25 = allPm25[i];
    const v10 = allPm10[i];
    if (v25 !== null && v25 !== undefined) bucket.pm25.push(v25);
    if (v10 !== null && v10 !== undefined) bucket.pm10.push(v10);
  }

  return Array.from(byDate.entries()).map(([dateStr, vals]) => {
    const dayLabel = new Date(`${dateStr}T00:00:00`).toLocaleDateString('en-US', { weekday: 'short' });
    const mean25 = vals.pm25.length ? vals.pm25.reduce((a, b) => a + b, 0) / vals.pm25.length : null;
    const mean10 = vals.pm10.length ? vals.pm10.reduce((a, b) => a + b, 0) / vals.pm10.length : null;
    const dAqi = mean25 !== null || mean10 !== null ? calculateIndianNAQI({ pm25: mean25, pm10: mean10 }).aqi : fallbackAqi;
    return {
      day: dayLabel,
      aqi: dAqi,
      category: getAQICategory(dAqi).name,
    };
  });
}

/**
 * Construct offline demonstration air quality telemetry when APIs are unreachable.
 */
export function getDemoAirQuality(city: string): AirQualityData {
  const base = DEMO_LOCS[city] || DEMO_LOCS['Ludhiana'];
  const aqi = base.aqi;
  const category = getAQICategory(aqi);
  const hourly: HourlyReading[] = generateSyntheticHourly(aqi).map((v, i) => ({
    hour: HOURS_24[i],
    aqi: v,
  }));
  const daily: DailyForecast[] = generateSyntheticDaily(aqi).map((v, i) => ({
    day: DAYS_7[i],
    aqi: v,
    category: getAQICategory(v).name,
  }));

  return {
    loc: city,
    aqi,
    usAqi: Math.round(aqi * 0.85),
    indexStandard: 'Indicative CPCB-Method Estimate (Modelled Data)',
    category,
    pollutants: {
      pm25: base.pm25,
      pm10: base.pm10,
      no2: base.no2,
      so2: base.so2,
      co: base.co,
      o3: base.o3,
      nh3: null,
      pb: null,
    },
    hourly,
    daily,
    stations: buildStationReadings(aqi),
    lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    isLive: false,
    source: 'Demonstration baseline (offline benchmark)',
  };
}

/**
 * Parse a direct Open-Meteo API payload into the shared AirQualityData structure.
 */
export function parseOpenMeteoAirQuality(
  city: string,
  cityInfo: CityCoords,
  om: OpenMeteoPayload
): AirQualityData {
  const current = om.current || {};
  const pm25 = roundOpt(current.pm2_5);
  const pm10 = roundOpt(current.pm10);
  const no2 = roundOpt(current.nitrogen_dioxide);
  const so2 = roundOpt(current.sulphur_dioxide);
  const co =
    current.carbon_monoxide !== null && current.carbon_monoxide !== undefined
      ? parseFloat((current.carbon_monoxide / 1000).toFixed(2))
      : null;
  const o3 = roundOpt(current.ozone);
  const usAqi =
    current.us_aqi !== null && current.us_aqi !== undefined ? Math.round(current.us_aqi) : undefined;

  const naqiResult = calculateIndianNAQI({ pm25, pm10, no2, so2, co, o3 });
  const naqi = naqiResult.aqi;
  const category = getAQICategory(naqi);

  const allTimes = om.hourly?.time || [];
  const allPm25 = om.hourly?.pm2_5 || [];
  const allPm10 = om.hourly?.pm10 || [];
  const currTime = current.time;
  const startIdx = findCurrentHourIndex(allTimes, currTime);

  const hourlyData: HourlyReading[] = allTimes.slice(startIdx, startIdx + 24).map((t, idx) => {
    const hourStr = t.split('T')[1] || `${String(idx).padStart(2, '0')}:00`;
    const p25 = allPm25[startIdx + idx] ?? null;
    const p10 = allPm10[startIdx + idx] ?? null;
    const hAqi = p25 !== null || p10 !== null ? calculateIndianNAQI({ pm25: p25, pm10: p10 }).aqi : naqi;
    return {
      hour: hourStr.slice(0, 5),
      aqi: hAqi,
      pm25: p25 !== null ? Math.round(p25) : undefined,
      pm10: p10 !== null ? Math.round(p10) : undefined,
    };
  });

  const dailyData = buildDailyForecastFromHourly(allTimes, allPm25, allPm10, startIdx, naqi);

  return {
    loc: city,
    aqi: naqi,
    usAqi,
    indexStandard: 'Indicative CPCB-Method Estimate (Modelled Data)',
    category,
    pollutants: { pm25, pm10, no2, so2, co, o3, nh3: null, pb: null },
    dominantPollutant: naqiResult.dominant,
    cpcbSufficient: naqiResult.sufficient,
    hourly: hourlyData.length
      ? hourlyData
      : generateSyntheticHourly(naqi).map((v, i) => ({ hour: HOURS_24[i], aqi: v })),
    daily: dailyData.length
      ? dailyData
      : generateSyntheticDaily(naqi).map((v, i) => ({
          day: DAYS_7[i],
          aqi: v,
          category: getAQICategory(v).name,
        })),
    stations: buildStationReadings(naqi),
    lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    measurementTime: currTime ? `${currTime.replace('T', ' ')} IST` : undefined,
    isLive: true,
    source: 'Open-Meteo CAMS Global IFS-AER (~0.4° Model)',
    coordinates: { latitude: cityInfo.lat, longitude: cityInfo.lon },
  };
}
