'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { settingsApi } from '@/lib/api';
import { useSocket } from '@/context/socket-context';
import { PolymarketStrikeChart } from '@/components/mid-market/polymarket-strike-chart';
import { MobileChartWrapper } from '@/components/mid-market/mobile-chart-wrapper';
import { MidMarketForecastBars } from '@/components/mid-market/mid-market-forecast-bars';
import { MidMarketMonitor } from '@/components/dashboard/mid-market-monitor';
import { MarketConfigPanel } from '@/components/settings/market-config-panel';
import { MobileBottomSheet } from '@/components/ui/mobile-bottom-sheet';
import { Loading } from '@/components/ui/loading';
import { toast } from '@/context/toast-context';
import type { StrategySelection, MarketConfig } from '@/types/api';
import { Settings, ChevronDown, ChevronUp, Activity, BarChart2, Sliders, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

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

export default function MidMarketStrategyPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const { socket } = useSocket();

  const [loading, setLoading] = useState(true);
  const [strategy, setStrategy] = useState<StrategySelection | null>(null);
  const [marketConfigs, setMarketConfigs] = useState<MarketConfig[]>([]);
  const [selectedMarket, setSelectedMarket] = useState<string>('btc-5m');
  const [showConfig, setShowConfig] = useState<boolean>(true);
  const [mobileConfigOpen, setMobileConfigOpen] = useState<boolean>(false);
  const [mobileTab, setMobileTab] = useState<'chart' | 'forecast' | 'config'>('chart');

  // Stats for the active window chart ticks
  const [stats, setStats] = useState<{
    strike_price: number | null;
    btc_price: number | null;
    price_distance: number | null;
    up_price: number | null;
    down_price: number | null;
  } | null>(null);

  // Per-market activity indicator (pulse when data updating)
  const [hasActivity, setHasActivity] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const marketParam = searchParams.get('market');
    if (marketParam && MARKET_LABELS[marketParam]) {
      setSelectedMarket(marketParam);
    }
  }, [searchParams]);

  // Reset stats on market selection change
  useEffect(() => {
    setStats(null);
  }, [selectedMarket]);

  // Subscribe to live socket metrics for selectedMarket
  useEffect(() => {
    if (!socket) return;

    const handleUpdate = (data: any) => {
      const mt = (data?.market_type || 'btc-5m').toLowerCase();
      if (mt !== selectedMarket.toLowerCase()) return;

      const validPrice =
        typeof data?.asset_price === 'number' && data.asset_price > 0 ? data.asset_price : null;

      setStats((prev) => ({
        strike_price:
          typeof data.strike_price === 'number' && data.strike_price > 0
            ? data.strike_price
            : prev?.strike_price ?? null,
        btc_price: validPrice ?? prev?.btc_price ?? null,
        price_distance:
          typeof data.price_distance === 'number' ? data.price_distance : prev?.price_distance ?? null,
        up_price: typeof data.up_price === 'number' ? data.up_price : prev?.up_price ?? null,
        down_price: typeof data.down_price === 'number' ? data.down_price : prev?.down_price ?? null,
      }));
    };

    socket.on('mid_market_update', handleUpdate);
    return () => {
      socket.off('mid_market_update', handleUpdate);
    };
  }, [socket, selectedMarket]);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [stratRes, marketsRes] = await Promise.all([
          settingsApi.getStrategySelection(),
          settingsApi.getMarketConfigs(),
        ]);
        setStrategy(stratRes.strategySelection);
        setMarketConfigs(marketsRes.marketConfigs || []);
      } catch (err) {
        toast.error('Failed to load strategy settings');
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  // Activity ping interval
  useEffect(() => {
    const id = setInterval(() => {
      setHasActivity((prev) => ({ ...prev, [selectedMarket]: true }));
      setTimeout(() => {
        setHasActivity((prev) => ({ ...prev, [selectedMarket]: false }));
      }, 2000);
    }, 4000);
    return () => clearInterval(id);
  }, [selectedMarket]);

  if (loading) return <Loading text="Initializing Market Engine..." />;

  const adminApprovedMarkets = marketConfigs
    .filter((c) => c.enabled !== false)
    .map((c) => c.market_type);

  const enabledMarkets = adminApprovedMarkets;

  const isMidMarketActive = strategy?.active_strategies?.includes('mid_market') ?? false;

  const handleUserMarketToggle = async (marketId: string) => {
    const currentMarkets = strategy?.mid_market_markets || [];
    const updatedMarkets = currentMarkets.includes(marketId)
      ? currentMarkets.filter((m) => m !== marketId)
      : [...currentMarkets, marketId];

    const currentStrats = strategy?.active_strategies || [];
    const updatedStrats = !currentStrats.includes('mid_market')
      ? [...currentStrats, 'mid_market']
      : currentStrats;

    try {
      const resp = await settingsApi.updateStrategySelection({
        mid_market_markets: updatedMarkets,
        active_strategies: updatedStrats,
      });
      setStrategy(resp.strategySelection);
      toast.success(
        updatedMarkets.includes(marketId)
          ? `Activated ${MARKET_LABELS[marketId]?.label || marketId} for MID-MARKET`
          : `Deactivated ${MARKET_LABELS[marketId]?.label || marketId}`
      );
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update market activation');
    }
  };

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto px-2 sm:px-4 py-3 select-none font-mono text-xs">
      {/* Top Bar: Market Selector Tabs & Engine Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0F1215] p-2.5 border border-[#1B2026]">
        {/* Left: Market Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none max-w-full py-0.5">
          {enabledMarkets.map((mt) => {
            const isApproved = adminApprovedMarkets.includes(mt);
            return (
              <button
                key={mt}
                onClick={() => {
                  setSelectedMarket(mt);
                  router.replace(`${pathname}?market=${mt}`, {
                    scroll: false,
                  });
                }}
                className={cn(
                  'px-3 py-1.5 font-mono text-xs font-bold uppercase transition-all rounded-xs flex items-center gap-1.5 shrink-0 cursor-pointer',
                  selectedMarket === mt
                    ? 'bg-[#16191E] text-[#20B2AA] border border-[#20B2AA]/40 shadow-sm'
                    : 'bg-[#080A0C] text-[#8B949E] border border-[#1B2026] hover:text-[#E1E4E8] hover:border-[#2A313A]'
                )}
              >
                <span>{MARKET_LABELS[mt]?.label || mt}</span>
                {user?.isAdmin && !isApproved && (
                  <span className="text-[9px] px-1 py-0.2 bg-[#E55353]/15 text-[#E55353] border border-[#E55353]/30 rounded-xs">
                    OFF
                  </span>
                )}
                {hasActivity[mt] && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#20B2AA] animate-pulse" />
                )}
              </button>
            );
          })}
        </div>

        {/* Right: Engine Status */}
        <div className="flex items-center justify-between sm:justify-end gap-3 font-mono text-xs pt-2 sm:pt-0 border-t sm:border-t-0 border-[#1B2026]">
          <div className="flex items-center gap-1.5 shrink-0">
            <span
              className={cn(
                'px-2 py-0.5 font-bold uppercase text-[10px] rounded-xs border',
                isMidMarketActive
                  ? 'bg-[#20B2AA]/15 text-[#20B2AA] border-[#20B2AA]/30'
                  : 'bg-[#586069]/15 text-[#586069] border-[#586069]/30'
              )}
            >
              <TrendingUp className="h-3 w-3 inline-block mr-1" />
              {isMidMarketActive ? '● MID-MARKET ONLINE' : '○ INACTIVE'}
            </span>
          </div>
        </div>
      </div>

      {/* Segmented Mobile View Switcher (<1024px) */}
      <div className="lg:hidden flex items-center bg-[#0F1215] border border-[#1B2026] p-1 font-mono text-xs rounded-xs">
        <button
          onClick={() => setMobileTab('chart')}
          className={cn(
            'flex-1 py-2 font-bold uppercase flex items-center justify-center gap-1.5 transition-colors cursor-pointer rounded-xs',
            mobileTab === 'chart'
              ? 'bg-[#16191E] text-[#20B2AA] border border-[#20B2AA]/40 shadow-sm'
              : 'text-[#8B949E] hover:text-[#E1E4E8]'
          )}
        >
          <Activity className="h-3.5 w-3.5" /> CHART
        </button>
        <button
          onClick={() => setMobileTab('forecast')}
          className={cn(
            'flex-1 py-2 font-bold uppercase flex items-center justify-center gap-1.5 transition-colors cursor-pointer rounded-xs',
            mobileTab === 'forecast'
              ? 'bg-[#16191E] text-[#20B2AA] border border-[#20B2AA]/40 shadow-sm'
              : 'text-[#8B949E] hover:text-[#E1E4E8]'
          )}
        >
          <BarChart2 className="h-3.5 w-3.5" /> FORECAST
        </button>
        <button
          onClick={() => setMobileConfigOpen(true)}
          className="flex-1 py-2 font-bold uppercase flex items-center justify-center gap-1.5 transition-colors cursor-pointer rounded-xs text-[#20B2AA] bg-[#20B2AA]/10 border border-[#20B2AA]/30"
        >
          <Sliders className="h-3.5 w-3.5" /> CONFIG
        </button>
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column: Polymarket Chart & Forecast Bars */}
        <div
          className={cn(
            'lg:col-span-2 space-y-4',
            mobileTab !== 'chart' && mobileTab !== 'forecast' && 'hidden lg:block'
          )}
        >
          <div className="lg:hidden">
            <MobileChartWrapper
              marketType={selectedMarket}
              strikePrice={stats?.strike_price ?? null}
              currentPrice={stats?.btc_price ?? null}
              priceDistance={stats?.price_distance ?? null}
              upPrice={stats?.up_price ?? null}
              downPrice={stats?.down_price ?? null}
            />
          </div>

          <div className="hidden lg:block">
            <PolymarketStrikeChart
              marketType={selectedMarket}
              strikePrice={stats?.strike_price ?? null}
              currentPrice={stats?.btc_price ?? null}
              priceDistance={stats?.price_distance ?? null}
              upPrice={stats?.up_price ?? null}
              downPrice={stats?.down_price ?? null}
              height={420}
            />
          </div>

          <div className={cn(mobileTab !== 'forecast' && 'hidden lg:block')}>
            <MidMarketForecastBars
              marketType={selectedMarket}
              numShares={
                marketConfigs.find((c) => c.market_type === selectedMarket)?.num_shares || 25
              }
            />
          </div>
        </div>

        {/* Right Sidebar Column: Dynamic Strategy Monitor + Config Panel */}
        <div className="hidden lg:block space-y-4">
          {/* Mid-Market Monitor */}
          <MidMarketMonitor enabled={isMidMarketActive} marketType={selectedMarket} />

          {/* Config Toggle Drawer Button */}
          <div className="bg-[#0F1215] border border-[#1B2026] p-3">
            <button
              type="button"
              aria-expanded={showConfig}
              onClick={() => setShowConfig(!showConfig)}
              className="w-full flex items-center justify-between px-3 py-2 bg-[#16191E] border border-[#1B2026] hover:border-[#20B2AA] transition-colors text-xs font-mono font-bold text-[#E1E4E8]"
            >
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-[#20B2AA]" />
                <span>
                  CONFIGURE MID-MARKET — {MARKET_LABELS[selectedMarket]?.label || selectedMarket}
                </span>
              </div>
              {showConfig ? (
                <ChevronUp className="h-4 w-4 text-[#8B949E]" />
              ) : (
                <ChevronDown className="h-4 w-4 text-[#8B949E]" />
              )}
            </button>
          </div>

          {/* Per-Market Configuration Panel */}
          {showConfig && (
            <MarketConfigPanel
              marketType={selectedMarket}
              isAdmin={user?.isAdmin}
              userSelectedMarkets={strategy?.mid_market_markets || []}
              isMidMarketActive={isMidMarketActive}
              onToggleMarketActive={handleUserMarketToggle}
              initialConfig={marketConfigs.find((c) => c.market_type === selectedMarket) || null}
              onSave={(updatedConfig) => {
                setMarketConfigs((prev) => {
                  const exists = prev.find((c) => c.market_type === selectedMarket);
                  if (exists) {
                    return prev.map((c) =>
                      c.market_type === selectedMarket ? updatedConfig : c
                    );
                  }
                  return [...prev, updatedConfig];
                });
              }}
            />
          )}
        </div>
      </div>

      {/* Mobile Market Config Bottom Sheet */}
      <MobileBottomSheet
        isOpen={mobileConfigOpen}
        onClose={() => setMobileConfigOpen(false)}
        title={`CONFIGURE MID-MARKET — ${MARKET_LABELS[selectedMarket]?.label || selectedMarket}`}
        subtitle="RISK METRICS, SPREADS & POSITION SIZING"
      >
        <MarketConfigPanel
          marketType={selectedMarket}
          isAdmin={user?.isAdmin}
          userSelectedMarkets={strategy?.mid_market_markets || []}
          isMidMarketActive={isMidMarketActive}
          onToggleMarketActive={handleUserMarketToggle}
          initialConfig={marketConfigs.find((c) => c.market_type === selectedMarket) || null}
          onSave={(updatedConfig) => {
            setMarketConfigs((prev) => {
              const exists = prev.find((c) => c.market_type === selectedMarket);
              if (exists) {
                return prev.map((c) => (c.market_type === selectedMarket ? updatedConfig : c));
              }
              return [...prev, updatedConfig];
            });
            setMobileConfigOpen(false);
          }}
        />
      </MobileBottomSheet>
    </div>
  );
}