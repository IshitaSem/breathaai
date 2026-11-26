import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { ThemeProvider } from './context/ThemeContext';
import { AppLayout } from './components/layout/AppLayout';
import { ErrorBoundary } from './components/common/ErrorBoundary';

const OverviewPage = lazy(() => import('./pages/OverviewPage').then(m => ({ default: m.OverviewPage })));
const MonitorPage = lazy(() => import('./pages/MonitorPage').then(m => ({ default: m.MonitorPage })));
const AssistantPage = lazy(() => import('./pages/AssistantPage').then(m => ({ default: m.AssistantPage })));
const PlannerPage = lazy(() => import('./pages/PlannerPage').then(m => ({ default: m.PlannerPage })));
const IndoorPage = lazy(() => import('./pages/IndoorPage').then(m => ({ default: m.IndoorPage })));
const GreenerPage = lazy(() => import('./pages/GreenerPage').then(m => ({ default: m.GreenerPage })));
const CommunityPage = lazy(() => import('./pages/CommunityPage').then(m => ({ default: m.CommunityPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })));

const PageFallback: React.FC = () => (
  <div className="flex items-center justify-center py-16 text-sm text-mute">
    Loading view...
  </div>
);

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AppProvider>
        <BrowserRouter>
          <ErrorBoundary>
            <Suspense fallback={<PageFallback />}>
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
            </Suspense>
          </ErrorBoundary>
        </BrowserRouter>
      </AppProvider>
    </ThemeProvider>
  );
};

export default App;
