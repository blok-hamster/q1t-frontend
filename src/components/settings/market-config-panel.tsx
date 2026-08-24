'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { settingsApi } from '@/lib/api';
import { toast } from '@/context/toast-context';
import { Settings, Save, RotateCcw, ChevronDown, ChevronRight } from 'lucide-react';
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
  'doge-5m': { min_price_distance: 0.001, distance_label: 'DOGE distance from strike' },
  'doge-15m': { min_price_distance: 0.002, distance_label: 'DOGE distance from strike' },
};

const DISTANCE_RANGES: Record<string, { min: number; max: number; step: number; scale: number; format: (v: number) => string }> = {
  'btc-5m': { min: 0, max: 100, step: 5, scale: 1, format: (v) => `$${v}` },
  'btc-15m': { min: 0, max: 200, step: 10, scale: 1, format: (v) => `$${v}` },
  'eth-5m': { min: 0, max: 20, step: 0.5, scale: 1, format: (v) => `$${v.toFixed(1)}` },
  'eth-15m': { min: 0, max: 30, step: 1, scale: 1, format: (v) => `$${v}` },
  'sol-5m': { min: 0, max: 1, step: 0.01, scale: 1, format: (v) => `$${v.toFixed(2)}` },
  'sol-15m': { min: 0, max: 2, step: 0.02, scale: 1, format: (v) => `$${v.toFixed(2)}` },
  'doge-5m': { min: 0, max: 0.01, step: 0.00005, scale: 100000, format: (v) => `$${v.toFixed(5)}` },
  'doge-15m': { min: 0, max: 0.02, step: 0.0001, scale: 10000, format: (v) => `$${v.toFixed(5)}` },
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
  watch_end_seconds: 285,
  mqs_enabled: true,
  mqs_threshold: 0.60,
  volatility_gate_enabled: false,
  min_kronos_spread: 0.0003,
  fade_enabled: false,
  fade_vol_ceiling: 0.00020,
  fade_trigger_price: 0.82,
  fade_mqs_max: 0.45,
  fade_num_shares: 50,
  fade_stop_loss: 0.08,
  dynamic_stop_enabled: true,
  target_rr_ratio: 1.0,
  min_stop_floor: 0.50,
  min_rr_ratio: 0.75,
  stop_loss_debounce_ticks: 3,
  retrace_entry_enabled: false,
  limit_entry_price: 0.70,
  fok_buffer_cents: 0.03,
  take_profit_enabled: false,
  take_profit_delta: 0.10,
  blocked_hours_utc: [],
};

function getTimeframeDefaults(marketType: string): Partial<MarketConfig> {
  if (marketType.includes('15m')) {
    return { watch_start_seconds: 480, watch_end_seconds: 870, take_profit_delta: 0.12 };
  }
  return { watch_start_seconds: 120, watch_end_seconds: 285, take_profit_delta: 0.10 };
}

interface MarketConfigPanelProps {
  marketType: string;
  initialConfig?: MarketConfig | null;
  userSelectedMarkets?: string[];
  isMidMarketActive?: boolean;
  onToggleMarketActive?: (marketId: string) => void;
  onSave?: (config: MarketConfig) => void;
  isAdmin?: boolean;
}

