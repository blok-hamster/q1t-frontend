'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { settingsApi } from '@/lib/api';
import { toast } from '@/context/toast-context';
import { Settings, Save, RotateCcw } from 'lucide-react';
import type { MarketConfig } from '@/types/api';

function fmtTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}s`;
  if (s === 0) return `${m}m`;
  return `${m}m ${s}s`;
}

const MARKET_LABELS: Record<string, string> = {
  'btc-5m': 'BTC 5-Minute',
  'btc-15m': 'BTC 15-Minute',
  'eth-5m': 'ETH 5-Minute',
  'eth-15m': 'ETH 15-Minute',
  'sol-5m': 'SOL 5-Minute',
  'sol-15m': 'SOL 15-Minute',
  'doge-5m': 'DOGE 5-Minute',
  'doge-15m': 'DOGE 15-Minute',
};

const MARKET_DEFAULTS: Record<string, { min_price_distance: number; distance_label: string }> = {
  'btc-5m': { min_price_distance: 25, distance_label: 'BTC distance from strike' },
  'btc-15m': { min_price_distance: 50, distance_label: 'BTC distance from strike' },
  'eth-5m': { min_price_distance: 3, distance_label: 'ETH distance from strike' },
  'eth-15m': { min_price_distance: 5, distance_label: 'ETH distance from strike' },
  'sol-5m': { min_price_distance: 0.10, distance_label: 'SOL distance from strike' },
  'sol-15m': { min_price_distance: 0.20, distance_label: 'SOL distance from strike' },
  'doge-5m': { min_price_distance: 0.0002, distance_label: 'DOGE distance from strike' },
  'doge-15m': { min_price_distance: 0.0005, distance_label: 'DOGE distance from strike' },
};

const DISTANCE_RANGES: Record<string, { min: number; max: number; step: number; format: (v: number) => string }> = {
  'btc-5m': { min: 5, max: 100, step: 5, format: (v) => `$${v}` },
  'btc-15m': { min: 10, max: 200, step: 10, format: (v) => `$${v}` },
  'eth-5m': { min: 0.5, max: 20, step: 0.5, format: (v) => `$${v.toFixed(1)}` },
  'eth-15m': { min: 1, max: 30, step: 1, format: (v) => `$${v}` },
  'sol-5m': { min: 0.02, max: 1, step: 0.02, format: (v) => `$${v.toFixed(2)}` },
  'sol-15m': { min: 0.05, max: 2, step: 0.05, format: (v) => `$${v.toFixed(2)}` },
  'doge-5m': { min: 0.0001, max: 0.002, step: 0.0001, format: (v) => `$${v.toFixed(4)}` },
  'doge-15m': { min: 0.0002, max: 0.005, step: 0.0001, format: (v) => `$${v.toFixed(4)}` },
};

const DEFAULT_CONFIG: MarketConfig = {
  market_type: '',
  enabled: false,
  entry_share_price: 0.80,
  min_price_distance: 25.0,
  max_entry_price: 0.85,
  stop_loss_price: 0.40,
  num_shares: 20,
  max_daily_trades: 200,
  max_concurrent: 1,
  cooldown_after_stop_seconds: 300,
  watch_start_seconds: 120,
  watch_end_seconds: 210,
};

interface MarketConfigPanelProps {
  marketType: string;
  initialConfig?: MarketConfig | null;
  onSave?: (config: MarketConfig) => void;
}

export function MarketConfigPanel({ marketType, initialConfig, onSave }: MarketConfigPanelProps) {
  const [config, setConfig] = useState<MarketConfig>(
    initialConfig || { ...DEFAULT_CONFIG, market_type: marketType }
  );
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (initialConfig) {
      setConfig(initialConfig);
      setHasChanges(false);
    } else {
      const defaults = MARKET_DEFAULTS[marketType];
      setConfig({
        ...DEFAULT_CONFIG,
        market_type: marketType,
        min_price_distance: defaults?.min_price_distance || 25,
      });
      setHasChanges(false);
    }
  }, [marketType, initialConfig]);

  const update = (key: keyof MarketConfig, value: number | boolean) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleReset = () => {
    if (initialConfig) {
      setConfig(initialConfig);
    } else {
      const defaults = MARKET_DEFAULTS[marketType];
      setConfig({
        ...DEFAULT_CONFIG,
        market_type: marketType,
        min_price_distance: defaults?.min_price_distance || 25,
      });
    }
    setHasChanges(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { market_type, ...updates } = config;
      const res = await settingsApi.updateMarketConfig(marketType, updates);
      toast.success(`${MARKET_LABELS[marketType] || marketType} config saved`);
      setHasChanges(false);
      onSave?.(res.marketConfig);
    } catch (error: any) {
      toast.error(error.message || 'Failed to save market config');
    } finally {
      setSaving(false);
    }
  };

  const distRange = DISTANCE_RANGES[marketType] || DISTANCE_RANGES['btc-5m'];
  const distLabel = MARKET_DEFAULTS[marketType]?.distance_label || 'Price distance from strike';
  const isInterval15m = marketType.includes('15m');

  const costPerTrade = config.num_shares * config.max_entry_price;
  const maxLossPerStop = config.num_shares * (config.entry_share_price - config.stop_loss_price);
  const profitPerWin = config.num_shares * (1.0 - config.entry_share_price);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings className="h-5 w-5 text-accent-primary" />
            <div>
              <h3 className="text-lg font-semibold text-text-primary">
                {MARKET_LABELS[marketType] || marketType}
              </h3>
              <p className="text-sm text-text-secondary mt-1">
                Per-market configuration
              </p>
            </div>
          </div>
          <Badge variant={config.enabled ? 'success' : 'neutral'}>
            {config.enabled ? 'Enabled' : 'Disabled'}
          </Badge>
        </div>
      </CardHeader>

      <CardBody className="space-y-6">
        {/* Enable Toggle */}
        <div className="flex items-center justify-between p-4 bg-bg-tertiary rounded-lg">
          <div className="flex-1">
            <label className="text-sm font-medium text-text-primary block mb-1">
              Enable {MARKET_LABELS[marketType] || marketType}
            </label>
            <p className="text-xs text-text-tertiary">
              Monitor and trade this market automatically
            </p>
          </div>
          <Switch
            checked={config.enabled}
            onChange={(checked) => update('enabled', checked)}
          />
        </div>

        {/* Entry Conditions */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-text-primary uppercase tracking-wide">
            Entry Conditions
          </h4>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-text-primary">
                Entry Share Price
              </label>
              <span className="text-sm font-mono font-semibold text-accent-primary">
                ${config.entry_share_price.toFixed(2)}
              </span>
            </div>
            <Slider
              min={50}
              max={95}
              step={1}
              value={config.entry_share_price * 100}
              onChange={(v) => update('entry_share_price', v / 100)}
              formatValue={(v) => `$${(v / 100).toFixed(2)}`}
            />
            <p className="text-xs text-text-tertiary">
              Only enter when the leading side reaches this price
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-text-primary">
                Min {distLabel}
              </label>
              <span className="text-sm font-mono font-semibold text-accent-primary">
                {distRange.format(config.min_price_distance)}
              </span>
            </div>
            <Slider
              min={distRange.min * 100}
              max={distRange.max * 100}
              step={distRange.step * 100}
              value={config.min_price_distance * 100}
              onChange={(v) => update('min_price_distance', v / 100)}
              formatValue={(v) => distRange.format(v / 100)}
            />
            <p className="text-xs text-text-tertiary">
              Reject trades when price is too close to strike (reversal risk)
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-text-primary">
                Max Entry Price (Slippage Cap)
              </label>
              <span className="text-sm font-mono font-semibold text-accent-primary">
                ${config.max_entry_price.toFixed(2)}
              </span>
            </div>
            <Slider
              min={50}
              max={95}
              step={1}
              value={config.max_entry_price * 100}
              onChange={(v) => update('max_entry_price', v / 100)}
              formatValue={(v) => `$${(v / 100).toFixed(2)}`}
            />
          </div>
        </div>

        {/* Risk / Exit */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-text-primary uppercase tracking-wide">
            Risk / Exit
          </h4>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-text-primary">
                Stop-Loss Price
              </label>
              <span className="text-sm font-mono font-semibold text-negative">
                ${config.stop_loss_price.toFixed(2)}
              </span>
            </div>
            <Slider
              min={10}
              max={70}
              step={5}
              value={config.stop_loss_price * 100}
              onChange={(v) => update('stop_loss_price', v / 100)}
              formatValue={(v) => `$${(v / 100).toFixed(2)}`}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-text-primary">
                Cooldown After Stop-Loss
              </label>
              <span className="text-sm font-mono font-semibold text-accent-primary">
                {fmtTime(config.cooldown_after_stop_seconds)}
              </span>
            </div>
            <Slider
              min={0}
              max={600}
              step={30}
              value={config.cooldown_after_stop_seconds}
              onChange={(v) => update('cooldown_after_stop_seconds', v)}
              formatValue={(v) => fmtTime(v)}
            />
          </div>
        </div>

        {/* Position Sizing */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-text-primary uppercase tracking-wide">
            Position Sizing
          </h4>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-text-primary">
                Shares per Trade
              </label>
              <span className="text-sm font-mono font-semibold text-accent-primary">
                {config.num_shares}
              </span>
            </div>
            <Slider
              min={1}
              max={200}
              step={1}
              value={config.num_shares}
              onChange={(v) => update('num_shares', v)}
              formatValue={(v) => `${v}`}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-text-primary">
                Max Daily Trades
              </label>
              <span className="text-sm font-mono font-semibold text-accent-primary">
                {config.max_daily_trades}
              </span>
            </div>
            <Slider
              min={1}
              max={500}
              step={10}
              value={config.max_daily_trades}
              onChange={(v) => update('max_daily_trades', v)}
              formatValue={(v) => `${v}`}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-text-primary">
                Max Concurrent Positions
              </label>
              <span className="text-sm font-mono font-semibold text-accent-primary">
                {config.max_concurrent}
              </span>
            </div>
            <Slider
              min={1}
              max={5}
              step={1}
              value={config.max_concurrent}
              onChange={(v) => update('max_concurrent', v)}
              formatValue={(v) => `${v}`}
            />
          </div>
        </div>

        {/* Watch Window */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-text-primary uppercase tracking-wide">
            Watch Window
          </h4>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-text-primary">
                Start Watching At
              </label>
              <span className="text-sm font-mono font-semibold text-accent-primary">
                T+{fmtTime(config.watch_start_seconds)}
              </span>
            </div>
            <Slider
              min={30}
              max={isInterval15m ? 600 : 180}
              step={10}
              value={config.watch_start_seconds}
              onChange={(v) => update('watch_start_seconds', v)}
              formatValue={(v) => `T+${fmtTime(v)}`}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-text-primary">
                Stop Watching At
              </label>
              <span className="text-sm font-mono font-semibold text-accent-primary">
                T+{fmtTime(config.watch_end_seconds)}
              </span>
            </div>
            <Slider
              min={120}
              max={isInterval15m ? 800 : 270}
              step={10}
              value={config.watch_end_seconds}
              onChange={(v) => update('watch_end_seconds', v)}
              formatValue={(v) => `T+${fmtTime(v)}`}
            />
          </div>
        </div>

        {/* Trade Economics Preview */}
        <div className="p-4 bg-accent-muted border border-accent-primary/30 rounded-lg">
          <p className="text-xs font-semibold text-accent-primary uppercase tracking-wide mb-3">
            Trade Economics Preview
          </p>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-text-tertiary text-xs mb-1">Max cost:</p>
              <p className="font-mono font-semibold text-text-primary">
                ${costPerTrade.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-text-tertiary text-xs mb-1">Profit/win:</p>
              <p className="font-mono font-semibold text-positive">
                +${profitPerWin.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-text-tertiary text-xs mb-1">Loss/stop:</p>
              <p className="font-mono font-semibold text-negative">
                -${maxLossPerStop.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </CardBody>

      {hasChanges && (
        <CardFooter>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={handleReset}
              disabled={saving}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleSave}
              loading={saving}
              className="ml-auto"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
