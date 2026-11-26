import { ChatMessage } from '../types';

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
  theme: 'auto' | 'light' | 'dark';
}

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
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_STATE,
      ...parsed,
      nt: { ...DEFAULT_STATE.nt, ...(parsed.nt || {}) },
      priv: { ...DEFAULT_STATE.priv, ...(parsed.priv || {}) },
      done: parsed.done || {},
      chat: Array.isArray(parsed.chat) ? parsed.chat : [],
      joined: parsed.joined || {},
    };
  } catch (err) {
    console.warn('Error reading from localStorage', err);
    return DEFAULT_STATE;
  }
}

export function saveStoredState(state: Partial<StoredAppState>): void {
  try {
    const current = loadStoredState();
    const updated = { ...current, ...state };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Error saving to localStorage', err);
  }
}
