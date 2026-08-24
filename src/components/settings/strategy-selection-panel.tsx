'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { settingsApi } from '@/lib/api';
import { toast } from '@/context/toast-context';
import { Zap, TrendingUp, ShieldCheck, Lock } from 'lucide-react';
import type { StrategySelection, MarketConfig, AiV2Config } from '@/types/api';
import { cn } from '@/lib/utils/cn';

const SUPPORTED_MARKETS = [
  { id: 'btc-5m', label: 'BTC 5m', asset: 'BTC' },
  { id: 'btc-15m', label: 'BTC 15m', asset: 'BTC' },
  { id: 'eth-5m', label: 'ETH 5m', asset: 'ETH' },
  { id: 'eth-15m', label: 'ETH 15m', asset: 'ETH' },
  { id: 'sol-5m', label: 'SOL 5m', asset: 'SOL' },
  { id: 'sol-15m', label: 'SOL 15m', asset: 'SOL' },
  { id: 'doge-5m', label: 'DOGE 5m', asset: 'DOGE' },
  { id: 'doge-15m', label: 'DOGE 15m', asset: 'DOGE' },
];

const STRATEGIES = [
  {
    value: 'mid_market',
    label: 'Mid-Market Strategy',
    description: 'Trajectory slope consensus & momentum entry during 5-minute active windows',
    icon: TrendingUp,
  },
  {
    value: 'scalp',
    label: 'Scalp Strategy',
    description: 'Mean-reversion: buy cheap trailing side early, exit on TP/SL before resolution',
    icon: ShieldCheck,
  },
];

interface Props {
  initialStrategy: StrategySelection;
  marketConfigs: MarketConfig[];
  onUpdate: (strategy: StrategySelection) => void;
}

