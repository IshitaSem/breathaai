import { AirQualityData, AssistantReply, ChatContext, UserPreferences } from '../types';
import { SUPPORTED_CITIES, getAQICategory } from '../constants/mockData';
import {
  calculateIndianNAQI,
  getDemoAirQuality,
  OpenMeteoPayload,
  parseOpenMeteoAirQuality,
} from '../utils/aqi';
import { buildLocalAssistantReply } from './aiFallback';

export { calculateIndianNAQI, getDemoAirQuality };

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

async function postJson(endpoint: string, body?: unknown, timeoutMs = 5000): Promise<Response> {
  const init: RequestInit = { method: 'POST' };
  if (body !== undefined) {
    init.headers = { 'Content-Type': 'application/json' };
    init.body = JSON.stringify(body);
  }
  return fetchWithTimeout(`${API_BASE}${endpoint}`, init, timeoutMs);
}

async function sendNonBlockingPost(endpoint: string, body?: unknown): Promise<void> {
  try {
    await postJson(endpoint, body, 5000);
  } catch {
    // Non-blocking; localStorage handles offline persistence
  }
}

/**
 * Fetch air quality telemetry via backend API, direct Open-Meteo fallback, or demo baseline.
 */
export async function fetchAirQualityData(city: string): Promise<AirQualityData> {
  try {
    const res = await fetchWithTimeout(`${API_BASE}/air-quality?city=${encodeURIComponent(city)}`, {}, 8000);
    if (res.ok) {
      const data = (await res.json()) as AirQualityData;
      return {
        ...data,
        category: getAQICategory(data.aqi),
      };
    }
  } catch {
    // Backend may not be running or network is transitioning
  }

  const cityInfo = SUPPORTED_CITIES[city];
  if (cityInfo) {
    try {
      const omUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${cityInfo.lat}&longitude=${cityInfo.lon}&current=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,us_aqi&hourly=pm10,pm2_5,us_aqi&past_days=1&forecast_days=7&timezone=Asia%2FKolkata`;
      const omRes = await fetchWithTimeout(omUrl, {}, 8000);
      if (omRes.ok) {
        const om = (await omRes.json()) as OpenMeteoPayload;
        return parseOpenMeteoAirQuality(city, cityInfo, om);
      }
    } catch (err) {
      console.warn('Direct Open-Meteo query failed, falling back to benchmark', err);
    }
  }

  return getDemoAirQuality(city);
}

/**
 * Query the backend AI air assistant with graceful fallback to the local contextual engine.
 */
export async function askAIAssistant(
  question: string,
  context: ChatContext
): Promise<AssistantReply> {
  try {
    const res = await postJson('/chat', { question, context }, 16000);
    if (res.ok) {
      const data = (await res.json()) as {
        text?: string;
        t?: string;
        cards?: [string, string][];
        is_live_genai?: boolean;
        model_used?: string;
      };
      return {
        text: data.text || data.t || '',
        cards: data.cards || [],
        isLiveGenAI: Boolean(data.is_live_genai ?? true),
        modelUsed: data.model_used || 'Gemini 2.5 Flash',
      };
    }
  } catch (err) {
    console.warn('Backend /api/chat error, using contextual fallback engine', err);
  }

  await new Promise(resolve => setTimeout(resolve, 600));
  return buildLocalAssistantReply(question, context);
}

// ---------------- Backend Sync Helpers ---------------- //

export async function syncPlannerTaskToBackend(taskId: string, completed: boolean): Promise<void> {
  await sendNonBlockingPost('/planner/toggle', { task_id: taskId, completed });
}

export async function resetPlannerBackend(): Promise<void> {
  await sendNonBlockingPost('/planner/reset');
}

export async function syncCommunityChallengeToBackend(
  challengeId: number,
  isJoined: boolean
): Promise<void> {
  await sendNonBlockingPost('/community/challenge/toggle', {
    challenge_id: challengeId,
    is_joined: isJoined,
  });
}

export async function syncSettingsToBackend(
  settingsPayload: Omit<UserPreferences, 'col'>
): Promise<void> {
  await sendNonBlockingPost('/settings', settingsPayload);
}
