'use client';

import { useState, useEffect } from 'react';
import { formatCurrency, formatPercent, getPnLColor } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface PriceTickerProps {
  price: number;
  change24h?: number;
  className?: string;
}

export function PriceTicker({ price, change24h, className }: PriceTickerProps) {
  const [flashClass, setFlashClass] = useState('');

  // Flash effect when price changes
  useEffect(() => {
    setFlashClass('bg-accent-primary/20');
    const timeout = setTimeout(() => setFlashClass(''), 300);
    return () => clearTimeout(timeout);
  }, [price]);

  const isPositive = change24h ? change24h > 0 : false;
  const isNegative = change24h ? change24h < 0 : false;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 p-4 rounded-lg bg-bg-secondary border border-border transition-colors duration-300',
        flashClass,
        className
      )}
    >
      <div>
        <p className="text-sm text-text-tertiary uppercase tracking-wide mb-1">
          Bitcoin (BTC)
        </p>
        <p className="text-3xl sm:text-4xl font-bold font-mono text-text-primary">
          {formatCurrency(price, { minimumFractionDigits: 2 })}
        </p>
      </div>

      {change24h !== undefined && (
        <div className="text-right">
          <div
            className={cn(
              'inline-flex items-center gap-1 px-3 py-1 rounded-md text-sm font-medium',
              isPositive && 'bg-positive/20 text-positive',
              isNegative && 'bg-negative/20 text-negative'
            )}
          >
            <TrendIcon className="h-4 w-4" />
            <span className="font-mono">
              {formatPercent(change24h / 100, 2)}
            </span>
          </div>
          <p className="text-xs text-text-tertiary mt-1">24h Change</p>
        </div>
      )}
    </div>
  );
}