export function StrategySelectionPanel({ initialStrategy, marketConfigs, onUpdate }: Props) {
  const { user } = useAuth();
  const isAdmin = user?.isAdmin ?? false;

  const [strategy, setStrategy] = useState<StrategySelection>(initialStrategy);
  const [saving, setSaving] = useState(false);
  const [configs, setConfigs] = useState<MarketConfig[]>(marketConfigs);

  useEffect(() => {
    setStrategy(initialStrategy);
    setConfigs(marketConfigs);
  }, [initialStrategy, marketConfigs]);

  const activeStrategies = strategy.active_strategies || [];
  const showMidMarketMarkets = isAdmin &&
    (activeStrategies.includes('mid_market') || activeStrategies.includes('scalp'));

  const handleStrategyToggle = async (value: string) => {
    const current = strategy.active_strategies || [];
    const updated = current.includes(value)
      ? current.filter((s) => s !== value)
      : [...current, value];

    setSaving(true);
    try {
      const resp = await settingsApi.updateStrategySelection({ active_strategies: updated });
      setStrategy(resp.strategySelection);
      onUpdate(resp.strategySelection);
      if (updated.length === 0) {
        toast.success('All strategies paused');
      } else {
        toast.success(`Active: ${updated.join(', ').replace(/_/g, ' ')}`);
      }
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update strategy');
    } finally {
      setSaving(false);
    }
  };

  // User toggle to activate/deactivate an admin-approved market
  const handleUserMarketToggle = async (marketId: string) => {
    const current = strategy.mid_market_markets || [];
    const updated = current.includes(marketId)
      ? current.filter((m) => m !== marketId)
      : [...current, marketId];

    setSaving(true);
    try {
      const resp = await settingsApi.updateStrategySelection({ mid_market_markets: updated });
      setStrategy(resp.strategySelection);
      onUpdate(resp.strategySelection);
      toast.success(
        updated.includes(marketId)
          ? `Activated ${marketId.toUpperCase()}`
          : `Deactivated ${marketId.toUpperCase()}`
      );
    } catch (error) {
      toast.error('Failed to update market selection');
    } finally {
      setSaving(false);
    }
  };

  // Admin toggle to globally enable/disable a market for mid-market strategy
  const handleAdminMidMarketToggle = async (marketId: string, currentEnabled: boolean) => {
    setSaving(true);
    try {
      await settingsApi.updateMarketConfig(marketId, { enabled: !currentEnabled });
      setConfigs((prev) =>
        prev.map((c) => (c.market_type === marketId ? { ...c, enabled: !currentEnabled } : c))
      );
      toast.success(
        !currentEnabled
          ? `Mid-Market ENABLED for ${marketId.toUpperCase()}`
          : `Mid-Market DISABLED for ${marketId.toUpperCase()}`
      );
    } catch (error) {
      toast.error('Failed to update mid-market availability');
    } finally {
      setSaving(false);
    }
  };

  // Admin toggle to globally enable/disable a market for scalp strategy
  const handleAdminScalpToggle = async (marketId: string, currentScalpEnabled: boolean) => {
    setSaving(true);
    try {
      await settingsApi.updateMarketConfig(marketId, { scalp_enabled: !currentScalpEnabled });
      setConfigs((prev) =>
        prev.map((c) => (c.market_type === marketId ? { ...c, scalp_enabled: !currentScalpEnabled } : c))
      );
      toast.success(
        !currentScalpEnabled
          ? `Scalp ENABLED for ${marketId.toUpperCase()}`
          : `Scalp DISABLED for ${marketId.toUpperCase()}`
      );
    } catch (error) {
      toast.error('Failed to update scalp availability');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-[#0F1215] border border-[#1B2026] select-none font-mono">
      {/* Panel Header */}
      <div className="p-3.5 border-b border-[#1B2026] flex items-center justify-between bg-[#16191E]/60">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-[#20B2AA]" />
          <div>
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[#586069] block">
              AUTOMATED STRATEGIES
            </span>
            <h3 className="font-mono text-xs font-bold text-[#E1E4E8] mt-0.5 uppercase">
              STRATEGY SELECTION & MARKET CONTROL
            </h3>
          </div>
        </div>
        {isAdmin && (
          <span className="inline-flex items-center gap-1 font-mono text-[9px] uppercase px-2 py-0.5 bg-[#D99B00]/10 text-[#D99B00] border border-[#D99B00]/30 font-bold rounded-xs">
            <ShieldCheck className="h-3 w-3" /> ADMIN CONTROL ACTIVE
          </span>
        )}
      </div>

      <div className="p-4 space-y-6">
        {/* Strategy Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {STRATEGIES.map((s) => {
            const isActive = activeStrategies.includes(s.value);
            return (
              <button
                key={s.value}
                onClick={() => handleStrategyToggle(s.value)}
                disabled={saving}
                className={cn(
                  'flex items-start gap-3 p-3.5 border transition-all text-left cursor-pointer rounded-xs',
                  isActive
                    ? 'bg-[#16191E] border-[#20B2AA]/50 text-[#E1E4E8]'
                    : 'bg-[#080A0C] border-[#1B2026] text-[#8B949E] hover:border-[#2A313A] hover:text-[#E1E4E8]'
                )}
              >
                <s.icon
                  className={cn('h-4 w-4 mt-0.5 shrink-0', isActive ? 'text-[#20B2AA]' : 'text-[#586069]')}
                />
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold font-mono uppercase">{s.label}</span>
                    <span
                      className={cn(
                        'text-[9px] font-bold uppercase px-1.5 py-0.2 rounded-xs border',
                        isActive
                          ? 'bg-[#20B2AA]/15 text-[#20B2AA] border-[#20B2AA]/30'
                          : 'bg-[#586069]/15 text-[#586069] border-[#586069]/30'
                      )}
                    >
                      {isActive ? 'ONLINE' : 'OFF'}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#8B949E] mt-1 font-mono leading-relaxed">
                    {s.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {activeStrategies.length === 0 && (
          <div className="p-3 bg-[#080A0C] border border-[#1B2026] text-center text-xs text-[#8B949E]">
            No strategies active — all automated trading is currently paused.
          </div>
        )}

        {/* Market Selection Section */}
        {showMidMarketMarkets && (
          <div className="pt-4 border-t border-[#1B2026] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-[#586069] uppercase tracking-[0.12em] block">
                  {isAdmin ? 'ADMIN PER-STRATEGY MARKET CONTROL' : 'MID-MARKET TRADING MARKETS'}
                </span>
                <p className="text-xs text-[#8B949E] mt-0.5">
                  {isAdmin
                    ? 'Enable or disable each market independently per strategy (Mid-Market / Scalp).'
                    : 'Select which markets the mid-market strategy trades. Scalp markets are controlled by admin.'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {SUPPORTED_MARKETS.map((m) => {
                const config = configs.find((c) => c.market_type === m.id);
                const isMidMarketEnabled = config?.enabled ?? true;
                const isScalpEnabled = config?.scalp_enabled ?? true;
                const isUserActive = strategy.mid_market_markets?.includes(m.id) ?? false;

                if (isAdmin) {
                  // Admin View: Per-strategy toggles
                  return (
                    <div
                      key={m.id}
                      className={cn(
                        'p-2.5 border rounded-xs bg-[#080A0C] flex flex-col gap-2',
                        isMidMarketEnabled || isScalpEnabled ? 'border-[#20B2AA]/40' : 'border-[#1B2026] opacity-60'
                      )}
                    >
                      <span className="font-mono text-xs font-bold text-[#E1E4E8]">
                        {m.label}
                      </span>
                      <div className="flex flex-col gap-1.5">
                        <button
                          onClick={() => handleAdminMidMarketToggle(m.id, isMidMarketEnabled)}
                          disabled={saving}
                          className={cn(
                            'w-full py-1 text-[9px] font-bold uppercase border transition-colors cursor-pointer rounded-xs',
                            isMidMarketEnabled
                              ? 'bg-[#20B2AA]/10 text-[#20B2AA] border-[#20B2AA]/30 hover:bg-[#E55353]/10 hover:text-[#E55353] hover:border-[#E55353]/30'
                              : 'bg-[#E55353]/10 text-[#E55353] border-[#E55353]/30 hover:bg-[#20B2AA]/10 hover:text-[#20B2AA] hover:border-[#20B2AA]/30'
                          )}
                        >
                          MID: {isMidMarketEnabled ? 'ON' : 'OFF'}
                        </button>
                        <button
                          onClick={() => handleAdminScalpToggle(m.id, isScalpEnabled)}
                          disabled={saving}
                          className={cn(
                            'w-full py-1 text-[9px] font-bold uppercase border transition-colors cursor-pointer rounded-xs',
                            isScalpEnabled
                              ? 'bg-[#20B2AA]/10 text-[#20B2AA] border-[#20B2AA]/30 hover:bg-[#E55353]/10 hover:text-[#E55353] hover:border-[#E55353]/30'
                              : 'bg-[#E55353]/10 text-[#E55353] border-[#E55353]/30 hover:bg-[#20B2AA]/10 hover:text-[#20B2AA] hover:border-[#20B2AA]/30'
                          )}
                        >
                          SCALP: {isScalpEnabled ? 'ON' : 'OFF'}
                        </button>
                      </div>
                    </div>
                  );
                }

                // Regular User View: locked if admin disabled mid-market for this market
                if (!isMidMarketEnabled) {
                  return (
                    <div
                      key={m.id}
                      className="p-2.5 border border-[#1B2026] bg-[#080A0C]/50 opacity-40 flex items-center justify-between cursor-not-allowed rounded-xs"
                    >
                      <span className="font-mono text-xs font-bold text-[#586069]">{m.label}</span>
                      <span className="text-[9px] font-bold uppercase text-[#E55353] flex items-center gap-1">
                        <Lock className="h-2.5 w-2.5" /> LOCKED
                      </span>
                    </div>
                  );
                }

                return (
                  <button
                    key={m.id}
                    onClick={() => handleUserMarketToggle(m.id)}
                    disabled={saving}
                    className={cn(
                      'p-2.5 border text-left transition-all cursor-pointer rounded-xs flex items-center justify-between',
                      isUserActive
                        ? 'bg-[#16191E] border-[#20B2AA]/50 text-[#E1E4E8]'
                        : 'bg-[#080A0C] border-[#1B2026] text-[#8B949E] hover:border-[#2A313A] hover:text-[#E1E4E8]'
                    )}
                  >
                    <div>
                      <span className="font-mono text-xs font-bold block">{m.label}</span>
                      <span
                        className={cn(
                          'text-[9px] font-bold uppercase block mt-0.5',
                          isUserActive ? 'text-[#20B2AA]' : 'text-[#586069]'
                        )}
                      >
                        {isUserActive ? '● ACTIVE' : '○ INACTIVE'}
                      </span>
                    </div>
                    <span
                      className={cn(
                        'w-2 h-2 rounded-full',
                        isUserActive ? 'bg-[#20B2AA] animate-pulse' : 'bg-[#1B2026]'
                      )}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
