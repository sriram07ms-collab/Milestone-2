'use client';

import { useEffect, useState } from 'react';
import OverviewCards from '@/components/OverviewCards';
import ThemeTrendChart from '@/components/ThemeTrendChart';
import WeeklyPulseCard from '@/components/WeeklyPulseCard';
import { THEME_COLORS } from '@/lib/types';
import { fetchAllPulses, fetchThemeAggregation } from '@/lib/data-loader';
import type { WeeklyPulseNote, ThemeAggregation } from '@/lib/types';

export default function Dashboard() {
  const [pulses, setPulses] = useState<WeeklyPulseNote[]>([]);
  const [aggregation, setAggregation] = useState<ThemeAggregation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [pulsesData, aggregationData] = await Promise.all([
          fetchAllPulses(),
          fetchThemeAggregation(),
        ]);
        setPulses(pulsesData);
        setAggregation(aggregationData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const latestPulse = pulses.length > 0 ? pulses[0] : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Overview of app review insights and trends</p>
        </div>
        <div className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleDateString()}
        </div>
      </div>
      
      {/* Overview Cards */}
      <OverviewCards aggregation={aggregation} latestPulse={latestPulse} />

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Theme Trends Chart */}
        {aggregation && aggregation.weekly_counts.length > 0 && (
          <div className="lg:col-span-2">
            <ThemeTrendChart data={aggregation.weekly_counts} />
          </div>
        )}

        {/* Top Themes */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Top Themes This Week</h2>
              <span className="text-sm text-gray-500">By review count</span>
            </div>
            <div className="space-y-4">
              {aggregation?.top_themes.slice(0, 5).map((theme, index) => (
                <div key={theme.theme_id} className="flex items-center justify-between group">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 text-gray-600 font-semibold text-sm">
                      {index + 1}
                    </div>
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: THEME_COLORS[theme.theme_id] || '#6b7280' }}
                    />
                    <span className="font-medium text-gray-900 flex-1">
                      {theme.theme_id.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-64 bg-gray-100 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${(theme.count / (aggregation?.top_themes[0]?.count || 1)) * 100}%`,
                          backgroundColor: THEME_COLORS[theme.theme_id] || '#6b7280',
                        }}
                      />
                    </div>
                    <span className="text-gray-900 font-bold text-lg w-16 text-right">{theme.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Latest Weekly Pulse */}
      {latestPulse && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Latest Weekly Pulse</h2>
            <a 
              href="/pulses" 
              className="text-sm text-green-500 hover:text-green-600 font-medium transition-colors"
            >
              View all pulses →
            </a>
          </div>
          <WeeklyPulseCard pulse={latestPulse} />
        </div>
      )}
    </div>
  );
}
