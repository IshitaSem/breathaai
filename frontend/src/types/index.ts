export type PollutantKey = 'pm25' | 'pm10' | 'no2' | 'so2' | 'co' | 'o3';

export type ThemeMode = 'auto' | 'light' | 'dark';

export interface ChartDataPoint {
  label: string;
  value: number;
}

export interface PollutantDefinition {
  key: PollutantKey;
  name: string;
  formula: string;
  unit: string;
  referenceLevel: number;
  description: string;
}

export interface AQICategory {
  maxVal: number;
  name: string;
  color: string;
  advice: string;
  healthRisk: 'Low' | 'Moderate' | 'High' | 'Severe' | 'Very Severe';
}

export interface HourlyReading {
  hour: string;
  aqi: number;
  pm25?: number;
  pm10?: number;
}

export interface DailyForecast {
  day: string;
  aqi: number;
  category: string;
}

export interface StationReading {
  name: string;
  aqi: number;
  category: string;
  color: string;
  x: number; // 0-1 for relative positioning on map
  y: number; // 0-1 for relative positioning on map
}

export interface AirQualityData {
  loc: string;
  aqi: number; // Indian NAQI
  usAqi?: number; // US EPA AQI
  indexStandard: string;
  category: AQICategory;
  pollutants: {
    pm25: number | null;
    pm10: number | null;
    no2: number | null;
    so2: number | null;
    co: number | null;
    o3: number | null;
    nh3?: number | null;
    pb?: number | null;
    pm25_24h_avg?: number | null;
    pm10_24h_avg?: number | null;
    no2_24h_avg?: number | null;
    so2_24h_avg?: number | null;
    co_8h_avg?: number | null;
    o3_8h_avg?: number | null;
  };
  hourly: HourlyReading[];
  daily: DailyForecast[];
  stations: StationReading[];
  lastUpdated: string;
  measurementTime?: string;
  dominantPollutant?: string;
  isLive: boolean;
  source: string;
  modelProvider?: string;
  modelResolution?: string;
  averagingMethod?: string;
  dataClassification?: string;
  cpcbSufficient?: boolean;
  averagingCoverageComplete?: boolean | null;
  coordinates?: { latitude: number; longitude: number };
}

export interface ChatContext {
  loc: string;
  aqi: number;
  pm25: number;
  pm10: number;
  fam: number;
  sens: string;
  life: string;
}

export interface AssistantReply {
  text: string;
  cards: [string, string][];
  isLiveGenAI: boolean;
  modelUsed: string;
}

export interface ChatMessage {
  id: string;
  role: 'u' | 'a';
  text: string;
  cards?: [string, string][];
  isLiveGenAI?: boolean;
  timestamp?: string;
}

export interface UserPreferences {
  name: string;
  email: string;
  loc: string;
  fam: number;
  sens: string;
  life: string;
  nt: {
    alert: boolean;
    daily: boolean;
    weekly: boolean;
  };
  priv: {
    share: boolean;
    anon: boolean;
  };
  theme: ThemeMode;
  col: boolean;
}

export interface PlannerTask {
  id: string;
  timeOfDay: 'Morning' | 'Afternoon' | 'Evening';
  description: string;
  co2eKg: number;
}

export interface GreenerChoice {
  category: 'Transport' | 'Home';
  title: string;
  description: string;
  benefit: string;
  tip: string;
}

export interface CommunityChallenge {
  id: number;
  title: string;
  description: string;
  participants: number;
}
