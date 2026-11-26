import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { AirQualityData, ChatMessage, UserPreferences } from '../types';
import { loadStoredState, saveStoredState, StoredAppState, DEFAULT_STATE } from '../services/storage';
import { PLANNER_TASKS } from '../constants/mockData';
import { useTheme } from './ThemeContext';
import {
  fetchAirQualityData,
  getDemoAirQuality,
  syncPlannerTaskToBackend,
  resetPlannerBackend,
  syncCommunityChallengeToBackend,
  syncSettingsToBackend,
} from '../services/api';

const TASK_WEIGHTS: Record<string, number> = Object.fromEntries(
  PLANNER_TASKS.map(t => [t.id, t.co2eKg])
);

interface AppContextType {
  state: StoredAppState;
  updateUserPreferences: (prefs: Partial<UserPreferences>) => void;
  resetAllSettings: () => void;
  airData: AirQualityData;
  loadingAir: boolean;
  refreshAirData: (city?: string) => Promise<void>;
  toggleTaskDone: (taskId: string, done: boolean) => void;
  resetDayTasks: () => void;
  chatMessages: ChatMessage[];
  addChatMessage: (msg: ChatMessage) => void;
  clearChatHistory: () => void;
  toggleChallengeJoined: (challengeId: number) => void;
  sidebarCollapsed: boolean;
  toggleSidebarCollapse: () => void;
  mobileSidebarOpen: boolean;
  setMobileSidebarOpen: (open: boolean) => void;
  toastMessage: string | null;
  showToast: (msg: string) => void;
  completedTasksCount: number;
  totalKgCo2eAvoided: number;
  plannerProgressPercent: number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function extractSettingsPayload(state: StoredAppState): Omit<UserPreferences, 'col'> {
  return {
    name: state.name,
    email: state.email,
    loc: state.loc,
    fam: state.fam,
    life: state.life,
    sens: state.sens,
    theme: state.theme,
    nt: state.nt,
    priv: state.priv,
  };
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { setTheme } = useTheme();
  const [state, setState] = useState<StoredAppState>(() => loadStoredState());
  const stateRef = useRef<StoredAppState>(state);

  const [airData, setAirData] = useState<AirQualityData>(() => getDemoAirQuality(state.loc || 'Ludhiana'));
  const [loadingAir, setLoadingAir] = useState<boolean>(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const airRequestIdRef = useRef<number>(0);
  const isInitialMountRef = useRef<boolean>(true);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Sync persisted theme preference on initial mount and whenever theme setting changes
  useEffect(() => {
    setTheme(state.theme || 'auto');
  }, [state.theme, setTheme]);

  // Sync state changes to localStorage (skip redundant write on initial mount)
  useEffect(() => {
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      return;
    }
    saveStoredState(state);
  }, [state]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current !== null) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const showToast = useCallback((msg: string) => {
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
    }
    setToastMessage(msg);
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage(null);
      toastTimerRef.current = null;
    }, 2400);
  }, []);

  const refreshAirData = useCallback(async (cityOverride?: string) => {
    const targetCity = cityOverride || state.loc || 'Ludhiana';
    const requestId = ++airRequestIdRef.current;
    setLoadingAir(true);
    try {
      const data = await fetchAirQualityData(targetCity);
      if (requestId === airRequestIdRef.current) {
        setAirData(data);
      }
    } catch (err) {
      console.warn('Failed to fetch air data, falling back to benchmark', err);
      if (requestId === airRequestIdRef.current) {
        setAirData(getDemoAirQuality(targetCity));
      }
    } finally {
      if (requestId === airRequestIdRef.current) {
        setLoadingAir(false);
      }
    }
  }, [state.loc]);

  // Initial load and whenever state.loc changes
  useEffect(() => {
    refreshAirData(state.loc);
  }, [state.loc, refreshAirData]);

  // Apply pure functional updates to React state while tracking next snapshot for side effects
  const applyStateUpdate = useCallback(
    (updater: (prev: StoredAppState) => StoredAppState): StoredAppState => {
      const next = updater(stateRef.current);
      stateRef.current = next;
      setState(updater);
      return next;
    },
    []
  );

  const updateUserPreferences = useCallback((prefs: Partial<UserPreferences>) => {
    const next = applyStateUpdate(prev => ({ ...prev, ...prefs }));
    syncSettingsToBackend(extractSettingsPayload(next));
  }, [applyStateUpdate]);

  const resetAllSettings = useCallback(() => {
    applyStateUpdate(() => DEFAULT_STATE);
    syncSettingsToBackend(extractSettingsPayload(DEFAULT_STATE));
    showToast('Reset settings to default');
  }, [applyStateUpdate, showToast]);

  const toggleTaskDone = useCallback((taskId: string, done: boolean) => {
    applyStateUpdate(prev => ({
      ...prev,
      done: {
        ...prev.done,
        [taskId]: done,
      },
    }));
    syncPlannerTaskToBackend(taskId, done);
  }, [applyStateUpdate]);

  const resetDayTasks = useCallback(() => {
    applyStateUpdate(prev => ({
      ...prev,
      done: {},
    }));
    resetPlannerBackend();
    showToast('Day reset');
  }, [applyStateUpdate, showToast]);

  const addChatMessage = useCallback((msg: ChatMessage) => {
    applyStateUpdate(prev => ({
      ...prev,
      chat: [...prev.chat, msg],
    }));
  }, [applyStateUpdate]);

  const clearChatHistory = useCallback(() => {
    applyStateUpdate(prev => ({
      ...prev,
      chat: [],
    }));
    showToast('Chat history cleared');
  }, [applyStateUpdate, showToast]);

  const toggleChallengeJoined = useCallback((challengeId: number) => {
    const next = applyStateUpdate(prev => ({
      ...prev,
      joined: {
        ...prev.joined,
        [challengeId]: !prev.joined[challengeId],
      },
    }));
    syncCommunityChallengeToBackend(challengeId, Boolean(next.joined[challengeId]));
  }, [applyStateUpdate]);

  const toggleSidebarCollapse = useCallback(() => {
    applyStateUpdate(prev => ({
      ...prev,
      col: !prev.col,
    }));
  }, [applyStateUpdate]);

  // Compute completed tasks, progress, and kg CO2e only when state.done changes
  const { completedTasksCount, totalKgCo2eAvoided, plannerProgressPercent } = useMemo(() => {
    let count = 0;
    let co2e = 0;
    for (const [id, isDone] of Object.entries(state.done)) {
      if (isDone) {
        count += 1;
        co2e += TASK_WEIGHTS[id] || 0;
      }
    }
    const totalTasks = PLANNER_TASKS.length;
    const pct = totalTasks > 0 ? Math.min(100, Math.round((count / totalTasks) * 100)) : 0;
    return {
      completedTasksCount: count,
      totalKgCo2eAvoided: co2e,
      plannerProgressPercent: pct,
    };
  }, [state.done]);

  const contextValue = useMemo<AppContextType>(
    () => ({
      state,
      updateUserPreferences,
      resetAllSettings,
      airData,
      loadingAir,
      refreshAirData,
      toggleTaskDone,
      resetDayTasks,
      chatMessages: state.chat,
      addChatMessage,
      clearChatHistory,
      toggleChallengeJoined,
      sidebarCollapsed: state.col,
      toggleSidebarCollapse,
      mobileSidebarOpen,
      setMobileSidebarOpen,
      toastMessage,
      showToast,
      completedTasksCount,
      totalKgCo2eAvoided,
      plannerProgressPercent,
    }),
    [
      state,
      updateUserPreferences,
      resetAllSettings,
      airData,
      loadingAir,
      refreshAirData,
      toggleTaskDone,
      resetDayTasks,
      addChatMessage,
      clearChatHistory,
      toggleChallengeJoined,
      toggleSidebarCollapse,
      mobileSidebarOpen,
      toastMessage,
      showToast,
      completedTasksCount,
      totalKgCo2eAvoided,
      plannerProgressPercent,
    ]
  );

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export function useApp(): AppContextType {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
