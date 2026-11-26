import { AirQualityData, UserPreferences } from '../types';
import {
  DEMO_LOCS,
  SUPPORTED_CITIES,
  getAQICategory,
  STATIONS_OFFSET,
  generateSyntheticHourly,
  generateSyntheticDaily,
  HOURS_24,
  DAYS_7,
} from '../constants/mockData';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 8000
): Promise<Response> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    window.clearTimeout(timer);
  }
}

type Breakpoint = [number, number, number, number];

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

// Calculation helper for Indian National AQI (CPCB Standard)
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

// Fallback demo constructor when offline or backend unreachable
export function getDemoAirQuality(city: string): AirQualityData {
  const base = DEMO_LOCS[city] || DEMO_LOCS['Ludhiana'];
  const aqi = base.aqi;
  const category = getAQICategory(aqi);
  const hourly = generateSyntheticHourly(aqi).map((v, i) => ({
    hour: HOURS_24[i],
    aqi: v,
  }));
  const daily = generateSyntheticDaily(aqi).map((v, i) => ({
    day: DAYS_7[i],
    aqi: v,
    category: getAQICategory(v).name,
  }));
  const stations = STATIONS_OFFSET.map(([name, mult, x, y]) => {
    const sAqi = Math.round(aqi * mult);
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
    stations,
    lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    isLive: false,
    source: 'Demonstration baseline (offline benchmark)',
  };
}

export async function fetchAirQualityData(city: string): Promise<AirQualityData> {
  // First attempt backend endpoint
  try {
    const res = await fetchWithTimeout(`${API_BASE}/air-quality?city=${encodeURIComponent(city)}`, {}, 8000);
    if (res.ok) {
      const data = await res.json();
      return {
        ...data,
        category: getAQICategory(data.aqi),
      };
    }
  } catch {
    // Backend may not be running or network is transitioning
  }

  // Second attempt: Try direct Open-Meteo Air Quality API (with IST timezone & past_days=1)
  const cityInfo = SUPPORTED_CITIES[city];
  if (cityInfo) {
    try {
      const omUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${cityInfo.lat}&longitude=${cityInfo.lon}&current=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,us_aqi&hourly=pm10,pm2_5,us_aqi&past_days=1&forecast_days=7&timezone=Asia%2FKolkata`;
      const omRes = await fetchWithTimeout(omUrl, {}, 8000);
      if (omRes.ok) {
        const om = await omRes.json();
        const current = om.current || {};
        const pm25 = current.pm2_5 !== null && current.pm2_5 !== undefined ? Math.round(current.pm2_5) : null;
        const pm10 = current.pm10 !== null && current.pm10 !== undefined ? Math.round(current.pm10) : null;
        const no2 = current.nitrogen_dioxide !== null && current.nitrogen_dioxide !== undefined ? Math.round(current.nitrogen_dioxide) : null;
        const so2 = current.sulphur_dioxide !== null && current.sulphur_dioxide !== undefined ? Math.round(current.sulphur_dioxide) : null;
        const co = current.carbon_monoxide !== null && current.carbon_monoxide !== undefined
          ? parseFloat((current.carbon_monoxide / 1000).toFixed(2))
          : null;
        const o3 = current.ozone !== null && current.ozone !== undefined ? Math.round(current.ozone) : null;
        const usAqi = current.us_aqi !== null && current.us_aqi !== undefined ? Math.round(current.us_aqi) : undefined;

        const naqiResult = calculateIndianNAQI({ pm25, pm10, no2, so2, co, o3 });
        const naqi = naqiResult.aqi;
        const category = getAQICategory(naqi);

        // Match current hour in hourly array
        const allTimes: string[] = om.hourly?.time || [];
        const allPm25: (number | null)[] = om.hourly?.pm2_5 || [];
        const allPm10: (number | null)[] = om.hourly?.pm10 || [];
        const currTime: string | undefined = current.time;
        let startIdx = currTime ? allTimes.indexOf(currTime) : -1;
        if (startIdx < 0 && currTime) {
          const prefix = currTime.slice(0, 13);
          startIdx = allTimes.findIndex(t => t.startsWith(prefix));
        }
        if (startIdx < 0) {
          startIdx = Math.min(24, Math.max(0, allTimes.length - 1));
        }

        const hourlyTimes = allTimes.slice(startIdx, startIdx + 24);
        const hourlyData = hourlyTimes.map((t, idx) => {
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

        // 7-day daily forecast aggregated from actual Open-Meteo hourly forecast
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

        const dailyData = Array.from(byDate.entries()).map(([dateStr, vals]) => {
          const dayLabel = new Date(`${dateStr}T00:00:00`).toLocaleDateString('en-US', { weekday: 'short' });
          const mean25 = vals.pm25.length ? vals.pm25.reduce((a, b) => a + b, 0) / vals.pm25.length : null;
          const mean10 = vals.pm10.length ? vals.pm10.reduce((a, b) => a + b, 0) / vals.pm10.length : null;
          const dAqi = mean25 !== null || mean10 !== null ? calculateIndianNAQI({ pm25: mean25, pm10: mean10 }).aqi : naqi;
          return {
            day: dayLabel,
            aqi: dAqi,
            category: getAQICategory(dAqi).name,
          };
        });

        const stations = STATIONS_OFFSET.map(([name, mult, x, y]) => {
          const sAqi = Math.round(naqi * mult);
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

        return {
          loc: city,
          aqi: naqi,
          usAqi,
          indexStandard: 'Indicative CPCB-Method Estimate (Modelled Data)',
          category,
          pollutants: { pm25, pm10, no2, so2, co, o3, nh3: null, pb: null },
          dominantPollutant: naqiResult.dominant,
          cpcbSufficient: naqiResult.sufficient,
          hourly: hourlyData.length ? hourlyData : generateSyntheticHourly(naqi).map((v, i) => ({ hour: HOURS_24[i], aqi: v })),
          daily: dailyData.length ? dailyData : generateSyntheticDaily(naqi).map((v, i) => ({ day: DAYS_7[i], aqi: v, category: getAQICategory(v).name })),
          stations,
          lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          measurementTime: currTime ? `${currTime.replace('T', ' ')} IST` : undefined,
          isLive: true,
          source: 'Open-Meteo CAMS Global IFS-AER (~0.4° Model)',
          coordinates: { latitude: cityInfo.lat, longitude: cityInfo.lon },
        };
      }
    } catch (err) {
      console.warn('Direct Open-Meteo query failed, falling back to benchmark', err);
    }
  }

  return getDemoAirQuality(city);
}

export async function askAIAssistant(
  question: string,
  context: {
    loc: string;
    aqi: number;
    pm25: number;
    pm10: number;
    fam: number;
    sens: string;
    life: string;
  }
): Promise<{ text: string; cards: [string, string][]; isLiveGenAI: boolean; modelUsed: string }> {
  try {
    const res = await fetchWithTimeout(
      `${API_BASE}/chat`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, context }),
      },
      16000
    );

    if (res.ok) {
      const data = await res.json();
      return {
        text: data.text || data.t,
        cards: data.cards || [],
        isLiveGenAI: Boolean(data.is_live_genai ?? true),
        modelUsed: data.model_used || 'Gemini 2.5 Flash',
      };
    }
  } catch (err) {
    console.warn('Backend /api/chat error, using contextual fallback engine', err);
  }

  // Local fallback response engine
  await new Promise(r => setTimeout(r, 600));
  const q = question.toLowerCase();
  const c = getAQICategory(context.aqi);
  const hi = context.aqi > 200;
  const pre = `In ${context.loc}, the AQI is currently ${context.aqi} (${c.name}) with PM2.5 at ${context.pm25} µg/m³. `;

  if (/outside|safe|go out/.test(q)) {
    return {
      text: pre + (hi ? 'I recommend keeping outdoor time short and essential today.' : 'Outdoor activity is generally fine, with care for sensitive family members.'),
      cards: [
        ['Wear a fitted N95/FFP2 if you must go out', 'Surgical and cloth masks filter far fewer fine particles.'],
        ['Choose midday for errands', 'Smog often eases after late morning as surface temperatures rise and the inversion layer lifts.'],
      ],
      isLiveGenAI: false,
      modelUsed: 'Local Contextual Fallback',
    };
  }

  if (/family|child|kid|smog|elder/.test(q)) {
    return {
      text: pre + `Given your household of ${context.fam} people and sensitive individuals (${context.sens}), prioritize clean indoor air zones. Check with a doctor for specific health concerns.`,
      cards: [
        ['Keep windows closed in early morning and night', 'Pollution peaks when cold, stagnant night air traps vehicular and burning emissions.'],
        ['Run a HEPA purifier in the bedroom', 'Cuts fine particulate exposure where your family spends 7–9 continuous hours.'],
        ['Swap outdoor play for indoor activities', 'Children breathe more air per kilogram of body weight, increasing toxic dose.'],
      ],
      isLiveGenAI: false,
      modelUsed: 'Local Contextual Fallback',
    };
  }

  if (/exercise|workout|run|jog|walk/.test(q)) {
    return {
      text: pre + (hi ? 'Move today’s workout indoors to avoid breathing heavy concentrations of fine particles.' : 'Early afternoon is typically cleaner than early morning or evening.'),
      cards: [
        ['Exercise indoors when AQI > 200', 'Higher breathing rates cause deep alveolar deposition of PM2.5 and ultrafine particles.'],
        ['Avoid arterial roadways', 'Nitrogen dioxide and particulate matter spike within 300 meters of heavy traffic corridors.'],
      ],
      isLiveGenAI: false,
      modelUsed: 'Local Contextual Fallback',
    };
  }

  if (/indoor|home|purifier|room|clean/.test(q)) {
    return {
      text: pre + 'Indoor air quality closely tracks outdoor pollution. Focus on preventing outdoor infiltration and reducing indoor emission sources.',
      cards: [
        ['Ventilate briefly when AQI dips', 'A 10–15 minute airing between 1 PM and 3 PM exchanges stale air with lower outdoor particulate load.'],
        ['Wet-mop instead of sweeping', 'Dry sweeping re-suspends settled particles back into your breathing zone.'],
        ['Use kitchen exhaust during and after cooking', 'Cooking oil fumes and gas combustion are significant indoor PM2.5 and VOC sources.'],
      ],
      isLiveGenAI: false,
      modelUsed: 'Local Contextual Fallback',
    };
  }

  if (/pm2|pm 2|high/.test(q)) {
    return {
      text: pre + 'When PM2.5 levels are elevated, minimize direct exposure and avoid adding indoor combustion sources.',
      cards: [
        ['Wear a certified N95/FFP2 respirator', 'Fine particles smaller than 2.5 microns penetrate directly into the bloodstream.'],
        ['Seal windows and run true HEPA filtration', 'High-efficiency particulate filters capture 99.97% of particles down to 0.3 microns.'],
        ['Avoid burning incense or candles', 'Indoor burning generates volatile organic compounds and fine carbonaceous soot.'],
      ],
      isLiveGenAI: false,
      modelUsed: 'Local Contextual Fallback',
    };
  }

  if (/reduce|contribut|emission|carbon|green/.test(q)) {
    return {
      text: 'Individual actions aggregate into meaningful community benefits. Note: Carbon reductions are transparent estimates, not measured air quality changes.',
      cards: [
        ['Shift to metro, bus or carpool', 'Saves approximately 1.8 kg CO₂e per 15 km trip compared to a solo combustion vehicle.'],
        ['Cook with lids and exhaust on', 'Reduces fuel consumption and prevents indoor particulate buildup.'],
        ['Unplug idle electronic devices', 'Eliminating vampire standby power reduces continuous grid power demand.'],
      ],
      isLiveGenAI: false,
      modelUsed: 'Local Contextual Fallback',
    };
  }

  return {
    text: pre + 'I can assist you with outdoor safety planning, family health advisories, exercise timing, indoor air management, and sustainable personal choices. Select any suggested prompt or type your query below.',
    cards: [
      ['Plan outdoor trips around peak smog', 'Avoid early morning and late evening rush hours.'],
      ['Check purifier filter condition', 'Inspect pre-filters monthly to maintain optimum clean air delivery rate (CADR).'],
    ],
    isLiveGenAI: false,
    modelUsed: 'Local Contextual Fallback',
  };
}

// ---------------- Backend Sync Helpers ---------------- //

export async function syncPlannerTaskToBackend(taskId: string, completed: boolean): Promise<void> {
  try {
    await fetchWithTimeout(
      `${API_BASE}/planner/toggle`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task_id: taskId, completed }),
      },
      5000
    );
  } catch {
    // Non-blocking; localStorage handles offline persistence
  }
}

export async function resetPlannerBackend(): Promise<void> {
  try {
    await fetchWithTimeout(`${API_BASE}/planner/reset`, { method: 'POST' }, 5000);
  } catch {
    // Non-blocking
  }
}

export async function syncCommunityChallengeToBackend(challengeId: number, isJoined: boolean): Promise<void> {
  try {
    await fetchWithTimeout(
      `${API_BASE}/community/challenge/toggle`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challenge_id: challengeId, is_joined: isJoined }),
      },
      5000
    );
  } catch {
    // Non-blocking
  }
}

export async function syncSettingsToBackend(settingsPayload: Omit<UserPreferences, 'col'>): Promise<void> {
  try {
    await fetchWithTimeout(
      `${API_BASE}/settings`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsPayload),
      },
      5000
    );
  } catch {
    // Non-blocking
  }
}
