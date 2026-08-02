'use client';

import { memo } from 'react';
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
      <div className={cn('bg-[#0F1215] border border-[#1B2026] p-3.5 space-y-2 animate-pulse', className)}>
        <div className="h-3 bg-[#16191E] w-1/2" />
        <div className="h-6 bg-[#16191E] w-3/4" />
        <div className="h-2.5 bg-[#16191E] w-1/3" />
      </div>
    );
  }

  return (
    <div className={cn('bg-[#0F1215] border border-[#1B2026] p-3.5 space-y-1.5', className)}>
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-mono font-bold uppercase tracking-[0.12em] text-[#586069]">
          {title}
        </p>
        {Icon && <Icon className="h-3.5 w-3.5 text-[#586069]" />}
      </div>

      <p className="text-xl sm:text-2xl font-mono font-bold text-[#E1E4E8] tabular-nums">
        {value}
      </p>

      {change !== undefined && (
        <div className="flex items-center gap-1.5 font-mono text-[11px]">
          <span
            className={cn(
              'inline-flex items-center gap-0.5 font-bold',
              determinedTrend === 'up' && 'text-[#20B2AA]',
              determinedTrend === 'down' && 'text-[#E55353]',
              determinedTrend === 'neutral' && 'text-[#586069]'
            )}
          >
            <TrendIcon className="h-3 w-3" />
            <span>
              {change > 0 && '+'}
              {change}%
            </span>
          </span>
          {changeLabel && (
            <span className="text-[#586069]">{changeLabel}</span>
          )}
        </div>
      )}
    </div>
  );
});
