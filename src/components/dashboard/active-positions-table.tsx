'use client';

import { useState, useEffect, useRef, memo } from 'react';
import Link from 'next/link';
import { useSocket } from '@/context/socket-context';
import { useAuth } from '@/context/auth-context';
import { executionApi, settingsApi } from '@/lib/api';
import { TrendingUp, TrendingDown, Radio, Clock, Activity, ArrowUpRight, Flame } from 'lucide-react';
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
  strategy: 'mid_market' | 'ai_prediction_v2';
  num_shares?: number;
  stop_price?: number;
  fair_value_at_entry?: number;
  fair_value_edge_at_entry?: number;
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
    bestEdge: null,
    minFvEdge: 0.04,
  };
}

interface StrategyAgg {
  trades: number;
  wins: number;
  losses: number;
  pnl: number;
}

export const ActivePositionsTable = memo(function ActivePositionsTable() {
  const { socket } = useSocket();
  const { user } = useAuth();
  const [markets, setMarkets] = useState<Record<string, MarketState>>(() => {
    const init: Record<string, MarketState> = {};
    ALL_MARKETS.forEach(m => { init[m.id] = emptyState(); });
    return init;
  });
  const [midStats, setMidStats] = useState<StrategyAgg>({ trades: 0, wins: 0, losses: 0, pnl: 0 });
  const [enabledMarkets, setEnabledMarkets] = useState<string[]>(['btc-5m']);
  const [adminApprovedMarkets, setAdminApprovedMarkets] = useState<string[]>([]);
  const [activeStrategies, setActiveStrategies] = useState<string[]>([]);

  const marketsRef = useRef(markets);
  marketsRef.current = markets;
  const strategiesRef = useRef(activeStrategies);
  strategiesRef.current = activeStrategies;

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [midData, tradesData, strategyData, marketConfigData] = await Promise.all([
          executionApi.getMidMarketStats(),
          executionApi.getTrades(),
          settingsApi.getStrategySelection(),
          settingsApi.getMarketConfigs(),
        ]);

        const approved = (marketConfigData.marketConfigs || [])
          .filter((c: any) => c.enabled !== false)
          .map((c: any) => c.market_type);
        setAdminApprovedMarkets(approved);

        const enabledStrats = strategyData.strategySelection?.active_strategies ?? [];
        const enabledMkts = strategyData.strategySelection?.mid_market_markets ?? ['btc-5m'];
        setActiveStrategies(enabledStrats);
        setEnabledMarkets(enabledMkts);

        setMarkets(prev => {
          const updated = { ...prev };
          for (const id of Object.keys(updated)) {
            const midPosRaw = midData.positions?.[id];
            const midPos = Array.isArray(midPosRaw) ? midPosRaw[0] : midPosRaw;
            if (midPos && enabledStrats.includes('mid_market')) {
              updated[id] = {
                ...updated[id],
                position: {
                  direction: midPos.direction,
                  entry_price: midPos.entry_price,
                  strategy: 'mid_market',
                  num_shares: midPos.num_shares,
                  stop_price: midPos.stop_loss_price,
                  fair_value_at_entry: midPos.fair_value_at_entry,
                  fair_value_edge_at_entry: midPos.fair_value_edge_at_entry,
                },
                lastEvent: Date.now(),
              };
            }
          }

          if (enabledStrats.includes('ai_prediction_v2')) {
            const openPredictions = tradesData.trades.filter(
              (t: any) => t.strategy === 'ai_prediction_v2' && t.status === 'OPEN'
            );
            for (const trade of openPredictions) {
              const mt = deriveMarketType(trade.market_slug);
              if (mt && updated[mt] && !updated[mt].position) {
                updated[mt] = {
                  ...updated[mt],
                  position: {
                    direction: trade.direction,
                    entry_price: trade.execution_price || trade.entry_share_price || 0,
                    strategy: 'ai_prediction_v2',
                    num_shares: trade.num_shares ?? undefined,
                  },
                  lastEvent: Date.now(),
                };
              }
            }
          }

          return updated;
        });

        setMidStats({
          trades: midData.daily_trades ?? 0,
          wins: midData.daily_wins ?? 0,
          losses: midData.daily_losses ?? 0,
          pnl: midData.daily_pnl ?? 0,
        });
      } catch {}
    };
    fetchAll();
  }, []);

  useEffect(() => {
    if (!socket) return;

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
          updated.bestEdge = null;
          return { ...prev, [mt]: updated };
        }

        if (data.up_price != null) updated.upPrice = Math.round(data.up_price * 100) / 100;
        if (data.down_price != null) updated.downPrice = Math.round(data.down_price * 100) / 100;
        if (data.strike_price != null) updated.strikePrice = data.strike_price;
        if (data.price_distance != null) updated.priceDistance = Math.round(data.price_distance * 10) / 10;
        if (data.window_end_ts && data.window_end_ts > 0) updated.windowEndTs = data.window_end_ts;
        if (data.type === 'stop_sell') updated.position = null;
        if (data.min_fv_edge != null) updated.minFvEdge = data.min_fv_edge;
        if (data.fv_edge_up != null || data.fv_edge_down != null) {
          const edges = [data.fv_edge_up, data.fv_edge_down].filter((e): e is number => e != null);
          updated.bestEdge = edges.length > 0 ? Math.max(...edges) : null;
        }

        return { ...prev, [mt]: updated };
      });
    };

    const refetchMidStats = () => {
      executionApi.getMidMarketStats().then((mid) => {
        setMidStats({
          trades: mid.daily_trades ?? 0,
          wins: mid.daily_wins ?? 0,
          losses: mid.daily_losses ?? 0,
          pnl: mid.daily_pnl ?? 0,
        });
      }).catch(() => {});
    };

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
            fair_value_at_entry: data.fair_value,
            fair_value_edge_at_entry: data.fair_value_edge,
          },
          lastEvent: Date.now(),
        }
      }));
      refetchMidStats();
    };

    const midExitHandler = (data: any) => {
      const mt = data.market_type || 'btc-5m';
      if (!marketsRef.current[mt]) return;
      setMarkets(prev => ({
        ...prev,
        [mt]: { ...prev[mt], position: null, lastEvent: Date.now() }
      }));
      refetchMidStats();
    };

    socket.on('mid_market_update', midUpdateHandler);
    socket.on('mid_market_entry', midEntryHandler);
    socket.on('mid_market_stop', midExitHandler);
    socket.on('mid_market_resolved', midExitHandler);

    return () => {
      socket.off('mid_market_update', midUpdateHandler);
      socket.off('mid_market_entry', midEntryHandler);
      socket.off('mid_market_stop', midExitHandler);
      socket.off('mid_market_resolved', midExitHandler);
    };
  }, [socket]);

  // Filter markets: For Admins, show all admin-approved platform markets. For regular users, show user-selected markets (or open positions).
  const visibleMarkets = ALL_MARKETS.filter((m) => {
    const hasOpenPos = markets[m.id]?.position != null;
    const isApprovedByAdmin = adminApprovedMarkets.length === 0 || adminApprovedMarkets.includes(m.id);
    const isUserEnabled = enabledMarkets.includes(m.id) && isApprovedByAdmin;
    const isEnabled = user?.isAdmin
      ? (adminApprovedMarkets.length > 0 ? isApprovedByAdmin : true)
      : (enabledMarkets.length > 0 ? isUserEnabled : isApprovedByAdmin);

    return isEnabled || hasOpenPos;
  });

  const openPositionsCount = ALL_MARKETS.filter(m => markets[m.id]?.position != null).length;

  return (
    <div className="bg-[#0F1215] border border-[#1B2026] font-mono select-none">
      {/* Header Bar (Mobile-Responsive Header & Badges) */}
      <div className="p-3 sm:p-3.5 border-b border-[#1B2026] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-[#16191E]/80">
        <div className="flex items-center justify-between w-full sm:w-auto">
          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center">
              <Radio className="h-4 w-4 text-[#20B2AA]" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#20B2AA] animate-ping" />
            </div>
            <h3 className="text-xs font-bold text-[#E1E4E8] uppercase tracking-[0.12em]">
              ACTIVE TRADING MARKETS
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {openPositionsCount > 0 && (
            <span className="px-2 sm:px-2.5 py-1 text-[10px] sm:text-xs font-black uppercase rounded-xs bg-[#20B2AA] text-[#080A0C] shadow-[0_0_15px_rgba(32,178,170,0.5)] animate-pulse flex items-center gap-1">
              <Flame className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              {openPositionsCount} OPEN POSITION{openPositionsCount > 1 ? 'S' : ''}
            </span>
          )}
          <span className="px-2 py-1 text-[9px] sm:text-[10px] font-bold uppercase rounded-xs bg-[#16191E] text-[#8B949E] border border-[#1B2026]">
            {visibleMarkets.length} TRADING MARKET{visibleMarkets.length > 1 ? 'S' : ''}
          </span>
        </div>
      </div>

      {/* Grid of Active Trading Market Cards */}
      <div className="p-3 sm:p-3.5">
        {visibleMarkets.length === 0 ? (
          <div className="text-center py-8 text-[#586069] text-xs uppercase tracking-wider">
            NO MARKETS ENABLED. GO TO SETTINGS TO ACTIVATE MARKETS.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            {visibleMarkets.map(m => (
              <MarketCard key={m.id} market={m} state={markets[m.id]} />
            ))}
          </div>
        )}
      </div>

      {/* Responsive Mobile Summary Bar */}
      <div className="p-2.5 sm:p-3 border-t border-[#1B2026] bg-[#16191E]/50">
        <div className="grid grid-cols-3 sm:flex sm:items-center sm:justify-end gap-2 sm:gap-6 text-xs tabular-nums font-mono text-center sm:text-right">
          <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-end gap-0.5 sm:gap-1.5">
            <span className="text-[9px] sm:text-[10px] text-[#586069] uppercase font-bold tracking-tight shrink-0">
              TRADES:
            </span>
            <span className="font-bold text-xs text-[#E1E4E8] shrink-0">
              {midStats.trades}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-end gap-0.5 sm:gap-1.5">
            <span className="text-[9px] sm:text-[10px] text-[#586069] uppercase font-bold tracking-tight shrink-0">
              W / L:
            </span>
            <div className="flex items-center gap-0.5 text-xs font-bold shrink-0">
              <span className="text-[#20B2AA]">{midStats.wins}</span>
              <span className="text-[#586069]">/</span>
              <span className="text-[#E55353]">{midStats.losses}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-end gap-0.5 sm:gap-1.5">
            <span className="text-[9px] sm:text-[10px] text-[#586069] uppercase font-bold tracking-tight shrink-0">
              P&L:
            </span>
            <span className={`font-bold text-xs shrink-0 ${midStats.pnl >= 0 ? 'text-[#20B2AA]' : 'text-[#E55353]'}`}>
              {midStats.pnl >= 0 ? '+' : ''}${midStats.pnl.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});

