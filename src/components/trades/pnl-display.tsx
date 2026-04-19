'use client';

import { formatCurrency, formatPercent } from '@/lib/utils/format';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface PnLDisplayProps {
  value: number;
  showIcon?: boolean;
  showSign?: boolean;
  size?: 'sm' | 'md' | 'lg';
  percentage?: number;
  showPercentage?: boolean;
  className?: string;
}

export function PnLDisplay({
  value,
  showIcon = false,
  showSign = true,
  size = 'md',
  percentage,
  showPercentage = false,
  className = '',
}: PnLDisplayProps) {
  const isPositive = value > 0;
  const isNegative = value < 0;
  const isNeutral = value === 0;

  const colorClass = isPositive
    ? 'text-positive'
    : isNegative
    ? 'text-negative'
    : 'text-text-secondary';

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  const Icon = isPositive
    ? TrendingUp
    : isNegative
    ? TrendingDown
    : Minus;

  return (
    <div className={`inline-flex items-center gap-1 ${className}`}>
      {showIcon && (
        <Icon className={`${iconSizes[size]} ${colorClass}`} />
      )}
      <span className={`font-mono font-semibold ${sizeClasses[size]} ${colorClass}`}>
        {showSign && !isNeutral && (value > 0 ? '+' : '')}
        {formatCurrency(value)}
      </span>
      {showPercentage && percentage !== undefined && (
        <span className={`${sizeClasses[size]} ${colorClass} ml-1`}>
          ({formatPercent(percentage / 100)})
        </span>
      )}
    </div>
  );
}
