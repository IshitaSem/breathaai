import type { CSSProperties } from 'react';

export const CHART_MARGIN = { top: 12, right: 16, left: -14, bottom: 4 } as const;

export const CHART_GRID_PROPS = {
  strokeDasharray: '3 3',
  stroke: 'var(--line)',
  vertical: false,
} as const;

export const CHART_AXIS_PROPS = {
  stroke: 'var(--mute)',
  fontSize: 11,
  tickLine: false,
  axisLine: { stroke: 'var(--line)' },
} as const;

export const CHART_TOOLTIP_STYLE: CSSProperties = {
  backgroundColor: 'var(--card)',
  borderColor: 'var(--line)',
  borderRadius: '14px',
  boxShadow: '0 8px 24px rgba(23, 63, 53, 0.12)',
  fontSize: '12px',
  color: 'var(--ink)',
};
