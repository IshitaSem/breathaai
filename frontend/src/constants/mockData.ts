import { AQICategory, PollutantDefinition, PlannerTask, GreenerChoice, CommunityChallenge } from '../types';

export interface CityCoords {
  name: string;
  lat: number;
  lon: number;
  state: string;
}

export const SUPPORTED_CITIES: Record<string, CityCoords> = {
  Ludhiana: { name: 'Ludhiana', lat: 30.9010, lon: 75.8573, state: 'Punjab' },
  Delhi: { name: 'Delhi', lat: 28.6139, lon: 77.2090, state: 'Delhi' },
  Lucknow: { name: 'Lucknow', lat: 26.8467, lon: 80.9462, state: 'Uttar Pradesh' },
  Mumbai: { name: 'Mumbai', lat: 19.0760, lon: 72.8777, state: 'Maharashtra' },
  Bengaluru: { name: 'Bengaluru', lat: 12.9716, lon: 77.5946, state: 'Karnataka' },
  Kolkata: { name: 'Kolkata', lat: 22.5726, lon: 88.3639, state: 'West Bengal' },
  Chennai: { name: 'Chennai', lat: 13.0827, lon: 80.2707, state: 'Tamil Nadu' },
  Hyderabad: { name: 'Hyderabad', lat: 17.3850, lon: 78.4867, state: 'Telangana' }
};

export const DEMO_LOCS: Record<string, { aqi: number; pm25: number; pm10: number; no2: number; so2: number; co: number; o3: number }> = {
  Ludhiana: { aqi: 286, pm25: 148, pm10: 241, no2: 58, so2: 14, co: 2.1, o3: 31 },
  Delhi: { aqi: 352, pm25: 201, pm10: 318, no2: 74, so2: 19, co: 3.4, o3: 26 },
  Lucknow: { aqi: 241, pm25: 119, pm10: 196, no2: 49, so2: 11, co: 1.8, o3: 38 },
  Mumbai: { aqi: 128, pm25: 52, pm10: 98, no2: 36, so2: 9, co: 1.1, o3: 44 },
  Bengaluru: { aqi: 78, pm25: 28, pm10: 54, no2: 24, so2: 6, co: 0.8, o3: 36 },
  Kolkata: { aqi: 184, pm25: 86, pm10: 142, no2: 44, so2: 12, co: 1.5, o3: 29 },
  Chennai: { aqi: 92, pm25: 38, pm10: 68, no2: 26, so2: 8, co: 0.9, o3: 41 },
  Hyderabad: { aqi: 115, pm25: 48, pm10: 88, no2: 32, so2: 10, co: 1.2, o3: 35 }
};

export const POLLUTANT_DEFINITIONS: PollutantDefinition[] = [
  { key: 'pm25', name: 'PM2.5', formula: 'PM₂.₅', unit: 'µg/m³', referenceLevel: 60, description: 'Fine particles that reach deep into the lungs. Main smog pollutant.' },
  { key: 'pm10', name: 'PM10', formula: 'PM₁₀', unit: 'µg/m³', referenceLevel: 100, description: 'Coarse dust from roads, construction and burning.' },
  { key: 'no2', name: 'NO2', formula: 'NO₂', unit: 'µg/m³', referenceLevel: 80, description: 'Gas from vehicle exhaust and combustion.' },
  { key: 'so2', name: 'SO2', formula: 'SO₂', unit: 'µg/m³', referenceLevel: 80, description: 'Released by burning coal and industrial fuel.' },
  { key: 'co', name: 'CO', formula: 'CO', unit: 'mg/m³', referenceLevel: 2, description: 'Colourless gas from incomplete burning of fuel.' },
  { key: 'o3', name: 'O3', formula: 'O₃', unit: 'µg/m³', referenceLevel: 100, description: 'Ground-level ozone formed by sunlight on exhaust gases.' }
];

export const AQI_CATEGORIES: AQICategory[] = [
  { maxVal: 50, name: 'Good', color: '#2e9e5b', advice: 'Air is clean. Enjoy outdoor activity.', healthRisk: 'Low' },
  { maxVal: 100, name: 'Satisfactory', color: '#8cbf3f', advice: 'Minor discomfort possible for very sensitive people.', healthRisk: 'Low' },
  { maxVal: 200, name: 'Moderate', color: '#e0b020', advice: 'Sensitive groups should reduce long outdoor exertion.', healthRisk: 'Moderate' },
  { maxVal: 300, name: 'Poor', color: '#e8832a', advice: 'Limit outdoor time; avoid exercise near traffic.', healthRisk: 'High' },
  { maxVal: 400, name: 'Very Poor', color: '#d6453d', advice: 'Stay indoors where possible; wear a well-fitted N95/FFP2 mask if outside.', healthRisk: 'Severe' },
  { maxVal: 999, name: 'Severe', color: '#8e2a6b', advice: 'Avoid going out. Keep windows closed and run an air purifier.', healthRisk: 'Very Severe' }
];

export function getAQICategory(aqi: number): AQICategory {
  return AQI_CATEGORIES.find(c => aqi <= c.maxVal) || AQI_CATEGORIES[AQI_CATEGORIES.length - 1];
}

export const STATIONS_OFFSET: [string, number, number, number][] = [
  ['City Centre', 1.0, 0.4, 0.4],
  ['Industrial Area', 1.15, 0.75, 0.3],
  ['Residential North', 0.88, 0.3, 0.7],
  ['Highway Ring Road', 1.2, 0.8, 0.75],
  ['University Campus', 0.8, 0.2, 0.25]
];

