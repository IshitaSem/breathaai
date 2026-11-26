import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useApp } from '../../context/AppContext';
import { BrandLogo } from '../common/BrandLogo';

export const AppLayout: React.FC = () => {
  const { mobileSidebarOpen, setMobileSidebarOpen, toastMessage } = useApp();

  return (
    <div id="app-container">
      {/* Mobile Backdrop */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 transition-opacity md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="bw-main">
        <Header />
        <div id="pg" className="flex-1">
          <Outlet />
        </div>
        <footer className="border-t border-line/70 px-6 md:px-8 py-5 max-w-[1260px] w-full mx-auto flex flex-wrap items-center justify-between gap-3 text-xs text-mute">
          <div className="flex items-center gap-2.5">
            <BrandLogo size="sm" />
            <span>·</span>
            <span>Breathe better. Live lighter.</span>
          </div>
          <span>Your intelligent urban air quality companion.</span>
        </footer>
      </main>

      {/* Floating Toast Notification */}
      <div id="toast" className={toastMessage ? 's' : ''} role="status" aria-live="polite">
        {toastMessage}
      </div>
    </div>
  );
};
