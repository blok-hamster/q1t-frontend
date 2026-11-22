'use client';

import { useState, useEffect } from 'react';
import { settingsApi } from '@/lib/api';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loading } from '@/components/ui/loading';
import { toast } from '@/context/toast-context';
import { cn } from '@/lib/utils/cn';
import { Target, Settings, Save } from 'lucide-react';
import type { AiV2Config } from '@/types/api';

const MARKET_LABELS: Record<string, { label: string; asset: string }> = {
  'btc-5m': { label: 'BTC 5m', asset: 'BTC' },
  'btc-15m': { label: 'BTC 15m', asset: 'BTC' },
  'eth-5m': { label: 'ETH 5m', asset: 'ETH' },
  'eth-15m': { label: 'ETH 15m', asset: 'ETH' },
  'sol-5m': { label: 'SOL 5m', asset: 'SOL' },
  'sol-15m': { label: 'SOL 15m', asset: 'SOL' },
  'doge-5m': { label: 'DOGE 5m', asset: 'DOGE' },
  'doge-15m': { label: 'DOGE 15m', asset: 'DOGE' },
  'bnb-5m': { label: 'BNB 5m', asset: 'BNB' },
  'xrp-5m': { label: 'XRP 5m', asset: 'XRP' },
  'hype-5m': { label: 'HYPE 5m', asset: 'HYPE' },
};

const DEFAULT_AI_V2: Omit<AiV2Config, 'market_type'> = {
  enabled: false,
  entry_price_min: 0.55,
  entry_price_max: 0.65,
  take_profit_price: 0.85,
  stop_loss_delta: 0.10,
  min_stop_floor: 0.45,
  num_shares: 20,
  max_daily_trades: 50,
  max_concurrent: 2,
  cooldown_after_loss_seconds: 300,
  sl_debounce_ticks: 3,
  exit_before_end_seconds: 45,
};

interface ConfigField {
  key: keyof AiV2Config;
  label: string;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  description: string;
}

const CONFIG_FIELDS: ConfigField[] = [
  { key: 'entry_price_min', label: 'Entry Price Min', min: 0.01, max: 0.99, step: 0.01, format: v => `$${v.toFixed(2)}`, description: 'Minimum share price to enter' },
  { key: 'entry_price_max', label: 'Entry Price Max', min: 0.01, max: 0.99, step: 0.01, format: v => `$${v.toFixed(2)}`, description: 'Maximum share price to enter' },
  { key: 'take_profit_price', label: 'Take Profit', min: 0.01, max: 0.99, step: 0.01, format: v => `$${v.toFixed(2)}`, description: 'Exit when share price reaches this' },
  { key: 'stop_loss_delta', label: 'Stop Loss Delta', min: 0.01, max: 0.99, step: 0.01, format: v => `$${v.toFixed(2)}`, description: 'Exit if price drops this much below entry' },
  { key: 'min_stop_floor', label: 'Min Stop Floor', min: 0.01, max: 0.99, step: 0.01, format: v => `$${v.toFixed(2)}`, description: 'Stop loss cannot go below this price' },
  { key: 'num_shares', label: 'Shares Per Trade', min: 1, max: 10000, step: 1, format: v => `${v}`, description: 'Number of shares to buy each entry' },
  { key: 'max_daily_trades', label: 'Max Daily Trades', min: 1, max: 10000, step: 1, format: v => `${v}`, description: 'Maximum trades per day on this market' },
  { key: 'max_concurrent', label: 'Max Concurrent', min: 1, max: 50, step: 1, format: v => `${v}`, description: 'Simultaneous open positions on this market' },
  { key: 'cooldown_after_loss_seconds', label: 'Loss Cooldown', min: 0, max: 3600, step: 30, format: v => v === 0 ? 'None' : `${Math.floor(v/60)}m ${v%60}s`, description: 'Wait time after a stop-loss hit' },
  { key: 'sl_debounce_ticks', label: 'SL Debounce Ticks', min: 1, max: 20, step: 1, format: v => `${v}`, description: 'Price must breach SL for this many ticks' },
  { key: 'exit_before_end_seconds', label: 'Exit Before End', min: 10, max: 300, step: 5, format: v => v === 0 ? 'Disabled' : `${v}s`, description: 'Sell at current price this many seconds before market ends' },
];

