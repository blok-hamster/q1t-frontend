'use client';

import { useState, useEffect, useId } from 'react';
import { Card, CardHeader, CardBody, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { adminApi, settingsApi } from '@/lib/api';
import { formatEdgeBadge } from '@/lib/mid-market-presets';
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

function calculatePolymarketTakerFee(shares: number, price: number): number {
  if (price <= 0 || price >= 1) return 0;
  return Math.round(shares * 0.07 * price * (1.0 - price) * 10000) / 10000;
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
  'bnb-5m': 'BNB 5-Minute',
  'xrp-5m': 'XRP 5-Minute',
  'hype-5m': 'HYPE 5-Minute',
};

const MARKET_SIGMA_DEFAULTS: Record<string, number> = {
  'btc-5m': 0.0006,
  'btc-15m': 0.0006,
  'eth-5m': 0.0007,
  'eth-15m': 0.0007,
  'sol-5m': 0.0011,
  'sol-15m': 0.0011,
  'doge-5m': 0.0015,
  'doge-15m': 0.0015,
  'bnb-5m': 0.00055,
  'xrp-5m': 0.00065,
  'hype-5m': 0.0008,
};

const DEFAULT_CONFIG: MarketConfig = {
  market_type: '',
  enabled: false,
  entry_share_price: 0.55,
  max_entry_price: 0.85,
  stop_loss_price: 0.42,
  num_shares: 25,
  max_daily_trades: 200,
  max_concurrent: 1,
  cooldown_after_stop_seconds: 180,
  watch_start_seconds: 30,
  watch_end_seconds: 270,
  fair_value_enabled: true,
  min_fair_value_edge: 0.99,
  fair_value_sigma: 0.0006,
  fair_value_stop_prob: 0.30,
  fair_value_stop_bid: 0.42,
  entry_min_elapsed_seconds: 90,
  entry_max_elapsed_seconds: 220,
  first_impression_only: false,
  sigma_vol_multiplier: 1.35,
  sigma_min_floor_ratio: 1.2,
  high_conviction_z: 1.0,
  high_conviction_min_edge: 0.05,
  high_conviction_max_ask: 0.85,
  volatility_gate_enabled: false,
  min_kronos_spread: 0.0003,
  fade_enabled: false,
  fade_vol_ceiling: 0.0002,
  fade_trigger_price: 0.82,
  fade_mqs_max: 0.45,
  fade_num_shares: 50,
  fade_stop_loss: 0.08,
  stop_loss_debounce_ticks: 3,
  fok_buffer_cents: 0.03,
  sell_buffer_cents: 0.01,
  blocked_hours_utc: [],
  max_losses_per_window: 1,
  entry_dedup_seconds: 4,
  reversal_fade_suppress_enabled: true,
};

function getTimeframeDefaults(marketType: string): Partial<MarketConfig> {
  const sigma = MARKET_SIGMA_DEFAULTS[marketType] ?? 0.0006;
  if (marketType.includes('15m')) {
    return {
      watch_start_seconds: 60,
      watch_end_seconds: 870,
      entry_min_elapsed_seconds: 60,
      entry_max_elapsed_seconds: 700,
      cooldown_after_stop_seconds: 300,
      fair_value_sigma: sigma,
    };
  }
  return {
    watch_start_seconds: 30,
    watch_end_seconds: 270,
    entry_min_elapsed_seconds: 90,
    entry_max_elapsed_seconds: 220,
    cooldown_after_stop_seconds: 180,
    fair_value_sigma: sigma,
  };
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
  onSave,
  isAdmin = false,
}: MarketConfigPanelProps) {
  const baseId = useId();
  const [config, setConfig] = useState<MarketConfig>({
    ...DEFAULT_CONFIG,
    ...getTimeframeDefaults(marketType),
    ...initialConfig,
    market_type: marketType,
  });
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    const tfDefaults = getTimeframeDefaults(marketType);
    if (initialConfig) {
      setConfig({ ...DEFAULT_CONFIG, ...tfDefaults, ...initialConfig, market_type: marketType });
      setHasChanges(false);
    } else {
      setConfig({
        ...DEFAULT_CONFIG,
        ...tfDefaults,
        market_type: marketType,
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
      setConfig({ ...DEFAULT_CONFIG, ...tfDefaults, ...initialConfig, market_type: marketType });
    } else {
      setConfig({
        ...DEFAULT_CONFIG,
        ...tfDefaults,
        market_type: marketType,
      });
    }
    setHasChanges(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { market_type, ...updates } = config;
      const res = await settingsApi.updateMarketConfig(marketType, updates);
      let latestAdminConfig: Partial<MarketConfig> = {};
      if (isAdmin) {
        // Keep num_shares & max_concurrent strictly per-user even when saving from an admin card
        const { num_shares: _ns, max_concurrent: _mc, ...adminUpdates } = updates;
        const adminRes = await adminApi.updateMarketConfig(marketType, adminUpdates);
        latestAdminConfig = adminRes?.config || {};
      }
      toast.success(`${MARKET_LABELS[marketType] || marketType} config saved`);
      setHasChanges(false);
      const merged = {
        ...config,
        ...res.marketConfig,
        ...latestAdminConfig,
        ...(res.marketConfig?.num_shares !== undefined ? { num_shares: res.marketConfig.num_shares } : {}),
        ...(res.marketConfig?.max_concurrent !== undefined ? { max_concurrent: res.marketConfig.max_concurrent } : {}),
        market_type: marketType,
      };
      setConfig(merged);
      onSave?.(merged);
    } catch (error: any) {
      toast.error(error.message || 'Failed to save market config');
    } finally {
      setSaving(false);
    }
  };

  const isInterval15m = marketType.includes('15m');

  // Model D Fee-Accurate Economics (Hold winners to $1.00 resolution = $0.00 exit fee;
  // exit losers on debounced Fair-Value collapse <= fvStopBid with taker fee).
  const minAsk = config.entry_share_price ?? 0.65;
  const maxAsk = config.max_entry_price ?? 0.85;
  const refAsk = Math.round(((minAsk + maxAsk) / 2) * 100) / 100;
  const fvStopProb = config.fair_value_stop_prob ?? 0.30;
  const fvStopBid = config.fair_value_stop_bid ?? 0.42;
  const minFvEdge = config.min_fair_value_edge ?? 0.04;
  const sigma = config.fair_value_sigma ?? MARKET_SIGMA_DEFAULTS[marketType] ?? 0.0006;

  const entryFee = calculatePolymarketTakerFee(config.num_shares, refAsk);
  const stopExitFee = calculatePolymarketTakerFee(config.num_shares, fvStopBid);
  const profitPerWin = Math.max(0, config.num_shares * (1.0 - refAsk) - entryFee);
  const maxLossPerStop = Math.max(0, config.num_shares * (refAsk - fvStopBid) + entryFee + stopExitFee);
  const breakEvenWinRate =
    profitPerWin + maxLossPerStop > 0
      ? maxLossPerStop / (profitPerWin + maxLossPerStop)
      : 0;

  return (
    <Card className="font-mono text-xs select-none">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings className="h-5 w-5 text-accent-primary" aria-hidden="true" />
            <h3 className="text-lg font-semibold text-text-primary">
              {MARKET_LABELS[marketType] || marketType}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="success">
              {formatEdgeBadge(config)}
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
        {/* ═══ MODEL D FEE-ACCURATE ECONOMICS ═══ */}
        <div className="p-3.5 bg-accent-muted border border-accent-primary/30 rounded-lg">
          <div className="grid grid-cols-4 gap-2 text-xs">
            <div>
              <p className="text-text-tertiary text-[10px] mb-1">Ask Band</p>
              <p className="font-mono font-semibold text-text-primary tabular-nums">
                ${minAsk.toFixed(2)}–${maxAsk.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-text-tertiary text-[10px] mb-1">FV Stop</p>
              <p className="font-mono font-semibold text-negative tabular-nums">
                &lt;{(fvStopProb * 100).toFixed(0)}% / ${fvStopBid.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-text-tertiary text-[10px] mb-1">Net Win ($1)</p>
              <p className="font-mono font-semibold text-positive tabular-nums">
                +${profitPerWin.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-text-tertiary text-[10px] mb-1">Net Stop</p>
              <p className="font-mono font-semibold text-negative tabular-nums">
                -${maxLossPerStop.toFixed(2)}
              </p>
            </div>
          </div>
          <div className="border-t border-accent-primary/20 mt-3 pt-2 flex justify-between text-[11px] gap-2">
            <span className="text-text-tertiary">
              Ref ${refAsk.toFixed(2)} fee:{' '}
              <span className="font-mono font-semibold text-text-primary tabular-nums">
                ${entryFee.toFixed(2)}
              </span>{' '}
              ($0 win exit)
            </span>
            <span className="text-text-tertiary">
              Break-even WR:{' '}
              <span className="font-mono font-semibold text-text-primary tabular-nums">
                {(breakEvenWinRate * 100).toFixed(0)}%
              </span>
            </span>
          </div>
        </div>

        {/* ═══ USER CONTROLS (non-admin) ═══ */}
        {!isAdmin && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor={`${baseId}-user-shares`} className="text-sm font-medium text-text-primary">
                  Shares per Trade
                </label>
                <span className="text-sm font-mono font-semibold text-accent-primary tabular-nums">
                  {config.num_shares}
                </span>
              </div>
              <Slider
                id={`${baseId}-user-shares`}
                name="num_shares"
                showValue={false}
                min={1}
                max={200}
                step={1}
                value={config.num_shares}
                onChange={(v) => update('num_shares', v)}
                aria-describedby={`${baseId}-user-shares-hint`}
              />
              <p id={`${baseId}-user-shares-hint`} className="text-xs text-text-tertiary">
                Winning positions hold to $1.00 resolution with 0% exit fee.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor={`${baseId}-user-max-conc`} className="text-sm font-medium text-text-primary">
                  Max Concurrent Positions
                </label>
                <span className="text-sm font-mono font-semibold text-accent-primary tabular-nums">
                  {config.max_concurrent}
                </span>
              </div>
              <Slider
                id={`${baseId}-user-max-conc`}
                name="max_concurrent"
                showValue={false}
                min={1}
                max={10}
                step={1}
                value={config.max_concurrent}
                onChange={(v) => update('max_concurrent', v)}
                aria-describedby={`${baseId}-user-max-conc-hint`}
              />
              <p id={`${baseId}-user-max-conc-hint`} className="text-xs text-text-tertiary">
                Maximum open positions for this market at the same time.
              </p>
            </div>
          </div>
        )}

        {/* ═══ MODEL D CORE PARAMETERS (admin) ═══ */}
        {isAdmin && (
          <div className="space-y-4">
            {/* Time Gate */}
            <div className="space-y-2">
              <span className="text-sm font-medium text-text-primary block">Time Gate (UTC)</span>
              <div className="grid grid-cols-12 gap-1" role="group" aria-label="Blocked UTC trading hours">
                {Array.from({ length: 24 }, (_, h) => {
                  const blocked = config.blocked_hours_utc || [];
                  const isBlocked = blocked.includes(h);
                  const hourStr = String(h).padStart(2, '0');
                  return (
                    <button
                      key={h}
                      type="button"
                      aria-pressed={isBlocked}
                      aria-label={`Block ${hourStr}:00 UTC`}
                      onClick={() => {
                        const current = [...blocked];
                        const updated = isBlocked
                          ? current.filter((x) => x !== h)
                          : [...current, h].sort((a, b) => a - b);
                        update('blocked_hours_utc', updated);
                      }}
                      className={`px-0 py-1.5 text-[10px] font-mono rounded transition-colors ${
                        isBlocked
                          ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                          : 'bg-bg-tertiary text-text-tertiary border border-border-primary hover:border-border-secondary'
                      }`}
                    >
                      {hourStr}
                    </button>
                  );
                })}
              </div>
              {(config.blocked_hours_utc || []).length > 0 && (
                <p className="text-xs font-mono text-red-400">
                  Blocked: {(config.blocked_hours_utc || []).map((h) => `${String(h).padStart(2, '0')}:00`).join(', ')} UTC
                </p>
              )}
              <p className="text-xs text-text-tertiary">No new entries during blocked UTC hours.</p>
            </div>

            {/* Ask Entry Band */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor={`${baseId}-min-ask`} className="text-xs font-medium text-text-primary">
                    Min Ask Price
                  </label>
                  <span className="text-xs font-mono font-semibold text-accent-primary tabular-nums">
                    ${minAsk.toFixed(2)}
                  </span>
                </div>
                <Slider
                  id={`${baseId}-min-ask`}
                  name="entry_share_price"
                  showValue={false}
                  min={50}
                  max={Math.max(51, Math.round(maxAsk * 100) - 2)}
                  step={1}
                  value={Math.round(minAsk * 100)}
                  onChange={(v) => update('entry_share_price', v / 100)}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor={`${baseId}-max-ask`} className="text-xs font-medium text-text-primary">
                    Max Ask Price
                  </label>
                  <span className="text-xs font-mono font-semibold text-accent-primary tabular-nums">
                    ${maxAsk.toFixed(2)}
                  </span>
                </div>
                <Slider
                  id={`${baseId}-max-ask`}
                  name="max_entry_price"
                  showValue={false}
                  min={Math.min(94, Math.round(minAsk * 100) + 2)}
                  max={95}
                  step={1}
                  value={Math.round(maxAsk * 100)}
                  onChange={(v) => update('max_entry_price', v / 100)}
                />
              </div>
            </div>

            {/* Entry Trigger Mode: z-Score Conviction (v4) vs Pure Post-Fee Edge */}
            {minFvEdge >= 0.95 ? (
              <div className="space-y-3 p-3 bg-bg-tertiary/60 border border-border-primary rounded-md">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-accent-primary uppercase tracking-wide">
                    z-Score Conviction Gate (v4)
                  </span>
                  <button
                    type="button"
                    onClick={() => update('min_fair_value_edge', 0.04)}
                    className="text-[10px] text-text-tertiary hover:text-text-primary underline cursor-pointer"
                  >
                    Use Edge Mode
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label htmlFor={`${baseId}-conv-z`} className="text-[11px] text-text-secondary">
                        Min z
                      </label>
                      <span className="text-[11px] font-mono font-semibold text-positive tabular-nums">
                        {(config.high_conviction_z ?? 1.0).toFixed(1)}
                      </span>
                    </div>
                    <Slider
                      id={`${baseId}-conv-z`}
                      name="high_conviction_z"
                      showValue={false}
                      min={5}
                      max={25}
                      step={1}
                      value={Math.round((config.high_conviction_z ?? 1.0) * 10)}
                      onChange={(v) => update('high_conviction_z', v / 10)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label htmlFor={`${baseId}-conv-edge`} className="text-[11px] text-text-secondary">
                        Min Edge
                      </label>
                      <span className="text-[11px] font-mono font-semibold text-positive tabular-nums">
                        +{Math.round((config.high_conviction_min_edge ?? 0.05) * 100)}¢
                      </span>
                    </div>
                    <Slider
                      id={`${baseId}-conv-edge`}
                      name="high_conviction_min_edge"
                      showValue={false}
                      min={0}
                      max={15}
                      step={1}
                      value={Math.round((config.high_conviction_min_edge ?? 0.05) * 100)}
                      onChange={(v) => update('high_conviction_min_edge', v / 100)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label htmlFor={`${baseId}-conv-ask`} className="text-[11px] text-text-secondary">
                        Conv Max
                      </label>
                      <span className="text-[11px] font-mono font-semibold text-accent-primary tabular-nums">
                        ${(config.high_conviction_max_ask ?? maxAsk).toFixed(2)}
                      </span>
                    </div>
                    <Slider
                      id={`${baseId}-conv-ask`}
                      name="high_conviction_max_ask"
                      showValue={false}
                      min={55}
                      max={95}
                      step={1}
                      value={Math.round((config.high_conviction_max_ask ?? maxAsk) * 100)}
                      onChange={(v) => update('high_conviction_max_ask', v / 100)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label htmlFor={`${baseId}-entry-min-sec`} className="text-[11px] text-text-secondary">
                        Entry Start
                      </label>
                      <span className="text-[11px] font-mono text-text-primary tabular-nums">
                        {config.entry_min_elapsed_seconds ?? 90}s
                      </span>
                    </div>
                    <Slider
                      id={`${baseId}-entry-min-sec`}
                      name="entry_min_elapsed_seconds"
                      showValue={false}
                      min={15}
                      max={isInterval15m ? 600 : 180}
                      step={5}
                      value={config.entry_min_elapsed_seconds ?? 90}
                      onChange={(v) => update('entry_min_elapsed_seconds', v)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label htmlFor={`${baseId}-entry-max-sec`} className="text-[11px] text-text-secondary">
                        Entry End
                      </label>
                      <span className="text-[11px] font-mono text-text-primary tabular-nums">
                        {config.entry_max_elapsed_seconds ?? 220}s
                      </span>
                    </div>
                    <Slider
                      id={`${baseId}-entry-max-sec`}
                      name="entry_max_elapsed_seconds"
                      showValue={false}
                      min={60}
                      max={isInterval15m ? 870 : 270}
                      step={5}
                      value={config.entry_max_elapsed_seconds ?? 220}
                      onChange={(v) => update('entry_max_elapsed_seconds', v)}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor={`${baseId}-fv-edge`} className="text-sm font-medium text-text-primary">
                    Min Post-Fee Edge
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => update('min_fair_value_edge', 0.99)}
                      className="text-[10px] text-text-tertiary hover:text-accent-primary underline cursor-pointer"
                    >
                      Use z-Gate
                    </button>
                    <span className="text-sm font-mono font-semibold text-positive tabular-nums">
                      +{(minFvEdge * 100).toFixed(1)}¢
                    </span>
                  </div>
                </div>
                <Slider
                  id={`${baseId}-fv-edge`}
                  name="min_fair_value_edge"
                  showValue={false}
                  min={10}
                  max={120}
                  step={5}
                  value={Math.min(120, Math.round(minFvEdge * 1000))}
                  onChange={(v) => update('min_fair_value_edge', v / 1000)}
                  aria-describedby={`${baseId}-fv-edge-hint`}
                />
                <p id={`${baseId}-fv-edge-hint`} className="text-xs text-text-tertiary">
                  Requires Black-Scholes fair probability minus ask minus Polymarket taker fee to exceed this threshold.
                </p>
              </div>
            )}

            {/* Shares */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor={`${baseId}-admin-shares`} className="text-sm font-medium text-text-primary">
                  Shares per Trade
                </label>
                <span className="text-sm font-mono font-semibold text-accent-primary tabular-nums">
                  {config.num_shares}
                </span>
              </div>
              <Slider
                id={`${baseId}-admin-shares`}
                name="num_shares"
                showValue={false}
                min={1}
                max={200}
                step={1}
                value={config.num_shares}
                onChange={(v) => update('num_shares', v)}
              />
            </div>
          </div>
        )}

        {/* ═══ ADVANCED MODEL D & RISK SETTINGS (admin) ═══ */}
        {isAdmin && (
          <div className="border-t border-border-primary pt-4">
            <button
              type="button"
              aria-expanded={showAdvanced}
              aria-controls={`${baseId}-advanced-panel`}
              className="flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors w-full"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              {showAdvanced ? (
                <ChevronDown className="h-4 w-4" aria-hidden="true" />
              ) : (
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              )}
              Advanced Model D &amp; Risk Controls
            </button>

            {showAdvanced && (
              <div id={`${baseId}-advanced-panel`} className="mt-4 space-y-5">
                {/* Fair-Value Pricing & Collapse Stop */}
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-text-tertiary uppercase tracking-wide">
                    Fair-Value Pricing &amp; Collapse Stop
                  </h4>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label htmlFor={`${baseId}-sigma`} className="text-xs text-text-secondary">
                        1-Minute Volatility Sigma
                      </label>
                      <span className="text-xs font-mono text-text-primary tabular-nums">
                        {(sigma * 10000).toFixed(1)} bps ({(sigma * 100).toFixed(3)}%)
                      </span>
                    </div>
                    <Slider
                      id={`${baseId}-sigma`}
                      name="fair_value_sigma"
                      showValue={false}
                      min={2}
                      max={30}
                      step={0.5}
                      value={sigma * 10000}
                      onChange={(v) => update('fair_value_sigma', v / 10000)}
                      aria-describedby={`${baseId}-sigma-hint`}
                    />
                    <p id={`${baseId}-sigma-hint`} className="text-xs text-text-tertiary">
                      Per-minute spot volatility used in Black-Scholes binary option fair-value calculation.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label htmlFor={`${baseId}-stop-prob`} className="text-xs text-text-secondary">
                          Stop Prob (&lt; P_fair)
                        </label>
                        <span className="text-xs font-mono text-negative tabular-nums">
                          {(fvStopProb * 100).toFixed(0)}%
                        </span>
                      </div>
                      <Slider
                        id={`${baseId}-stop-prob`}
                        name="fair_value_stop_prob"
                        showValue={false}
                        min={15}
                        max={45}
                        step={1}
                        value={Math.round(fvStopProb * 100)}
                        onChange={(v) => update('fair_value_stop_prob', v / 100)}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label htmlFor={`${baseId}-stop-bid`} className="text-xs text-text-secondary">
                          Stop Bid Ceiling
                        </label>
                        <span className="text-xs font-mono text-negative tabular-nums">
                          ${fvStopBid.toFixed(2)}
                        </span>
                      </div>
                      <Slider
                        id={`${baseId}-stop-bid`}
                        name="fair_value_stop_bid"
                        showValue={false}
                        min={20}
                        max={60}
                        step={1}
                        value={Math.round(fvStopBid * 100)}
                        onChange={(v) => update('fair_value_stop_bid', v / 100)}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-text-tertiary">
                    Exits early only when both fair probability falls below {(fvStopProb * 100).toFixed(0)}% and executable bid is at or below ${fvStopBid.toFixed(2)} for {config.stop_loss_debounce_ticks ?? 3} consecutive ticks.
                  </p>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label htmlFor={`${baseId}-debounce`} className="text-xs text-text-secondary">
                        Stop Debounce Ticks
                      </label>
                      <span className="text-xs font-mono text-text-primary tabular-nums">
                        {config.stop_loss_debounce_ticks ?? 3}
                      </span>
                    </div>
                    <Slider
                      id={`${baseId}-debounce`}
                      name="stop_loss_debounce_ticks"
                      showValue={false}
                      min={1}
                      max={8}
                      step={1}
                      value={config.stop_loss_debounce_ticks ?? 3}
                      onChange={(v) => update('stop_loss_debounce_ticks', v)}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label htmlFor={`${baseId}-cooldown`} className="text-xs text-text-secondary">
                        Cooldown After Stop
                      </label>
                      <span className="text-xs font-mono text-text-primary tabular-nums">
                        {fmtTime(config.cooldown_after_stop_seconds)}
                      </span>
                    </div>
                    <Slider
                      id={`${baseId}-cooldown`}
                      name="cooldown_after_stop_seconds"
                      showValue={false}
                      min={0}
                      max={isInterval15m ? 1800 : 600}
                      step={30}
                      value={config.cooldown_after_stop_seconds}
                      onChange={(v) => update('cooldown_after_stop_seconds', v)}
                    />
                  </div>
                </div>

                {/* Entry Window */}
                <div className="space-y-3 border-t border-border-primary/50 pt-3">
                  <h4 className="text-xs font-semibold text-text-tertiary uppercase tracking-wide">
                    Entry Window
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label htmlFor={`${baseId}-watch-start`} className="text-xs text-text-secondary">
                          Start
                        </label>
                        <span className="text-xs font-mono text-text-primary tabular-nums">
                          T+{fmtTime(config.watch_start_seconds)}
                        </span>
                      </div>
                      <Slider
                        id={`${baseId}-watch-start`}
                        name="watch_start_seconds"
                        showValue={false}
                        min={10}
                        max={isInterval15m ? 840 : 270}
                        step={5}
                        value={config.watch_start_seconds}
                        onChange={(v) => update('watch_start_seconds', v)}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label htmlFor={`${baseId}-watch-end`} className="text-xs text-text-secondary">
                          End
                        </label>
                        <span className="text-xs font-mono text-text-primary tabular-nums">
                          T+{fmtTime(config.watch_end_seconds)}
                        </span>
                      </div>
                      <Slider
                        id={`${baseId}-watch-end`}
                        name="watch_end_seconds"
                        showValue={false}
                        min={60}
                        max={isInterval15m ? 890 : 290}
                        step={5}
                        value={config.watch_end_seconds}
                        onChange={(v) => update('watch_end_seconds', v)}
                      />
                    </div>
                  </div>
                </div>

                {/* Risk & Order Buffers */}
                <div className="space-y-3 border-t border-border-primary/50 pt-3">
                  <h4 className="text-xs font-semibold text-text-tertiary uppercase tracking-wide">
                    Execution &amp; Window Guards
                  </h4>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label htmlFor={`${baseId}-buy-buf`} className="text-xs text-text-secondary">
                          FAK Buy Buffer
                        </label>
                        <span className="text-xs font-mono text-text-primary tabular-nums">
                          ${(config.fok_buffer_cents ?? 0.03).toFixed(2)}
                        </span>
                      </div>
                      <Slider
                        id={`${baseId}-buy-buf`}
                        name="fok_buffer_cents"
                        showValue={false}
                        min={1}
                        max={10}
                        step={1}
                        value={Math.round((config.fok_buffer_cents ?? 0.03) * 100)}
                        onChange={(v) => update('fok_buffer_cents', v / 100)}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label htmlFor={`${baseId}-sell-buf`} className="text-xs text-text-secondary">
                          FAK Sell Buffer
                        </label>
                        <span className="text-xs font-mono text-text-primary tabular-nums">
                          ${(config.sell_buffer_cents ?? 0.01).toFixed(2)}
                        </span>
                      </div>
                      <Slider
                        id={`${baseId}-sell-buf`}
                        name="sell_buffer_cents"
                        showValue={false}
                        min={1}
                        max={5}
                        step={1}
                        value={Math.round((config.sell_buffer_cents ?? 0.01) * 100)}
                        onChange={(v) => update('sell_buffer_cents', v / 100)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label htmlFor={`${baseId}-win-loss`} className="text-xs text-text-secondary">
                          Max Losses / Window
                        </label>
                        <span className="text-xs font-mono text-text-primary tabular-nums">
                          {config.max_losses_per_window ?? 1}
                        </span>
                      </div>
                      <Slider
                        id={`${baseId}-win-loss`}
                        name="max_losses_per_window"
                        showValue={false}
                        min={0}
                        max={5}
                        step={1}
                        value={config.max_losses_per_window ?? 1}
                        onChange={(v) => update('max_losses_per_window', v)}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label htmlFor={`${baseId}-dedup`} className="text-xs text-text-secondary">
                          Entry Dedup Lock
                        </label>
                        <span className="text-xs font-mono text-text-primary tabular-nums">
                          {config.entry_dedup_seconds ?? 4}s
                        </span>
                      </div>
                      <Slider
                        id={`${baseId}-dedup`}
                        name="entry_dedup_seconds"
                        showValue={false}
                        min={0}
                        max={15}
                        step={1}
                        value={config.entry_dedup_seconds ?? 4}
                        onChange={(v) => update('entry_dedup_seconds', v)}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs font-medium text-text-primary">Reversal-Fade Suppression</span>
                    <Switch
                      checked={config.reversal_fade_suppress_enabled ?? true}
                      onChange={(checked) => update('reversal_fade_suppress_enabled', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-secondary">Kronos Volatility Gate</span>
                    <Switch
                      checked={config.volatility_gate_enabled}
                      onChange={(checked) => update('volatility_gate_enabled', checked)}
                    />
                  </div>
                  {config.volatility_gate_enabled && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label htmlFor={`${baseId}-kronos`} className="text-xs text-text-secondary">
                          Min Relative Spread
                        </label>
                        <span className="text-xs font-mono text-text-primary tabular-nums">
                          {(config.min_kronos_spread * 10000).toFixed(1)} bps
                        </span>
                      </div>
                      <Slider
                        id={`${baseId}-kronos`}
                        name="min_kronos_spread"
                        showValue={false}
                        min={1}
                        max={10}
                        step={1}
                        value={config.min_kronos_spread * 10000}
                        onChange={(v) => update('min_kronos_spread', v / 10000)}
                      />
                    </div>
                  )}
                </div>

                {/* Limits */}
                <div className="space-y-3 border-t border-border-primary/50 pt-3">
                  <h4 className="text-xs font-semibold text-text-tertiary uppercase tracking-wide">
                    Position &amp; Daily Limits
                  </h4>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label htmlFor={`${baseId}-max-daily`} className="text-xs text-text-secondary">
                          Max Daily
                        </label>
                        <input
                          id={`${baseId}-max-daily`}
                          name="max_daily_trades"
                          type="number"
                          min={1}
                          step={1}
                          value={config.max_daily_trades}
                          onChange={(e) => {
                            const v = parseInt(e.target.value, 10);
                            if (!isNaN(v) && v >= 1) update('max_daily_trades', v);
                          }}
                          className="w-20 px-2 py-1 text-right text-xs font-mono bg-bg-tertiary border border-border-primary rounded-md text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
                        />
                      </div>
                      <Slider
                        showValue={false}
                        min={1}
                        max={Math.max(500, config.max_daily_trades)}
                        step={10}
                        value={config.max_daily_trades}
                        onChange={(v) => update('max_daily_trades', v)}
                        aria-label="Max daily trades slider"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label htmlFor={`${baseId}-max-conc-admin`} className="text-xs text-text-secondary">
                          Max Concurrent
                        </label>
                        <input
                          id={`${baseId}-max-conc-admin`}
                          name="max_concurrent"
                          type="number"
                          min={1}
                          step={1}
                          value={config.max_concurrent}
                          onChange={(e) => {
                            const v = parseInt(e.target.value, 10);
                            if (!isNaN(v) && v >= 1) update('max_concurrent', v);
                          }}
                          className="w-16 px-2 py-1 text-right text-xs font-mono bg-bg-tertiary border border-border-primary rounded-md text-text-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
                        />
                      </div>
                      <Slider
                        showValue={false}
                        min={1}
                        max={20}
                        step={1}
                        value={config.max_concurrent}
                        onChange={(v) => update('max_concurrent', v)}
                        aria-label="Max concurrent positions slider"
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
              <RotateCcw className="h-4 w-4 mr-2" aria-hidden="true" />
              Reset
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleSave}
              loading={saving}
              className="ml-auto"
            >
              <Save className="h-4 w-4 mr-2" aria-hidden="true" />
              Save Changes
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
