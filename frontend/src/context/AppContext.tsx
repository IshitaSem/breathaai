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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { setTheme } = useTheme();
  const [state, setState] = useState<StoredAppState>(() => loadStoredState());
  const [airData, setAirData] = useState<AirQualityData>(() => getDemoAirQuality(state.loc || 'Ludhiana'));
  const [loadingAir, setLoadingAir] = useState<boolean>(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const airRequestIdRef = useRef<number>(0);
  const isInitialMountRef = useRef<boolean>(true);

  // Sync persisted theme preference on initial mount
  useEffect(() => {
    if (state.theme) {
      setTheme(state.theme);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const updateUserPreferences = useCallback((prefs: Partial<UserPreferences>) => {
    setState(prev => {
      const updated = { ...prev, ...prefs };
      syncSettingsToBackend({
        name: updated.name,
        email: updated.email,
        loc: updated.loc,
        fam: updated.fam,
        life: updated.life,
        sens: updated.sens,
        theme: updated.theme,
        nt: updated.nt,
        priv: updated.priv,
      });
      return updated;
    });
  }, []);

  const resetAllSettings = useCallback(() => {
    setState(DEFAULT_STATE);
    syncSettingsToBackend(DEFAULT_STATE);
    showToast('Reset settings to default');
  }, [showToast]);

  const toggleTaskDone = useCallback((taskId: string, done: boolean) => {
    setState(prev => ({
      ...prev,
      done: {
        ...prev.done,
        [taskId]: done,
      },
    }));
    syncPlannerTaskToBackend(taskId, done);
  }, []);

  const resetDayTasks = useCallback(() => {
    setState(prev => ({
      ...prev,
      done: {},
    }));
    resetPlannerBackend();
    showToast('Day reset');
  }, [showToast]);

  const addChatMessage = useCallback((msg: ChatMessage) => {
    setState(prev => ({
      ...prev,
      chat: [...prev.chat, msg],
    }));
  }, []);

  const clearChatHistory = useCallback(() => {
    setState(prev => ({
      ...prev,
      chat: [],
    }));
    showToast('Chat history cleared');
  }, [showToast]);

  const toggleChallengeJoined = useCallback((challengeId: number) => {
    setState(prev => {
      const isJoined = !prev.joined[challengeId];
      syncCommunityChallengeToBackend(challengeId, isJoined);
      return {
        ...prev,
        joined: {
          ...prev.joined,
          [challengeId]: isJoined,
        },
      };
    });
  }, []);

  const toggleSidebarCollapse = useCallback(() => {
    setState(prev => ({
      ...prev,
      col: !prev.col,
    }));
  }, []);

  // Compute completed tasks and kg CO2e only when state.done changes
  const { completedTasksCount, totalKgCo2eAvoided } = useMemo(() => {
    let count = 0;
    let co2e = 0;
    for (const [id, isDone] of Object.entries(state.done)) {
      if (isDone) {
        count += 1;
        co2e += TASK_WEIGHTS[id] || 0;
      }
    }
    return { completedTasksCount: count, totalKgCo2eAvoided: co2e };
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