export const PLANNER_TASKS: PlannerTask[] = [
  { id: 'm1', timeOfDay: 'Morning', description: 'Check today’s AQI before leaving; plan outdoor time after 11 am', co2eKg: 0 },
  { id: 'm2', timeOfDay: 'Morning', description: 'Keep windows shut during early-morning smog peak', co2eKg: 0.1 },
  { id: 'm3', timeOfDay: 'Morning', description: 'Cook with the chimney/exhaust fan on and use induction or LPG over wood/coal', co2eKg: 0.6 },
  { id: 'm4', timeOfDay: 'Morning', description: 'Commute by metro, bus or carpool instead of a solo drive', co2eKg: 1.8 },
  { id: 'a1', timeOfDay: 'Afternoon', description: 'Ventilate briefly (10 min) when AQI dips most', co2eKg: 0 },
  { id: 'a2', timeOfDay: 'Afternoon', description: 'Wet-mop floors and wipe surfaces instead of dry sweeping', co2eKg: 0 },
  { id: 'a3', timeOfDay: 'Afternoon', description: 'Set AC to 24–26 °C and clean its filter', co2eKg: 0.5 },
  { id: 'e1', timeOfDay: 'Evening', description: 'Walk or cycle for short errands (under 2 km)', co2eKg: 0.4 },
  { id: 'e2', timeOfDay: 'Evening', description: 'Switch off standby devices and unused lights', co2eKg: 0.3 },
  { id: 'e3', timeOfDay: 'Evening', description: 'Run the purifier in the bedroom 30 min before sleep', co2eKg: 0 }
];

export const INDOOR_ADVICE: Record<string, string[]> = {
  Kitchen: [
    'Use the exhaust fan while cooking and 10 minutes after.',
    'Prefer LPG/induction; avoid burning wood, coal or dung cakes indoors.',
    'Cover pans to cut oil smoke.'
  ],
  Bedroom: [
    'Keep windows closed on high-AQI nights.',
    'Run a purifier with a HEPA filter on a low, quiet setting.',
    'Wash bedding weekly in hot water to reduce dust.'
  ],
  'Living room': [
    'Wet-mop and damp-dust; dry sweeping lifts particles into the air.',
    'Place plants if you like them, but don’t rely on them to clean air.',
    'Avoid incense and candles on bad air days.'
  ],
  Kids: [
    'Keep play indoors when AQI is Poor or worse.',
    'Use a snug-fitting child-size mask only for essential trips.',
    'Keep rooms free of heavy dust-collecting soft toys.'
  ]
};

export const GREENER_CHOICES: GreenerChoice[] = [
  {
    category: 'Transport',
    title: 'Metro / bus',
    description: 'Shared transport moves many people per vehicle, cutting tailpipe emissions per person.',
    benefit: '≈ 1.8 kg CO₂e saved per 15 km trip vs solo car',
    tip: 'Pick a route with one transfer; use a monthly pass.'
  },
  {
    category: 'Transport',
    title: 'Walk or cycle',
    description: 'Zero tailpipe emissions and no fuel cost.',
    benefit: '≈ 0.4 kg CO₂e saved per 2 km trip',
    tip: 'Combine errands in one loop; carry a reusable bag.'
  },
  {
    category: 'Transport',
    title: 'Carpool',
    description: 'Fewer vehicles on the road at peak hours.',
    benefit: '≈ 1 kg CO₂e saved per shared 15 km trip',
    tip: 'Set a fixed group with neighbours or colleagues.'
  },
  {
    category: 'Home',
    title: 'Energy-efficient appliances',
    description: 'BEE 5-star ACs, fans and LEDs use far less electricity.',
    benefit: '≈ 120 kg CO₂e per year per household',
    tip: 'Replace the oldest appliance first.'
  },
  {
    category: 'Home',
    title: 'Cleaner cooking',
    description: 'LPG, PNG or induction burn cleaner than wood or coal.',
    benefit: 'Lower indoor PM2.5 and ≈ 0.6 kg CO₂e per day',
    tip: 'Use pressure cookers and lids to save fuel.'
  },
  {
    category: 'Home',
    title: 'Sustainable habits',
    description: 'Less waste burning, more reuse and segregation.',
    benefit: 'Avoids open-burning smoke',
    tip: 'Never burn leaves or plastic; use municipal pick-up.'
  }
];

export const COMMUNITY_CHALLENGES: CommunityChallenge[] = [
  { id: 0, title: 'No-burn week', description: 'Avoid burning waste or leaves for 7 days', participants: 412 },
  { id: 1, title: 'Car-free Friday', description: 'Use public transport or walk every Friday', participants: 287 },
  { id: 2, title: 'Switch off standby', description: 'Unplug idle devices nightly', participants: 356 }
];

export const HOURS_24 = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);
export const DAYS_7 = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function generateSyntheticHourly(baseAQI: number, k: number = 1): number[] {
  return Array.from({ length: 24 }, (_, h) =>
    Math.round(baseAQI * k * (0.72 + 0.22 * Math.cos(((h - 8) / 24) * 6.283) + 0.18 * Math.cos(((h - 21) / 24) * 6.283) + 0.04 * Math.sin(h * 2.3)))
  );
}

export function generateSyntheticDaily(baseAQI: number): number[] {
  return [0.82, 0.95, 1.1, 1.04, 0.9, 1.0, 1.0].map(x => Math.round(baseAQI * x));
}
