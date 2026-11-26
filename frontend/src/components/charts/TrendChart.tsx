import React, { useId } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { ChartDataPoint } from '../../types';
import {
  CHART_AXIS_PROPS,
  CHART_GRID_PROPS,
  CHART_MARGIN,
  CHART_TOOLTIP_STYLE,
} from './chartTheme';

interface TrendChartProps {
  data: ChartDataPoint[];
  color?: string;
  unit?: string;
}

export const TrendChart: React.FC<TrendChartProps> = React.memo(({
  data,
  color = 'var(--g)',
  unit = 'AQI',
}) => {
  const gradientId = useId();

  if (!data || data.length === 0) {
    return <div className="empty">No trend data available</div>;
  }

  const values = data.map(d => d.value);
  const maxVal = Math.max(...values, 100);
  const yDomainMax = Math.ceil((maxVal * 1.15) / 50) * 50;

  return (
    <div style={{ width: '100%', height: 220 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={CHART_MARGIN}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.22} />
              <stop offset="95%" stopColor={color} stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <CartesianGrid {...CHART_GRID_PROPS} />
          <XAxis
            dataKey="label"
            {...CHART_AXIS_PROPS}
            interval={data.length > 12 ? 3 : 0}
          />
          <YAxis {...CHART_AXIS_PROPS} domain={[0, yDomainMax]} />
          <Tooltip
            contentStyle={CHART_TOOLTIP_STYLE}
            formatter={(val: number) => [`${val} ${unit}`, 'Air Quality']}
            labelFormatter={(label: string) => `Time / Period: ${label}`}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2.5}
            fillOpacity={1}
            fill={`url(#${gradientId})`}
            dot={{ r: data.length > 12 ? 2 : 3.5, fill: color }}
            activeDot={{ r: 5, stroke: 'var(--card)', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
});
