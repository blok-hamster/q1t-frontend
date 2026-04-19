'use client';

import { Card } from '@/components/ui/card';
import { formatCurrency, formatNumber } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface BalanceCardProps {
  asset: string;
  balance: number;
  usdValue: number;
  icon?: LucideIcon;
  change24h?: number;
  className?: string;
}

export function BalanceCard({
  asset,
  balance,
  usdValue,
  icon: Icon,
  change24h,
  className,
}: BalanceCardProps) {
  const hasPositiveChange = change24h !== undefined && change24h > 0;
  const hasNegativeChange = change24h !== undefined && change24h < 0;

  return (
    <Card className={cn('hover:border-border-hover transition-colors', className)}>
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="w-10 h-10 rounded-full bg-accent-muted flex items-center justify-center">
                <Icon className="h-5 w-5 text-accent-primary" />
              </div>
            )}
            <div>
              <h3 className="text-sm text-text-tertiary uppercase tracking-wide">
                {asset}
              </h3>
              <p className="text-xs text-text-tertiary mt-0.5">Balance</p>
            </div>
          </div>

          {change24h !== undefined && (
            <div
              className={cn(
                'flex items-center gap-1 text-xs font-medium',
                hasPositiveChange && 'text-positive',
                hasNegativeChange && 'text-negative'
              )}
            >
              {hasPositiveChange ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              <span className="font-mono">
                {change24h > 0 && '+'}
                {change24h.toFixed(2)}%
              </span>
            </div>
          )}
        </div>

        {/* Balance */}
        <div>
          <p className="text-3xl font-bold font-mono text-text-primary">
            {formatNumber(balance, 4)} {asset}
          </p>
          <p className="text-sm text-text-secondary mt-1">
            ≈ {formatCurrency(usdValue)}
          </p>
        </div>
      </div>
    </Card>
  );
}
