import { ChatMessage, ThemeMode } from '../types';

export interface StoredAppState {
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
  done: Record<string, boolean>;
  chat: ChatMessage[];
  joined: Record<number, boolean>;
  col: boolean;
  theme: ThemeMode;
}

const VALID_THEMES: ReadonlySet<ThemeMode> = new Set(['auto', 'light', 'dark']);

export const DEFAULT_STATE: StoredAppState = {
  name: 'Ishita',
  email: '',
  loc: 'Ludhiana',
  fam: 4,
  sens: 'Children / elderly at home',
  life: 'Mixed commute',
  nt: {
    alert: true,
    daily: true,
    weekly: false,
  },
  priv: {
    share: false,
    anon: true,
  },
  done: {},
  chat: [],
  joined: {},
  col: false,
  theme: 'auto',
};

const STORAGE_KEY = 'bw';

export function loadStoredState(): StoredAppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return DEFAULT_STATE;
    }
    const record = parsed as Partial<StoredAppState>;
    const validTheme = VALID_THEMES.has(record.theme as ThemeMode)
      ? (record.theme as ThemeMode)
      : DEFAULT_STATE.theme;
    const validFam =
      typeof record.fam === 'number' && Number.isInteger(record.fam) && record.fam >= 1 && record.fam <= 20
        ? record.fam
        : DEFAULT_STATE.fam;

    return {
      ...DEFAULT_STATE,
      ...record,
      fam: validFam,
      theme: validTheme,
      nt: { ...DEFAULT_STATE.nt, ...(record.nt || {}) },
      priv: { ...DEFAULT_STATE.priv, ...(record.priv || {}) },
      done: record.done || {},
      chat: Array.isArray(record.chat) ? record.chat : [],
      joined: record.joined || {},
    };
  } catch (err) {
    console.warn('Error reading from localStorage', err);
    return DEFAULT_STATE;
  }
}

export function saveStoredState(state: StoredAppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.warn('Error saving to localStorage', err);
  }
}
