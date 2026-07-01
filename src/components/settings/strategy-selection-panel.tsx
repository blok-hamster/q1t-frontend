'use client';

import { useState, useEffect } from 'react';
import { settingsApi } from '@/lib/api';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { toast } from '@/context/toast-context';
import { Target, TrendingUp, Zap, Shield } from 'lucide-react';
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
    value: 'ai_prediction_v2',
    label: 'AI Prediction',
    description: 'Classifier-driven entry with dynamic TP/SL across all markets',
    icon: Target,
  },
  {
    value: 'mid_market',
    label: 'Mid-Market',
    description: 'Momentum entry during active windows',
    icon: TrendingUp,
  },
  {
    value: 'scalp',
    label: 'Scalp',
    description: 'Buy cheap trailing side, exit on TP/SL',
    icon: Shield,
  },
];

interface Props {
  initialStrategy: StrategySelection;
  marketConfigs: MarketConfig[];
  onUpdate: (strategy: StrategySelection) => void;
}

export function StrategySelectionPanel({ initialStrategy, marketConfigs, onUpdate }: Props) {
  const [strategy, setStrategy] = useState<StrategySelection>(initialStrategy);
  const [saving, setSaving] = useState(false);
  const [aiV2Configs, setAiV2Configs] = useState<AiV2Config[]>([]);

  const activeStrategies = strategy.active_strategies || [];
  const showMidMarketMarkets = activeStrategies.includes('mid_market') || activeStrategies.includes('scalp');
  const showAiV2Markets = activeStrategies.includes('ai_prediction_v2');

  useEffect(() => {
    if (showAiV2Markets) {
      settingsApi.getAiV2Configs().then(resp => {
        setAiV2Configs(resp.aiV2Configs || []);
      }).catch(() => {});
    }
  }, [showAiV2Markets]);

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

  const handleMarketToggle = async (marketId: string) => {
    const current = strategy.mid_market_markets || [];
    const updated = current.includes(marketId)
      ? current.filter((m) => m !== marketId)
      : [...current, marketId];

    setSaving(true);
    try {
      const resp = await settingsApi.updateStrategySelection({ mid_market_markets: updated });
      setStrategy(resp.strategySelection);
      onUpdate(resp.strategySelection);
    } catch (error) {
      toast.error('Failed to update market selection');
    } finally {
      setSaving(false);
    }
  };

  const handleAiV2MarketToggle = async (marketId: string) => {
    const existing = aiV2Configs.find(c => c.market_type === marketId);
    const newEnabled = !existing?.enabled;

    setSaving(true);
    try {
      const resp = await settingsApi.updateAiV2Config(marketId, { enabled: newEnabled });
      setAiV2Configs(prev => {
        const idx = prev.findIndex(c => c.market_type === marketId);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = resp.aiV2Config;
          return updated;
        }
        return [...prev, resp.aiV2Config];
      });
    } catch (error) {
      toast.error('Failed to update AI market selection');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card padding="lg">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Zap className="h-5 w-5 text-accent-primary" />
          <div>
            <h3 className="text-lg font-semibold text-text-primary">Strategy Selection</h3>
            <p className="text-sm text-text-secondary mt-1">
              Toggle one or more strategies to run simultaneously
            </p>
          </div>
        </div>
      </CardHeader>
      <CardBody>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {STRATEGIES.map((s) => {
            const isActive = activeStrategies.includes(s.value);
            return (
              <button
                key={s.value}
                onClick={() => handleStrategyToggle(s.value)}
                disabled={saving}
                className={cn(
                  'flex items-start gap-3 p-4 rounded-lg border transition-colors text-left',
                  isActive
                    ? 'border-accent-primary bg-accent-muted'
                    : 'border-border hover:border-text-tertiary'
                )}
              >
                <s.icon className={cn(
                  'h-5 w-5 mt-0.5 shrink-0',
                  isActive ? 'text-accent-primary' : 'text-text-tertiary'
                )} />
                <div>
                  <p className={cn(
                    'text-sm font-medium',
                    isActive ? 'text-accent-primary' : 'text-text-primary'
                  )}>
                    {s.label}
                  </p>
                  <p className="text-xs text-text-secondary mt-0.5">{s.description}</p>
                </div>
              </button>
            );
          })}
        </div>

        {activeStrategies.length === 0 && (
          <p className="text-sm text-text-tertiary mt-3 text-center">
            No strategies active — all automated trading is paused
          </p>
        )}

        {showAiV2Markets && (
          <div className="mt-6 pt-4 border-t border-border">
            <p className="text-sm font-medium text-text-primary mb-3">
              AI Prediction Markets
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {SUPPORTED_MARKETS.map((m) => {
                const config = aiV2Configs.find(c => c.market_type === m.id);
                const isEnabled = config?.enabled ?? false;

                return (
                  <button
                    key={m.id}
                    onClick={() => handleAiV2MarketToggle(m.id)}
                    disabled={saving}
                    className={cn(
                      'px-3 py-2 rounded-md border text-sm font-medium transition-colors',
                      isEnabled
                        ? 'border-purple-500 bg-purple-500/10 text-purple-400'
                        : 'border-border text-text-secondary hover:border-text-tertiary'
                    )}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-text-tertiary mt-2">
              Select which markets the AI strategy trades
            </p>
          </div>
        )}

        {showMidMarketMarkets && (
          <div className="mt-6 pt-4 border-t border-border">
            <p className="text-sm font-medium text-text-primary mb-3">
              Mid-Market & Scalp Markets
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {SUPPORTED_MARKETS.map((m) => {
                const isEnabled = strategy.mid_market_markets?.includes(m.id);
                const config = marketConfigs.find((c) => c.market_type === m.id);
                const configEnabled = config?.enabled ?? false;

                return (
                  <button
                    key={m.id}
                    onClick={() => handleMarketToggle(m.id)}
                    disabled={saving}
                    className={cn(
                      'px-3 py-2 rounded-md border text-sm font-medium transition-colors',
                      isEnabled
                        ? 'border-accent-primary bg-accent-muted text-accent-primary'
                        : 'border-border text-text-secondary hover:border-text-tertiary'
                    )}
                  >
                    {m.label}
                    {isEnabled && configEnabled && (
                      <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-positive" />
                    )}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-text-tertiary mt-2">
              Select which markets to monitor for mid-market and scalp strategies
            </p>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
