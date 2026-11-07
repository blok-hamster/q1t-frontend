'use client';

import { formatDate, formatCurrency } from '@/lib/utils/format';
import type { Trade } from '@/types/trade';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface TradeRowProps {
  trade: Trade;
  variant?: 'desktop' | 'mobile';
  onClick?: () => void;
}

export function TradeRow({ trade, variant = 'desktop', onClick }: TradeRowProps) {
  const isWin = trade.status === 'CLOSED_WIN';
  const isLoss = trade.status === 'CLOSED_LOSS';
  const isOpen = trade.status === 'OPEN';
  const pnl = trade.pnl || 0;
  const exitLabel =
    trade.exit_reason === 'FAIR_VAL_STOP'
      ? 'FV STOP'
      : trade.exit_reason === 'WINDOW_END' && (isWin || isLoss)
      ? 'RESOLVED'
      : null;

  if (variant === 'mobile') {
    return (
      <div
        onClick={onClick}
        className="p-3 bg-[#0F1215] border border-[#1B2026] text-xs font-mono select-none"
      >
        <div className="flex items-center justify-between mb-2">
          <span className={`inline-flex items-center gap-1 font-bold ${
            trade.direction === 'UP' ? 'text-[#20B2AA]' : 'text-[#E55353]'
          }`}>
            {trade.direction === 'UP' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
            {trade.direction} {trade.market_slug.toUpperCase()}
          </span>
          <span className={`px-1.5 py-0.5 text-[9px] font-bold uppercase rounded-xs border ${
            isWin ? 'bg-[#20B2AA]/15 text-[#20B2AA] border-[#20B2AA]/30' :
            isLoss ? 'bg-[#E55353]/15 text-[#E55353] border-[#E55353]/30' :
            isOpen ? 'bg-[#20B2AA]/10 text-[#20B2AA] border-[#20B2AA]/20' :
            'bg-[#D99B00]/15 text-[#D99B00] border-[#D99B00]/30'
          }`}>
            {trade.status}
          </span>
        </div>
        <div className="flex justify-between text-[#8B949E] text-[11px] tabular-nums">
          <span>{formatDate(trade.createdAt)}</span>
          <span className={isWin ? 'text-[#20B2AA] font-bold' : isLoss ? 'text-[#E55353] font-bold' : ''}>
            {isOpen ? '—' : `${pnl > 0 ? '+' : ''}${formatCurrency(pnl)}`}
          </span>
        </div>
      </div>
    );
  }

  return (
    <tr
      onClick={onClick}
      className="hover:bg-[#16191E]/50 transition-colors cursor-pointer font-mono text-xs border-b border-[#1B2026]/40"
    >
      <td className="px-3 py-2 text-[#8B949E]">
        {formatDate(trade.createdAt)}
      </td>

      <td className="px-3 py-2 text-[#E1E4E8] font-bold">
        {trade.market_slug.toUpperCase()}
      </td>

      <td className="px-3 py-2">
        <span className={`inline-flex items-center gap-1 font-bold ${
          trade.direction === 'UP' ? 'text-[#20B2AA]' : 'text-[#E55353]'
        }`}>
          {trade.direction === 'UP' ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />}
          {trade.direction}
        </span>
      </td>

      <td className="px-3 py-2 text-right tabular-nums text-[#8B949E]">
        {trade.num_shares ? `${trade.num_shares} SH` : formatCurrency(trade.size_usd)}
      </td>

      <td className="px-3 py-2 text-right tabular-nums text-[#E1E4E8]">
        <div>
          {trade.entry_share_price !== null
            ? `$${trade.entry_share_price.toFixed(2)}`
            : trade.execution_price !== null
            ? `$${trade.execution_price.toFixed(2)}`
            : '—'}
        </div>
        {trade.fair_value_edge_at_entry != null && (
          <div className="text-[9px] text-[#20B2AA]">
            +{(trade.fair_value_edge_at_entry * 100).toFixed(1)}¢
          </div>
        )}
      </td>

      <td className="px-3 py-2 text-right">
        <div className="inline-flex items-center gap-1 justify-end">
          {exitLabel && (
            <span className="px-1 py-0.5 text-[8px] font-bold uppercase rounded-xs bg-[#16191E] text-[#8B949E] border border-[#1B2026]">
              {exitLabel}
            </span>
          )}
          <span className={`inline-block px-1.5 py-0.5 text-[9px] font-bold uppercase rounded-xs border ${
            isWin
              ? 'bg-[#20B2AA]/15 text-[#20B2AA] border-[#20B2AA]/30'
              : isLoss
              ? 'bg-[#E55353]/15 text-[#E55353] border-[#E55353]/30'
              : isOpen
              ? 'bg-[#20B2AA]/10 text-[#20B2AA] border-[#20B2AA]/20'
              : 'bg-[#D99B00]/15 text-[#D99B00] border-[#D99B00]/30'
          }`}>
            {trade.status}
          </span>
        </div>
      </td>

      <td className="px-3 py-2 text-right tabular-nums font-bold">
        {isOpen ? (
          <span className="text-[#586069]">—</span>
        ) : (
          <span className={isWin ? 'text-[#20B2AA]' : isLoss ? 'text-[#E55353]' : 'text-[#8B949E]'}>
            {pnl > 0 ? '+' : ''}
            {formatCurrency(pnl)}
          </span>
        )}
      </td>
    </tr>
  );
}
