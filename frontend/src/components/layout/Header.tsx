import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Bell, Settings, MapPin, Search } from 'lucide-react';
import { SUPPORTED_CITIES } from '../../constants/mockData';
import { NAV_ITEMS } from '../../constants/navigation';
import { useApp } from '../../context/AppContext';

export const Header: React.FC = () => {
  const {
    state,
    updateUserPreferences,
    airData,
    completedTasksCount,
    setMobileSidebarOpen,
    showToast,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return;

      const matched = NAV_ITEMS.find(
        item => item.label.toLowerCase().includes(q) || item.searchKeywords.includes(q)
      );

      if (matched) {
        navigate(matched.path);
        setSearchQuery('');
      } else {
        showToast(`No matching page for "${q}"`);
      }
    }
  };

  const remainingTasks = 10 - completedTasksCount;
  const userInitial = (state.name?.trim().charAt(0) || 'U').toUpperCase();

  return (
    <header className="bw-header">
      <button
        type="button"
        id="burger"
        className="ib"
        onClick={() => setMobileSidebarOpen(true)}
        aria-label="Open navigation menu"
      >
        <Menu size={20} strokeWidth={2} />
      </button>

      <div className="relative flex items-center">
        <MapPin size={15} className="absolute left-3 text-forest pointer-events-none" />
        <select
          className="in font-medium pl-8 pr-7"
          value={state.loc}
          onChange={e => updateUserPreferences({ loc: e.target.value })}
          aria-label="Select City"
        >
          {Object.keys(SUPPORTED_CITIES).map(cityName => (
            <option key={cityName} value={cityName}>
              {cityName}
            </option>
          ))}
        </select>
      </div>

      <div className="relative flex-1 max-w-[340px] min-w-[160px] hidden sm:block">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-mute pointer-events-none" />
        <input
          type="search"
          className="in w-full pl-9"
          id="sr"
          placeholder="Search pages (monitor, chat, planner)..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          onKeyDown={handleSearch}
          aria-label="Search pages"
        />
      </div>

      <span className="sp" />

      {/* Live AQI quick indicator */}
      <button
        type="button"
        onClick={() => navigate('/monitor')}
        className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-card border border-line text-xs font-medium hover:border-sage transition-colors"
        title="View Air Quality Monitor"
      >
        <span
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: airData.category.color }}
        />
        <span className="text-mute">{airData.loc}</span>
        <span className="font-display font-bold text-ink">AQI {airData.aqi}</span>
      </button>

      {/* Notifications Popover */}
      <div className="relative" ref={notifRef}>
        <button
          type="button"
          className="ib"
          onClick={() => setShowNotifications(prev => !prev)}
          aria-label="Notifications"
          title="Notifications"
        >
          <Bell size={18} strokeWidth={1.9} />
          <span
            style={{
              position: 'absolute',
              top: '8px',
              right: '9px',
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: 'var(--terracotta)',
            }}
          />
        </button>

        {showNotifications && (
          <div className="dd" role="dialog" aria-label="Notifications panel">
            <div className="font-display font-semibold text-xs uppercase tracking-wider text-mute">
              Live Air Alerts
            </div>
            <div>
              <span className="font-semibold">{airData.loc}:</span> AQI is currently{' '}
              <b style={{ color: airData.category.color }}>{airData.aqi}</b> ({airData.category.name}).{' '}
              {airData.aqi > 200 ? 'Limit prolonged outdoor exposure.' : 'Air quality acceptable.'}
            </div>
            <div>
              <span className="font-semibold">Daily Planner:</span> You have{' '}
              <b>{remainingTasks > 0 ? remainingTasks : 0}</b> actions left to complete today.
            </div>
            <div className="text-xs text-mute">
              Data Source: {airData.source}
            </div>
          </div>
        )}
      </div>

      <button
        type="button"
        className="ib"
        onClick={() => navigate('/settings')}
        aria-label="Settings"
        title="Settings"
      >
        <Settings size={18} strokeWidth={1.9} />
      </button>

      <div
        className="av cursor-pointer"
        title={`Profile: ${state.name} (${state.loc})`}
        onClick={() => navigate('/settings')}
      >
        {userInitial}
      </div>
    </header>
  );
};