export function MarketConfigPanel({
  marketType,
  initialConfig,
  userSelectedMarkets = [],
  isMidMarketActive = false,
  onToggleMarketActive,
  onSave,
  isAdmin = false,
}: MarketConfigPanelProps) {
  const [config, setConfig] = useState<MarketConfig>(
    { ...DEFAULT_CONFIG, ...initialConfig, market_type: marketType }
  );
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    const tfDefaults = getTimeframeDefaults(marketType);
    if (initialConfig) {
      setConfig({ ...DEFAULT_CONFIG, ...tfDefaults, ...initialConfig });
      setHasChanges(false);
    } else {
      const defaults = MARKET_DEFAULTS[marketType];
      setConfig({
        ...DEFAULT_CONFIG,
        ...tfDefaults,
        market_type: marketType,
        min_price_distance: defaults?.min_price_distance ?? 25,
      });
      setHasChanges(false);
    }
  }, [marketType, initialConfig]);

  const update = (key: keyof MarketConfig, value: number | boolean | number[]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleReset = () => {
    const tfDefaults = getTimeframeDefaults(marketType);
    if (initialConfig) {
      setConfig({ ...DEFAULT_CONFIG, ...tfDefaults, ...initialConfig });
    } else {
      const defaults = MARKET_DEFAULTS[marketType];
      setConfig({
        ...DEFAULT_CONFIG,
        ...tfDefaults,
        market_type: marketType,
        min_price_distance: defaults?.min_price_distance ?? 25,
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
      // Merge response with current config to preserve fields the server may not return
      const merged = { ...config, ...res.marketConfig, market_type: marketType };
      setConfig(merged);
      onSave?.(merged);
    } catch (error: any) {
      toast.error(error.message || 'Failed to save market config');
    } finally {
      setSaving(false);
    }
  };

  const distRange = DISTANCE_RANGES[marketType] || DISTANCE_RANGES['btc-5m'];
  const distLabel = MARKET_DEFAULTS[marketType]?.distance_label || 'Price distance from strike';
  const isInterval15m = marketType.includes('15m');

  // Economics calculation
  const retraceEnabled = config.retrace_entry_enabled ?? false;
  const effectiveEntry = retraceEnabled ? (config.limit_entry_price ?? 0.70) : config.entry_share_price;
  const dynamicStopEnabled = config.dynamic_stop_enabled ?? true;

  const tpEnabled = config.take_profit_enabled ?? false;
  const tpDelta = config.take_profit_delta ?? (isInterval15m ? 0.12 : 0.10);
  const winTargetPrice = tpEnabled ? Math.min(1.0, effectiveEntry + tpDelta) : 1.0;

  let effectiveStop: number;
  let effectiveRR: number;

  if (dynamicStopEnabled) {
    const reward = winTargetPrice - effectiveEntry;
    const targetRR = config.target_rr_ratio ?? 1.0;
    const idealStop = effectiveEntry - (reward / targetRR);
    effectiveStop = Math.max(idealStop, config.min_stop_floor ?? 0.50);
    const risk = effectiveEntry - effectiveStop;
    effectiveRR = risk > 0 ? reward / risk : 0;
  } else {
    effectiveStop = config.stop_loss_price;
    const reward = winTargetPrice - effectiveEntry;
    const risk = effectiveEntry - effectiveStop;
    effectiveRR = risk > 0 ? reward / risk : 0;
  }

  const profitPerWin = config.num_shares * (winTargetPrice - effectiveEntry);
  const maxLossPerStop = config.num_shares * (effectiveEntry - effectiveStop);
  const lossesToWipeWin = maxLossPerStop > 0 ? profitPerWin / maxLossPerStop : Infinity;
  const breakEvenWinRate = maxLossPerStop > 0 ? maxLossPerStop / (profitPerWin + maxLossPerStop) : 0;

  return (
    <Card className="font-mono text-xs select-none">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings className="h-5 w-5 text-accent-primary" />
            <h3 className="text-lg font-semibold text-text-primary">
              {MARKET_LABELS[marketType] || marketType}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={effectiveRR >= 1.0 ? 'success' : effectiveRR >= (config.min_rr_ratio ?? 0.75) ? 'warning' : 'error'}>
              R:R {effectiveRR.toFixed(1)}:1
            </Badge>
            {isAdmin ? (
              <Switch
                checked={config.enabled}
                onChange={(checked) => update('enabled', checked)}
              />
            ) : config.enabled === false ? (
              <Badge variant="neutral">Disabled by Admin</Badge>
            ) : (
              <Badge variant="success">Active</Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardBody className="space-y-5 max-h-[380px] overflow-y-auto scrollbar-thin pr-1">
        {/* ═══ TRADE ECONOMICS (always visible summary) ═══ */}
        <div className="p-4 bg-accent-muted border border-accent-primary/30 rounded-lg">
          <div className="grid grid-cols-4 gap-3 text-sm">
            <div>
              <p className="text-text-tertiary text-xs mb-1">Entry:</p>
              <p className="font-mono font-semibold text-text-primary">
                ${effectiveEntry.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-text-tertiary text-xs mb-1">Stop:</p>
              <p className="font-mono font-semibold text-negative">
                ${effectiveStop.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-text-tertiary text-xs mb-1">Win:</p>
              <p className="font-mono font-semibold text-positive">
                +${profitPerWin.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-text-tertiary text-xs mb-1">Loss:</p>
              <p className="font-mono font-semibold text-negative">
                -${maxLossPerStop.toFixed(2)}
              </p>
            </div>
          </div>
          <div className="border-t border-accent-primary/20 mt-3 pt-2 flex justify-between text-xs">
            <span className="text-text-tertiary">
              Losses to wipe 1 win: <span className="font-mono font-semibold text-text-primary">
                {lossesToWipeWin === Infinity ? '∞' : lossesToWipeWin.toFixed(1)}
              </span>
            </span>
            <span className="text-text-tertiary">
              Break-even WR: <span className="font-mono font-semibold text-text-primary">
                {(breakEvenWinRate * 100).toFixed(0)}%
              </span>
            </span>
          </div>
        </div>

        {/* ═══ USER CONTROLS (visible to all users) ═══ */}
        {!isAdmin && (
          <div className="space-y-4">
            {/* Shares */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-text-primary">Shares per Trade</label>
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

            {/* Max Concurrent */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-text-primary">Max Concurrent Positions</label>
                <span className="text-sm font-mono font-semibold text-accent-primary">
                  {config.max_concurrent}
                </span>
              </div>
              <Slider
                min={1}
                max={100}
                step={1}
                value={config.max_concurrent}
                onChange={(v) => update('max_concurrent', v)}
                formatValue={(v) => `${v}`}
              />
              <p className="text-xs text-text-tertiary">
                Maximum open positions for this market at the same time
              </p>
            </div>
          </div>
        )}

        {/* ═══ ENTRY & RISK (admin only) ═══ */}
        {isAdmin && (<div className="space-y-4">
          {/* Time Gate */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-primary">Time Gate (UTC)</label>
            <div className="grid grid-cols-12 gap-1">
              {Array.from({ length: 24 }, (_, h) => {
                const blocked = config.blocked_hours_utc || [];
                const isBlocked = blocked.includes(h);
                return (
                  <button
                    key={h}
                    type="button"
                    onClick={() => {
                      const current = [...(blocked as number[])];
                      const updated = isBlocked
                        ? current.filter((x: number) => x !== h)
                        : [...current, h].sort((a, b) => a - b);
                      update('blocked_hours_utc', updated);
                    }}
                    className={`px-0 py-1.5 text-[10px] font-mono rounded transition-colors ${
                      isBlocked
                        ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                        : 'bg-bg-tertiary text-text-tertiary border border-border-primary hover:border-border-secondary'
                    }`}
                  >
                    {String(h).padStart(2, '0')}
                  </button>
                );
              })}
            </div>
            {(config.blocked_hours_utc || []).length > 0 && (
              <p className="text-xs font-mono text-red-400">
                Blocked: {(config.blocked_hours_utc || []).map(h => `${String(h).padStart(2, '0')}:00`).join(', ')} UTC
              </p>
            )}
            <p className="text-xs text-text-tertiary">
              No new entries during red hours
            </p>
          </div>

          {/* Signal Price */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-text-primary">Signal Price</label>
              <span className="text-sm font-mono font-semibold text-accent-primary">
                ${config.entry_share_price.toFixed(2)}
              </span>
            </div>
            <Slider
              min={55}
              max={92}
              step={1}
              value={config.entry_share_price * 100}
              onChange={(v) => update('entry_share_price', v / 100)}
              formatValue={(v) => `$${(v / 100).toFixed(2)}`}
            />
            <p className="text-xs text-text-tertiary">
              Momentum confirmed when leading side reaches this price
            </p>
          </div>

          {/* Retrace Entry */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-text-primary">Retrace Entry</label>
              <Switch
                checked={config.retrace_entry_enabled ?? false}
                onChange={(checked) => update('retrace_entry_enabled', checked)}
              />
            </div>
            {retraceEnabled && (
              <div className="space-y-2 pl-1 border-l-2 border-cyan-500/30 ml-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-text-secondary">Limit Price</label>
                  <span className="text-sm font-mono font-semibold text-cyan-400">
                    ${(config.limit_entry_price ?? 0.70).toFixed(2)}
                  </span>
                </div>
                <Slider
                  min={50}
                  max={Math.max(51, Math.round(config.entry_share_price * 100) - 1)}
                  step={1}
                  value={(config.limit_entry_price ?? 0.70) * 100}
                  onChange={(v) => update('limit_entry_price', v / 100)}
                  formatValue={(v) => `$${(v / 100).toFixed(2)}`}
                />
                <p className="text-xs text-text-tertiary">
                  Buy here instead — saves ${(config.entry_share_price - (config.limit_entry_price ?? 0.70)).toFixed(2)}/share. Holds until filled or window ends.
                </p>
              </div>
            )}
          </div>

          {/* Shares */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-text-primary">Shares per Trade</label>
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

          {/* R:R Ratio */}
          {dynamicStopEnabled && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-text-primary">Target R:R</label>
                <span className="text-sm font-mono font-semibold text-accent-primary">
                  {(config.target_rr_ratio ?? 1.0).toFixed(1)}:1
                </span>
              </div>
              <Slider
                min={5}
                max={20}
                step={1}
                value={(config.target_rr_ratio ?? 1.0) * 10}
                onChange={(v) => update('target_rr_ratio', v / 10)}
                formatValue={(v) => `${(v / 10).toFixed(1)}:1`}
              />
              <p className="text-xs text-text-tertiary">
                1.0 = win equals loss. 1.5 = each win covers 1.5 losses.
              </p>
            </div>
          )}
        </div>)}

        {/* ═══ ADVANCED (collapsed by default, admin only) ═══ */}
        {isAdmin && (
        <div className="border-t border-border-primary pt-4">
          <button
            type="button"
            className="flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors w-full"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            Advanced Settings
          </button>

          {showAdvanced && (
            <div className="mt-4 space-y-5">
              {/* Stop-Loss Settings */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-text-tertiary uppercase tracking-wide">
                  Stop-Loss
                </h4>

                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-text-primary">Dynamic Stop</label>
                  <Switch
                    checked={config.dynamic_stop_enabled ?? true}
                    onChange={(checked) => update('dynamic_stop_enabled', checked)}
                  />
                </div>

                {dynamicStopEnabled ? (
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs text-text-secondary">Min Stop Floor</label>
                        <span className="text-xs font-mono text-text-primary">
                          ${(config.min_stop_floor ?? 0.50).toFixed(2)}
                        </span>
                      </div>
                      <Slider
                        min={30}
                        max={65}
                        step={1}
                        value={(config.min_stop_floor ?? 0.50) * 100}
                        onChange={(v) => update('min_stop_floor', v / 100)}
                        formatValue={(v) => `$${(v / 100).toFixed(2)}`}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs text-text-secondary">Min Acceptable R:R</label>
                        <span className="text-xs font-mono text-text-primary">
                          {(config.min_rr_ratio ?? 0.75).toFixed(2)}:1
                        </span>
                      </div>
                      <Slider
                        min={50}
                        max={150}
                        step={5}
                        value={(config.min_rr_ratio ?? 0.75) * 100}
                        onChange={(v) => update('min_rr_ratio', v / 100)}
                        formatValue={(v) => `${(v / 100).toFixed(2)}:1`}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-text-secondary">Fixed Stop Price</label>
                      <span className="text-xs font-mono text-negative">
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
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-text-secondary">Cooldown After Stop</label>
                    <span className="text-xs font-mono text-text-primary">
                      {fmtTime(config.cooldown_after_stop_seconds)}
                    </span>
                  </div>
                  <Slider
                    min={0}
                    max={isInterval15m ? 1800 : 600}
                    step={30}
                    value={config.cooldown_after_stop_seconds}
                    onChange={(v) => update('cooldown_after_stop_seconds', v)}
                    formatValue={(v) => fmtTime(v)}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-text-secondary">Stop-Loss Debounce Ticks</label>
                    <span className="text-xs font-mono text-text-primary">
                      {config.stop_loss_debounce_ticks ?? 3}
                    </span>
                  </div>
                  <Slider
                    min={1}
                    max={10}
                    step={1}
                    value={config.stop_loss_debounce_ticks ?? 3}
                    onChange={(v) => update('stop_loss_debounce_ticks', v)}
                    formatValue={(v) => `${v}`}
                  />
                  <p className="text-xs text-text-tertiary">
                    Consecutive ticks below stop before triggering — higher = more whipsaw tolerance
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-text-secondary">Hard Floor (cents)</label>
                    <span className="text-xs font-mono text-text-primary">
                      ${(config.stop_loss_hard_floor_cents ?? 0.04).toFixed(2)}
                    </span>
                  </div>
                  <Slider
                    min={1}
                    max={50}
                    step={1}
                    value={(config.stop_loss_hard_floor_cents ?? 0.04) * 100}
                    onChange={(v) => update('stop_loss_hard_floor_cents', v / 100)}
                    formatValue={(v) => `$${(v / 100).toFixed(2)}`}
                  />
                  <p className="text-xs text-text-tertiary">
                    Instant stop if price drops this far below stop in one tick
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-text-secondary">Time Exit (seconds left)</label>
                    <span className="text-xs font-mono text-text-primary">
                      {config.time_exit_seconds ?? 60}s
                    </span>
                  </div>
                  <Slider
                    min={15}
                    max={120}
                    step={5}
                    value={config.time_exit_seconds ?? 60}
                    onChange={(v) => update('time_exit_seconds', v)}
                    formatValue={(v) => `${v}s`}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-text-secondary">Time Exit Threshold</label>
                    <span className="text-xs font-mono text-text-primary">
                      ${(config.time_exit_threshold ?? 0.80).toFixed(2)}
                    </span>
                  </div>
                  <Slider
                    min={50}
                    max={95}
                    step={1}
                    value={(config.time_exit_threshold ?? 0.80) * 100}
                    onChange={(v) => update('time_exit_threshold', v / 100)}
                    formatValue={(v) => `$${(v / 100).toFixed(2)}`}
                  />
                  <p className="text-xs text-text-tertiary">
                    Close position if below this price with less than time exit seconds remaining
                  </p>
                </div>
              </div>

              {/* Take-Profit Settings */}
              <div className="space-y-3 border-t border-border-primary/50 pt-3">
                <h4 className="text-xs font-semibold text-text-tertiary uppercase tracking-wide">
                  Take-Profit
                </h4>

                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-text-primary">Take-Profit Exit</label>
                  <Switch
                    checked={config.take_profit_enabled ?? false}
                    onChange={(checked) => update('take_profit_enabled', checked)}
                  />
                </div>

                {(config.take_profit_enabled ?? false) && (
                  <div className="space-y-2 pl-1 border-l-2 border-emerald-500/30 ml-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-text-secondary">Profit Delta ($ gain per share)</label>
                      <span className="text-xs font-mono font-semibold text-emerald-400">
                        +${(config.take_profit_delta ?? (isInterval15m ? 0.12 : 0.10)).toFixed(2)}
                      </span>
                    </div>
                    <Slider
                      min={5}
                      max={25}
                      step={1}
                      value={(config.take_profit_delta ?? (isInterval15m ? 0.12 : 0.10)) * 100}
                      onChange={(v) => update('take_profit_delta', v / 100)}
                      formatValue={(v) => `+$${(v / 100).toFixed(2)}`}
                    />
                    <p className="text-xs text-text-tertiary">
                      Exits position early when share price rises by this delta above entry price (e.g. entry $0.80 + $0.10 = sell at $0.90)
                    </p>
                  </div>
                )}
              </div>

              {/* Entry Filters */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-text-tertiary uppercase tracking-wide">
                  Entry Filters
                </h4>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-text-secondary">Max Entry Price (slippage cap)</label>
                    <span className="text-xs font-mono text-text-primary">
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

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-text-secondary">Min {distLabel}</label>
                    <span className="text-xs font-mono text-text-primary">
                      {distRange.format(config.min_price_distance)}
                    </span>
                  </div>
                  {marketType.includes('doge') ? (
                    <input
                      type="number"
                      step="any"
                      min={distRange.min}
                      max={distRange.max}
                      value={config.min_price_distance}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value);
                        if (!isNaN(v)) update('min_price_distance', v);
                      }}
                      className="w-full px-3 py-2 bg-bg-tertiary border border-border-primary rounded-lg text-sm font-mono text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
                    />
                  ) : (
                    <Slider
                      min={distRange.min * distRange.scale}
                      max={distRange.max * distRange.scale}
                      step={distRange.step * distRange.scale}
                      value={config.min_price_distance * distRange.scale}
                      onChange={(v) => update('min_price_distance', v / distRange.scale)}
                      formatValue={(v) => distRange.format(v / distRange.scale)}
                    />
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-xs text-text-secondary">MQS Filter</label>
                  <Switch
                    checked={config.mqs_enabled}
                    onChange={(checked) => update('mqs_enabled', checked)}
                  />
                </div>
                {config.mqs_enabled && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-text-secondary">MQS Threshold</label>
                      <span className="text-xs font-mono text-text-primary">
                        {(config.mqs_threshold * 100).toFixed(0)}%
                      </span>
                    </div>
                    <Slider
                      min={30}
                      max={90}
                      step={5}
                      value={config.mqs_threshold * 100}
                      onChange={(v) => update('mqs_threshold', v / 100)}
                      formatValue={(v) => `${v}%`}
                    />
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <label className="text-xs text-text-secondary">Kronos Volatility Gate</label>
                  <Switch
                    checked={config.volatility_gate_enabled}
                    onChange={(checked) => update('volatility_gate_enabled', checked)}
                  />
                </div>
                {config.volatility_gate_enabled && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-text-secondary">Min Relative Spread</label>
                      <span className="text-xs font-mono text-text-primary">
                        {(config.min_kronos_spread * 10000).toFixed(1)} bps
                      </span>
                    </div>
                    <Slider
                      min={1}
                      max={10}
                      step={1}
                      value={config.min_kronos_spread * 10000}
                      onChange={(v) => update('min_kronos_spread', v / 10000)}
                      formatValue={(v) => `${v.toFixed(1)} bps`}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-text-secondary">FOK Buy Buffer</label>
                    <span className="text-xs font-mono text-text-primary">
                      ${(config.fok_buffer_cents ?? 0.03).toFixed(2)}
                    </span>
                  </div>
                  <Slider
                    min={1}
                    max={10}
                    step={1}
                    value={(config.fok_buffer_cents ?? 0.03) * 100}
                    onChange={(v) => update('fok_buffer_cents', v / 100)}
                    formatValue={(v) => `$${(v / 100).toFixed(2)}`}
                  />
                  <p className="text-xs text-text-tertiary">
                    Extra cents above ask for BUY FOK orders — higher = more fills, lower = less overpay
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-text-secondary">FOK Sell Buffer</label>
                    <span className="text-xs font-mono text-text-primary">
                      ${(config.sell_buffer_cents ?? 0.01).toFixed(2)}
                    </span>
                  </div>
                  <Slider
                    min={1}
                    max={5}
                    step={1}
                    value={(config.sell_buffer_cents ?? 0.01) * 100}
                    onChange={(v) => update('sell_buffer_cents', v / 100)}
                    formatValue={(v) => `$${(v / 100).toFixed(2)}`}
                  />
                  <p className="text-xs text-text-tertiary">
                    Cents below market for SELL FOK orders (SL/TP exits) — lower preserves more profit
                  </p>
                </div>
              </div>

              {/* Limits */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-text-tertiary uppercase tracking-wide">
                  Limits
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-text-secondary">Max Daily</label>
                      <input
                        type="number"
                        min={1}
                        step={1}
                        value={config.max_daily_trades}
                        onChange={(e) => {
                          const v = parseInt(e.target.value);
                          if (!isNaN(v) && v >= 1) update('max_daily_trades', v);
                        }}
                        className="w-20 px-2 py-1 text-right text-xs font-mono bg-bg-tertiary border border-border-primary rounded-md text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
                      />
                    </div>
                    <Slider
                      min={1}
                      max={Math.max(500, config.max_daily_trades)}
                      step={10}
                      value={config.max_daily_trades}
                      onChange={(v) => update('max_daily_trades', v)}
                      formatValue={(v) => `${v}`}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-text-secondary">Max Concurrent</label>
                      <input
                        type="number"
                        min={1}
                        step={1}
                        value={config.max_concurrent}
                        onChange={(e) => {
                          const v = parseInt(e.target.value);
                          if (!isNaN(v) && v >= 1) update('max_concurrent', v);
                        }}
                        className="w-16 px-2 py-1 text-right text-xs font-mono bg-bg-tertiary border border-border-primary rounded-md text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
                      />
                    </div>
                    <Slider
                      min={1}
                      max={100}
                      step={1}
                      value={config.max_concurrent}
                      onChange={(v) => update('max_concurrent', v)}
                      formatValue={(v) => `${v}`}
                    />
                  </div>
                </div>

              </div>

              {/* Watch Window */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-text-tertiary uppercase tracking-wide">
                  Watch Window
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-text-secondary">Start</label>
                      <span className="text-xs font-mono text-text-primary">T+{fmtTime(config.watch_start_seconds)}</span>
                    </div>
                    <Slider
                      min={10}
                      max={isInterval15m ? 840 : 270}
                      step={10}
                      value={config.watch_start_seconds}
                      onChange={(v) => update('watch_start_seconds', v)}
                      formatValue={(v) => `T+${fmtTime(v)}`}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-text-secondary">End</label>
                      <span className="text-xs font-mono text-text-primary">T+{fmtTime(config.watch_end_seconds)}</span>
                    </div>
                    <Slider
                      min={60}
                      max={isInterval15m ? 890 : 290}
                      step={10}
                      value={config.watch_end_seconds}
                      onChange={(v) => update('watch_end_seconds', v)}
                      formatValue={(v) => `T+${fmtTime(v)}`}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        )}
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
