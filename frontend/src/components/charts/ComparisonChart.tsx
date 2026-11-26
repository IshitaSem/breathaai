import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
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

interface ComparisonChartProps {
  data: ChartDataPoint[];
  color?: string;
  unit?: string;
}

export const ComparisonChart: React.FC<ComparisonChartProps> = React.memo(({
  data,
  color = 'var(--g)',
  unit = 'AQI',
}) => {
  if (!data || data.length === 0) {
    return <div className="empty">No data available</div>;
  }

  const values = data.map(d => d.value);
  const maxVal = Math.max(...values, 50);
  const yDomainMax = Math.ceil((maxVal * 1.15) / 20) * 20;

  return (
    <div style={{ width: '100%', height: 220 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={CHART_MARGIN}>
          <CartesianGrid {...CHART_GRID_PROPS} />
          <XAxis dataKey="label" {...CHART_AXIS_PROPS} />
          <YAxis {...CHART_AXIS_PROPS} domain={[0, yDomainMax]} />
          <Tooltip
            contentStyle={CHART_TOOLTIP_STYLE}
            formatter={(val: number) => [`${val} ${unit}`, 'Value']}
          />
          <Bar
            dataKey="value"
            fill={color}
            radius={[8, 8, 0, 0]}
            maxBarSize={44}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
});
