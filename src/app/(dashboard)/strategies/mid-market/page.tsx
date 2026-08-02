'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useSocket } from '@/context/socket-context';
import { useAuth } from '@/context/auth-context';
import { settingsApi, executionApi } from '@/lib/api';
import { PolymarketStrikeChart } from '@/components/mid-market/polymarket-strike-chart';
import { MidMarketForecastBars } from '@/components/mid-market/mid-market-forecast-bars';
import { MidMarketMonitor } from '@/components/dashboard/mid-market-monitor';
import { MarketConfigPanel } from '@/components/settings/market-config-panel';
import { Loading } from '@/components/ui/loading';
import { toast } from '@/context/toast-context';
import { cn } from '@/lib/utils/cn';
import type { StrategySelection, MarketConfig } from '@/types/api';
import { Settings, ChevronDown, ChevronUp } from 'lucide-react';

const MARKET_LABELS: Record<string, { label: string; asset: string }> = {
  'btc-5m': { label: 'BTC 5M', asset: 'BTC' },
  'btc-15m': { label: 'BTC 15M', asset: 'BTC' },
  'eth-5m': { label: 'ETH 5M', asset: 'ETH' },
  'eth-15m': { label: 'ETH 15M', asset: 'ETH' },
  'sol-5m': { label: 'SOL 5M', asset: 'SOL' },
  'sol-15m': { label: 'SOL 15M', asset: 'SOL' },
  'doge-5m': { label: 'DOGE 5M', asset: 'DOGE' },
  'doge-15m': { label: 'DOGE 15M', asset: 'DOGE' },
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
  btc_price?: number;
  price_distance?: number;
  position_direction?: string;
}

