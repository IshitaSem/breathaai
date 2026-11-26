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

interface ComparisonChartProps {
  data: { label: string; value: number }[];
  color?: string;
  unit?: string;
}

export const ComparisonChart: React.FC<ComparisonChartProps> = ({
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
        <BarChart
          data={data}
          margin={{ top: 12, right: 16, left: -14, bottom: 4 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
          <XAxis
            dataKey="label"
            stroke="var(--mute)"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: 'var(--line)' }}
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
};
