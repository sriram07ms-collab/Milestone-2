'use client';

import { WeeklyPulseNote } from '@/lib/types';
import { formatDateRange } from '@/lib/utils';
import { Calendar, FileText, MessageSquare, CheckCircle, ArrowRight } from 'lucide-react';

interface WeeklyPulseCardProps {
  pulse: WeeklyPulseNote;
  compact?: boolean;
}

export default function WeeklyPulseCard({ pulse, compact = false }: WeeklyPulseCardProps) {
  // Helper to get theme name
  const getThemeName = (theme: WeeklyPulseNote['themes'][0]) => {
    return theme.name || theme.theme_name || theme.theme_id || 'Unknown Theme';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 hover:shadow-lg hover:border-gray-300 transition-all duration-200">
      {/* Header Section */}
      <div className="border-b border-gray-200 pb-6 mb-8">
        <div className="flex justify-between items-start mb-5">
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">{pulse.title}</h2>
            <div className="flex items-center gap-3 text-gray-600 flex-wrap">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span className="text-sm font-medium">{formatDateRange(pulse.week_start, pulse.week_end)}</span>
              </div>
              <span className="text-gray-400">•</span>
              <span className="text-sm font-medium">{pulse.themes.length} theme{pulse.themes.length !== 1 ? 's' : ''}</span>
              <span className="text-gray-400">•</span>
              <span className="text-sm font-medium">{pulse.quotes.length} quote{pulse.quotes.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
          <span className="bg-green-50 text-green-700 text-xs font-semibold px-4 py-2 rounded-full border border-green-200 flex-shrink-0">
            {pulse.word_count} words
          </span>
        </div>
        
        {/* Overview */}
        <p className="text-gray-700 leading-relaxed text-lg">{pulse.overview}</p>
      </div>

      {!compact && (
        <div className="space-y-8">
          {/* Themes Section */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-blue-100 p-3 rounded-xl">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Themes</h3>
            </div>
            <div className="grid md:grid-cols-1 gap-4">
              {pulse.themes.map((theme, idx) => (
                <div key={idx} className="bg-blue-50 rounded-lg p-5 border-l-4 border-blue-500">
                  <h4 className="font-bold text-gray-900 text-lg mb-2">
                    {getThemeName(theme)}
                  </h4>
                  {theme.summary && (
                    <p className="text-gray-700 leading-relaxed">{theme.summary}</p>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Quotes Section */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-green-100 p-3 rounded-xl">
                <MessageSquare className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Representative Quotes</h3>
            </div>
            <div className="grid md:grid-cols-1 gap-4">
              {pulse.quotes.map((quote, idx) => (
                <div key={idx} className="bg-gray-50 rounded-lg p-5 border-l-4 border-green-500">
                  <p className="text-gray-800 italic leading-relaxed">"{quote}"</p>
                </div>
              ))}
            </div>
          </section>

          {/* Action Ideas Section */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-purple-100 p-3 rounded-xl">
                <CheckCircle className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Action Ideas</h3>
            </div>
            <div className="space-y-3">
              {pulse.actions.map((action, idx) => (
                <div key={idx} className="flex items-start gap-4 bg-purple-50 rounded-lg p-5">
                  <div className="flex-shrink-0 w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold text-sm mt-0.5">
                    {idx + 1}
                  </div>
                  <p className="text-gray-800 leading-relaxed flex-1">{action}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {compact && (
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <div className="flex items-center gap-6 text-sm text-gray-600">
            <span className="font-medium">{pulse.themes.length} theme{pulse.themes.length !== 1 ? 's' : ''}</span>
            <span className="font-medium">{pulse.quotes.length} quote{pulse.quotes.length !== 1 ? 's' : ''}</span>
            <span className="font-medium">{pulse.actions.length} action{pulse.actions.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-2 text-green-600 font-medium">
            <span>View details</span>
            <ArrowRight className="w-5 h-5" />
          </div>
        </div>
      )}
    </div>
  );
}
