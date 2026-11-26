import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface TrendChartProps {
  data: { label: string; value: number }[];
  color?: string;
  unit?: string;
}

export const TrendChart: React.FC<TrendChartProps> = ({
  data,
  color = 'var(--g)',
  unit = 'AQI',
}) => {
  if (!data || data.length === 0) {
    return <div className="empty">No trend data available</div>;
  }

  const values = data.map(d => d.value);
  const maxVal = Math.max(...values, 100);
  const yDomainMax = Math.ceil((maxVal * 1.15) / 50) * 50;

  return (
    <div style={{ width: '100%', height: 220 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 12, right: 16, left: -14, bottom: 4 }}
        >
          <defs>
            <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.22} />
              <stop offset="95%" stopColor={color} stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
          <XAxis
            dataKey="label"
            stroke="var(--mute)"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: 'var(--line)' }}
            interval={data.length > 12 ? 3 : 0}
          />
          <YAxis
            stroke="var(--mute)"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: 'var(--line)' }}
            domain={[0, yDomainMax]}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--card)',
              borderColor: 'var(--line)',
              borderRadius: '14px',
              boxShadow: '0 8px 24px rgba(23, 63, 53, 0.12)',
              fontSize: '12px',
              color: 'var(--ink)',
            }}
            formatter={(val: number) => [`${val} ${unit}`, 'Air Quality']}
            labelFormatter={(label: string) => `Time / Period: ${label}`}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#trendGradient)"
            dot={{ r: data.length > 12 ? 2 : 3.5, fill: color }}
            activeDot={{ r: 5, stroke: 'var(--card)', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
