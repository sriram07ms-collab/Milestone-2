'use client';

import { THEME_ICONS, THEME_COLORS } from '@/lib/types';
import { formatThemeName } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface ThemeCardProps {
  themeId: string;
  count: number;
  trend?: number; // percentage change
  keyPoints?: string[];
  quotes?: string[];
}

export default function ThemeCard({ themeId, count, trend, keyPoints, quotes }: ThemeCardProps) {
  const themeName = formatThemeName(themeId);
  const icon = THEME_ICONS[themeId] || '📋';
  const color = THEME_COLORS[themeId] || '#6b7280';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
            style={{ backgroundColor: `${color}15` }}
          >
            {icon}
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">{themeName}</h3>
            <p className="text-xs text-gray-500 mt-0.5">Theme ID: {themeId}</p>
          </div>
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${trend >= 0 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
            {trend >= 0 ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            <span className="text-xs font-semibold">{Math.abs(trend).toFixed(1)}%</span>
          </div>
        )}
      </div>

      <div className="mb-4 pb-4 border-b border-gray-200">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold" style={{ color }}>
            {count.toLocaleString()}
          </span>
          <span className="text-gray-500 text-sm">reviews</span>
        </div>
      </div>

      {keyPoints && keyPoints.length > 0 && (
        <div className="mb-4">
          <h4 className="font-semibold text-gray-900 mb-2 text-sm">Key Points:</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
            {keyPoints.map((point, idx) => (
              <li key={idx}>{point}</li>
            ))}
          </ul>
        </div>
      )}

      {quotes && quotes.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-900 mb-2 text-sm">Top Quotes:</h4>
          <ul className="space-y-2">
            {quotes.slice(0, 2).map((quote, idx) => (
              <li key={idx} className="bg-gray-50 p-3 rounded-lg text-sm italic text-gray-700 border-l-2" style={{ borderColor: color }}>
                "{quote}"
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
