'use client';

import { useState, useEffect, useRef, memo } from 'react';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSocket } from '@/context/socket-context';
import { executionApi } from '@/lib/api';
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
  { id: 'bnb-5m', asset: 'BNB', window: '5m' },
  { id: 'xrp-5m', asset: 'XRP', window: '5m' },
  { id: 'hype-5m', asset: 'HYPE', window: '5m' },
];

function formatDistance(asset: string, value: number): string {
  if (asset === 'DOGE') return `$${value.toFixed(4)}`;
  if (asset === 'SOL') return `$${value.toFixed(2)}`;
  if (asset === 'ETH') return `$${value.toFixed(1)}`;
  return `$${value.toFixed(0)}`;
}

function isDistanceSignificant(asset: string, value: number): boolean {
  if (asset === 'DOGE') return value >= 0.0002;
  if (asset === 'SOL') return value >= 0.10;
  if (asset === 'ETH') return value >= 3;
  return value >= 25;
}

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
  bestEdge: number | null;
  minFvEdge: number;
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
    bestEdge: null,
    minFvEdge: 0.04,
  };
}

interface ActiveMarketsProps {
  enabledMarkets?: string[];
}

export const ActiveMarkets = memo(function ActiveMarkets({ enabledMarkets }: ActiveMarketsProps) {
  const { socket } = useSocket();
  const [markets, setMarkets] = useState<Record<string, MarketState>>(() => {
    const init: Record<string, MarketState> = {};
    ALL_MARKETS.forEach(m => { init[m.id] = emptyState(); });
    return init;
  });

  const marketsRef = useRef(markets);
  marketsRef.current = markets;

  // Fetch persisted daily stats + open positions on mount (per-market)
  useEffect(() => {
    executionApi.getMidMarketStats().then((stats) => {
      setMarkets(prev => {
        const updated = { ...prev };
        for (const id of Object.keys(updated)) {
          const ms = stats.per_market?.[id];
          if (ms) {
            updated[id] = {
              ...updated[id],
              dailyTrades: ms.trades,
              dailyWins: ms.wins,
              dailyLosses: ms.losses,
              dailyPnl: ms.pnl,
            };
          }
          const posRaw = stats.positions?.[id];
          const pos = Array.isArray(posRaw) ? posRaw[0] : posRaw;
          if (pos) {
            updated[id] = {
              ...updated[id],
              position: { direction: pos.direction, entry_price: pos.entry_price },
              lastEvent: Date.now(),
            };
          }
        }
        return updated;
      });
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handler = (data: MidMarketState) => {
      if (data.type === 'heartbeat') return;
      const mt = (data as any).market_type || 'btc-5m';
      if (!marketsRef.current[mt]) return;

      setMarkets(prev => {
        const current = prev[mt];
        const updated: MarketState = { ...current, lastEvent: Date.now() };

        if (data.type === 'outcome' || data.type === 'window_end') {
          updated.position = null;
          updated.upPrice = null;
          updated.downPrice = null;
          updated.bestEdge = null;
          return { ...prev, [mt]: updated };
        }

        const effectiveUp = data.ask_up ?? data.up_price;
        const effectiveDown = data.ask_down ?? data.down_price;
        const effectiveDist = data.pm_price_distance ?? data.price_distance;
        if (effectiveUp != null) updated.upPrice = Math.round(effectiveUp * 100) / 100;
        if (effectiveDown != null) updated.downPrice = Math.round(effectiveDown * 100) / 100;
        if (data.strike_price != null) updated.strikePrice = data.strike_price;
        if (effectiveDist != null) updated.priceDistance = Math.round(effectiveDist * 10) / 10;
        if (data.window_end_ts && data.window_end_ts > 0) updated.windowEndTs = data.window_end_ts;
        if (data.position) updated.position = data.position;
        if (data.type === 'stop_sell') updated.position = null;
        if (data.daily_trades != null) updated.dailyTrades = data.daily_trades;
        if (data.daily_wins != null) updated.dailyWins = data.daily_wins;
        if (data.daily_losses != null) updated.dailyLosses = data.daily_losses;
        if (data.daily_pnl != null) updated.dailyPnl = Math.round(data.daily_pnl * 100) / 100;
        if (data.min_fv_edge != null) updated.minFvEdge = data.min_fv_edge;
        if (data.fv_edge_up != null || data.fv_edge_down != null) {
          const edges = [data.fv_edge_up, data.fv_edge_down].filter((e): e is number => e != null);
          updated.bestEdge = edges.length > 0 ? Math.max(...edges) : null;
        }

        return { ...prev, [mt]: updated };
      });
    };

    socket.on('mid_market_update', handler);

    // Per-user events for position/stats tracking
    const entryHandler = (data: any) => {
      const mt = data.market_type || 'btc-5m';
      if (!marketsRef.current[mt]) return;
      setMarkets(prev => ({
        ...prev,
        [mt]: {
          ...prev[mt],
          position: { direction: data.direction, entry_price: data.entry_price },
          dailyTrades: data.daily_trades ?? prev[mt].dailyTrades + 1,
          dailyWins: data.daily_wins ?? prev[mt].dailyWins,
          dailyLosses: data.daily_losses ?? prev[mt].dailyLosses,
          dailyPnl: data.daily_pnl != null ? Math.round(data.daily_pnl * 100) / 100 : prev[mt].dailyPnl,
          lastEvent: Date.now(),
        }
      }));
    };

    const stopHandler = (data: any) => {
      const mt = data.market_type || 'btc-5m';
      if (!marketsRef.current[mt]) return;
      setMarkets(prev => ({
        ...prev,
        [mt]: {
          ...prev[mt],
          position: null,
          dailyTrades: data.daily_trades ?? prev[mt].dailyTrades,
          dailyWins: data.daily_wins ?? prev[mt].dailyWins,
          dailyLosses: data.daily_losses ?? prev[mt].dailyLosses + 1,
          dailyPnl: data.daily_pnl != null ? Math.round(data.daily_pnl * 100) / 100 : prev[mt].dailyPnl,
          lastEvent: Date.now(),
        }
      }));
    };

    const resolvedHandler = (data: any) => {
      const mt = data.market_type || 'btc-5m';
      if (!marketsRef.current[mt]) return;
      setMarkets(prev => ({
        ...prev,
        [mt]: {
          ...prev[mt],
          position: null,
          dailyTrades: data.daily_trades ?? prev[mt].dailyTrades,
          dailyWins: data.daily_wins ?? prev[mt].dailyWins + (data.outcome === 'WIN' ? 1 : 0),
          dailyLosses: data.daily_losses ?? prev[mt].dailyLosses,
          dailyPnl: data.daily_pnl != null ? Math.round(data.daily_pnl * 100) / 100 : prev[mt].dailyPnl,
          lastEvent: Date.now(),
        }
      }));
    };

    socket.on('mid_market_entry', entryHandler);
    socket.on('mid_market_stop', stopHandler);
    socket.on('mid_market_resolved', resolvedHandler);

    return () => {
      socket.off('mid_market_update', handler);
      socket.off('mid_market_entry', entryHandler);
      socket.off('mid_market_stop', stopHandler);
      socket.off('mid_market_resolved', resolvedHandler);
    };
  }, [socket]);

  // Re-evaluate active/inactive every 5s
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick(t => t + 1), 5000);
    return () => clearInterval(id);
  }, []);

  // Only show markets the user has enabled (or all if prop not provided)
  const visibleMarkets = enabledMarkets && enabledMarkets.length > 0
    ? ALL_MARKETS.filter(m => enabledMarkets.includes(m.id))
    : ALL_MARKETS;

  const activeMarkets = visibleMarkets.filter(m => {
    const s = markets[m.id];
    return s.lastEvent > 0 && (Date.now() - s.lastEvent < 15000);
  });

  const inactiveMarkets = visibleMarkets.filter(m => {
    const s = markets[m.id];
    return s.lastEvent === 0 || (Date.now() - s.lastEvent >= 15000);
  });

  const totalTrades = visibleMarkets.reduce((sum, m) => sum + markets[m.id].dailyTrades, 0);
  const totalWins = visibleMarkets.reduce((sum, m) => sum + markets[m.id].dailyWins, 0);
  const totalLosses = visibleMarkets.reduce((sum, m) => sum + markets[m.id].dailyLosses, 0);
  const totalPnl = Math.round(visibleMarkets.reduce((sum, m) => sum + markets[m.id].dailyPnl, 0) * 100) / 100;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="h-5 w-5 text-accent-primary" />
            <h3 className="text-sm font-semibold text-text-primary">Active Markets</h3>
          </div>
          <Badge variant={activeMarkets.length > 0 ? 'success' : 'neutral'} size="sm">
            {activeMarkets.length}/{visibleMarkets.length}
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
          <span className={`text-[10px] font-mono tabular-nums ${isDistanceSignificant(market.asset, state.priceDistance) ? 'text-positive' : 'text-text-tertiary'}`}>
            {formatDistance(market.asset, state.priceDistance)}
          </span>
        )}

        {state.bestEdge != null && (
          <span
            className={`text-[10px] font-mono tabular-nums ${
              state.bestEdge >= state.minFvEdge
                ? 'text-positive font-bold'
                : state.bestEdge > 0
                ? 'text-text-secondary'
                : 'text-text-tertiary'
            }`}
          >
            {state.bestEdge >= 0 ? '+' : ''}{(state.bestEdge * 100).toFixed(1)}¢
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
