import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AirQualityData, ChatMessage, UserPreferences } from '../types';
import { loadStoredState, saveStoredState, StoredAppState, DEFAULT_STATE } from '../services/storage';
import {
  fetchAirQualityData,
  getDemoAirQuality,
  syncPlannerTaskToBackend,
  resetPlannerBackend,
  syncCommunityChallengeToBackend,
  syncSettingsToBackend,
} from '../services/api';

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
  const [state, setState] = useState<StoredAppState>(() => loadStoredState());
  const [airData, setAirData] = useState<AirQualityData>(() => getDemoAirQuality(state.loc || 'Ludhiana'));
  const [loadingAir, setLoadingAir] = useState<boolean>(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync state changes to localStorage
  useEffect(() => {
    saveStoredState(state);
  }, [state]);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    const timer = setTimeout(() => {
      setToastMessage(null);
    }, 2400);
    return () => clearTimeout(timer);
  }, []);

  const refreshAirData = useCallback(async (cityOverride?: string) => {
    const targetCity = cityOverride || state.loc || 'Ludhiana';
    setLoadingAir(true);
    try {
      const data = await fetchAirQualityData(targetCity);
      setAirData(data);
    } catch (err) {
      console.warn('Failed to fetch air data, falling back to benchmark', err);
      setAirData(getDemoAirQuality(targetCity));
    } finally {
      setLoadingAir(false);
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

  // Compute completed tasks and kg CO2e
  const completedTasksCount = Object.values(state.done).filter(Boolean).length;
  const taskWeights: Record<string, number> = {
    m1: 0,
    m2: 0.1,
    m3: 0.6,
    m4: 1.8,
    a1: 0,
    a2: 0,
    a3: 0.5,
    e1: 0.4,
    e2: 0.3,
    e3: 0,
  };
  const totalKgCo2eAvoided = Object.entries(state.done)
    .filter(([_, isDone]) => isDone)
    .reduce((sum, [id]) => sum + (taskWeights[id] || 0), 0);

  return (
    <AppContext.Provider
      value={{
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
      }}
    >
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
