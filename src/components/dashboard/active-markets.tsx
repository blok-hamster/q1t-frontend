'use client';

import { useState, useEffect, useRef, memo } from 'react';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSocket } from '@/context/socket-context';
import { TrendingUp, TrendingDown, Radio, Clock } from 'lucide-react';
import type { MidMarketState } from '@/types/websocket';

const ALL_MARKETS = [
  { id: 'btc-5m', asset: 'BTC', window: '5m' },
  { id: 'btc-15m', asset: 'BTC', window: '15m' },
  { id: 'eth-5m', asset: 'ETH', window: '5m' },
  { id: 'eth-15m', asset: 'ETH', window: '15m' },
  { id: 'sol-5m', asset: 'SOL', window: '5m' },
  { id: 'sol-15m', asset: 'SOL', window: '15m' },
  { id: 'doge-5m', asset: 'DOGE', window: '5m' },
  { id: 'doge-15m', asset: 'DOGE', window: '15m' },
];

interface MarketState {
  upPrice: number | null;
  downPrice: number | null;
  strikePrice: number | null;
  priceDistance: number | null;
  windowEndTs: number;
  position: { direction: string; entry_price: number } | null;
  lastEvent: number;
  dailyTrades: number;
  dailyWins: number;
  dailyLosses: number;
  dailyPnl: number;
}

function emptyState(): MarketState {
  return {
    upPrice: null,
    downPrice: null,
    strikePrice: null,
    priceDistance: null,
    windowEndTs: 0,
    position: null,
    lastEvent: 0,
    dailyTrades: 0,
    dailyWins: 0,
    dailyLosses: 0,
    dailyPnl: 0,
  };
}

