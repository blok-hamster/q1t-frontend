'use client';

import { useState } from 'react';
import { MobileBottomSheet } from '@/components/ui/mobile-bottom-sheet';
import { formatCurrency, formatTimeAgo } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';
import type { Trade } from '@/types/trade';
import { ArrowUp, ArrowDown, Copy, Check } from 'lucide-react';

export interface MobileTradeCardProps {
  trade: Trade;
}

export function MobileTradeCard({ trade }: MobileTradeCardProps) {
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const isWin = trade.status === 'CLOSED_WIN';
  const isLoss = trade.status === 'CLOSED_LOSS';
  const isOpen = trade.status === 'OPEN' || trade.status === 'LIMIT_PENDING';
  const pnl = trade.pnl || 0;

  const handleCopyId = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(trade._id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <div
        onClick={() => setInspectorOpen(true)}
        className="p-3 bg-[#080A0C] border border-[#1B2026] hover:border-[#20B2AA]/50 active:bg-[#16191E] transition-all rounded-xs font-mono text-xs cursor-pointer select-none space-y-2"
      >
        {/* Header Row: Market & Direction + Status Tag */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#E1E4E8] tracking-wider">
              {trade.market_slug.toUpperCase()}
            </span>
            <span
              className={cn(
                'inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.2 rounded-xs border',
                trade.direction === 'UP'
                  ? 'bg-[#20B2AA]/10 text-[#20B2AA] border-[#20B2AA]/30'
                  : 'bg-[#E55353]/10 text-[#E55353] border-[#E55353]/30'
              )}
            >
              {trade.direction === 'UP' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
              {trade.direction}
            </span>
          </div>

          <span
            className={cn(
              'px-1.5 py-0.5 text-[9px] font-bold uppercase rounded-xs border',
              isWin
                ? 'bg-[#20B2AA]/15 text-[#20B2AA] border-[#20B2AA]/30'
                : isLoss
                ? 'bg-[#E55353]/15 text-[#E55353] border-[#E55353]/30'
                : isOpen
                ? 'bg-[#20B2AA]/10 text-[#20B2AA] border-[#20B2AA]/20'
                : 'bg-[#D99B00]/15 text-[#D99B00] border-[#D99B00]/30'
            )}
          >
            {isOpen ? 'OPEN' : isWin ? 'WIN' : isLoss ? 'LOSS' : trade.status}
          </span>
        </div>

        {/* Details Row: Time, Size, & PnL */}
        <div className="flex items-center justify-between text-[11px] tabular-nums pt-1 border-t border-[#1B2026]">
          <span className="text-[#8B949E]">{formatTimeAgo(trade.createdAt)}</span>
          <div className="flex items-center gap-3">
            <span className="text-[#586069]">SIZE {formatCurrency(trade.size_usd)}</span>
            {isOpen ? (
              <span className="text-[#586069]">—</span>
            ) : (
              <span className={cn('font-bold', isWin ? 'text-[#20B2AA]' : isLoss ? 'text-[#E55353]' : 'text-[#8B949E]')}>
                {pnl > 0 ? '+' : ''}
                {formatCurrency(pnl)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Trade Inspector Bottom Sheet */}
      <MobileBottomSheet
        isOpen={inspectorOpen}
        onClose={() => setInspectorOpen(false)}
        title={`TRANSACTION INSPECTOR`}
        subtitle={`ID: ${trade._id}`}
      >
        <div className="space-y-3 font-mono text-xs">
          {/* Status & Market Summary */}
          <div className="p-3 bg-[#080A0C] border border-[#1B2026] space-y-2 rounded-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#586069] uppercase font-bold">MARKET TYPE</span>
              <span className="font-bold text-[#E1E4E8]">{trade.market_slug.toUpperCase()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#586069] uppercase font-bold">DIRECTION</span>
              <span className={trade.direction === 'UP' ? 'text-[#20B2AA] font-bold' : 'text-[#E55353] font-bold'}>
                {trade.direction}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#586069] uppercase font-bold">RESOLUTION STATUS</span>
              <span className="font-bold text-[#E1E4E8]">{trade.status}</span>
            </div>
          </div>

          {/* Execution Financials */}
          <div className="p-3 bg-[#080A0C] border border-[#1B2026] space-y-2 rounded-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#586069] uppercase font-bold">POSITION SIZE</span>
              <span className="font-bold text-[#E1E4E8] tabular-nums">{formatCurrency(trade.size_usd)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#586069] uppercase font-bold">ENTRY PRICE</span>
              <span className="font-bold text-[#E1E4E8] tabular-nums">${trade.execution_price || trade.entry_share_price || 0}</span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-[#1B2026]">
              <span className="text-[10px] text-[#586069] uppercase font-bold">NET P&L RESULT</span>
              <span className={cn('font-bold tabular-nums text-sm', isWin ? 'text-[#20B2AA]' : isLoss ? 'text-[#E55353]' : 'text-[#8B949E]')}>
                {pnl > 0 ? '+' : ''}
                {formatCurrency(pnl)}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={handleCopyId}
              className="flex-1 py-2 bg-[#16191E] border border-[#1B2026] hover:border-[#20B2AA] text-[#E1E4E8] font-bold uppercase text-[10px] flex items-center justify-center gap-1.5 rounded-xs cursor-pointer transition-colors"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-[#20B2AA]" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'COPIED ID' : 'COPY TRADE ID'}</span>
            </button>

            <button
              onClick={() => setInspectorOpen(false)}
              className="px-4 py-2 bg-[#20B2AA]/10 border border-[#20B2AA]/40 text-[#20B2AA] font-bold uppercase text-[10px] rounded-xs cursor-pointer hover:bg-[#20B2AA]/20"
            >
              CLOSE
            </button>
          </div>
        </div>
      </MobileBottomSheet>
    </>
  );
}
