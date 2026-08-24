'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardBody, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { settingsApi } from '@/lib/api';
import { toast } from '@/context/toast-context';
import { Shield, Save, RotateCcw, ChevronDown, ChevronRight } from 'lucide-react';
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

const DEFAULT_SCALP_CONFIG: Partial<MarketConfig> = {
  scalp_enabled: true,
  scalp_max_entry: 0.40,
  scalp_min_entry: 0.10,
  scalp_tp_delta: 0.15,
  scalp_sl_delta: 0.10,
  scalp_max_hold_seconds: 240,
  num_shares: 20,
  max_concurrent: 1,
  scalp_watch_start: 30,
  scalp_watch_end: 180,
  scalp_dynamic_stop_enabled: true,
  scalp_sl_pct: 0.40,
  scalp_min_sl_delta: 0.06,
  scalp_min_rr: 1.2,
  blocked_hours_utc: [],
};

interface ScalpConfigPanelProps {
  marketType: string;
  initialConfig?: MarketConfig | null;
  userSelectedMarkets?: string[];
  isScalpActive?: boolean;
  onToggleMarketActive?: (marketId: string) => void;
  onSave?: (config: MarketConfig) => void;
  isAdmin?: boolean;
}

export function ScalpConfigPanel({
  marketType,
  initialConfig,
  userSelectedMarkets = [],
  isScalpActive = false,
  onToggleMarketActive,
  onSave,
  isAdmin = false,
}: ScalpConfigPanelProps) {
  const isInterval15m = marketType.includes('15m');
  const defaults = {
    ...DEFAULT_SCALP_CONFIG,
    scalp_max_hold_seconds: isInterval15m ? 840 : 240,
    scalp_watch_end: isInterval15m ? 600 : 180,
  };

  const [config, setConfig] = useState<MarketConfig>({
    ...defaults,
    ...initialConfig,
    market_type: marketType,
  } as MarketConfig);

  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (initialConfig) {
      setConfig({ ...defaults, ...initialConfig, market_type: marketType } as MarketConfig);
      setHasChanges(false);
    } else {
      setConfig({ ...defaults, market_type: marketType } as MarketConfig);
      setHasChanges(false);
    }
  }, [marketType, initialConfig]);

  const update = (key: keyof MarketConfig, value: number | boolean | number[]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleReset = () => {
    if (initialConfig) {
      setConfig({ ...defaults, ...initialConfig, market_type: marketType } as MarketConfig);
    } else {
      setConfig({ ...defaults, market_type: marketType } as MarketConfig);
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
      const merged = { ...config, ...res.marketConfig, market_type: marketType };
      setConfig(merged);
      onSave?.(merged);
    } catch (error: any) {
      toast.error(error.message || 'Failed to save scalp config');
    } finally {
      setSaving(false);
    }
  };

  // Trade Economics Calculations
  const userShares = config.num_shares || 20;
  const maxEntry = config.scalp_max_entry ?? 0.40;
  const tpDelta = config.scalp_tp_delta ?? 0.15;
  const isDynamicStop = config.scalp_dynamic_stop_enabled !== false;

  let estimatedSlDelta: number;
  if (isDynamicStop) {
    const slPct = config.scalp_sl_pct ?? 0.40;
    const minSlFloor = config.scalp_min_sl_delta ?? 0.06;
    // Estimated SL based on average max entry
    estimatedSlDelta = Math.max(minSlFloor, maxEntry * slPct);
  } else {
    estimatedSlDelta = config.scalp_sl_delta ?? 0.10;
  }

  const costPerTrade = userShares * maxEntry;
  const profitPerWin = userShares * tpDelta;
  const maxLossPerStop = userShares * estimatedSlDelta;
  const rrRatio = estimatedSlDelta > 0 ? tpDelta / estimatedSlDelta : 0;
  const breakEvenWinRate =
    profitPerWin + maxLossPerStop > 0
      ? (maxLossPerStop / (profitPerWin + maxLossPerStop)) * 100
      : 0;

  return (
    <Card className="font-mono text-xs select-none">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-[#20B2AA]" />
            <div>
              <h3 className="text-lg font-semibold text-text-primary">
                {MARKET_LABELS[marketType] || marketType} — Scalp
              </h3>
              <p className="text-xs text-text-tertiary mt-0.5">
                Mean-reversion: buy cheap trailing side, exit on TP/SL
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={
                rrRatio >= 1.2 ? 'success' : rrRatio >= 1.0 ? 'warning' : 'error'
              }
            >
              R:R {rrRatio.toFixed(1)}:1
            </Badge>
            {isAdmin ? (
              <Switch
                checked={config.scalp_enabled ?? false}
                onChange={(checked) => update('scalp_enabled', checked)}
              />
            ) : config.scalp_enabled === false ? (
              <Badge variant="neutral">Disabled by Admin</Badge>
            ) : (
              <Badge variant="success">Active</Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardBody className="space-y-5 max-h-[420px] overflow-y-auto scrollbar-thin pr-1">
        {/* ═══ TRADE ECONOMICS PREVIEW (Visible to all users) ═══ */}
        <div className="p-4 bg-[#20B2AA]/10 border border-[#20B2AA]/30 rounded-lg">
          <p className="text-[10px] font-semibold text-[#20B2AA] uppercase tracking-wide mb-2">
            Trade Economics Preview {isDynamicStop ? '(Dynamic SL)' : '(Fixed SL)'}
          </p>
          <div className="grid grid-cols-4 gap-3 text-xs">
            <div>
              <p className="text-text-tertiary text-[10px] mb-1">Max Cost:</p>
              <p className="font-mono font-semibold text-text-primary">
                ${costPerTrade.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-text-tertiary text-[10px] mb-1">TP Profit:</p>
              <p className="font-mono font-semibold text-positive">
                +${profitPerWin.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-text-tertiary text-[10px] mb-1">SL Loss:</p>
              <p className="font-mono font-semibold text-negative">
                -${maxLossPerStop.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-text-tertiary text-[10px] mb-1">Breakeven WR:</p>
              <p className="font-mono font-semibold text-text-primary">
                {breakEvenWinRate.toFixed(0)}%
              </p>
            </div>
          </div>
        </div>

        {/* ═══ REGULAR USER CONTROLS ═══ */}
        {!isAdmin && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-text-primary">
                  Shares per Trade (Max Cap)
                </label>
                <span className="text-sm font-mono font-semibold text-[#20B2AA]">
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
              <p className="text-xs text-text-tertiary">
                Your max share size. Dynamic XGB confidence scales sizing down when confidence is lower.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-text-primary">
                  Max Concurrent Positions
                </label>
                <span className="text-sm font-mono font-semibold text-[#20B2AA]">
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
            </div>
          </div>
        )}

        {/* ═══ ADMIN STRATEGY CONTROLS ═══ */}
        {isAdmin && (
          <div className="space-y-5">
            {/* Time Gate */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary">
                Time Gate (UTC)
              </label>
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
                          : 'bg-[#080A0C] text-text-tertiary border border-[#1B2026] hover:border-[#2A313A]'
                      }`}
                    >
                      {String(h).padStart(2, '0')}
                    </button>
                  );
                })}
              </div>
              {(config.blocked_hours_utc || []).length > 0 && (
                <p className="text-xs font-mono text-red-400">
                  Blocked:{' '}
                  {(config.blocked_hours_utc || [])
                    .map((h) => `${String(h).padStart(2, '0')}:00`)
                    .join(', ')}{' '}
                  UTC
                </p>
              )}
            </div>

            {/* Entry Conditions */}
            <div className="space-y-4">
              <h4 className="text-xs font-semibold text-text-tertiary uppercase tracking-wide">
                Entry Conditions
              </h4>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-text-primary">
                    Max Entry Price
                  </label>
                  <span className="text-sm font-mono font-semibold text-[#20B2AA]">
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
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-text-primary">
                    Min Entry Price
                  </label>
                  <span className="text-sm font-mono font-semibold text-[#20B2AA]">
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
            </div>

            {/* Take Profit & Stop Loss */}
            <div className="space-y-4">
              <h4 className="text-xs font-semibold text-text-tertiary uppercase tracking-wide">
                Exit & Risk Management
              </h4>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-text-primary">
                    Take Profit Delta
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
              </div>

              <div className="flex items-center justify-between p-3 bg-[#080A0C] border border-[#1B2026] rounded-lg">
                <div className="flex-1">
                  <label className="text-sm font-medium text-text-primary block mb-1">
                    Dynamic Stop Loss
                  </label>
                  <p className="text-xs text-text-tertiary">
                    SL scales proportionally with entry price
                  </p>
                </div>
                <Switch
                  checked={config.scalp_dynamic_stop_enabled ?? true}
                  onChange={(checked) =>
                    update('scalp_dynamic_stop_enabled', checked)
                  }
                />
              </div>

              {isDynamicStop ? (
                <>
                  <div className="space-y-2">
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
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-text-primary">
                        Min SL Delta Floor
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

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-text-primary">
                        Min R:R Gate
                      </label>
                      <span className="text-sm font-mono font-semibold text-[#20B2AA]">
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
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-text-primary">
                      Fixed Stop Loss Delta
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
            </div>

            {/* Shares & Limits */}
            <div className="space-y-4">
              <h4 className="text-xs font-semibold text-text-tertiary uppercase tracking-wide">
                Shares & Limits
              </h4>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-text-primary">
                    Shares per Trade
                  </label>
                  <span className="text-sm font-mono font-semibold text-[#20B2AA]">
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

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-text-primary">
                    Max Concurrent
                  </label>
                  <span className="text-sm font-mono font-semibold text-[#20B2AA]">
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

            {/* Advanced Section */}
            <div className="border-t border-[#1B2026] pt-4">
              <button
                type="button"
                className="flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors w-full"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                {showAdvanced ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                Advanced Timing Settings
              </button>

              {showAdvanced && (
                <div className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-text-secondary">
                        Max Hold Time
                      </label>
                      <span className="text-xs font-mono text-[#20B2AA]">
                        {fmtTime(
                          config.scalp_max_hold_seconds ?? (isInterval15m ? 840 : 240)
                        )}
                      </span>
                    </div>
                    <Slider
                      min={30}
                      max={isInterval15m ? 870 : 270}
                      step={10}
                      value={
                        config.scalp_max_hold_seconds ?? (isInterval15m ? 840 : 240)
                      }
                      onChange={(v) => update('scalp_max_hold_seconds', v)}
                      formatValue={(v) => fmtTime(v)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs text-text-secondary">
                          Entry After
                        </label>
                        <span className="text-xs font-mono text-[#20B2AA]">
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

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs text-text-secondary">
                          Entry Before
                        </label>
                        <span className="text-xs font-mono text-[#20B2AA]">
                          T+
                          {fmtTime(
                            config.scalp_watch_end ?? (isInterval15m ? 600 : 180)
                          )}
                        </span>
                      </div>
                      <Slider
                        min={60}
                        max={isInterval15m ? 840 : 260}
                        step={10}
                        value={
                          config.scalp_watch_end ?? (isInterval15m ? 600 : 180)
                        }
                        onChange={(v) => update('scalp_watch_end', v)}
                        formatValue={(v) => `T+${fmtTime(v)}`}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardBody>

      {hasChanges && (
        <CardFooter>
          <div className="flex items-center justify-between w-full">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleReset}
              disabled={saving}
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              Reset
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              loading={saving}
            >
              <Save className="h-3.5 w-3.5 mr-1" />
              Save Config
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
