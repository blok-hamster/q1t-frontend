'use client';

import { cn } from '@/lib/utils/cn';
import type { Candle } from '@/types/market';

interface VolumeBarProps {
  candles: Candle[];
  className?: string;
  height?: number;
}

export function VolumeBars({ candles, className, height = 100 }: VolumeBarProps) {
  if (!candles.length) return null;

  const maxVolume = Math.max(...candles.map((c) => c.volume));

  return (
    <div className={cn('bg-bg-primary rounded-lg border border-border p-4', className)}>
      <div className="flex items-end gap-1 justify-between" style={{ height }}>
        {candles.map((candle, index) => {
          const heightPercent = (candle.volume / maxVolume) * 100;
          const isGreen = candle.close >= candle.open;

          return (
            <div
              key={index}
              className={cn(
                'flex-1 rounded-t-sm transition-all duration-300',
                'hover:opacity-80 cursor-pointer',
                isGreen ? 'bg-positive/60' : 'bg-negative/60'
              )}
              style={{ height: `${heightPercent}%` }}
              title={`Volume: ${candle.volume.toFixed(2)}`}
            />
          );
        })}
      </div>

      <div className="mt-2 text-center">
        <p className="text-xs text-text-tertiary">Volume</p>
      </div>
    </div>
  );
}
