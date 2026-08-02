'use client';

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
    <div className={cn('bg-[#0F1215] border border-[#1B2026] p-3.5 space-y-2 select-none font-mono', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-3.5 w-3.5 text-[#20B2AA]" />}
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#586069]">
            {asset}
          </p>
        </div>

        {change24h !== undefined && (
          <div
            className={cn(
              'flex items-center gap-1 text-[11px] font-bold tabular-nums',
              hasPositiveChange && 'text-[#20B2AA]',
              hasNegativeChange && 'text-[#E55353]'
            )}
          >
            {hasPositiveChange ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            <span>
              {change24h > 0 && '+'}
              {change24h.toFixed(2)}%
            </span>
          </div>
        )}
      </div>

      <div>
        <p className="text-xl font-bold text-[#E1E4E8] tabular-nums">
          {formatNumber(balance, 4)} {asset}
        </p>
        <p className="text-[11px] text-[#8B949E] mt-0.5 tabular-nums">
          ≈ {formatCurrency(usdValue)}
        </p>
      </div>
    </div>
  );
}
