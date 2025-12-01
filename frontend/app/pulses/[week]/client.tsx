'use client';

import { useEffect, useState } from 'react';
import WeeklyPulseCard from '@/components/WeeklyPulseCard';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { fetchPulse } from '@/lib/data-loader';
import type { WeeklyPulseNote } from '@/lib/types';

export default function PulseDetailClient({ week }: { week: string }) {
  const [pulse, setPulse] = useState<WeeklyPulseNote | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPulse() {
      if (!week) return;
      try {
        const data = await fetchPulse(week);
        setPulse(data);
      } catch (error) {
        console.error('Error loading pulse:', error);
      } finally {
        setLoading(false);
      }
    }
    loadPulse();
  }, [week]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading pulse...</p>
        </div>
      </div>
    );
  }

  if (!pulse) {
    return (
      <div className="space-y-6">
        <Link 
          href="/pulses" 
          className="inline-flex items-center gap-2 text-green-500 hover:text-green-600 font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to all pulses
        </Link>
        <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-200 text-center">
          <p className="text-gray-500 text-lg">Pulse not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link 
        href="/pulses" 
        className="inline-flex items-center gap-2 text-green-500 hover:text-green-600 font-medium transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to all pulses
      </Link>
      
      <WeeklyPulseCard pulse={pulse} />
    </div>
  );
}

