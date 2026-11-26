import React from 'react';

interface BrandLogoProps {
  collapsed?: boolean;
  showTagline?: boolean;
  size?: 'sm' | 'md';
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  collapsed = false,
  showTagline = false,
  size = 'md',
}) => {
  const markSize = size === 'sm' ? 30 : 36;

  return (
    <div className="flex items-center gap-2.5 select-none">
      <svg
        width={markSize}
        height={markSize}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0 rounded-[11px] shadow-sm"
        aria-hidden="true"
      >
        <rect width="64" height="64" rx="16" fill="#173F35" />
        <path
          d="M19 42C19 27.5 29.5 18 45 18C45 33.5 35.5 44 21 44"
          stroke="#F8F7F2"
          strokeWidth="3.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M15 34.5C22 30.5 30.5 30.5 38 25.5"
          stroke="#A9BFA8"
          strokeWidth="3.1"
          strokeLinecap="round"
        />
        <path
          d="M21 43.5C26.5 39 33.5 37.5 41 35"
          stroke="#E5EFE7"
          strokeWidth="2.6"
          strokeLinecap="round"
          opacity="0.85"
        />
      </svg>

      {!collapsed && (
        <div className="lb flex flex-col leading-none">
          <span className="font-display font-bold tracking-tight text-[18px] text-ink">
            Aireolifye
          </span>
          {showTagline && (
            <span className="text-[10.5px] font-medium text-mute mt-0.5 tracking-wide">
              Breathe better. Live lighter.
            </span>
          )}
        </div>
      )}
    </div>
  );
};
