'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { WeeklyThemeCounts, THEME_COLORS } from '@/lib/types';
import { formatDate } from '@/lib/utils';

interface ThemeTrendChartProps {
  data: WeeklyThemeCounts[];
}

export default function ThemeTrendChart({ data }: ThemeTrendChartProps) {
  // Sort by week_start_date to ensure the trend line flows chronologically
  const sorted = [...data].sort((a, b) =>
    a.week_start_date.localeCompare(b.week_start_date)
  );

  // Transform data for Recharts
  const chartData = sorted.map(week => {
    const entry: any = {
      week: formatDate(week.week_start_date),
      week_start: week.week_start_date,
    };
    
    // Add each theme count
    Object.entries(week.theme_counts).forEach(([theme, count]) => {
      entry[theme] = count;
    });
    
    return entry;
  });

  // Get all unique themes from the data
  const allThemes = new Set<string>();
  data.forEach(week => {
    Object.keys(week.theme_counts).forEach(theme => allThemes.add(theme));
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Theme Trends</h2>
          <p className="text-sm text-gray-500 mt-1">Review distribution across themes over time</p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis 
            dataKey="week" 
            stroke="#6B7280"
            style={{ fontSize: '12px', fontWeight: 500 }}
            tick={{ fill: '#6B7280' }}
          />
          <YAxis 
            stroke="#6B7280"
            style={{ fontSize: '12px', fontWeight: 500 }}
            tick={{ fill: '#6B7280' }}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#fff', 
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
            labelStyle={{ color: '#1F2937', fontWeight: 600 }}
          />
          <Legend 
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="line"
          />
          {Array.from(allThemes).map((theme) => (
            <Line
              key={theme}
              type="monotone"
              dataKey={theme}
              name={theme.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              stroke={THEME_COLORS[theme] || '#6b7280'}
              strokeWidth={3}
              dot={{ r: 5, fill: THEME_COLORS[theme] || '#6b7280' }}
              activeDot={{ r: 7 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
