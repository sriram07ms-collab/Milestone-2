'use client';

import { useEffect, useState } from 'react';
import WeeklyPulseCard from '@/components/WeeklyPulseCard';
import Link from 'next/link';
import { fetchAllPulses } from '@/lib/data-loader';
import type { WeeklyPulseNote } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { Calendar, TrendingUp, FileText } from 'lucide-react';

export default function PulsesPage() {
  const [pulses, setPulses] = useState<WeeklyPulseNote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPulses() {
      try {
        const data = await fetchAllPulses();
        setPulses(data);
      } catch (error) {
        console.error('Error loading pulses:', error);
      } finally {
        setLoading(false);
      }
    }
    loadPulses();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading product pulses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Product Pulse</h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">Weekly insights and analysis from user reviews</p>
      </div>

      {pulses.length === 0 ? (
        <div className="bg-white p-8 sm:p-12 rounded-lg shadow-sm border border-gray-200 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 text-base sm:text-lg mb-2">No product pulses found</p>
            <p className="text-gray-400 text-sm">Run the pipeline to generate data.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:gap-4">
          {pulses.map((pulse) => (
            <Link
              key={pulse.week_start}
              href={`/pulses/${pulse.week_start}`}
              className="block group"
            >
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md hover:border-green-300 transition-all duration-200 active:scale-[0.99] touch-manipulation">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 group-hover:text-green-600 transition-colors break-words">
                      {pulse.title}
                    </h2>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span className="whitespace-nowrap">{formatDate(pulse.week_start)} - {formatDate(pulse.week_end)}</span>
                      </div>
                      <span className="text-gray-400 hidden sm:inline">•</span>
                      <span className="whitespace-nowrap">{pulse.themes.length} themes</span>
                      <span className="text-gray-400 hidden sm:inline">•</span>
                      <span className="whitespace-nowrap">{pulse.quotes.length} quotes</span>
                      <span className="text-gray-400 hidden sm:inline">•</span>
                      <span className="whitespace-nowrap">{pulse.actions.length} actions</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-green-600 opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <span className="text-xs sm:text-sm font-medium">View</span>
                    <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                </div>
                <p className="text-sm sm:text-base text-gray-700 line-clamp-2">{pulse.overview}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