export const ActiveMarkets = memo(function ActiveMarkets() {
  const { socket } = useSocket();
  const [markets, setMarkets] = useState<Record<string, MarketState>>(() => {
    const init: Record<string, MarketState> = {};
    ALL_MARKETS.forEach(m => { init[m.id] = emptyState(); });
    return init;
  });

  const marketsRef = useRef(markets);
  marketsRef.current = markets;

  useEffect(() => {
    if (!socket) return;

    const handler = (data: MidMarketState) => {
      const mt = (data as any).market_type || 'btc-5m';
      if (!marketsRef.current[mt]) return;

      setMarkets(prev => {
        const current = prev[mt];
        const updated: MarketState = { ...current, lastEvent: Date.now() };

        if (data.type === 'outcome' || data.type === 'window_end') {
          updated.position = null;
          updated.upPrice = null;
          updated.downPrice = null;
          return { ...prev, [mt]: updated };
        }

        if (data.up_price != null) updated.upPrice = Math.round(data.up_price * 100) / 100;
        if (data.down_price != null) updated.downPrice = Math.round(data.down_price * 100) / 100;
        if (data.strike_price != null) updated.strikePrice = data.strike_price;
        if (data.price_distance != null) updated.priceDistance = Math.round(data.price_distance * 10) / 10;
        if (data.window_end_ts && data.window_end_ts > 0) updated.windowEndTs = data.window_end_ts;
        if ((data as any).position) updated.position = (data as any).position;
        if (data.type === 'stop_sell') updated.position = null;
        if ((data as any).daily_trades != null) updated.dailyTrades = (data as any).daily_trades;
        if ((data as any).daily_wins != null) updated.dailyWins = (data as any).daily_wins;
        if ((data as any).daily_losses != null) updated.dailyLosses = (data as any).daily_losses;
        if ((data as any).daily_pnl != null) updated.dailyPnl = Math.round((data as any).daily_pnl * 100) / 100;

        return { ...prev, [mt]: updated };
      });
    };

    socket.on('mid_market_update', handler);
    return () => { socket.off('mid_market_update', handler); };
  }, [socket]);

  // Re-evaluate active/inactive every 5s
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick(t => t + 1), 5000);
    return () => clearInterval(id);
  }, []);

  const activeMarkets = ALL_MARKETS.filter(m => {
    const s = markets[m.id];
    return s.lastEvent > 0 && (Date.now() - s.lastEvent < 15000);
  });

  const inactiveMarkets = ALL_MARKETS.filter(m => {
    const s = markets[m.id];
    return s.lastEvent === 0 || (Date.now() - s.lastEvent >= 15000);
  });

  const totalTrades = ALL_MARKETS.reduce((sum, m) => sum + markets[m.id].dailyTrades, 0);
  const totalWins = ALL_MARKETS.reduce((sum, m) => sum + markets[m.id].dailyWins, 0);
  const totalLosses = ALL_MARKETS.reduce((sum, m) => sum + markets[m.id].dailyLosses, 0);
  const totalPnl = Math.round(ALL_MARKETS.reduce((sum, m) => sum + markets[m.id].dailyPnl, 0) * 100) / 100;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="h-5 w-5 text-accent-primary" />
            <h3 className="text-sm font-semibold text-text-primary">Active Markets</h3>
          </div>
          <Badge variant={activeMarkets.length > 0 ? 'success' : 'neutral'} size="sm">
            {activeMarkets.length}/{ALL_MARKETS.length}
          </Badge>
        </div>
      </CardHeader>

      <CardBody className="space-y-2">
        {activeMarkets.length === 0 && (
          <div className="text-center py-4">
            <p className="text-xs text-text-tertiary">No markets active</p>
          </div>
        )}

        {activeMarkets.map(m => (
          <MarketRow key={m.id} market={m} state={markets[m.id]} />
        ))}

        {inactiveMarkets.length > 0 && activeMarkets.length > 0 && (
          <div className="pt-2 border-t border-border/50">
            <p className="text-[10px] text-text-tertiary uppercase font-bold mb-1.5">Inactive</p>
            <div className="flex flex-wrap gap-1.5">
              {inactiveMarkets.map(m => (
                <span key={m.id} className="text-[10px] text-text-tertiary bg-bg-tertiary rounded px-1.5 py-0.5 font-mono">
                  {m.asset}-{m.window}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Totals */}
        <div className="pt-3 border-t border-border">
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center">
              <p className="text-[10px] text-text-tertiary uppercase font-bold">Trades</p>
              <p className="text-sm font-bold text-text-primary tabular-nums">{totalTrades}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-text-tertiary uppercase font-bold">W/L</p>
              <div className="text-sm font-bold tabular-nums">
                <span className="text-positive">{totalWins}</span>
                <span className="text-text-tertiary mx-0.5">/</span>
                <span className="text-negative">{totalLosses}</span>
              </div>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-text-tertiary uppercase font-bold">PnL</p>
              <p className={`text-sm font-mono font-bold tabular-nums ${totalPnl >= 0 ? 'text-positive' : 'text-negative'}`}>
                ${totalPnl.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
});

function MarketRow({ market, state }: { market: typeof ALL_MARKETS[0]; state: MarketState }) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!state.windowEndTs) { setRemaining(0); return; }
    const tick = () => setRemaining(Math.max(0, Math.floor(state.windowEndTs - Date.now() / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [state.windowEndTs]);

  const timeLabel = remaining > 0
    ? `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')}`
    : '—';

  const hasPosition = !!state.position;

  return (
    <div className="flex items-center justify-between p-2 bg-bg-tertiary rounded-lg border border-border/30">
      <div className="flex items-center gap-2">
        <div className={`h-2 w-2 rounded-full ${hasPosition ? 'bg-accent-primary animate-pulse' : 'bg-positive'}`} />
        <span className="text-xs font-bold text-text-primary uppercase">{market.asset}</span>
        <span className="text-[10px] text-text-tertiary font-mono">{market.window}</span>
      </div>

      <div className="flex items-center gap-3">
        {hasPosition && (
          <Badge variant={state.position!.direction === 'UP' ? 'success' : 'error'} size="sm">
            {state.position!.direction === 'UP'
              ? <TrendingUp className="h-3 w-3" />
              : <TrendingDown className="h-3 w-3" />}
          </Badge>
        )}

        {state.upPrice != null && (
          <div className="flex gap-1.5 text-[10px] font-mono tabular-nums">
            <span className="text-positive">${state.upPrice.toFixed(2)}</span>
            <span className="text-text-tertiary">/</span>
            <span className="text-negative">${state.downPrice?.toFixed(2) ?? '—'}</span>
          </div>
        )}

        {state.priceDistance != null && (
          <span className={`text-[10px] font-mono tabular-nums ${state.priceDistance >= 25 ? 'text-positive' : 'text-text-tertiary'}`}>
            ${state.priceDistance.toFixed(0)}
          </span>
        )}

        <div className="flex items-center gap-0.5 text-[10px] font-mono text-text-secondary tabular-nums min-w-[32px] justify-end">
          <Clock className="h-2.5 w-2.5" />
          {timeLabel}
        </div>
      </div>
    </div>
  );
}
