'use client';

import { useState, useEffect, useRef } from 'react';
import { useSocket } from '@/context/socket-context';
import { settingsApi, executionApi } from '@/lib/api';
import { ScalpConfigPanel } from '@/components/settings/scalp-config-panel';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loading } from '@/components/ui/loading';
import { toast } from '@/context/toast-context';
import { cn } from '@/lib/utils/cn';
import type { StrategySelection, MarketConfig } from '@/types/api';
import { Shield, Settings, ChevronDown, ChevronUp, TrendingUp } from 'lucide-react';

const MARKET_LABELS: Record<string, { label: string; asset: string }> = {
  'btc-5m': { label: 'BTC 5m', asset: 'BTC' },
  'btc-15m': { label: 'BTC 15m', asset: 'BTC' },
  'eth-5m': { label: 'ETH 5m', asset: 'ETH' },
  'eth-15m': { label: 'ETH 15m', asset: 'ETH' },
  'sol-5m': { label: 'SOL 5m', asset: 'SOL' },
  'sol-15m': { label: 'SOL 15m', asset: 'SOL' },
  'doge-5m': { label: 'DOGE 5m', asset: 'DOGE' },
  'doge-15m': { label: 'DOGE 15m', asset: 'DOGE' },
};

interface ScalpStats {
  daily_trades: number;
  daily_wins: number;
  daily_losses: number;
  daily_pnl: number;
}

interface ScalpPosition {
  direction: string;
  entry_price: number;
  num_shares?: number;
  take_profit_price?: number;
  stop_loss_price?: number;
  max_hold_until?: number;
}

