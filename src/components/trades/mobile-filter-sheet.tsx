'use client';

import { useState } from 'react';
import { MobileBottomSheet } from '@/components/ui/mobile-bottom-sheet';
import type { TradeStatus, TradeDirection, TradeStrategy } from '@/types/trade';
import { Search, SlidersHorizontal, RotateCcw, Check } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export interface MobileFilterSheetProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  statusFilter: TradeStatus | 'all';
  onStatusChange: (s: TradeStatus | 'all') => void;
  directionFilter: TradeDirection | 'all';
  onDirectionChange: (d: TradeDirection | 'all') => void;
  totalResults: number;
}

export function MobileFilterSheet({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  directionFilter,
  onDirectionChange,
  totalResults,
}: MobileFilterSheetProps) {
  const [isOpen, setIsOpen] = useState(false);

  const activeFiltersCount =
    (statusFilter !== 'all' ? 1 : 0) + (directionFilter !== 'all' ? 1 : 0) + (searchQuery ? 1 : 0);

  const handleReset = () => {
    onSearchChange('');
    onStatusChange('all');
    onDirectionChange('all');
  };

  return (
    <div className="sm:hidden font-mono text-xs space-y-2">
      {/* Mobile Top Controls: Search Input + Filter Button */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#586069]" />
          <input
            type="text"
            placeholder="Search market or ID..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-[#0F1215] border border-[#1B2026] text-xs text-[#E1E4E8] placeholder:text-[#586069] focus:border-[#20B2AA] focus:outline-none rounded-xs"
          />
        </div>

        <button
          onClick={() => setIsOpen(true)}
          className={cn(
            'px-3 py-2 bg-[#0F1215] border border-[#1B2026] text-[#E1E4E8] font-bold uppercase text-[10px] flex items-center gap-1.5 rounded-xs transition-colors cursor-pointer shrink-0',
            activeFiltersCount > 0 && 'border-[#20B2AA] bg-[#20B2AA]/10 text-[#20B2AA]'
          )}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span>FILTER</span>
          {activeFiltersCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-[#20B2AA] text-[#0F1215] text-[9px] font-bold flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </button>
      </div>

      {/* Filter Bottom Sheet */}
      <MobileBottomSheet
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="LEDGER FILTERS & PARAMETERS"
        subtitle={`SHOWING ${totalResults} MATCHING RECORDED TRANSACTIONS`}
      >
        <div className="space-y-4 font-mono text-xs">
          {/* Status Filter Options */}
          <div className="space-y-2">
            <span className="text-[10px] text-[#586069] uppercase font-bold block">
              EXECUTION STATUS
            </span>
            <div className="flex flex-wrap gap-1.5">
              {(['all', 'OPEN', 'CLOSED_WIN', 'CLOSED_LOSS'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => onStatusChange(s)}
                  className={cn(
                    'px-3 py-1.5 text-[10px] font-bold uppercase rounded-xs border transition-colors cursor-pointer',
                    statusFilter === s
                      ? 'bg-[#20B2AA]/20 text-[#20B2AA] border-[#20B2AA]/40'
                      : 'bg-[#16191E] text-[#8B949E] border-[#1B2026]'
                  )}
                >
                  {s === 'all' ? 'ALL STATUSES' : s.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Direction Filter Options */}
          <div className="space-y-2">
            <span className="text-[10px] text-[#586069] uppercase font-bold block">
              TRADE DIRECTION
            </span>
            <div className="flex gap-1.5">
              {(['all', 'UP', 'DOWN'] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => onDirectionChange(d)}
                  className={cn(
                    'flex-1 py-1.5 text-[10px] font-bold uppercase rounded-xs border transition-colors cursor-pointer text-center',
                    directionFilter === d
                      ? 'bg-[#20B2AA]/20 text-[#20B2AA] border-[#20B2AA]/40'
                      : 'bg-[#16191E] text-[#8B949E] border-[#1B2026]'
                  )}
                >
                  {d === 'all' ? 'ALL DIRECTIONS' : d}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2 border-t border-[#1B2026]">
            <button
              onClick={handleReset}
              className="flex-1 py-2 bg-[#16191E] border border-[#1B2026] text-[#8B949E] hover:text-[#E1E4E8] font-bold uppercase text-[10px] flex items-center justify-center gap-1.5 rounded-xs transition-colors cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>RESET</span>
            </button>

            <button
              onClick={() => setIsOpen(false)}
              className="flex-1 py-2 bg-[#20B2AA] text-[#0F1215] font-bold uppercase text-[10px] flex items-center justify-center gap-1.5 rounded-xs transition-colors cursor-pointer hover:bg-[#20B2AA]/90"
            >
              <Check className="h-3.5 w-3.5" />
              <span>APPLY FILTERS</span>
            </button>
          </div>
        </div>
      </MobileBottomSheet>
    </div>
  );
}
