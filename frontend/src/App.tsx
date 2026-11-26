import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { ThemeProvider } from './context/ThemeContext';
import { AppLayout } from './components/layout/AppLayout';
import { OverviewPage } from './pages/OverviewPage';
import { MonitorPage } from './pages/MonitorPage';
import { AssistantPage } from './pages/AssistantPage';
import { PlannerPage } from './pages/PlannerPage';
import { IndoorPage } from './pages/IndoorPage';
import { GreenerPage } from './pages/GreenerPage';
import { CommunityPage } from './pages/CommunityPage';
import { SettingsPage } from './pages/SettingsPage';

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AppProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<AppLayout />}>
              <Route index element={<OverviewPage />} />
              <Route path="monitor" element={<MonitorPage />} />
              <Route path="assistant" element={<AssistantPage />} />
              <Route path="planner" element={<PlannerPage />} />
              <Route path="indoor" element={<IndoorPage />} />
              <Route path="greener" element={<GreenerPage />} />
              <Route path="community" element={<CommunityPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </ThemeProvider>
  );
};

export default App;
