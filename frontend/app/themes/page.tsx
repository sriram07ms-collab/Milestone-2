'use client';

import { useEffect, useState } from 'react';
import ThemeCard from '@/components/ThemeCard';
import { fetchThemeAggregation, fetchAllPulses } from '@/lib/data-loader';
import type { ThemeAggregation } from '@/lib/types';

export default function ThemesPage() {
  const [aggregation, setAggregation] = useState<ThemeAggregation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await fetchThemeAggregation();
        setAggregation(data);
      } catch (error) {
        console.error('Error loading themes:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading themes...</p>
        </div>
      </div>
    );
  }

  if (!aggregation) {
    return (
      <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-200 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          </div>
          <p className="text-gray-500 text-lg mb-2">No theme data found</p>
          <p className="text-gray-400 text-sm">Run the pipeline to generate data.</p>
        </div>
      </div>
    );
  }

  // Calculate trends (simplified - compare last 2 weeks)
  const calculateTrend = (themeId: string): number | undefined => {
    if (aggregation.weekly_counts.length < 2) return undefined;
    const last = aggregation.weekly_counts[aggregation.weekly_counts.length - 1];
    const prev = aggregation.weekly_counts[aggregation.weekly_counts.length - 2];
    const lastCount = last.theme_counts[themeId] || 0;
    const prevCount = prev.theme_counts[themeId] || 0;
    if (prevCount === 0) return undefined;
    return ((lastCount - prevCount) / prevCount) * 100;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Theme Explorer</h1>
        <p className="text-gray-500 mt-1">Explore themes with trends and statistics</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {aggregation.top_themes.map((theme) => {
          const trend = calculateTrend(theme.theme_id);
          return (
            <ThemeCard
              key={theme.theme_id}
              themeId={theme.theme_id}
              count={theme.count}
              trend={trend}
            />
          );
        })}
      </div>
    </div>
  );
}
