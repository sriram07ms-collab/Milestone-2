'use client';

import { useEffect, useState } from 'react';
import WeeklyPulseCard from '@/components/WeeklyPulseCard';
import Link from 'next/link';
import { fetchAllPulses } from '@/lib/data-loader';
import type { WeeklyPulseNote } from '@/lib/types';

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
          <p className="text-gray-600">Loading pulses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Weekly Pulse Notes</h1>
          <p className="text-gray-500 mt-1">Browse all weekly insights and analysis</p>
        </div>
      </div>
      
      {pulses.length === 0 ? (
        <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-200 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-500 text-lg mb-2">No pulse notes found</p>
            <p className="text-gray-400 text-sm">Run the pipeline to generate data.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {pulses.map((pulse) => (
            <Link 
              key={pulse.week_start} 
              href={`/pulses/${pulse.week_start}`}
              className="block"
            >
              <WeeklyPulseCard pulse={pulse} compact />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
