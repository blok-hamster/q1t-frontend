'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils/cn';
import { formatNumber } from '@/lib/utils/format';

export interface OrderbookLevel {
  price: number;
  size: number;
  total?: number;
}

export interface OrderbookData {
  bids: OrderbookLevel[];
  asks: OrderbookLevel[];
  spread?: number;
  mid_price?: number;
}

interface OrderbookProps {
  data: OrderbookData;
  precision?: number;
  maxLevels?: number;
  className?: string;
}

export function Orderbook({
  data,
  precision = 2,
  maxLevels = 10,
  className,
}: OrderbookProps) {
  // Process and limit orderbook levels
  const { processedBids, processedAsks, maxTotal } = useMemo(() => {
    const bids = data.bids.slice(0, maxLevels);
    const asks = data.asks.slice(0, maxLevels).reverse(); // Show asks top to bottom

    // Calculate cumulative totals
    let bidTotal = 0;
    const bidsWithTotal = bids.map((bid) => {
      bidTotal += bid.size;
      return { ...bid, total: bidTotal };
    });

    let askTotal = 0;
    const asksWithTotal = asks.map((ask) => {
      askTotal += ask.size;
      return { ...ask, total: askTotal };
    });

    const maxTotal = Math.max(
      ...bidsWithTotal.map((b) => b.total!),
      ...asksWithTotal.map((a) => a.total!)
    );

    return {
      processedBids: bidsWithTotal,
      processedAsks: asksWithTotal,
      maxTotal,
    };
  }, [data.bids, data.asks, maxLevels]);

  const spread = data.spread || (data.asks[0]?.price - data.bids[0]?.price) || 0;
  const spreadPercent = data.mid_price
    ? (spread / data.mid_price) * 100
    : 0;

  return (
    <div className={cn('bg-bg-secondary rounded-lg border border-border', className)}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-primary">Order Book</h3>
          <div className="text-xs text-text-tertiary">
            Spread: {formatNumber(spread, precision)} ({spreadPercent.toFixed(2)}%)
          </div>
        </div>
      </div>

      {/* Column Headers */}
      <div className="grid grid-cols-3 gap-2 px-4 py-2 text-xs font-semibold text-text-tertiary uppercase tracking-wide border-b border-border">
        <div className="text-left">Price</div>
        <div className="text-right">Size</div>
        <div className="text-right">Total</div>
      </div>

      {/* Asks (Sell orders) */}
      <div className="divide-y divide-border/50">
        {processedAsks.map((ask, index) => (
          <OrderbookRow
            key={`ask-${index}`}
            price={ask.price}
            size={ask.size}
            total={ask.total!}
            maxTotal={maxTotal}
            side="ask"
            precision={precision}
          />
        ))}
      </div>

      {/* Spread Indicator */}
      <div className="px-4 py-3 bg-bg-tertiary border-y border-border">
        <div className="flex items-center justify-center gap-2">
          <span className="text-xs text-text-tertiary">Spread:</span>
          <span className="text-sm font-mono font-semibold text-neutral">
            {formatNumber(spread, precision)}
          </span>
          {data.mid_price && (
            <span className="text-xs text-text-tertiary">
              @ {formatNumber(data.mid_price, precision)}
            </span>
          )}
        </div>
      </div>

      {/* Bids (Buy orders) */}
      <div className="divide-y divide-border/50">
        {processedBids.map((bid, index) => (
          <OrderbookRow
            key={`bid-${index}`}
            price={bid.price}
            size={bid.size}
            total={bid.total!}
            maxTotal={maxTotal}
            side="bid"
            precision={precision}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Individual orderbook row
 */
interface OrderbookRowProps {
  price: number;
  size: number;
  total: number;
  maxTotal: number;
  side: 'bid' | 'ask';
  precision: number;
}

function OrderbookRow({
  price,
  size,
  total,
  maxTotal,
  side,
  precision,
}: OrderbookRowProps) {
  const depthPercent = (total / maxTotal) * 100;

  return (
    <div className="relative px-4 py-1.5 hover:bg-bg-tertiary/50 transition-colors cursor-pointer group">
      {/* Depth bar */}
      <div
        className={cn(
          'absolute top-0 bottom-0 right-0 transition-all duration-300',
          side === 'bid'
            ? 'bg-positive/10 group-hover:bg-positive/20'
            : 'bg-negative/10 group-hover:bg-negative/20'
        )}
        style={{ width: `${depthPercent}%` }}
      />

      {/* Content */}
      <div className="relative grid grid-cols-3 gap-2 text-sm">
        <div
          className={cn(
            'font-mono font-medium text-left',
            side === 'bid' ? 'text-positive' : 'text-negative'
          )}
        >
          {formatNumber(price, precision)}
        </div>
        <div className="font-mono text-text-primary text-right">
          {formatNumber(size, 4)}
        </div>
        <div className="font-mono text-text-secondary text-right text-xs">
          {formatNumber(total, 2)}
        </div>
      </div>
    </div>
  );
}

/**
 * Compact orderbook for smaller spaces
 */
interface CompactOrderbookProps {
  data: OrderbookData;
  maxLevels?: number;
  className?: string;
}

export function CompactOrderbook({
  data,
  maxLevels = 5,
  className,
}: CompactOrderbookProps) {
  const topBid = data.bids[0];
  const topAsk = data.asks[0];
  const spread = topAsk && topBid ? topAsk.price - topBid.price : 0;

  return (
    <div className={cn('bg-bg-secondary rounded-lg border border-border p-3', className)}>
      <div className="text-xs font-semibold text-text-tertiary uppercase tracking-wide mb-3">
        Order Book
      </div>

      {/* Top 5 asks */}
      <div className="space-y-1 mb-2">
        {data.asks.slice(0, maxLevels).reverse().map((ask, i) => (
          <div key={`ask-${i}`} className="flex justify-between text-xs">
            <span className="font-mono text-negative">{ask.price.toFixed(2)}</span>
            <span className="font-mono text-text-secondary">{ask.size.toFixed(4)}</span>
          </div>
        ))}
      </div>

      {/* Spread */}
      <div className="py-2 my-2 border-y border-border text-center">
        <div className="text-xs text-text-tertiary">Spread</div>
        <div className="text-sm font-mono font-semibold text-neutral">
          {spread.toFixed(4)}
        </div>
      </div>

      {/* Top 5 bids */}
      <div className="space-y-1">
        {data.bids.slice(0, maxLevels).map((bid, i) => (
          <div key={`bid-${i}`} className="flex justify-between text-xs">
            <span className="font-mono text-positive">{bid.price.toFixed(2)}</span>
            <span className="font-mono text-text-secondary">{bid.size.toFixed(4)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
