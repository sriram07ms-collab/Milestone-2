'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, Clock, CheckCircle } from 'lucide-react';
import { fetchAllPulses } from '@/lib/data-loader';
import { formatDateRange } from '@/lib/utils';
import type { WeeklyPulseNote } from '@/lib/types';

export default function ActionsPage() {
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

  // Helper to get theme name
  const getThemeName = (theme: WeeklyPulseNote['themes'][0]) => {
    return theme.name || theme.theme_name || theme.theme_id || 'Unknown';
  };

  // Extract all actions from all pulses
  const allActions = pulses.flatMap((pulse) =>
    pulse.actions.map((action) => ({
      action,
      week: pulse.week_start,
      weekRange: formatDateRange(pulse.week_start, pulse.week_end),
      themes: pulse.themes.map(t => getThemeName(t)).filter(t => t !== 'Unknown'),
    }))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading actions...</p>
        </div>
      </div>
    );
  }

  if (allActions.length === 0) {
    return (
      <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-200 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-gray-500 text-lg mb-2">No action ideas found</p>
          <p className="text-gray-400 text-sm">Run the pipeline to generate data.</p>
        </div>
      </div>
    );
  }

  // Group by priority (simplified - based on theme count)
  const highPriority = allActions.slice(0, Math.ceil(allActions.length * 0.3));
  const mediumPriority = allActions.slice(
    Math.ceil(allActions.length * 0.3),
    Math.ceil(allActions.length * 0.7)
  );
  const lowPriority = allActions.slice(Math.ceil(allActions.length * 0.7));

  const prioritySections = [
    {
      title: 'High Priority',
      icon: AlertCircle,
      bgColor: 'bg-red-100',
      iconColor: 'text-red-600',
      borderColor: 'border-red-500',
      badgeBg: 'bg-red-50',
      badgeText: 'text-red-700',
      actions: highPriority,
    },
    {
      title: 'Medium Priority',
      icon: Clock,
      bgColor: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      borderColor: 'border-yellow-500',
      badgeBg: 'bg-yellow-50',
      badgeText: 'text-yellow-700',
      actions: mediumPriority,
    },
    {
      title: 'Low Priority',
      icon: CheckCircle,
      bgColor: 'bg-green-100',
      iconColor: 'text-green-600',
      borderColor: 'border-green-500',
      badgeBg: 'bg-green-50',
      badgeText: 'text-green-700',
      actions: lowPriority,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Action Ideas Board</h1>
        <p className="text-gray-500 mt-1">Prioritized action items from all weekly pulses</p>
      </div>

      <div className="space-y-8">
        {prioritySections.map((section) => {
          const Icon = section.icon;
          if (section.actions.length === 0) return null;
          
          return (
            <section key={section.title}>
              <div className="flex items-center gap-3 mb-6">
                <div className={section.bgColor + ' p-2 rounded-lg'}>
                  <Icon className={`w-6 h-6 ${section.iconColor}`} />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900">{section.title}</h2>
                <span className={`${section.badgeBg} ${section.badgeText} text-sm font-medium px-3 py-1 rounded-full`}>
                  {section.actions.length} items
                </span>
              </div>
              <div className="grid gap-4">
                {section.actions.map((item, idx) => (
                  <div 
                    key={idx} 
                    className={`bg-white p-6 rounded-xl shadow-sm border-l-4 ${section.borderColor} hover:shadow-md transition-shadow`}
                  >
                    <p className="text-gray-900 font-medium mb-4 text-base leading-relaxed">{item.action}</p>
                    <div className="flex items-center gap-6 text-sm text-gray-500">
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="font-medium">{item.weekRange}</span>
                      </span>
                      {item.themes.length > 0 && (
                        <span className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                          <span className="font-medium">{item.themes.join(', ')}</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
