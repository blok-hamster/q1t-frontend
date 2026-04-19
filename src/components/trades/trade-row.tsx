'use client';

import { Badge } from '@/components/ui/badge';
import { PnLDisplay } from './pnl-display';
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
  const isPending = trade.status === 'PENDING';
  const isRejected = trade.status === 'REJECTED';

  const getStatusBadgeVariant = () => {
    if (isWin) return 'success';
    if (isLoss) return 'error';
    if (isOpen) return 'info';
    if (isPending) return 'warning';
    if (isRejected) return 'error';
    return 'neutral';
  };

  const getStatusLabel = () => {
    switch (trade.status) {
      case 'CLOSED_WIN':
        return 'Win';
      case 'CLOSED_LOSS':
        return 'Loss';
      case 'OPEN':
        return 'Open';
      case 'PENDING':
        return 'Pending';
      case 'REJECTED':
        return 'Rejected';
      case 'DRAFT':
        return 'Draft';
      default:
        return trade.status;
    }
  };

  // Mobile card layout
  if (variant === 'mobile') {
    return (
      <div
        onClick={onClick}
        className="p-4 bg-bg-secondary rounded-lg border border-border hover:border-border-hover transition-colors cursor-pointer"
      >
        {/* Header: Direction + Status */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div
              className={`p-1.5 rounded-full ${
                trade.direction === 'UP' ? 'bg-positive/20' : 'bg-negative/20'
              }`}
            >
              {trade.direction === 'UP' ? (
                <ArrowUp className="h-4 w-4 text-positive" />
              ) : (
                <ArrowDown className="h-4 w-4 text-negative" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary">
                {trade.market_slug}
              </p>
              <p className="text-xs text-text-tertiary">
                {formatDate(trade.createdAt)}
              </p>
            </div>
          </div>
          <Badge variant={getStatusBadgeVariant()} size="sm">
            {getStatusLabel()}
          </Badge>
        </div>

        {/* Details */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <p className="text-text-tertiary mb-1">Size</p>
            <p className="font-mono text-text-primary">
              {formatCurrency(trade.size_usd)}
            </p>
          </div>
          <div>
            <p className="text-text-tertiary mb-1">Entry Price</p>
            <p className="font-mono text-text-primary">
              {trade.execution_price !== null
                ? `$${trade.execution_price.toFixed(2)}`
                : '-'}
            </p>
          </div>
        </div>

        {/* P&L */}
        {trade.pnl !== null && (
          <div className="mt-3 pt-3 border-t border-border">
            <div className="flex items-center justify-between">
              <p className="text-xs text-text-tertiary">Profit/Loss</p>
              <PnLDisplay value={trade.pnl} size="md" showIcon />
            </div>
          </div>
        )}
      </div>
    );
  }

  // Desktop table row layout
  return (
    <tr
      onClick={onClick}
      className="border-b border-border hover:bg-bg-tertiary/50 transition-colors cursor-pointer"
    >
      {/* Date/Time */}
      <td className="px-4 py-3">
        <p className="text-sm text-text-primary">{formatDate(trade.createdAt)}</p>
      </td>

      {/* Market */}
      <td className="px-4 py-3">
        <p className="text-sm text-text-primary">{trade.market_slug}</p>
      </td>

      {/* Direction */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div
            className={`p-1 rounded ${
              trade.direction === 'UP' ? 'bg-positive/20' : 'bg-negative/20'
            }`}
          >
            {trade.direction === 'UP' ? (
              <ArrowUp className="h-3 w-3 text-positive" />
            ) : (
              <ArrowDown className="h-3 w-3 text-negative" />
            )}
          </div>
          <span className="text-sm font-medium text-text-primary">
            {trade.direction}
          </span>
        </div>
      </td>

      {/* Size */}
      <td className="px-4 py-3">
        <p className="text-sm font-mono text-text-primary">
          {formatCurrency(trade.size_usd)}
        </p>
      </td>

      {/* Entry Price */}
      <td className="px-4 py-3">
        <p className="text-sm font-mono text-text-primary">
          {trade.execution_price !== null
            ? `$${trade.execution_price.toFixed(2)}`
            : '-'}
        </p>
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        <Badge variant={getStatusBadgeVariant()} size="sm">
          {getStatusLabel()}
        </Badge>
      </td>

      {/* P&L */}
      <td className="px-4 py-3">
        {trade.pnl !== null ? (
          <PnLDisplay value={trade.pnl} size="sm" />
        ) : (
          <span className="text-sm text-text-tertiary">-</span>
        )}
      </td>
    </tr>
  );
}
