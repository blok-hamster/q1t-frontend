'use client';

import { useState, useEffect, useRef, memo } from 'react';
import { useSocket } from '@/context/socket-context';
import { executionApi, settingsApi } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Radio, Clock, Zap, Activity, Brain } from 'lucide-react';
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

interface PositionInfo {
  direction: string;
  entry_price: number;
  strategy: 'mid_market' | 'scalp' | 'prediction';
  num_shares?: number;
  stop_price?: number;
  take_profit_price?: number;
  rr_ratio?: number;
}

function deriveMarketType(slug: string): string | null {
  const parts = slug.split('-');
  if (parts.length >= 4) return `${parts[0]}-${parts[2]}`;
  return null;
}

interface MarketState {
  upPrice: number | null;
  downPrice: number | null;
  strikePrice: number | null;
  priceDistance: number | null;
  windowEndTs: number;
  position: PositionInfo | null;
  lastEvent: number;
  mqsScore: number;
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
    mqsScore: 0,
  };
}

type StatsFilter = 'all' | 'mid_market' | 'scalp';

interface StrategyAgg {
  trades: number;
  wins: number;
  losses: number;
  pnl: number;
}

export const ActivePositionsTable = memo(function ActivePositionsTable() {
  const { socket } = useSocket();
  const [markets, setMarkets] = useState<Record<string, MarketState>>(() => {
    const init: Record<string, MarketState> = {};
    ALL_MARKETS.forEach(m => { init[m.id] = emptyState(); });
    return init;
  });
  const [midStats, setMidStats] = useState<StrategyAgg>({ trades: 0, wins: 0, losses: 0, pnl: 0 });
  const [scalpStats, setScalpStats] = useState<StrategyAgg>({ trades: 0, wins: 0, losses: 0, pnl: 0 });
  const [statsFilter, setStatsFilter] = useState<StatsFilter>('all');
  const [activeStrategies, setActiveStrategies] = useState<string[]>([]);

  const marketsRef = useRef(markets);
  marketsRef.current = markets;
  const strategiesRef = useRef(activeStrategies);
  strategiesRef.current = activeStrategies;

  // Fetch persisted stats + positions on mount
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [midData, scalpData, tradesData, strategyData] = await Promise.all([
          executionApi.getMidMarketStats(),
          executionApi.getScalpStats(),
          executionApi.getTrades(),
          settingsApi.getStrategySelection(),
        ]);

        const enabled = strategyData.strategySelection?.active_strategies ?? [];
        setActiveStrategies(enabled);

        setMarkets(prev => {
          const updated = { ...prev };
          for (const id of Object.keys(updated)) {
            // Mid-market positions (only if strategy enabled)
            const midPos = midData.positions?.[id];
            if (midPos && enabled.includes('mid_market')) {
              updated[id] = {
                ...updated[id],
                position: {
                  direction: midPos.direction,
                  entry_price: midPos.entry_price,
                  strategy: 'mid_market',
                  num_shares: midPos.num_shares,
                },
                lastEvent: Date.now(),
              };
            }
            // Scalp positions (only if strategy enabled)
            const scalpPos = scalpData.positions?.[id];
            if (scalpPos && enabled.includes('scalp')) {
              updated[id] = {
                ...updated[id],
                position: {
                  direction: scalpPos.direction,
                  entry_price: scalpPos.entry_price,
                  strategy: 'scalp',
                  num_shares: scalpPos.num_shares,
                  take_profit_price: scalpPos.take_profit_price,
                  stop_price: scalpPos.stop_loss_price,
                },
                lastEvent: Date.now(),
              };
            }
          }

          // Open prediction trades (only if AI strategy enabled)
          if (enabled.includes('ai_prediction')) {
            const openPredictions = tradesData.trades.filter(
              (t: any) => t.strategy === 'ai_prediction' && t.status === 'OPEN'
            );
            for (const trade of openPredictions) {
              const mt = deriveMarketType(trade.market_slug);
              if (mt && updated[mt] && !updated[mt].position) {
                updated[mt] = {
                  ...updated[mt],
                  position: {
                    direction: trade.direction,
                    entry_price: trade.execution_price || trade.entry_share_price || 0,
                    strategy: 'prediction',
                    num_shares: trade.num_shares ?? undefined,
                  },
                  lastEvent: Date.now(),
                };
              }
            }
          }

          return updated;
        });

        // Use top-level aggregates directly (same source as socket events)
        setMidStats({
          trades: midData.daily_trades ?? 0,
          wins: midData.daily_wins ?? 0,
          losses: midData.daily_losses ?? 0,
          pnl: midData.daily_pnl ?? 0,
        });

        setScalpStats({
          trades: scalpData.daily_trades ?? 0,
          wins: scalpData.daily_wins ?? 0,
          losses: scalpData.daily_losses ?? 0,
          pnl: scalpData.daily_pnl ?? 0,
        });
      } catch {}
    };
    fetchAll();
  }, []);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    // Mid-market tick updates (prices, MQS, distance, timer)
    const midUpdateHandler = (data: MidMarketState) => {
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
        if (data.type === 'stop_sell') updated.position = null;
        if ((data as any).mqs_score != null) updated.mqsScore = Math.round((data as any).mqs_score * 100) / 100;

        return { ...prev, [mt]: updated };
      });
    };

    const refetchMidStats = () => {
      executionApi.getMidMarketStats().then(d => {
        setMidStats({ trades: d.daily_trades ?? 0, wins: d.daily_wins ?? 0, losses: d.daily_losses ?? 0, pnl: d.daily_pnl ?? 0 });
      }).catch(() => {});
    };

    const refetchScalpStats = () => {
      executionApi.getScalpStats().then(d => {
        setScalpStats({ trades: d.daily_trades ?? 0, wins: d.daily_wins ?? 0, losses: d.daily_losses ?? 0, pnl: d.daily_pnl ?? 0 });
      }).catch(() => {});
    };

    // Mid-market entry
    const midEntryHandler = (data: any) => {
      const mt = data.market_type || 'btc-5m';
      if (!marketsRef.current[mt]) return;
      if (!strategiesRef.current.includes('mid_market')) return;
      setMarkets(prev => ({
        ...prev,
        [mt]: {
          ...prev[mt],
          position: {
            direction: data.direction,
            entry_price: data.entry_price,
            strategy: 'mid_market',
            num_shares: data.num_shares,
            stop_price: data.stop_price,
            rr_ratio: data.rr_ratio,
          },
          lastEvent: Date.now(),
        }
      }));
      refetchMidStats();
    };

    // Mid-market stop/resolved
    const midExitHandler = (data: any) => {
      const mt = data.market_type || 'btc-5m';
      if (!marketsRef.current[mt]) return;
      setMarkets(prev => ({
        ...prev,
        [mt]: { ...prev[mt], position: null, lastEvent: Date.now() }
      }));
      refetchMidStats();
    };

    // Retrace watching (part of mid-market strategy)
    const retraceWatchHandler = (data: any) => {
      const mt = data.market_type || 'btc-5m';
      if (!marketsRef.current[mt]) return;
      if (!strategiesRef.current.includes('mid_market')) return;
      setMarkets(prev => ({
        ...prev,
        [mt]: {
          ...prev[mt],
          position: {
            direction: data.direction,
            entry_price: data.target_price,
            strategy: 'mid_market',
            num_shares: data.num_shares,
            stop_price: data.stop_price,
            rr_ratio: data.rr_ratio,
          },
          lastEvent: Date.now(),
        }
      }));
    };

    const retraceExpiredHandler = (data: any) => {
      const mt = data.market_type || 'btc-5m';
      if (!marketsRef.current[mt]) return;
      setMarkets(prev => ({
        ...prev,
        [mt]: { ...prev[mt], position: null, lastEvent: Date.now() }
      }));
    };

    // Scalp entry
    const scalpEntryHandler = (data: any) => {
      const mt = data.market_type || 'btc-5m';
      if (!marketsRef.current[mt]) return;
      if (!strategiesRef.current.includes('scalp')) return;
      setMarkets(prev => ({
        ...prev,
        [mt]: {
          ...prev[mt],
          position: {
            direction: data.direction,
            entry_price: data.entry_price,
            strategy: 'scalp',
            num_shares: data.num_shares,
            take_profit_price: data.take_profit,
            stop_price: data.stop_loss,
          },
          lastEvent: Date.now(),
        }
      }));
    };

    // Scalp exit
    const scalpExitHandler = (data: any) => {
      const mt = data.market_type || 'btc-5m';
      if (!marketsRef.current[mt]) return;
      setMarkets(prev => ({
        ...prev,
        [mt]: { ...prev[mt], position: null, lastEvent: Date.now() }
      }));
      refetchScalpStats();
    };

    // Prediction / AI signal — lights up when execution dispatched
    const predictionEntryHandler = (data: any) => {
      if (!data.market_slug) return;
      if (!strategiesRef.current.includes('ai_prediction')) return;
      const mt = deriveMarketType(data.market_slug);
      if (!mt || !marketsRef.current[mt]) return;
      setMarkets(prev => ({
        ...prev,
        [mt]: {
          ...prev[mt],
          position: {
            direction: data.direction,
            entry_price: data.entry_price || data.strike_price || 0,
            strategy: 'prediction',
            num_shares: data.num_shares,
          },
          lastEvent: Date.now(),
        }
      }));
    };

    // Execution update — clear prediction position on terminal status
    const executionUpdateHandler = (data: any) => {
      if (!data.strategy || data.strategy !== 'ai_prediction') return;
      if (!data.market_slug) return;
      const mt = deriveMarketType(data.market_slug);
      if (!mt || !marketsRef.current[mt]) return;
      const terminal = ['CLOSED_WIN', 'CLOSED_LOSS', 'REJECTED'].includes(data.status);
      if (terminal) {
        setMarkets(prev => {
          if (prev[mt].position?.strategy !== 'prediction') return prev;
          return { ...prev, [mt]: { ...prev[mt], position: null, lastEvent: Date.now() } };
        });
      }
    };

    socket.on('mid_market_update', midUpdateHandler);
    socket.on('mid_market_entry', midEntryHandler);
    socket.on('mid_market_stop', midExitHandler);
    socket.on('mid_market_resolved', midExitHandler);
    socket.on('mid_market_retrace_watching', retraceWatchHandler);
    socket.on('mid_market_limit_expired', retraceExpiredHandler);
    socket.on('scalp_entry', scalpEntryHandler);
    socket.on('scalp_exit', scalpExitHandler);
    socket.on('ai_signal_update', predictionEntryHandler);
    socket.on('execution_update', executionUpdateHandler);

    return () => {
      socket.off('mid_market_update', midUpdateHandler);
      socket.off('mid_market_entry', midEntryHandler);
      socket.off('mid_market_stop', midExitHandler);
      socket.off('mid_market_resolved', midExitHandler);
      socket.off('mid_market_retrace_watching', retraceWatchHandler);
      socket.off('mid_market_limit_expired', retraceExpiredHandler);
      socket.off('scalp_entry', scalpEntryHandler);
      socket.off('scalp_exit', scalpExitHandler);
      socket.off('ai_signal_update', predictionEntryHandler);
      socket.off('execution_update', executionUpdateHandler);
    };
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

  // Filtered totals based on selected strategy
  const totalTrades = statsFilter === 'scalp' ? scalpStats.trades : statsFilter === 'mid_market' ? midStats.trades : midStats.trades + scalpStats.trades;
  const totalWins = statsFilter === 'scalp' ? scalpStats.wins : statsFilter === 'mid_market' ? midStats.wins : midStats.wins + scalpStats.wins;
  const totalLosses = statsFilter === 'scalp' ? scalpStats.losses : statsFilter === 'mid_market' ? midStats.losses : midStats.losses + scalpStats.losses;
  const totalPnl = Math.round((statsFilter === 'scalp' ? scalpStats.pnl : statsFilter === 'mid_market' ? midStats.pnl : midStats.pnl + scalpStats.pnl) * 100) / 100;

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

        {/* Totals with strategy filter */}
        <div className="pt-3 border-t border-border space-y-2">
          <div className="flex justify-center gap-1">
            {(['all', 'mid_market', 'scalp'] as const).map(f => (
              <button
                key={f}
                onClick={() => setStatsFilter(f)}
                className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-md transition-colors ${
                  statsFilter === f
                    ? 'bg-accent-primary text-white'
                    : 'text-text-tertiary hover:text-text-secondary hover:bg-bg-tertiary'
                }`}
              >
                {f === 'all' ? 'All' : f === 'mid_market' ? 'Mid' : 'Scalp'}
              </button>
            ))}
          </div>
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

  const pos = state.position;
  const activeStrategy = pos?.strategy ?? null;

  return (
    <div className={`p-2.5 bg-bg-tertiary rounded-lg border ${pos ? 'border-accent-primary/30' : 'border-border/30'}`}>
      {/* Top row: market name, strategy badges, prices, distance, MQS, timer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${pos ? 'bg-accent-primary animate-pulse' : 'bg-positive'}`} />
          <span className="text-xs font-bold text-text-primary uppercase">{market.asset}</span>
          <span className="text-[10px] text-text-tertiary font-mono">{market.window}</span>
          {/* Strategy badges — always visible, lit when active */}
          <div className="flex items-center gap-1 ml-1">
            <StrategyBadge strategy="mid_market" active={activeStrategy === 'mid_market'} />
            <StrategyBadge strategy="scalp" active={activeStrategy === 'scalp'} />
            <StrategyBadge strategy="prediction" active={activeStrategy === 'prediction'} />
          </div>
        </div>

        <div className="flex items-center gap-3">
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

          {state.mqsScore > 0 && (
            <span className={`text-[10px] font-mono tabular-nums ${state.mqsScore >= 0.6 ? 'text-positive' : state.mqsScore >= 0.4 ? 'text-warning' : 'text-negative'}`}>
              {(state.mqsScore * 100).toFixed(0)}%
            </span>
          )}

          <div className="flex items-center gap-0.5 text-[10px] font-mono text-text-secondary tabular-nums min-w-[32px] justify-end">
            <Clock className="h-2.5 w-2.5" />
            {timeLabel}
          </div>
        </div>
      </div>

      {/* Position details (only if there's an active position) */}
      {pos && (
        <div className="mt-1.5 pt-1.5 border-t border-border/30 flex items-center justify-between">
          <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded ${
            pos.direction === 'UP' ? 'bg-positive/15 text-positive' : 'bg-negative/15 text-negative'
          }`}>
            {pos.direction === 'UP' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {pos.direction}
          </span>

          <div className="flex items-center gap-3 text-[10px] font-mono tabular-nums">
            <span className="text-text-secondary">
              @ ${pos.entry_price.toFixed(2)}
            </span>
            {pos.stop_price != null && (
              <span className="text-negative">SL ${pos.stop_price.toFixed(2)}</span>
            )}
            {pos.take_profit_price != null && (
              <span className="text-positive">TP ${pos.take_profit_price.toFixed(2)}</span>
            )}
            {pos.rr_ratio != null && (
              <span className="text-text-tertiary">R:R {pos.rr_ratio.toFixed(2)}</span>
            )}
            {pos.num_shares != null && (
              <span className="text-text-tertiary">{pos.num_shares}sh</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StrategyBadge({ strategy, active }: { strategy: string; active: boolean }) {
  const base = 'inline-flex items-center gap-0.5 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded transition-colors';

  switch (strategy) {
    case 'mid_market':
      return (
        <span className={`${base} ${active ? 'bg-accent-primary/20 text-accent-primary' : 'bg-bg-secondary/50 text-text-tertiary/40'}`}>
          <Activity className="h-2.5 w-2.5" />
          MID
        </span>
      );
    case 'scalp':
      return (
        <span className={`${base} ${active ? 'bg-warning/20 text-warning' : 'bg-bg-secondary/50 text-text-tertiary/40'}`}>
          <Zap className="h-2.5 w-2.5" />
          SCALP
        </span>
      );
    case 'prediction':
      return (
        <span className={`${base} ${active ? 'bg-purple-500/20 text-purple-400' : 'bg-bg-secondary/50 text-text-tertiary/40'}`}>
          <Brain className="h-2.5 w-2.5" />
          AI
        </span>
      );
    default:
      return null;
  }
}
