'use client';

import { useState } from 'react';
import { PolymarketStrikeChart } from './polymarket-strike-chart';
import { MobileBottomSheet } from '@/components/ui/mobile-bottom-sheet';
import { Lock, Unlock, Maximize2, Activity } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface MobileChartWrapperProps {
  marketType: string;
  strikePrice: number | null;
  currentPrice: number | null;
  priceDistance: number | null;
  upPrice: number | null;
  downPrice: number | null;
}

export function MobileChartWrapper({
  marketType,
  strikePrice,
  currentPrice,
  priceDistance,
  upPrice,
  downPrice,
}: MobileChartWrapperProps) {
  const [scrollLocked, setScrollLocked] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  return (
    <div className="space-y-2 font-mono">
      {/* Mobile Chart Header & Touch Control Bar */}
      <div className="flex items-center justify-between bg-[#0F1215] border border-[#1B2026] px-3 py-2 rounded-xs text-xs">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-[#20B2AA]" />
          <span className="font-bold text-[#E1E4E8] uppercase">{marketType} CHART</span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Scroll Lock Toggle */}
          <button
            onClick={() => setScrollLocked(!scrollLocked)}
            className={cn(
              'px-2 py-1 text-[10px] font-bold uppercase rounded-xs border flex items-center gap-1 transition-colors cursor-pointer',
              scrollLocked
                ? 'bg-[#16191E] text-[#8B949E] border-[#1B2026] hover:text-[#E1E4E8]'
                : 'bg-[#20B2AA]/20 text-[#20B2AA] border-[#20B2AA]/40'
            )}
            title={scrollLocked ? 'Enable chart drag gestures' : 'Disable chart drag gestures to allow page scrolling'}
          >
            {scrollLocked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
            <span>{scrollLocked ? 'PAGE SCROLL' : 'CHART DRAG'}</span>
          </button>

          {/* Fullscreen Expand Button */}
          <button
            onClick={() => setIsFullscreen(true)}
            className="p-1 bg-[#16191E] border border-[#1B2026] text-[#8B949E] hover:text-[#20B2AA] transition-colors rounded-xs cursor-pointer"
            title="Expand Fullscreen Chart"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Embedded Chart View */}
      <div className={cn('relative rounded-xs overflow-hidden border border-[#1B2026]', scrollLocked && 'pointer-events-none')}>
        <PolymarketStrikeChart
          marketType={marketType}
          strikePrice={strikePrice}
          currentPrice={currentPrice}
          priceDistance={priceDistance}
          upPrice={upPrice}
          downPrice={downPrice}
          height={320}
        />
      </div>

      {/* Fullscreen Bottom Sheet Modal */}
      <MobileBottomSheet
        isOpen={isFullscreen}
        onClose={() => setIsFullscreen(false)}
        title={`${marketType.toUpperCase()} STRIKE CHART`}
        subtitle="HIGH-FREQUENCY ORDERBOOK & PROBABILITY DENSITY"
        maxHeight="max-h-[95vh]"
      >
        <div className="h-[70vh] w-full">
          <PolymarketStrikeChart
            marketType={marketType}
            strikePrice={strikePrice}
            currentPrice={currentPrice}
            priceDistance={priceDistance}
            upPrice={upPrice}
            downPrice={downPrice}
            height={520}
          />
        </div>
      </MobileBottomSheet>
    </div>
  );
}
