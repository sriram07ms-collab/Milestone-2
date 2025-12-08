'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { WeeklyThemeCounts, THEME_COLORS } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { parseISO, subWeeks, isAfter, isEqual } from 'date-fns';

interface ThemeTrendChartProps {
  data: WeeklyThemeCounts[];
}

export default function ThemeTrendChart({ data }: ThemeTrendChartProps) {
  // Calculate the cutoff date (3 weeks ago from today)
  const today = new Date();
  const threeWeeksAgo = subWeeks(today, 3);
  
  // Filter data to only include last 3 weeks from current date
  const filteredData = data.filter(week => {
    try {
      const weekDate = parseISO(week.week_start_date);
      return isAfter(weekDate, threeWeeksAgo) || isEqual(weekDate, threeWeeksAgo);
    } catch {
      return false;
    }
  });

  // Sort by week_start_date to ensure the trend line flows chronologically
  const sorted = [...filteredData].sort((a, b) =>
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

  // Get all unique themes from the filtered data
  const allThemes = new Set<string>();
  filteredData.forEach(week => {
    Object.keys(week.theme_counts).forEach(theme => allThemes.add(theme));
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-4 sm:mb-6 lg:mb-8">
        <div>
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Theme Trends</h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-1.5">Last 3 weeks review distribution across themes</p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300} className="sm:h-[400px] lg:h-[450px]">
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }} className="sm:!mr-[30px] sm:!ml-[10px] sm:!mb-[10px]">
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
          <XAxis 
            dataKey="week" 
            stroke="#94A3B8"
            style={{ fontSize: '11px', fontWeight: 500 }}
            tick={{ fill: '#64748B' }}
            axisLine={false}
            tickLine={false}
            className="sm:!text-[13px]"
          />
          <YAxis 
            stroke="#94A3B8"
            style={{ fontSize: '11px', fontWeight: 500 }}
            tick={{ fill: '#64748B' }}
            axisLine={false}
            tickLine={false}
            className="sm:!text-[13px]"
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#fff', 
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              padding: '12px',
            }}
            labelStyle={{ color: '#0F172A', fontWeight: 600, marginBottom: '8px', fontSize: '13px' }}
            itemStyle={{ padding: '4px 0', fontSize: '13px' }}
          />
          <Legend 
            wrapperStyle={{ paddingTop: '16px', fontSize: '11px' }}
            iconType="line"
            iconSize={12}
            className="sm:!text-[13px] sm:[&_svg]:!w-4 sm:[&_svg]:!h-4"
          />
          {Array.from(allThemes).map((theme) => (
            <Line
              key={theme}
              type="monotone"
              dataKey={theme}
              name={theme.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              stroke={THEME_COLORS[theme] || '#6b7280'}
              strokeWidth={2.5}
              dot={{ r: 4, fill: THEME_COLORS[theme] || '#6b7280', strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
