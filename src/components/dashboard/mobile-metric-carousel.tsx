'use client';

import { LucideIcon, TrendingUp, TrendingDown, Wallet, BarChart3, Award } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface MobileMetricItem {
  title: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
  icon: LucideIcon;
}

export interface MobileMetricCarouselProps {
  metrics: {
    balance: number;
    balanceChange: number;
    openTrades: number;
    pnl24h: number;
    pnl24hChange: number;
    winRate: number;
    winRateChange: number;
  };
  loading?: boolean;
}

export function MobileMetricCarousel({ metrics, loading }: MobileMetricCarouselProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-2 font-mono sm:hidden">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 bg-[#0F1215] border border-[#1B2026] animate-pulse rounded-xs" />
        ))}
      </div>
    );
  }

  const items: MobileMetricItem[] = [
    {
      title: 'TOTAL BALANCE',
      value: `$${metrics.balance.toFixed(2)}`,
      change: metrics.balanceChange,
      icon: Wallet,
    },
    {
      title: 'OPEN POSITIONS',
      value: metrics.openTrades,
      icon: TrendingUp,
    },
    {
      title: '24H P&L',
      value: `$${metrics.pnl24h.toFixed(2)}`,
      change: metrics.pnl24hChange,
      trend: metrics.pnl24h >= 0 ? 'up' : 'down',
      icon: BarChart3,
    },
    {
      title: 'WIN RATE',
      value: `${metrics.winRate}%`,
      change: metrics.winRateChange,
      trend: metrics.winRateChange >= 0 ? 'up' : 'down',
      icon: Award,
    },
  ];

  return (
    <div className="sm:hidden font-mono select-none space-y-2">
      {/* 2x2 High-Density Touch Cards */}
      <div className="grid grid-cols-2 gap-2">
        {items.map((item, idx) => {
          const Icon = item.icon;
          const isPositive = (item.change ?? 0) >= 0;
          const hasChange = item.change !== undefined && item.change !== 0;

          return (
            <div
              key={idx}
              className="p-3 bg-[#0F1215] border border-[#1B2026] rounded-xs space-y-1 relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold text-[#586069] uppercase tracking-wider truncate">
                  {item.title}
                </span>
                <Icon className="h-3.5 w-3.5 text-[#20B2AA] shrink-0" />
              </div>

              <div className="flex items-baseline justify-between pt-0.5">
                <span className="text-base font-bold text-[#E1E4E8] tabular-nums">
                  {item.value}
                </span>

                {hasChange && (
                  <span
                    className={cn(
                      'text-[9px] font-bold flex items-center gap-0.5 tabular-nums',
                      isPositive ? 'text-[#20B2AA]' : 'text-[#E55353]'
                    )}
                  >
                    {isPositive ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                    {Math.abs(item.change!)}%
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