function MarketCard({ market, state }: { market: typeof ALL_MARKETS[0]; state: MarketState }) {
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
  const isLive = state.lastEvent > 0 && (Date.now() - state.lastEvent < 15000);
  const isLong = pos?.direction === 'UP';

  return (
    <Link
      href={`/strategies/mid-market?market=${market.id}`}
      className="block group"
    >
      <div
        className={`p-3 border transition-all rounded-xs space-y-2 font-mono relative overflow-hidden cursor-pointer ${
          pos
            ? isLong
              ? 'border-2 border-[#20B2AA] bg-[#20B2AA]/15 shadow-[0_0_25px_rgba(32,178,170,0.35)] scale-[1.02]'
              : 'border-2 border-[#E55353] bg-[#E55353]/15 shadow-[0_0_25px_rgba(229,83,83,0.35)] scale-[1.02]'
            : isLive
            ? 'border-[#1B2026] bg-[#16191E]/60 group-hover:border-[#20B2AA]/60 group-hover:bg-[#16191E]'
            : 'border-[#1B2026]/40 bg-[#16191E]/40 opacity-70 group-hover:opacity-100'
        }`}
      >
        {/* OPEN POSITION BANNER */}
        {pos && (
          <div
            className={`-mx-3 -mt-3 mb-2 px-3 py-1.5 font-black text-[11px] uppercase tracking-wider flex items-center justify-between ${
              isLong ? 'bg-[#20B2AA] text-[#080A0C]' : 'bg-[#E55353] text-[#FFFFFF]'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Flame className="h-4 w-4" aria-hidden="true" />
              <span>
                OPEN POSITION: {pos.direction === 'UP' ? 'LONG (YES)' : 'SHORT (NO)'}
              </span>
            </div>
            <span className="font-mono underline">
              @ ${(pos.entry_price ?? 0).toFixed(2)}
            </span>
          </div>
        )}

        {/* Top row: Market name, window, clickable icon */}
        <div className="flex items-center justify-between border-b border-[#1B2026]/80 pb-2">
          <div className="flex items-center gap-2">
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                pos
                  ? isLong ? 'bg-[#20B2AA] animate-ping' : 'bg-[#E55353] animate-ping'
                  : isLive
                  ? 'bg-[#20B2AA]'
                  : 'bg-[#586069]'
              }`}
            />
            <span className="text-xs font-bold text-[#E1E4E8] uppercase tracking-wide group-hover:text-[#20B2AA] transition-colors">
              {market.asset} {market.window}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[10px] text-[#586069] font-mono tabular-nums flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {timeLabel}
            </span>
            <ArrowUpRight className="h-3.5 w-3.5 text-[#586069] group-hover:text-[#20B2AA] transition-colors ml-1" />
          </div>
        </div>

        {/* YES / NO Pricing & Distance Row */}
        <div className="grid grid-cols-2 gap-2 text-xs tabular-nums py-0.5">
          <div>
            <span className="text-[9px] text-[#586069] uppercase font-bold block">YES / NO</span>
            {state.upPrice != null ? (
              <div className="font-bold">
                <span className="text-[#20B2AA]">${state.upPrice.toFixed(2)}</span>
                <span className="text-[#586069] mx-1">/</span>
                <span className="text-[#E55353]">${state.downPrice?.toFixed(2) ?? '—'}</span>
              </div>
            ) : (
              <span className="text-[#586069] text-[11px]">—</span>
            )}
          </div>

          <div className="text-right">
            <span className="text-[9px] text-[#586069] uppercase font-bold block">DISTANCE</span>
            {state.priceDistance != null ? (
              <span
                className={`font-bold ${
                  isDistanceSignificant(market.asset, state.priceDistance)
                    ? 'text-[#20B2AA]'
                    : 'text-[#8B949E]'
                }`}
              >
                {formatDistance(market.asset, state.priceDistance)}
              </span>
            ) : (
              <span className="text-[#586069] text-[11px]">—</span>
            )}
          </div>
        </div>

        {/* Fair-Value Edge & Strike Row */}
        <div className="flex items-center justify-between text-[10px] pt-1.5 border-t border-[#1B2026]/40 text-[#8B949E]">
          <div>
            {state.strikePrice != null ? (
              <span>
                STRIKE: <strong className="text-[#E1E4E8] tabular-nums">${state.strikePrice.toLocaleString()}</strong>
              </span>
            ) : (
              <span className="text-[#586069]">MONITORING...</span>
            )}
          </div>

          {state.bestEdge != null && (
            <span
              className={`font-bold px-1.5 py-0.5 rounded-xs border tabular-nums ${
                state.bestEdge >= state.minFvEdge
                  ? 'bg-[#20B2AA]/20 text-[#20B2AA] border-[#20B2AA]/40'
                  : state.bestEdge > 0
                  ? 'bg-[#16191E] text-[#E1E4E8] border-[#1B2026]'
                  : 'bg-[#16191E]/60 text-[#586069] border-[#1B2026]/60'
              }`}
            >
              {state.bestEdge >= 0 ? '+' : ''}{(state.bestEdge * 100).toFixed(1)}¢ EDGE
            </span>
          )}
        </div>

        {/* Additional position details if trade is open */}
        {pos && (
          <div className="pt-1.5 border-t border-[#1B2026]/80 flex items-center justify-between text-[10px] tabular-nums">
            <span className="text-[#8B949E]">
              {pos.num_shares ? `${pos.num_shares} SHARES` : 'MID-MARKET'}
              {pos.fair_value_edge_at_entry != null
                ? ` · +${(pos.fair_value_edge_at_entry * 100).toFixed(1)}¢`
                : ''}
            </span>
            {pos.stop_price != null && (
              <span className="text-[#E55353] font-bold">FV SL &le;${pos.stop_price.toFixed(2)}</span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
