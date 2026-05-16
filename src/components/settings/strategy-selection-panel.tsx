'use client';

import { useState } from 'react';
import { settingsApi } from '@/lib/api';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { toast } from '@/context/toast-context';
import { Target, TrendingUp, Zap } from 'lucide-react';
import type { StrategySelection, MarketConfig } from '@/types/api';
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
    value: 'prediction' as const,
    label: 'Prediction Only',
    description: 'AI predicts direction at market open',
    icon: Target,
  },
  {
    value: 'mid_market' as const,
    label: 'Mid-Market Only',
    description: 'Momentum entry during active windows',
    icon: TrendingUp,
  },
  {
    value: 'both' as const,
    label: 'Both Strategies',
    description: 'Run prediction and mid-market simultaneously',
    icon: Zap,
  },
  {
    value: 'none' as const,
    label: 'None (Paused)',
    description: 'No automated trading',
    icon: Target,
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

  const handleStrategyChange = async (active_strategy: StrategySelection['active_strategy']) => {
    setSaving(true);
    try {
      const resp = await settingsApi.updateStrategySelection({ active_strategy });
      setStrategy(resp.strategySelection);
      onUpdate(resp.strategySelection);
      toast.success(`Strategy set to ${active_strategy.replace('_', ' ')}`);
    } catch (error) {
      toast.error('Failed to update strategy');
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

  const showMarketSelection = strategy.active_strategy === 'mid_market' || strategy.active_strategy === 'both';

  return (
    <Card padding="lg">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Zap className="h-5 w-5 text-accent-primary" />
          <div>
            <h3 className="text-lg font-semibold text-text-primary">Strategy Selection</h3>
            <p className="text-sm text-text-secondary mt-1">
              Choose which trading strategies to run
            </p>
          </div>
        </div>
      </CardHeader>
      <CardBody>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {STRATEGIES.map((s) => (
            <button
              key={s.value}
              onClick={() => handleStrategyChange(s.value)}
              disabled={saving}
              className={cn(
                'flex items-start gap-3 p-4 rounded-lg border transition-colors text-left',
                strategy.active_strategy === s.value
                  ? 'border-accent-primary bg-accent-muted'
                  : 'border-border hover:border-text-tertiary'
              )}
            >
              <s.icon className={cn(
                'h-5 w-5 mt-0.5 shrink-0',
                strategy.active_strategy === s.value ? 'text-accent-primary' : 'text-text-tertiary'
              )} />
              <div>
                <p className={cn(
                  'text-sm font-medium',
                  strategy.active_strategy === s.value ? 'text-accent-primary' : 'text-text-primary'
                )}>
                  {s.label}
                </p>
                <p className="text-xs text-text-secondary mt-0.5">{s.description}</p>
              </div>
            </button>
          ))}
        </div>

        {showMarketSelection && (
          <div className="mt-6 pt-4 border-t border-border">
            <p className="text-sm font-medium text-text-primary mb-3">
              Enabled Markets (Mid-Market)
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
              Select which markets the mid-market strategy monitors
            </p>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
