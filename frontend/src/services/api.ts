import { AirQualityData } from '../types';
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

const API_BASE = '/api';

// Calculation helper for Indian National AQI (CPCB Standard)
export function calculateIndianNAQI(pollutants: {
  pm25: number;
  pm10: number;
  no2?: number;
  so2?: number;
  co?: number;
  o3?: number;
}): { aqi: number; dominant: string } {
  const calcSubIndex = (c: number | undefined, breaks: [number, number, number, number][]): number | null => {
    if (c === undefined || c === null || c < 0) return null;
    for (const [bLow, bHigh, iLow, iHigh] of breaks) {
      if (bLow <= c && c <= bHigh) {
        return Math.round(iLow + ((iHigh - iLow) / (bHigh - bLow)) * (c - bLow));
      }
    }
    const last = breaks[breaks.length - 1];
    if (c > last[1]) {
      return Math.min(500, Math.round(last[3] + (c - last[1]) * 0.5));
    }
    return 0;
  };

  const pm25Breaks: [number, number, number, number][] = [
    [0, 30, 0, 50],
    [30.01, 60, 51, 100],
    [60.01, 90, 101, 200],
    [90.01, 120, 201, 300],
    [120.01, 250, 301, 400],
    [250.01, 500, 401, 500],
  ];

  const pm10Breaks: [number, number, number, number][] = [
    [0, 50, 0, 50],
    [50.01, 100, 51, 100],
    [100.01, 250, 101, 200],
    [250.01, 350, 201, 300],
    [350.01, 430, 301, 400],
    [430.01, 600, 401, 500],
  ];

  const no2Breaks: [number, number, number, number][] = [
    [0, 40, 0, 50],
    [40.01, 80, 51, 100],
    [80.01, 180, 101, 200],
    [180.01, 280, 201, 300],
    [280.01, 400, 301, 400],
    [400.01, 500, 401, 500],
  ];

  const so2Breaks: [number, number, number, number][] = [
    [0, 40, 0, 50],
    [40.01, 80, 51, 100],
    [80.01, 380, 101, 200],
    [380.01, 800, 201, 300],
    [800.01, 1600, 301, 400],
    [1600.01, 2000, 401, 500],
  ];

  const coBreaks: [number, number, number, number][] = [
    [0, 1.0, 0, 50],
    [1.01, 2.0, 51, 100],
    [2.01, 10.0, 101, 200],
    [10.01, 17.0, 201, 300],
    [17.01, 34.0, 301, 400],
    [34.01, 50.0, 401, 500],
  ];

  const o3Breaks: [number, number, number, number][] = [
    [0, 50, 0, 50],
    [50.01, 100, 51, 100],
    [100.01, 168, 101, 200],
    [168.01, 208, 201, 300],
    [208.01, 748, 301, 400],
    [748.01, 1000, 401, 500],
  ];

  const subIndices: Record<string, number | null> = {
    'PM2.5': calcSubIndex(pollutants.pm25, pm25Breaks),
    'PM10': calcSubIndex(pollutants.pm10, pm10Breaks),
    'NO2': calcSubIndex(pollutants.no2, no2Breaks),
    'SO2': calcSubIndex(pollutants.so2, so2Breaks),
    'CO': calcSubIndex(pollutants.co, coBreaks),
    'O3': calcSubIndex(pollutants.o3, o3Breaks),
  };

  let maxAqi = 50;
  let dominant = 'PM2.5';

  for (const [key, val] of Object.entries(subIndices)) {
    if (val !== null && val >= maxAqi) {
      maxAqi = val;
      dominant = key;
    }
  }

  return { aqi: maxAqi, dominant };
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
    const res = await fetch(`${API_BASE}/air-quality?city=${encodeURIComponent(city)}`);
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

  // Second attempt: Try direct Open-Meteo Air Quality API
  const cityInfo = SUPPORTED_CITIES[city];
  if (cityInfo) {
    try {
      const omUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${cityInfo.lat}&longitude=${cityInfo.lon}&current=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,us_aqi&hourly=pm10,pm2_5,us_aqi&forecast_days=7`;
      const omRes = await fetch(omUrl);
      if (omRes.ok) {
        const om = await omRes.json();
        const current = om.current || {};
        const pm25 = Math.round(current.pm2_5 || 45);
        const pm10 = Math.round(current.pm10 || 85);
        const no2 = Math.round(current.nitrogen_dioxide || 35);
        const so2 = Math.round(current.sulphur_dioxide || 10);
        const co = parseFloat(((current.carbon_monoxide || 500) / 1000).toFixed(1));
        const o3 = Math.round(current.ozone || 30);
        const usAqi = Math.round(current.us_aqi || 120);

        const naqiResult = calculateIndianNAQI({ pm25, pm10, no2, so2, co, o3 });
        const naqi = naqiResult.aqi;
        const category = getAQICategory(naqi);

        // Hourly trends from Open-Meteo
        const hourlyTimes: string[] = om.hourly?.time?.slice(0, 24) || [];
        const hourlyPm25: number[] = om.hourly?.pm2_5?.slice(0, 24) || [];
        const hourlyData = hourlyTimes.map((t, idx) => {
          const hourStr = t.split('T')[1] || `${String(idx).padStart(2, '0')}:00`;
          const p25 = hourlyPm25[idx] || pm25;
          const hAqi = calculateIndianNAQI({ pm25: p25, pm10: p25 * 1.6 }).aqi;
          return {
            hour: hourStr.slice(0, 5),
            aqi: hAqi,
            pm25: Math.round(p25),
          };
        });

        // 7-day daily forecast
        const dailyData = DAYS_7.map((day, i) => {
          const mult = [0.92, 0.98, 1.05, 1.02, 0.95, 1.0, 0.97][i];
          const dAqi = Math.round(naqi * mult);
          return {
            day,
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
          hourly: hourlyData.length ? hourlyData : generateSyntheticHourly(naqi).map((v, i) => ({ hour: HOURS_24[i], aqi: v })),
          daily: dailyData,
          stations,
          lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
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
    const res = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, context }),
    });

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
    await fetch(`${API_BASE}/planner/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task_id: taskId, completed }),
    });
  } catch {
    // Non-blocking; localStorage handles offline persistence
  }
}

export async function resetPlannerBackend(): Promise<void> {
  try {
    await fetch(`${API_BASE}/planner/reset`, { method: 'POST' });
  } catch {
    // Non-blocking
  }
}

export async function syncCommunityChallengeToBackend(challengeId: number, isJoined: boolean): Promise<void> {
  try {
    await fetch(`${API_BASE}/community/challenge/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challenge_id: challengeId, is_joined: isJoined }),
    });
  } catch {
    // Non-blocking
  }
}

export async function syncSettingsToBackend(settingsPayload: any): Promise<void> {
  try {
    await fetch(`${API_BASE}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settingsPayload),
    });
  } catch {
    // Non-blocking
  }
}