export default function AiPredictionPage() {
  const [configs, setConfigs] = useState<AiV2Config[]>([]);
  const [selectedMarket, setSelectedMarket] = useState<string>('btc-5m');
  const [draft, setDraft] = useState<Partial<AiV2Config>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const [aiResp, settingsResp] = await Promise.all([
          settingsApi.getAiV2Configs(),
          settingsApi.getSettings(),
        ]);
        setConfigs(aiResp.aiV2Configs || []);
        setIsActive(settingsResp.strategySelection?.active_strategies?.includes('ai_prediction_v2') ?? false);
      } catch {
        toast.error('Failed to load AI prediction config');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  useEffect(() => {
    const config = configs.find(c => c.market_type === selectedMarket);
    setDraft(config || { market_type: selectedMarket, ...DEFAULT_AI_V2 });
  }, [selectedMarket, configs]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const resp = await settingsApi.updateAiV2Config(selectedMarket, draft);
      setConfigs(prev => {
        const idx = prev.findIndex(c => c.market_type === selectedMarket);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = resp.aiV2Config;
          return updated;
        }
        return [...prev, resp.aiV2Config];
      });
      toast.success(`${MARKET_LABELS[selectedMarket]?.label} config saved`);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to save config');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleEnabled = async () => {
    const newEnabled = !draft.enabled;
    setSaving(true);
    try {
      const resp = await settingsApi.updateAiV2Config(selectedMarket, { enabled: newEnabled });
      setConfigs(prev => {
        const idx = prev.findIndex(c => c.market_type === selectedMarket);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = resp.aiV2Config;
          return updated;
        }
        return [...prev, resp.aiV2Config];
      });
      setDraft(prev => ({ ...prev, enabled: newEnabled }));
      toast.success(`${MARKET_LABELS[selectedMarket]?.label} ${newEnabled ? 'enabled' : 'disabled'}`);
    } catch {
      toast.error('Failed to toggle market');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading text="Loading AI prediction config..." />;

  const currentConfig = configs.find(c => c.market_type === selectedMarket);
  const enabledCount = configs.filter(c => c.enabled).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">AI Prediction Strategy</h1>
          <p className="text-sm text-text-secondary mt-1">
            Classifier-driven entry with dynamic TP/SL — configure per market
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isActive ? 'success' : 'default'}>
            {isActive ? 'Active' : 'Inactive'}
          </Badge>
          <Badge variant="default">{enabledCount}/8 markets</Badge>
        </div>
      </div>

      {/* Market Selector */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {Object.entries(MARKET_LABELS).map(([id, { label }]) => {
          const config = configs.find(c => c.market_type === id);
          const enabled = config?.enabled ?? false;
          return (
            <button
              key={id}
              onClick={() => setSelectedMarket(id)}
              className={cn(
                'px-4 py-2 rounded-lg border text-sm font-medium whitespace-nowrap transition-colors',
                selectedMarket === id
                  ? 'border-purple-500 bg-purple-500/10 text-purple-400'
                  : 'border-border text-text-secondary hover:border-text-tertiary'
              )}
            >
              {label}
              {enabled && (
                <span className="ml-2 inline-block w-2 h-2 rounded-full bg-positive" />
              )}
            </button>
          );
        })}
      </div>

      {/* Config Panel */}
      <Card padding="lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Settings className="h-5 w-5 text-purple-400" />
              <div>
                <h3 className="text-lg font-semibold text-text-primary">
                  {MARKET_LABELS[selectedMarket]?.label} Configuration
                </h3>
                <p className="text-xs text-text-secondary mt-0.5">
                  Entry, TP/SL, and sizing parameters for this market
                </p>
              </div>
            </div>
            <button
              onClick={handleToggleEnabled}
              disabled={saving}
              className={cn(
                'px-4 py-2 rounded-lg border text-sm font-medium transition-colors',
                draft.enabled
                  ? 'border-positive bg-positive/10 text-positive'
                  : 'border-border text-text-secondary hover:border-text-tertiary'
              )}
            >
              {draft.enabled ? 'Enabled' : 'Disabled'}
            </button>
          </div>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {CONFIG_FIELDS.map((field) => {
              const value = (draft[field.key] as number) ?? (DEFAULT_AI_V2 as any)[field.key] ?? field.min;
              return (
                <div key={field.key} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-text-primary">{field.label}</label>
                    <input
                      type="number"
                      min={field.min}
                      step={field.step}
                      value={value}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value);
                        if (!isNaN(v) && v >= field.min) setDraft(prev => ({ ...prev, [field.key]: v }));
                      }}
                      className="w-24 px-2 py-1 text-right text-sm font-mono bg-bg-tertiary border border-border rounded-md text-accent-primary focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                  <input
                    type="range"
                    min={field.min}
                    max={field.max}
                    step={field.step}
                    value={Math.min(value, field.max)}
                    onChange={(e) => setDraft(prev => ({ ...prev, [field.key]: parseFloat(e.target.value) }))}
                    className="w-full h-2 bg-bg-tertiary rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                  <p className="text-xs text-text-tertiary">{field.description}</p>
                </div>
              );
            })}
          </div>

          {/* R:R Preview */}
          <div className="mt-6 p-4 rounded-lg bg-bg-secondary border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-purple-400" />
              <span className="text-sm font-medium text-text-primary">Trade Preview</span>
            </div>
            {(() => {
              const entryMin = (draft.entry_price_min as number) || DEFAULT_AI_V2.entry_price_min;
              const entryMax = (draft.entry_price_max as number) || DEFAULT_AI_V2.entry_price_max;
              const entry = (entryMin + entryMax) / 2;
              const tp = (draft.take_profit_price as number) || DEFAULT_AI_V2.take_profit_price;
              const slDelta = (draft.stop_loss_delta as number) || DEFAULT_AI_V2.stop_loss_delta;
              const sl = Math.max(entry - slDelta, (draft.min_stop_floor as number) || DEFAULT_AI_V2.min_stop_floor);
              const shares = (draft.num_shares as number) || DEFAULT_AI_V2.num_shares;
              const rr = (tp - entry) / (entry - sl);
              const costBasis = entry * shares;
              const tpProfit = (tp - entry) * shares;
              const slLoss = (entry - sl) * shares;

              return (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  <div>
                    <p className="text-text-tertiary text-xs">Entry</p>
                    <p className="font-mono text-text-primary">${entry.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-text-tertiary text-xs">Cost Basis</p>
                    <p className="font-mono text-text-primary">${costBasis.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-text-tertiary text-xs">TP Profit</p>
                    <p className="font-mono text-positive">+${tpProfit.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-text-tertiary text-xs">SL Loss</p>
                    <p className="font-mono text-negative">-${slLoss.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-text-tertiary text-xs">Stop Loss @</p>
                    <p className="font-mono text-text-primary">${sl.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-text-tertiary text-xs">R:R Ratio</p>
                    <p className="font-mono text-purple-400">{rr.toFixed(1)}:1</p>
                  </div>
                  <div>
                    <p className="text-text-tertiary text-xs">Breakeven WR</p>
                    <p className="font-mono text-text-primary">{(100 / (rr + 1)).toFixed(0)}%</p>
                  </div>
                  <div>
                    <p className="text-text-tertiary text-xs">Shares</p>
                    <p className="font-mono text-text-primary">{shares}</p>
                  </div>
                </div>
              );
            })()}
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-purple-500 text-white font-medium text-sm hover:bg-purple-600 transition-colors disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
