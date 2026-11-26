import React from 'react';
import { NavLink } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Leaf } from 'lucide-react';
import { NAV_ITEMS } from '../../constants/navigation';
import { useApp } from '../../context/AppContext';
import { BrandLogo } from '../common/BrandLogo';

export const Sidebar: React.FC = () => {
  const {
    sidebarCollapsed,
    toggleSidebarCollapse,
    mobileSidebarOpen,
    setMobileSidebarOpen,
    airData,
  } = useApp();

  const sidebarClass = `bw-sidebar ${sidebarCollapsed ? 'c' : ''} ${mobileSidebarOpen ? 'open' : ''}`;

  return (
    <aside className={sidebarClass} aria-label="Main Navigation">
      <div className="px-1.5 pt-1 pb-4">
        <BrandLogo collapsed={sidebarCollapsed} showTagline />
      </div>

      <nav className="flex flex-col gap-1 flex-1">
        {NAV_ITEMS.map(item => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.id}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => `nv ${isActive ? 'on' : ''}`}
              title={item.label}
              onClick={() => setMobileSidebarOpen(false)}
            >
              <Icon size={19} strokeWidth={1.9} />
              <span className="lb">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {!sidebarCollapsed && (
        <div className="lb mx-1 mb-2 p-3 rounded-2xl bg-cream border border-line/80">
          <div className="flex items-center gap-2 text-xs font-semibold text-forest mb-1">
            <Leaf size={13} />
            <span>{airData.loc} Air Pulse</span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="font-display text-lg font-bold" style={{ color: airData.category.color }}>
              AQI {airData.aqi}
            </span>
            <span className="text-[11px] font-medium text-mute">{airData.category.name}</span>
          </div>
        </div>
      )}

      <button
        type="button"
        className="col-btn"
        onClick={toggleSidebarCollapse}
        aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {sidebarCollapsed ? (
          <ChevronRight size={16} strokeWidth={2} />
        ) : (
          <>
            <ChevronLeft size={16} strokeWidth={2} />
            <span className="lb text-xs font-medium">Collapse</span>
          </>
        )}
      </button>
    </aside>
  );
};
