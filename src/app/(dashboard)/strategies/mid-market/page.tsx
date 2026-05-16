'use client';

import { useState, useEffect, useRef, memo } from 'react';
import { useSocket } from '@/context/socket-context';
import { settingsApi } from '@/lib/api';
import { MidMarketMonitor } from '@/components/dashboard/mid-market-monitor';
import { MarketConfigPanel } from '@/components/settings/market-config-panel';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loading } from '@/components/ui/loading';
import { toast } from '@/context/toast-context';
import { cn } from '@/lib/utils/cn';
import type { StrategySelection, MarketConfig } from '@/types/api';
import { TrendingUp, Settings, ChevronDown, ChevronUp } from 'lucide-react';

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

interface MarketStats {
  daily_trades: number;
  daily_wins: number;
  daily_losses: number;
  daily_pnl: number;
  in_cooldown: boolean;
  strike_price?: number;
  up_price?: number;
  down_price?: number;
}

export default function MidMarketPage() {
  const { socket } = useSocket();
  const [strategy, setStrategy] = useState<StrategySelection | null>(null);
  const [marketConfigs, setMarketConfigs] = useState<MarketConfig[]>([]);
  const [selectedMarket, setSelectedMarket] = useState<string>('btc-5m');
  const [stats, setStats] = useState<MarketStats | null>(null);
  const [hasActivity, setHasActivity] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [showConfig, setShowConfig] = useState(false);

  // Ref-based accumulation for stats — no re-renders from socket events
  const statsRef = useRef<MarketStats | null>(null);
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

  // Reset stats when switching markets
  useEffect(() => {
    setStats(null);
    statsRef.current = null;
  }, [selectedMarket]);

  // Socket listener writes to ref only — no setState calls
  useEffect(() => {
    if (!socket) return;

    const handler = (data: any) => {
      const mt = data.market_type || 'btc-5m';

      // Activity indicator (only set once per market, so minimal re-renders)
      if (data.type !== 'heartbeat') {
        setHasActivity(prev => {
          if (prev[mt]) return prev;
          return { ...prev, [mt]: true };
        });
      }

      // Only accumulate stats for selected market
      if (mt !== selectedMarketRef.current) return;

      const q = (v: number | undefined) => v != null ? Math.round(v * 100) / 100 : undefined;
      const prev = statsRef.current;
      statsRef.current = {
        daily_trades: data.daily_trades ?? prev?.daily_trades ?? 0,
        daily_wins: data.daily_wins ?? prev?.daily_wins ?? 0,
        daily_losses: data.daily_losses ?? prev?.daily_losses ?? 0,
        daily_pnl: data.daily_pnl != null ? Math.round(data.daily_pnl * 100) / 100 : (prev?.daily_pnl ?? 0),
        in_cooldown: data.in_cooldown ?? prev?.in_cooldown ?? false,
        strike_price: data.strike_price || prev?.strike_price,
        up_price: q(data.up_price) ?? prev?.up_price,
        down_price: q(data.down_price) ?? prev?.down_price,
      };
    };

    socket.on('mid_market_update', handler);
    return () => { socket.off('mid_market_update', handler); };
  }, [socket]);

  // Single interval flushes stats ref → state every 5s
  useEffect(() => {
    const id = setInterval(() => {
      const next = statsRef.current;
      if (!next) return;
      setStats(prev => {
        if (
          prev &&
          prev.daily_trades === next.daily_trades &&
          prev.daily_pnl === next.daily_pnl &&
          prev.up_price === next.up_price &&
          prev.down_price === next.down_price &&
          prev.strike_price === next.strike_price &&
          prev.in_cooldown === next.in_cooldown
        ) {
          return prev;
        }
        return { ...next };
      });
    }, 5000);
    return () => clearInterval(id);
  }, []);

  if (loading) return <Loading text="Loading mid-market strategy..." />;

  const enabledMarkets = strategy?.mid_market_markets || ['btc-5m'];
  const isStrategyActive = strategy?.active_strategy === 'mid_market' || strategy?.active_strategy === 'both';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Mid-Market Strategy</h1>
          <p className="text-sm text-text-secondary mt-1">
            Momentum-based trading across multiple markets
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
                ? 'border-accent-primary bg-accent-muted text-accent-primary'
                : 'border-border text-text-secondary hover:border-text-tertiary'
            )}
          >
            {MARKET_LABELS[mt]?.label || mt}
            {hasActivity[mt] && (
              <span className="ml-2 inline-block w-2 h-2 rounded-full bg-positive" />
            )}
          </button>
        ))}
      </div>

      {/* Selected Market Monitor */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <MidMarketMonitor enabled={isStrategyActive} marketType={selectedMarket} />
        </div>

        {/* Market Stats Sidebar */}
        <div className="space-y-4">
          <Card padding="md">
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-accent-primary" />
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
                    <span className="text-xs text-text-secondary">Daily PnL</span>
                    <span className={cn(
                      'text-sm font-medium tabular-nums',
                      stats.daily_pnl >= 0 ? 'text-positive' : 'text-negative'
                    )}>
                      ${stats.daily_pnl.toFixed(2)}
                    </span>
                  </div>
                  {stats.strike_price != null && (
                    <div className="flex justify-between">
                      <span className="text-xs text-text-secondary">Strike</span>
                      <span className="text-sm font-mono tabular-nums text-text-primary">
                        ${stats.strike_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                  {stats.up_price != null && (
                    <div className="flex justify-between">
                      <span className="text-xs text-text-secondary">YES / NO</span>
                      <span className="text-sm font-mono tabular-nums text-text-primary">
                        ${stats.up_price?.toFixed(2)} / ${stats.down_price?.toFixed(2)}
                      </span>
                    </div>
                  )}
                  {stats.in_cooldown && (
                    <div className="px-2 py-1 rounded bg-neutral/20 text-neutral text-xs text-center">
                      Cooldown Active
                    </div>
                  )}
                </div>
              )}
            </CardBody>
          </Card>

          {/* Configure Selected Market Button */}
          <Card padding="md">
            <CardBody>
              <button
                onClick={() => setShowConfig(!showConfig)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-border hover:border-accent-primary transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-accent-primary" />
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

      {/* Per-Market Configuration Panel (expandable) */}
      {showConfig && (
        <MarketConfigPanel
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
