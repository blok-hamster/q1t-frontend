'use client';

import { useState, useEffect } from 'react';
import { formatCurrency, formatPercent } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface PriceTickerProps {
  price: number;
  change24h?: number;
  className?: string;
}

export function PriceTicker({ price, change24h, className }: PriceTickerProps) {
  const [flashClass, setFlashClass] = useState('');

  useEffect(() => {
    setFlashClass('bg-[#20B2AA]/10');
    const timeout = setTimeout(() => setFlashClass(''), 300);
    return () => clearTimeout(timeout);
  }, [price]);

  const isPositive = change24h ? change24h > 0 : true;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;

  return (
    <div
      className={cn(
        'flex items-center justify-between p-3.5 bg-[#0F1215] border border-[#1B2026] transition-colors duration-300 select-none',
        flashClass,
        className
      )}
    >
      <div>
        <p className="text-[10px] font-mono font-bold text-[#586069] uppercase tracking-[0.12em]">
          BITCOIN SPOT PRICE (BINANCE BTC/USDT)
        </p>
        <p className="text-2xl sm:text-3xl font-mono font-bold text-[#E1E4E8] tabular-nums mt-0.5">
          {formatCurrency(price, { minimumFractionDigits: 2 })}
        </p>
      </div>

      {change24h !== undefined && (
        <div className="text-right font-mono">
          <div
            className={cn(
              'inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold uppercase rounded-xs border',
              isPositive
                ? 'bg-[#20B2AA]/15 text-[#20B2AA] border-[#20B2AA]/30'
                : 'bg-[#E55353]/15 text-[#E55353] border-[#E55353]/30'
            )}
          >
            <TrendIcon className="h-3 w-3" />
            <span className="tabular-nums">
              {formatPercent(change24h / 100, 2)}
            </span>
          </div>
          <p className="text-[10px] font-mono text-[#586069] mt-1 uppercase">24H CHANGE</p>
        </div>
      )}
    </div>
  );
}
