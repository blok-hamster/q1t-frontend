'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { settingsApi } from '@/lib/api';
import { toast } from '@/context/toast-context';
import { Save, RotateCcw, Shield } from 'lucide-react';
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

interface ScalpConfigPanelProps {
  marketType: string;
  initialConfig?: MarketConfig | null;
  onSave?: (config: MarketConfig) => void;
}

export function ScalpConfigPanel({ marketType, initialConfig, onSave }: ScalpConfigPanelProps) {
  const [config, setConfig] = useState<MarketConfig>(
    { ...getDefaults(marketType), ...initialConfig, market_type: marketType }
  );
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const isInterval15m = marketType.includes('15m');

  useEffect(() => {
    if (initialConfig) {
      setConfig({ ...getDefaults(marketType), ...initialConfig });
      setHasChanges(false);
    } else {
      setConfig({ ...getDefaults(marketType), market_type: marketType });
      setHasChanges(false);
    }
  }, [marketType, initialConfig]);

  const update = (key: keyof MarketConfig, value: number | boolean) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleReset = () => {
    if (initialConfig) {
      setConfig({ ...getDefaults(marketType), ...initialConfig });
    } else {
      setConfig({ ...getDefaults(marketType), market_type: marketType });
    }
    setHasChanges(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { market_type, ...updates } = config;
      const res = await settingsApi.updateMarketConfig(marketType, updates);
      toast.success(`${MARKET_LABELS[marketType] || marketType} scalp config saved`);
      setHasChanges(false);
      onSave?.(res.marketConfig);
    } catch (error: any) {
      toast.error(error.message || 'Failed to save scalp config');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-emerald-500/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-emerald-400" />
            <h3 className="text-lg font-semibold text-text-primary">
              Scalp Config — {MARKET_LABELS[marketType] || marketType}
            </h3>
          </div>
          <Switch
            checked={config.scalp_enabled ?? false}
            onChange={(checked) => update('scalp_enabled', checked)}
          />
        </div>
        <p className="text-xs text-text-tertiary mt-1">
          Buy the cheap trailing side early, exit on take-profit before resolution
        </p>
      </CardHeader>

      {config.scalp_enabled && (
        <CardBody className="space-y-5 border-l-2 border-emerald-400/30 ml-4">
          {/* Entry Range */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-text-primary">
                Max Entry Price (buy below this)
              </label>
              <span className="text-sm font-mono font-semibold text-emerald-400">
                ${(config.scalp_max_entry ?? 0.40).toFixed(2)}
              </span>
            </div>
            <Slider
              min={15}
              max={50}
              step={1}
              value={(config.scalp_max_entry ?? 0.40) * 100}
              onChange={(v) => update('scalp_max_entry', v / 100)}
              formatValue={(v) => `$${(v / 100).toFixed(2)}`}
            />
            <p className="text-xs text-text-tertiary">
              Only buy trailing side when price is at or below this (cheaper = more profit potential)
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-text-primary">
                Min Entry Price (skip illiquid)
              </label>
              <span className="text-sm font-mono font-semibold text-emerald-400">
                ${(config.scalp_min_entry ?? 0.10).toFixed(2)}
              </span>
            </div>
            <Slider
              min={3}
              max={25}
              step={1}
              value={(config.scalp_min_entry ?? 0.10) * 100}
              onChange={(v) => update('scalp_min_entry', v / 100)}
              formatValue={(v) => `$${(v / 100).toFixed(2)}`}
            />
          </div>

          {/* Take Profit */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-text-primary">
                Take Profit (delta from entry)
              </label>
              <span className="text-sm font-mono font-semibold text-positive">
                +${(config.scalp_tp_delta ?? 0.15).toFixed(2)}
              </span>
            </div>
            <Slider
              min={5}
              max={40}
              step={1}
              value={(config.scalp_tp_delta ?? 0.15) * 100}
              onChange={(v) => update('scalp_tp_delta', v / 100)}
              formatValue={(v) => `+$${(v / 100).toFixed(2)}`}
            />
            <p className="text-xs text-text-tertiary">
              Exit with profit when share price rises this much from entry
            </p>
          </div>

          {/* Dynamic Stop Loss */}
          <div className="flex items-center justify-between p-3 bg-bg-tertiary rounded-lg">
            <div className="flex-1">
              <label className="text-sm font-medium text-text-primary block mb-1">
                Dynamic Stop Loss
              </label>
              <p className="text-xs text-text-tertiary">
                SL scales with entry price (cheap entries get tight SL, expensive entries get wider SL)
              </p>
            </div>
            <Switch
              checked={config.scalp_dynamic_stop_enabled ?? true}
              onChange={(checked) => update('scalp_dynamic_stop_enabled', checked)}
            />
          </div>

          {config.scalp_dynamic_stop_enabled !== false ? (
            <>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-text-primary">
                    SL % of Entry Price
                  </label>
                  <span className="text-sm font-mono font-semibold text-negative">
                    {((config.scalp_sl_pct ?? 0.40) * 100).toFixed(0)}%
                  </span>
                </div>
                <Slider
                  min={20}
                  max={60}
                  step={5}
                  value={(config.scalp_sl_pct ?? 0.40) * 100}
                  onChange={(v) => update('scalp_sl_pct', v / 100)}
                  formatValue={(v) => `${v}%`}
                />
                <p className="text-xs text-text-tertiary">
                  e.g. 40% of $0.20 entry = $0.08 SL delta; 40% of $0.30 entry = $0.12 SL delta
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-text-primary">
                    Min SL Delta (floor)
                  </label>
                  <span className="text-sm font-mono font-semibold text-negative">
                    -${(config.scalp_min_sl_delta ?? 0.06).toFixed(2)}
                  </span>
                </div>
                <Slider
                  min={3}
                  max={10}
                  step={1}
                  value={(config.scalp_min_sl_delta ?? 0.06) * 100}
                  onChange={(v) => update('scalp_min_sl_delta', v / 100)}
                  formatValue={(v) => `-$${(v / 100).toFixed(2)}`}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-text-primary">
                    Min R:R Ratio (gate)
                  </label>
                  <span className="text-sm font-mono font-semibold text-emerald-400">
                    {(config.scalp_min_rr ?? 1.2).toFixed(1)}:1
                  </span>
                </div>
                <Slider
                  min={10}
                  max={30}
                  step={1}
                  value={(config.scalp_min_rr ?? 1.2) * 10}
                  onChange={(v) => update('scalp_min_rr', v / 10)}
                  formatValue={(v) => `${(v / 10).toFixed(1)}:1`}
                />
                <p className="text-xs text-text-tertiary">
                  Reject trades where TP/SL ratio falls below this (blocks expensive entries)
                </p>
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-text-primary">
                  Fixed Stop Loss (delta from entry)
                </label>
                <span className="text-sm font-mono font-semibold text-negative">
                  -${(config.scalp_sl_delta ?? 0.10).toFixed(2)}
                </span>
              </div>
              <Slider
                min={3}
                max={20}
                step={1}
                value={(config.scalp_sl_delta ?? 0.10) * 100}
                onChange={(v) => update('scalp_sl_delta', v / 100)}
                formatValue={(v) => `-$${(v / 100).toFixed(2)}`}
              />
            </div>
          )}

          {/* Timing */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-text-primary">
                Max Hold Time
              </label>
              <span className="text-sm font-mono font-semibold text-emerald-400">
                {fmtTime(config.scalp_max_hold_seconds ?? (isInterval15m ? 840 : 240))}
              </span>
            </div>
            <Slider
              min={30}
              max={isInterval15m ? 870 : 270}
              step={10}
              value={config.scalp_max_hold_seconds ?? (isInterval15m ? 840 : 240)}
              onChange={(v) => update('scalp_max_hold_seconds', v)}
              formatValue={(v) => fmtTime(v)}
            />
            <p className="text-xs text-text-tertiary">
              Force-exit if neither TP nor SL hit by this time
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-text-primary">
                  Entry After
                </label>
                <span className="text-sm font-mono font-semibold text-emerald-400">
                  T+{fmtTime(config.scalp_watch_start ?? 30)}
                </span>
              </div>
              <Slider
                min={10}
                max={isInterval15m ? 300 : 120}
                step={10}
                value={config.scalp_watch_start ?? 30}
                onChange={(v) => update('scalp_watch_start', v)}
                formatValue={(v) => `T+${fmtTime(v)}`}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-text-primary">
                  Entry Before
                </label>
                <span className="text-sm font-mono font-semibold text-emerald-400">
                  T+{fmtTime(config.scalp_watch_end ?? (isInterval15m ? 600 : 180))}
                </span>
              </div>
              <Slider
                min={60}
                max={isInterval15m ? 840 : 260}
                step={10}
                value={config.scalp_watch_end ?? (isInterval15m ? 600 : 180)}
                onChange={(v) => update('scalp_watch_end', v)}
                formatValue={(v) => `T+${fmtTime(v)}`}
              />
            </div>
          </div>

          {/* Sizing */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-text-primary">
                Scalp Shares
              </label>
              <span className="text-sm font-mono font-semibold text-emerald-400">
                {config.scalp_num_shares ?? 20}
              </span>
            </div>
            <Slider
              min={5}
              max={200}
              step={5}
              value={config.scalp_num_shares ?? 20}
              onChange={(v) => update('scalp_num_shares', v)}
              formatValue={(v) => `${v}`}
            />
          </div>

          {/* MQS filter (inverted) */}
          <div className="flex items-center justify-between p-3 bg-bg-tertiary rounded-lg">
            <div className="flex-1">
              <label className="text-sm font-medium text-text-primary block mb-1">
                MQS Filter (inverted)
              </label>
              <p className="text-xs text-text-tertiary">
                Only scalp when momentum is weak (MQS below threshold = likely retracement)
              </p>
            </div>
            <Switch
              checked={config.scalp_mqs_enabled ?? false}
              onChange={(checked) => update('scalp_mqs_enabled', checked)}
            />
          </div>

          {config.scalp_mqs_enabled && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-text-primary">
                  Max MQS for Scalp Entry
                </label>
                <span className="text-sm font-mono font-semibold text-emerald-400">
                  {((config.scalp_mqs_max ?? 0.45) * 100).toFixed(0)}%
                </span>
              </div>
              <Slider
                min={20}
                max={70}
                step={5}
                value={(config.scalp_mqs_max ?? 0.45) * 100}
                onChange={(v) => update('scalp_mqs_max', v / 100)}
                formatValue={(v) => `${v}%`}
              />
              <p className="text-xs text-text-tertiary">
                Block scalp if momentum is above this (strong trend = risky to fade)
              </p>
            </div>
          )}

          {/* Scalp Economics */}
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
            <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wide mb-2">
              Scalp Economics {config.scalp_dynamic_stop_enabled !== false ? '(Dynamic SL)' : '(Fixed SL)'}
            </p>
            {config.scalp_dynamic_stop_enabled !== false ? (
              <>
                <div className="grid grid-cols-3 gap-3 text-xs mb-2">
                  <div>
                    <p className="text-text-tertiary mb-1">Entry $0.15:</p>
                    <p className="font-mono font-semibold text-negative">
                      SL -${Math.max(config.scalp_min_sl_delta ?? 0.06, 0.15 * (config.scalp_sl_pct ?? 0.40)).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-text-tertiary mb-1">Entry $0.20:</p>
                    <p className="font-mono font-semibold text-negative">
                      SL -${Math.max(config.scalp_min_sl_delta ?? 0.06, 0.20 * (config.scalp_sl_pct ?? 0.40)).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-text-tertiary mb-1">Entry $0.25:</p>
                    <p className="font-mono font-semibold text-negative">
                      SL -${Math.max(config.scalp_min_sl_delta ?? 0.06, 0.25 * (config.scalp_sl_pct ?? 0.40)).toFixed(2)}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-text-tertiary">
                  Min R:R gate: {(config.scalp_min_rr ?? 1.2).toFixed(1)}:1 — max entry before gate: ${((config.scalp_tp_delta ?? 0.15) / ((config.scalp_min_rr ?? 1.2) * (config.scalp_sl_pct ?? 0.40))).toFixed(2)}
                </p>
              </>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <p className="text-text-tertiary mb-1">Entry cost:</p>
                    <p className="font-mono font-semibold text-text-primary">
                      ${((config.scalp_num_shares ?? 20) * (config.scalp_max_entry ?? 0.40)).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-text-tertiary mb-1">TP profit:</p>
                    <p className="font-mono font-semibold text-positive">
                      +${((config.scalp_num_shares ?? 20) * (config.scalp_tp_delta ?? 0.15)).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-text-tertiary mb-1">SL loss:</p>
                    <p className="font-mono font-semibold text-negative">
                      -${((config.scalp_num_shares ?? 20) * (config.scalp_sl_delta ?? 0.10)).toFixed(2)}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-text-tertiary mt-2">
                  Risk/Reward: 1:{((config.scalp_tp_delta ?? 0.15) / (config.scalp_sl_delta ?? 0.10)).toFixed(1)} — needs {(100 * (config.scalp_sl_delta ?? 0.10) / ((config.scalp_tp_delta ?? 0.15) + (config.scalp_sl_delta ?? 0.10))).toFixed(0)}% WR to break even
                </p>
              </>
            )}
          </div>
        </CardBody>
      )}

      <CardFooter className="flex justify-end gap-2 pt-3">
        <Button variant="ghost" size="sm" onClick={handleReset} disabled={!hasChanges}>
          <RotateCcw className="h-3.5 w-3.5 mr-1" />
          Reset
        </Button>
        <Button size="sm" onClick={handleSave} disabled={!hasChanges || saving}>
          <Save className="h-3.5 w-3.5 mr-1" />
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </CardFooter>
    </Card>
  );
}

function getDefaults(marketType: string): MarketConfig {
  const isInterval15m = marketType.includes('15m');
  return {
    market_type: marketType,
    enabled: true,
    entry_share_price: 0.80,
    min_price_distance: 25,
    max_entry_price: 0.85,
    stop_loss_price: 0.40,
    num_shares: 20,
    max_daily_trades: 200,
    max_concurrent: 1,
    cooldown_after_stop_seconds: 300,
    watch_start_seconds: isInterval15m ? 480 : 120,
    watch_end_seconds: isInterval15m ? 870 : 285,
    mqs_enabled: true,
    mqs_threshold: 0.60,
    volatility_gate_enabled: false,
    min_kronos_spread: 0.0003,
    fade_enabled: false,
    fade_vol_ceiling: 0.0002,
    fade_trigger_price: 0.82,
    fade_mqs_max: 0.45,
    fade_num_shares: 50,
    fade_stop_loss: 0.08,
    scalp_enabled: false,
    scalp_max_entry: 0.40,
    scalp_min_entry: 0.10,
    scalp_tp_delta: 0.15,
    scalp_sl_delta: 0.10,
    scalp_max_hold_seconds: isInterval15m ? 840 : 240,
    scalp_num_shares: 20,
    scalp_watch_start: 30,
    scalp_watch_end: isInterval15m ? 600 : 180,
    scalp_mqs_enabled: false,
    scalp_mqs_max: 0.45,
    scalp_dynamic_stop_enabled: true,
    scalp_sl_pct: 0.40,
    scalp_min_sl_delta: 0.06,
    scalp_min_rr: 1.2,
  };
}