export default function MidMarketPage() {
  const { socket } = useSocket();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const queryMarket = searchParams?.get('market');

  const [strategy, setStrategy] = useState<StrategySelection | null>(null);
  const [marketConfigs, setMarketConfigs] = useState<MarketConfig[]>([]);
  const [selectedMarket, setSelectedMarket] = useState<string>(queryMarket || 'btc-5m');
  const [stats, setStats] = useState<MarketStats | null>(null);
  const [hasActivity, setHasActivity] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [showConfig, setShowConfig] = useState(true);

  const statsRef = useRef<MarketStats | null>(null);
  const selectedMarketRef = useRef(selectedMarket);
  selectedMarketRef.current = selectedMarket;

  // Load initial settings and market configs
  useEffect(() => {
    const fetchData = async () => {
      try {
        const settings = await settingsApi.getSettings();
        setStrategy(settings.strategySelection);
        setMarketConfigs(settings.marketConfigs || []);
        const markets = settings.strategySelection?.mid_market_markets || ['btc-5m'];
        if (queryMarket && MARKET_LABELS[queryMarket]) {
          setSelectedMarket(queryMarket);
        } else if (markets.length > 0) {
          setSelectedMarket(markets[0]);
        }
      } catch (error) {
        toast.error('Failed to load strategy settings');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [queryMarket]);

  // Fetch persisted market stats on market switch
  useEffect(() => {
    setStats(null);
    statsRef.current = null;
    executionApi
      .getMidMarketStats()
      .then((s) => {
        const ms = s.per_market?.[selectedMarket];
        const pos = s.positions?.[selectedMarket];
        const initial: MarketStats = {
          daily_trades: ms?.trades || 0,
          daily_wins: ms?.wins || 0,
          daily_losses: ms?.losses || 0,
          daily_pnl: ms?.pnl || 0,
          in_cooldown: false,
          position_direction: pos?.direction,
        };
        statsRef.current = initial;
        setStats(initial);
      })
      .catch(() => {});
  }, [selectedMarket]);

  // Handle WebSocket updates
  useEffect(() => {
    if (!socket) return;

    const handler = (data: any) => {
      const mt = data.market_type || 'btc-5m';

      if (data.type !== 'heartbeat') {
        setHasActivity((prev) => {
          if (prev[mt]) return prev;
          return { ...prev, [mt]: true };
        });
      }

      if (mt !== selectedMarketRef.current) return;

      const q = (v: number | undefined) => (v != null ? Math.round(v * 100) / 100 : undefined);
      const prev = statsRef.current;
      const price = data.asset_price || data.btc_price;
      statsRef.current = {
        daily_trades: data.daily_trades ?? prev?.daily_trades ?? 0,
        daily_wins: data.daily_wins ?? prev?.daily_wins ?? 0,
        daily_losses: data.daily_losses ?? prev?.daily_losses ?? 0,
        daily_pnl: data.daily_pnl != null ? Math.round(data.daily_pnl * 100) / 100 : prev?.daily_pnl ?? 0,
        in_cooldown: data.in_cooldown ?? prev?.in_cooldown ?? false,
        strike_price: data.strike_price || prev?.strike_price,
        up_price: q(data.up_price) ?? prev?.up_price,
        down_price: q(data.down_price) ?? prev?.down_price,
        btc_price: price || prev?.btc_price,
        price_distance: data.price_distance != null ? Math.round(data.price_distance * 10) / 10 : prev?.price_distance,
        position_direction: data.position?.direction ?? prev?.position_direction,
      };
    };

    socket.on('mid_market_update', handler);

    return () => {
      socket.off('mid_market_update', handler);
    };
  }, [socket]);

  // Flush socket ref to state periodically
  useEffect(() => {
    const id = setInterval(() => {
      const next = statsRef.current;
      if (!next) return;
      setStats((prev) => {
        if (
          prev &&
          prev.daily_trades === next.daily_trades &&
          prev.daily_pnl === next.daily_pnl &&
          prev.up_price === next.up_price &&
          prev.down_price === next.down_price &&
          prev.strike_price === next.strike_price &&
          prev.btc_price === next.btc_price &&
          prev.price_distance === next.price_distance &&
          prev.position_direction === next.position_direction &&
          prev.in_cooldown === next.in_cooldown
        ) {
          return prev;
        }
        return { ...next };
      });
    }, 2000);
    return () => clearInterval(id);
  }, []);

  if (loading) return <Loading text="Initializing Mid-Market Engine..." />;

  const adminApprovedMarkets = marketConfigs
    .filter((c) => c.enabled !== false)
    .map((c) => c.market_type);
  const userSelectedMarkets = (strategy?.mid_market_markets || []).filter(
    (m) => adminApprovedMarkets.length === 0 || adminApprovedMarkets.includes(m)
  );
  const enabledMarkets = userSelectedMarkets.length > 0 ? userSelectedMarkets : (adminApprovedMarkets.length > 0 ? adminApprovedMarkets : ['btc-5m']);
  const isStrategyActive = strategy?.active_strategies?.includes('mid_market') ?? false;

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto px-4 py-4 select-none">
      {/* Top Market Selector Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0F1215] p-2.5 border border-[#1B2026]">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-thin">
          {enabledMarkets.map((mt) => (
            <button
              key={mt}
              onClick={() => {
                setSelectedMarket(mt);
                router.replace(`${pathname}?market=${mt}`, { scroll: false });
              }}
              className={cn(
                'px-3.5 py-1.5 font-mono text-xs font-bold uppercase transition-all rounded-xs flex items-center gap-2 cursor-pointer',
                selectedMarket === mt
                  ? 'bg-[#16191E] text-[#20B2AA] border border-[#20B2AA]/40 shadow-sm'
                  : 'bg-[#080A0C] text-[#8B949E] border border-[#1B2026] hover:text-[#E1E4E8] hover:border-[#2A313A]'
              )}
            >
              <span>{MARKET_LABELS[mt]?.label || mt}</span>
              {hasActivity[mt] && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#20B2AA] animate-pulse" />
              )}
            </button>
          ))}
        </div>

        {/* Global Strategy Engine Status */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="text-[#586069] text-[10px] uppercase font-bold">ENGINE STATE:</span>
          <span
            className={cn(
              'px-2 py-0.5 font-bold uppercase text-[10px] rounded-xs border',
              isStrategyActive
                ? 'bg-[#20B2AA]/15 text-[#20B2AA] border-[#20B2AA]/30'
                : 'bg-[#586069]/15 text-[#586069] border-[#586069]/30'
            )}
          >
            {isStrategyActive ? '● ENGINE ONLINE' : '○ INACTIVE'}
          </span>
        </div>
      </div>

      {/* Main Grid Section: Polymarket Strike Chart vs Right Monitor & Config Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column: Polymarket Chart & Forecast Bar Stack */}
        <div className="lg:col-span-2 space-y-4">
          <PolymarketStrikeChart
            marketType={selectedMarket}
            strikePrice={stats?.strike_price ?? null}
            currentPrice={stats?.btc_price ?? null}
            priceDistance={stats?.price_distance ?? null}
            upPrice={stats?.up_price ?? null}
            downPrice={stats?.down_price ?? null}
            height={420}
          />

          <MidMarketForecastBars
            marketType={selectedMarket}
            numShares={
              marketConfigs.find((c) => c.market_type === selectedMarket)?.num_shares || 20
            }
          />
        </div>

        {/* Right Sidebar Column: Mid-Market Monitor + Market Config Side Panel */}
        <div className="space-y-4">
          <MidMarketMonitor enabled={isStrategyActive} marketType={selectedMarket} />

          {/* Config Drawer Toggle Button */}
          <div className="bg-[#0F1215] border border-[#1B2026] p-3">
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="w-full flex items-center justify-between px-3 py-2 bg-[#16191E] border border-[#1B2026] hover:border-[#20B2AA] transition-colors text-xs font-mono font-bold text-[#E1E4E8]"
            >
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-[#20B2AA]" />
                <span>CONFIGURE {MARKET_LABELS[selectedMarket]?.label || selectedMarket}</span>
              </div>
              {showConfig ? (
                <ChevronUp className="h-4 w-4 text-[#8B949E]" />
              ) : (
                <ChevronDown className="h-4 w-4 text-[#8B949E]" />
              )}
            </button>
          </div>

          {/* Per-Market Configuration Sidebar Panel */}
          {showConfig && (
            <MarketConfigPanel
              marketType={selectedMarket}
              isAdmin={user?.isAdmin}
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
      </div>
    </div>
  );
}