export default function ScalpStrategyPage() {
  const { socket } = useSocket();
  const [strategy, setStrategy] = useState<StrategySelection | null>(null);
  const [marketConfigs, setMarketConfigs] = useState<MarketConfig[]>([]);
  const [selectedMarket, setSelectedMarket] = useState<string>('btc-5m');
  const [stats, setStats] = useState<ScalpStats | null>(null);
  const [position, setPosition] = useState<ScalpPosition | null>(null);
  const [hasActivity, setHasActivity] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [showConfig, setShowConfig] = useState(false);

  const statsRef = useRef<ScalpStats | null>(null);
  const positionRef = useRef<ScalpPosition | null>(null);
  const selectedMarketRef = useRef(selectedMarket);
  selectedMarketRef.current = selectedMarket;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const settings = await settingsApi.getSettings();
        setStrategy(settings.strategySelection);
        setMarketConfigs(settings.marketConfigs || []);
        const markets = settings.strategySelection?.mid_market_markets || ['btc-5m'];
        if (markets.length > 0) {
          setSelectedMarket(markets[0]);
        }
      } catch (error) {
        toast.error('Failed to load strategy data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Fetch persisted stats on market switch
  useEffect(() => {
    setStats(null);
    setPosition(null);
    statsRef.current = null;
    positionRef.current = null;

    executionApi.getScalpStats().then((s) => {
      const ms = s.per_market?.[selectedMarket];
      const initial: ScalpStats = {
        daily_trades: ms?.trades || 0,
        daily_wins: ms?.wins || 0,
        daily_losses: ms?.losses || 0,
        daily_pnl: ms?.pnl || 0,
      };
      statsRef.current = initial;
      setStats(initial);

      const pos = s.positions?.[selectedMarket];
      if (pos) {
        positionRef.current = pos;
        setPosition(pos);
      }
    }).catch(() => {});
  }, [selectedMarket]);

  // Socket listeners for scalp-specific events
  useEffect(() => {
    if (!socket) return;

    const onEntry = (data: any) => {
      const mt = data.market_type || 'btc-5m';
      setHasActivity(prev => prev[mt] ? prev : { ...prev, [mt]: true });

      if (mt !== selectedMarketRef.current) return;
      positionRef.current = {
        direction: data.direction,
        entry_price: data.entry_price,
        num_shares: data.num_shares,
        take_profit_price: data.take_profit,
        stop_loss_price: data.stop_loss,
        max_hold_until: Date.now() + (data.timeout_seconds || 240) * 1000,
      };
    };

    const onExit = (data: any) => {
      const mt = data.market_type || 'btc-5m';
      setHasActivity(prev => prev[mt] ? prev : { ...prev, [mt]: true });

      if (mt !== selectedMarketRef.current) return;
      positionRef.current = null;

      const prev = statsRef.current;
      statsRef.current = {
        daily_trades: data.daily_trades ?? (prev?.daily_trades ?? 0),
        daily_wins: data.daily_wins ?? (prev?.daily_wins ?? 0),
        daily_losses: data.daily_losses ?? (prev?.daily_losses ?? 0),
        daily_pnl: data.daily_pnl != null ? Math.round(data.daily_pnl * 100) / 100 : (prev?.daily_pnl ?? 0),
      };
    };

    socket.on('scalp_entry', onEntry);
    socket.on('scalp_exit', onExit);
    return () => {
      socket.off('scalp_entry', onEntry);
      socket.off('scalp_exit', onExit);
    };
  }, [socket]);

  // Flush ref to state every 5s
  useEffect(() => {
    const id = setInterval(() => {
      const nextStats = statsRef.current;
      if (nextStats) {
        setStats(prev => {
          if (prev && prev.daily_trades === nextStats.daily_trades && prev.daily_pnl === nextStats.daily_pnl) return prev;
          return { ...nextStats };
        });
      }
      const nextPos = positionRef.current;
      setPosition(prev => {
        if (prev === nextPos) return prev;
        return nextPos ? { ...nextPos } : null;
      });
    }, 5000);
    return () => clearInterval(id);
  }, []);

  if (loading) return <Loading text="Loading scalp strategy..." />;

  const enabledMarkets = strategy?.mid_market_markets || ['btc-5m'];
  const isStrategyActive = strategy?.active_strategies?.includes('scalp') ?? false;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Scalp Strategy</h1>
          <p className="text-sm text-text-secondary mt-1">
            Mean-reversion: buy cheap trailing side, exit on TP/SL/timeout
          </p>
        </div>
        <Badge variant={isStrategyActive ? 'success' : 'default'}>
          {isStrategyActive ? 'Active' : 'Inactive'}
        </Badge>
      </div>

      {/* Market Selector Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {enabledMarkets.map((mt) => (
          <button
            key={mt}
            onClick={() => setSelectedMarket(mt)}
            className={cn(
              'px-4 py-2 rounded-lg border text-sm font-medium whitespace-nowrap transition-colors',
              selectedMarket === mt
                ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                : 'border-border text-text-secondary hover:border-text-tertiary'
            )}
          >
            {MARKET_LABELS[mt]?.label || mt}
            {hasActivity[mt] && (
              <span className="ml-2 inline-block w-2 h-2 rounded-full bg-emerald-400" />
            )}
          </button>
        ))}
      </div>

      {/* Stats + Position */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Position Card */}
        <div className="lg:col-span-2">
          <Card padding="md" className="border-emerald-500/20">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-emerald-400" />
                <span className="text-sm font-medium text-text-primary">
                  {MARKET_LABELS[selectedMarket]?.label || selectedMarket} — Active Position
                </span>
              </div>
            </CardHeader>
            <CardBody>
              {!position ? (
                <div className="text-center py-8">
                  <p className="text-sm text-text-tertiary">No open scalp position</p>
                  <p className="text-xs text-text-tertiary mt-1">
                    Waiting for entry conditions (trailing side within price range)
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-text-tertiary mb-1">Direction</p>
                      <p className={cn(
                        'text-lg font-bold',
                        position.direction === 'UP' ? 'text-positive' : 'text-negative'
                      )}>
                        {position.direction}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-text-tertiary mb-1">Entry</p>
                      <p className="text-lg font-mono font-bold text-text-primary">
                        ${position.entry_price.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-text-tertiary mb-1">Take Profit</p>
                      <p className="text-lg font-mono font-bold text-positive">
                        ${position.take_profit_price?.toFixed(2) ?? '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-text-tertiary mb-1">Stop Loss</p>
                      <p className="text-lg font-mono font-bold text-negative">
                        ${position.stop_loss_price?.toFixed(2) ?? '—'}
                      </p>
                    </div>
                  </div>
                  {position.max_hold_until && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-text-tertiary">Timeout:</span>
                      <span className="text-xs font-mono text-text-secondary">
                        {new Date(position.max_hold_until).toLocaleTimeString()}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Stats Sidebar */}
        <div className="space-y-4">
          <Card padding="md">
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
                <span className="text-sm font-medium text-text-primary">
                  {MARKET_LABELS[selectedMarket]?.label || selectedMarket} Stats
                </span>
              </div>
            </CardHeader>
            <CardBody>
              {!stats ? (
                <p className="text-sm text-text-tertiary">Waiting for data...</p>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-xs text-text-secondary">Daily Trades</span>
                    <span className="text-sm font-medium text-text-primary tabular-nums">{stats.daily_trades}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-text-secondary">Wins / Losses</span>
                    <span className="text-sm font-medium tabular-nums">
                      <span className="text-positive">{stats.daily_wins}</span>
                      {' / '}
                      <span className="text-negative">{stats.daily_losses}</span>
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-text-secondary">Win Rate</span>
                    <span className="text-sm font-medium tabular-nums text-text-primary">
                      {stats.daily_trades > 0
                        ? `${((stats.daily_wins / stats.daily_trades) * 100).toFixed(0)}%`
                        : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-text-secondary">Daily PnL</span>
                    <span className={cn(
                      'text-sm font-medium tabular-nums',
                      stats.daily_pnl >= 0 ? 'text-positive' : 'text-negative'
                    )}>
                      ${stats.daily_pnl.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Configure Button */}
          <Card padding="md">
            <CardBody>
              <button
                onClick={() => setShowConfig(!showConfig)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-border hover:border-emerald-500 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-emerald-400" />
                  <span className="text-sm font-medium text-text-primary">
                    Configure {MARKET_LABELS[selectedMarket]?.label || selectedMarket}
                  </span>
                </div>
                {showConfig ? (
                  <ChevronUp className="h-4 w-4 text-text-secondary" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-text-secondary" />
                )}
              </button>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Scalp Config Panel (expandable) */}
      {showConfig && (
        <ScalpConfigPanel
          marketType={selectedMarket}
          initialConfig={marketConfigs.find((c) => c.market_type === selectedMarket) || null}
          onSave={(updatedConfig) => {
            setMarketConfigs((prev) => {
              const exists = prev.find((c) => c.market_type === selectedMarket);
              if (exists) {
                return prev.map((c) => (c.market_type === selectedMarket ? updatedConfig : c));
              }
              return [...prev, updatedConfig];
            });
          }}
        />
      )}
    </div>
  );
}
