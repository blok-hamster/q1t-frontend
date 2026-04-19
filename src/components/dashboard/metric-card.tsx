'use client';

import { memo } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils/cn';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
  loading?: boolean;
}

export const MetricCard = memo(function MetricCard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  trend,
  className,
  loading = false,
}: MetricCardProps) {
  // Auto-detect trend from change if not provided
  const determinedTrend = trend || (change !== undefined
    ? change > 0
      ? 'up'
      : change < 0
      ? 'down'
      : 'neutral'
    : 'neutral');

  const TrendIcon =
    determinedTrend === 'up'
      ? TrendingUp
      : determinedTrend === 'down'
      ? TrendingDown
      : Minus;

  if (loading) {
    return (
      <Card className={cn('animate-pulse', className)}>
        <div className="p-4 space-y-3">
          <div className="h-4 bg-bg-tertiary rounded w-1/2" />
          <div className="h-8 bg-bg-tertiary rounded w-3/4" />
          <div className="h-3 bg-bg-tertiary rounded w-1/3" />
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn('hover:border-border-hover transition-colors', className)}>
      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-xs uppercase tracking-wide text-text-tertiary font-medium">
            {title}
          </h3>
          {Icon && (
            <Icon className="h-4 w-4 text-text-tertiary" />
          )}
        </div>

        {/* Value */}
        <p className="text-2xl sm:text-3xl font-bold font-mono text-text-primary">
          {value}
        </p>

        {/* Change */}
        {change !== undefined && (
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'inline-flex items-center gap-1 text-xs font-medium',
                determinedTrend === 'up' && 'text-positive',
                determinedTrend === 'down' && 'text-negative',
                determinedTrend === 'neutral' && 'text-text-tertiary'
              )}
            >
              <TrendIcon className="h-3 w-3" />
              <span className="font-mono">
                {change > 0 && '+'}
                {change}%
              </span>
            </div>
            {changeLabel && (
              <span className="text-xs text-text-tertiary">{changeLabel}</span>
            )}
          </div>
        )}
      </div>
    </Card>
  );
});
