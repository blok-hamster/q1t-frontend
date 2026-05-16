'use client';

import { useState } from 'react';
import { Card, CardHeader, CardBody, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { settingsApi } from '@/lib/api';
import { toast } from '@/context/toast-context';
import { TrendingUp, Save, RotateCcw } from 'lucide-react';
import type { MidMarketConfig } from '@/types/api';

interface MidMarketConfigPanelProps {
  initialConfig: MidMarketConfig;
  onSave?: (config: MidMarketConfig) => void;
}

export function MidMarketConfigPanel({ initialConfig, onSave }: MidMarketConfigPanelProps) {
  const [config, setConfig] = useState<MidMarketConfig>(initialConfig);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const update = (key: keyof MidMarketConfig, value: number | boolean) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleReset = () => {
    setConfig(initialConfig);
    setHasChanges(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await settingsApi.updateMidMarketConfig(config);
      toast.success('Mid-market configuration updated');
      setHasChanges(false);
      onSave?.(res.midMarketConfig);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update mid-market configuration');
    } finally {
      setSaving(false);
    }
  };

  const costPerTrade = config.num_shares * config.max_entry_price;
  const maxLossPerStop = config.num_shares * (config.entry_share_price - config.stop_loss_price);
  const profitPerWin = config.num_shares * (1.0 - config.entry_share_price);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-accent-primary" />
            <div>
              <h3 className="text-lg font-semibold text-text-primary">
                Mid-Market Momentum
              </h3>
              <p className="text-sm text-text-secondary mt-1">
                Buy the leading side mid-window and ride momentum to resolution
              </p>
            </div>
          </div>
          <Badge variant={config.enabled ? 'success' : 'neutral'}>
            {config.enabled ? 'Active' : 'Disabled'}
          </Badge>
        </div>
      </CardHeader>

      <CardBody className="space-y-6">
        {/* Master Toggle */}
        <div className="flex items-center justify-between p-4 bg-bg-tertiary rounded-lg">
          <div className="flex-1">
            <label className="text-sm font-medium text-text-primary block mb-1">
              Enable Mid-Market Strategy
            </label>
            <p className="text-xs text-text-tertiary">
              Monitor share prices mid-window and enter momentum trades automatically
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
              Only enter when the leading side reaches this share price
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-text-primary">
                Min BTC Distance from Strike
              </label>
              <span className="text-sm font-mono font-semibold text-accent-primary">
                ${config.min_price_distance.toFixed(0)}
              </span>
            </div>
            <Slider
              min={5}
              max={100}
              step={5}
              value={config.min_price_distance}
              onChange={(v) => update('min_price_distance', v)}
              formatValue={(v) => `$${v}`}
            />
            <p className="text-xs text-text-tertiary">
              Reject trades when BTC is too close to the strike (reversal risk)
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
            <p className="text-xs text-text-tertiary">
              Never pay more than this per share — caps slippage on fast-moving markets
            </p>
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
            <p className="text-xs text-text-tertiary">
              Sell immediately if share price drops to this level
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-text-primary">
                Cooldown After Stop-Loss
              </label>
              <span className="text-sm font-mono font-semibold text-accent-primary">
                {config.cooldown_after_stop_seconds}s
              </span>
            </div>
            <Slider
              min={0}
              max={600}
              step={30}
              value={config.cooldown_after_stop_seconds}
              onChange={(v) => update('cooldown_after_stop_seconds', v)}
              formatValue={(v) => `${v}s`}
            />
            <p className="text-xs text-text-tertiary">
              Wait this long after a stop-loss before entering again
            </p>
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
                T+{config.watch_start_seconds}s
              </span>
            </div>
            <Slider
              min={30}
              max={180}
              step={10}
              value={config.watch_start_seconds}
              onChange={(v) => update('watch_start_seconds', v)}
              formatValue={(v) => `T+${v}s`}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-text-primary">
                Stop Watching At
              </label>
              <span className="text-sm font-mono font-semibold text-accent-primary">
                T+{config.watch_end_seconds}s
              </span>
            </div>
            <Slider
              min={120}
              max={270}
              step={10}
              value={config.watch_end_seconds}
              onChange={(v) => update('watch_end_seconds', v)}
              formatValue={(v) => `T+${v}s`}
            />
          </div>
        </div>

        {/* Preview Box */}
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
