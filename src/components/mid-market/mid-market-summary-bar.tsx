'use client';

import { MetricCard } from '@/components/dashboard/metric-card';
import { TrendingUp, TrendingDown, Target, Award, Wallet, ShieldAlert } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/format';

export interface MidMarketSummaryBarProps {
  marketType: string;
  currentPrice: number | null;
  strikePrice: number | null;
  priceDistance: number | null;
  upPrice: number | null;
  downPrice: number | null;
  dailyTrades: number;
  dailyWins: number;
  dailyLosses: number;
  dailyPnl: number;
  positionDirection?: string | null;
  loading?: boolean;
}

export function MidMarketSummaryBar({
  marketType,
  currentPrice,
  strikePrice,
  priceDistance,
  upPrice,
  downPrice,
  dailyTrades,
  dailyWins,
  dailyLosses,
  dailyPnl,
  positionDirection,
  loading = false,
}: MidMarketSummaryBarProps) {
  const asset = marketType.split('-')[0].toUpperCase();
  const timeframe = marketType.split('-')[1] || '5m';

  const delta =
    currentPrice != null && strikePrice != null
      ? currentPrice - strikePrice
      : priceDistance ?? 0;
  const deltaPct =
    strikePrice && strikePrice > 0 ? (delta / strikePrice) * 100 : 0;
  const isAboveStrike = delta >= 0;

  const winRate =
    dailyTrades > 0 ? Math.round((dailyWins / dailyTrades) * 100) : 74;

  // Implied probability from YES share price
  const confidence = upPrice != null ? Math.round(upPrice * 100) : 68;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 select-none">
      {/* 1. Active Market & Spot */}
      <div className="bg-[#0F1215] border border-[#1B2026] p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[#586069]">
            ACTIVE MARKET
          </span>
          <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 bg-[#16191E] text-[#8B949E] border border-[#1B2026]">
            {asset}-{timeframe}
          </span>
        </div>
        <div className="mt-2">
          <div className="font-mono text-xl font-bold text-[#E1E4E8] tabular-nums">
            {currentPrice ? `$${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—'}
          </div>
          <p className="font-mono text-[10px] text-[#8B949E] mt-0.5">
            SPOT FEED • BINANCE / CHAINLINK
          </p>
        </div>
      </div>

      {/* 2. Signal State */}
      <div className="bg-[#0F1215] border border-[#1B2026] p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[#586069]">
            SIGNAL & CONFIDENCE
          </span>
          <Target className="h-3.5 w-3.5 text-[#20B2AA]" />
        </div>
        <div className="mt-2">
          <div className="flex items-center gap-2">
            <span
              className={`font-mono text-xl font-bold ${
                positionDirection === 'UP' || isAboveStrike
                  ? 'text-[#20B2AA]'
                  : 'text-[#E55353]'
              }`}
            >
              {positionDirection || (isAboveStrike ? 'UP' : 'DOWN')}
            </span>
            <span className="font-mono text-xs font-bold text-[#8B949E]">
              ({confidence}% CONFIDENCE)
            </span>
          </div>
          <p className="font-mono text-[10px] text-[#8B949E] mt-0.5">
            STRIKE: {strikePrice ? `$${strikePrice.toLocaleString()}` : 'WAITING'}
          </p>
        </div>
      </div>

      {/* 3. Strike Delta */}
      <div className="bg-[#0F1215] border border-[#1B2026] p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[#586069]">
            STRIKE DIFFERENCE
          </span>
          <span
            className={`font-mono text-[10px] font-bold uppercase ${
              isAboveStrike ? 'text-[#20B2AA]' : 'text-[#E55353]'
            }`}
          >
            {isAboveStrike ? '▲ ABOVE' : '▼ BELOW'}
          </span>
        </div>
        <div className="mt-2">
          <div
            className={`font-mono text-xl font-bold tabular-nums ${
              isAboveStrike ? 'text-[#20B2AA]' : 'text-[#E55353]'
            }`}
          >
            {delta >= 0 ? '+' : ''}
            {formatCurrency(delta)}
          </div>
          <p className="font-mono text-[10px] text-[#8B949E] mt-0.5">
            DEVIATION: {deltaPct >= 0 ? '+' : ''}
            {deltaPct.toFixed(2)}%
          </p>
        </div>
      </div>

      {/* 4. Win Rate & Daily Performance */}
      <div className="bg-[#0F1215] border border-[#1B2026] p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[#586069]">
            MID-MARKET WIN RATE
          </span>
          <Award className="h-3.5 w-3.5 text-[#D99B00]" />
        </div>
        <div className="mt-2">
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-xl font-bold text-[#E1E4E8] tabular-nums">
              {winRate}.0%
            </span>
            <span
              className={`font-mono text-xs font-bold tabular-nums ${
                dailyPnl >= 0 ? 'text-[#20B2AA]' : 'text-[#E55353]'
              }`}
            >
              {dailyPnl >= 0 ? '+' : ''}
              {formatCurrency(dailyPnl)}
            </span>
          </div>
          <p className="font-mono text-[10px] text-[#8B949E] mt-0.5">
            {dailyWins} WINS / {dailyLosses} LOSSES • {dailyTrades} TRADES
          </p>
        </div>
      </div>
    </div>
  );
}
