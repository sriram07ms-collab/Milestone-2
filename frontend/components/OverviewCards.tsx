'use client';

import { ThemeAggregation, WeeklyPulseNote } from '@/lib/types';
import { TrendingUp, TrendingDown, Star, Users, Calendar, Award } from 'lucide-react';

interface OverviewCardsProps {
  aggregation: ThemeAggregation | null;
  latestPulse: WeeklyPulseNote | null;
}

export default function OverviewCards({ aggregation, latestPulse }: OverviewCardsProps) {
  const totalReviews = aggregation?.overall_counts
    ? Object.values(aggregation.overall_counts).reduce((a, b) => a + b, 0)
    : 0;

  const thisWeekReviews = latestPulse
    ? aggregation?.weekly_counts[aggregation.weekly_counts.length - 1]?.total_reviews || 0
    : 0;

  const topTheme = aggregation?.top_themes[0];
  const topThemeName = topTheme ? topTheme.theme_id.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'N/A';
  const topThemeCount = topTheme?.count || 0;

  // Calculate average rating (mock - you'd need to load review data)
  const avgRating = 3.2;

  const cards = [
    {
      title: 'Total Reviews',
      value: totalReviews.toLocaleString(),
      icon: Users,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      trend: '+12%',
      trendUp: true,
    },
    {
      title: 'This Week',
      value: thisWeekReviews.toString(),
      icon: Calendar,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
      trend: '-5%',
      trendUp: false,
    },
    {
      title: 'Top Theme',
      value: topThemeName,
      subtitle: `${topThemeCount} reviews`,
      icon: Award,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
    },
    {
      title: 'Avg Rating',
      value: avgRating.toFixed(1),
      icon: Star,
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={index}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-2">{card.title}</p>
                <div className="flex items-baseline gap-2">
                  {card.subtitle ? (
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                      <p className="text-sm text-gray-500 mt-1">{card.subtitle}</p>
                    </div>
                  ) : (
                    <p className="text-3xl font-bold text-gray-900">{card.value}</p>
                  )}
                </div>
                {card.trend && (
                  <div className={`flex items-center gap-1 mt-2 ${card.trendUp ? 'text-green-600' : 'text-red-600'}`}>
                    {card.trendUp ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    <span className="text-xs font-medium">{card.trend}</span>
                    <span className="text-xs text-gray-500">vs last week</span>
                  </div>
                )}
              </div>
              <div className={`${card.bgColor} p-3 rounded-xl`}>
                <Icon className={`w-6 h-6 ${card.textColor}`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
