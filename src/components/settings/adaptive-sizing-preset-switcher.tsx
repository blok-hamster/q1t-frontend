'use client';

import { useState } from 'react';
import { Sliders, Layers, ShieldAlert, Loader2, CheckCircle2, ShieldCheck, BookOpen } from 'lucide-react';
import { toast } from '@/context/toast-context';
import { MarketConfig, RiskConfig } from '@/types/api';
import { settingsApi } from '@/lib/api/settings';
import {
  ADAPTIVE_SIZING_PRESETS,
  AdaptiveSizingPresetId,
  CONCURRENT_MODE_PRESETS,
  CONCURRENT_ORDER,
  ConcurrentPresetId,
  ENTRY_GATE_ORDER,
  ENTRY_GATE_PRESETS,
  EntryGatePresetId,
  PRESET_ORDER,
  detectActiveAdaptivePreset,
  detectConcurrentPreset,
  detectEntryGatePreset,
  previewPresetExample,
} from '@/lib/adaptive-sizing-presets';
import { cn } from '@/lib/utils/cn';
import { PRESET_HELP_GUIDES } from '@/lib/preset-help-content';
import { PresetInfoButton } from './preset-info-button';

interface AdaptiveSizingPresetSwitcherProps {
  riskConfig?: RiskConfig | null;
  marketConfigs: MarketConfig[];
  balanceUsd?: number;
  onRiskConfigUpdated?: (nextRiskConfig: RiskConfig, nextMarketConfigs?: MarketConfig[]) => void;
  compact?: boolean;
}

export function AdaptiveSizingPresetSwitcher({
  riskConfig,
  marketConfigs,
  balanceUsd = 1000,
  onRiskConfigUpdated,
  compact = false,
}: AdaptiveSizingPresetSwitcherProps) {
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const activePreset = detectActiveAdaptivePreset(riskConfig);
  const activeConcurrent = detectConcurrentPreset(marketConfigs, riskConfig);
  const activeEntryGate = detectEntryGatePreset(riskConfig);
  const maxSameDirCoins: 0 | 2 | 3 =
    riskConfig?.max_same_dir_5m_coins === 0 || riskConfig?.max_same_dir_5m_coins === 2
      ? riskConfig.max_same_dir_5m_coins
      : 3;
  const orderbookDepthMode: 'off' | 'cap_size' | 'strict_skip' =
    riskConfig?.orderbook_depth_mode === 'off' || riskConfig?.orderbook_depth_mode === 'strict_skip'
      ? riskConfig.orderbook_depth_mode
      : 'cap_size';
  const fixedSharesSample = marketConfigs.find((c) => c.market_type.endsWith('-5m'))?.num_shares ?? 20;

  const handleSelectEntryGatePreset = async (gateId: EntryGatePresetId) => {
    if (savingKey) return;
    const gate = ENTRY_GATE_PRESETS[gateId];
    setSavingKey(`gate:${gateId}`);
    try {
      const res = await settingsApi.updateRiskConfig({
        entry_gate_preset: gate.id,
      });
      onRiskConfigUpdated?.(res.riskConfig);
      toast.success(`Entry strategy switched to ${gate.name}`);
    } catch (err: any) {
      toast.error(err?.error || err?.message || 'Failed to switch entry strategy preset');
    } finally {
      setSavingKey(null);
    }
  };

  const handleSelectAdaptivePreset = async (presetId: AdaptiveSizingPresetId) => {
    if (savingKey) return;
    const preset = ADAPTIVE_SIZING_PRESETS[presetId];
    setSavingKey(`preset:${presetId}`);
    try {
      const res = await settingsApi.updateRiskConfig({
        adaptive_preset: preset.id,
        use_adaptive_sizing: preset.use_adaptive_sizing,
        adaptive_base_pct: preset.adaptive_base_pct,
        max_bet_pct: preset.max_bet_pct,
        adaptive_min_shares: preset.adaptive_min_shares,
        adaptive_max_shares: preset.adaptive_max_shares,
      });
      onRiskConfigUpdated?.(res.riskConfig);
      toast.success(`Sizing switched to ${preset.name}`);
    } catch (err: any) {
      toast.error(err?.error || err?.message || 'Failed to switch sizing preset');
    } finally {
      setSavingKey(null);
    }
  };

  const handleSelectConcurrentPreset = async (modeId: ConcurrentPresetId) => {
    if (savingKey) return;
    const mode = CONCURRENT_MODE_PRESETS[modeId];
    setSavingKey(`conc:${modeId}`);
    try {
      const res = await settingsApi.updateRiskConfig({
        concurrent_sizing_mode: mode.concurrent_sizing_mode,
        sync_5m_concurrent: mode.max_concurrent,
      });
      let refreshedConfigs: MarketConfig[] | undefined;
      try {
        const mcRes = await settingsApi.getMarketConfigs();
        refreshedConfigs = mcRes.marketConfigs;
      } catch {
        // Optimistically mirror synced 5m max_concurrent values if refetch is unavailable
        refreshedConfigs = marketConfigs.map((c) =>
          c.market_type.endsWith('-5m') ? { ...c, max_concurrent: mode.max_concurrent } : c
        );
      }
      onRiskConfigUpdated?.(res.riskConfig, refreshedConfigs);
      toast.success(`Concurrent mode set to ${mode.name} across all 5m markets`);
    } catch (err: any) {
      toast.error(err?.error || err?.message || 'Failed to update concurrent mode');
    } finally {
      setSavingKey(null);
    }
  };

  const handleSelectSameDirCoinCap = async (cap: 0 | 2 | 3) => {
    if (savingKey) return;
    setSavingKey(`coincap:${cap}`);
    try {
      const res = await settingsApi.updateRiskConfig({
        max_same_dir_5m_coins: cap,
      });
      onRiskConfigUpdated?.(res.riskConfig);
      toast.success(
        cap === 0
          ? 'Same-window coin cap turned OFF (unlimited)'
          : `Same-window coin cap set to Max ${cap} coins per direction`
      );
    } catch (err: any) {
      toast.error(err?.error || err?.message || 'Failed to update same-window coin cap');
    } finally {
      setSavingKey(null);
    }
  };

  const handleSelectDepthMode = async (mode: 'off' | 'cap_size' | 'strict_skip') => {
    if (savingKey) return;
    setSavingKey(`depth:${mode}`);
    try {
      const res = await settingsApi.updateRiskConfig({
        orderbook_depth_mode: mode,
      });
      onRiskConfigUpdated?.(res.riskConfig);
      const label = mode === 'off' ? 'OFF' : mode === 'cap_size' ? 'Cap Size' : 'Strict Skip';
      toast.success(`Orderbook depth guard set to ${label}`);
    } catch (err: any) {
      toast.error(err?.error || err?.message || 'Failed to update orderbook depth guard');
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div
      className={cn(
        'bg-[#0F1215] border border-[#1B2026] font-mono select-none',
        compact ? 'p-3 space-y-3' : 'p-4 space-y-4 rounded-xs'
      )}
    >
      {/* Section 1: Bet Sizing Presets */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Sliders className="h-3.5 w-3.5 text-[#20B2AA]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#E1E4E8]">
              POSITION SIZING PRESETS
            </span>
            <PresetInfoButton guide={PRESET_HELP_GUIDES.sizing} accentClassName="text-[#20B2AA]" />
          </div>
          <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 border border-[#1B2026] bg-[#080A0C] text-[#8B949E] rounded-xs">
            ACTIVE:{' '}
            <span className="text-[#20B2AA]">
              {activePreset === 'custom' ? 'CUSTOM' : ADAPTIVE_SIZING_PRESETS[activePreset].name.toUpperCase()}
            </span>
          </span>
        </div>

        {!compact && (
          <p className="text-[11px] font-sans text-[#8B949E] leading-relaxed">
            Pick how much capital is deployed per qualifying signal. Adaptive presets automatically scale up on cheap &lt;$0.82 bargains and cut size during thin-edge (&lt;5¢ = 0.50×) or quiet-floor (≤1.21× vol = 0.65×) sessions.
          </p>
        )}

        <div className={cn('grid gap-2', compact ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4')}>
          {PRESET_ORDER.map((id) => {
            const preset = ADAPTIVE_SIZING_PRESETS[id];
            const isSelected = activePreset === id;
            const isBusy = savingKey === `preset:${id}`;
            const preview = previewPresetExample(id, balanceUsd, 0.75, fixedSharesSample);

            return (
              <button
                key={id}
                type="button"
                disabled={Boolean(savingKey)}
                onClick={() => handleSelectAdaptivePreset(id)}
                className={cn(
                  'text-left border p-2.5 transition-all rounded-xs cursor-pointer flex flex-col justify-between gap-1.5',
                  isSelected
                    ? 'bg-[#20B2AA]/10 border-[#20B2AA]/70 text-[#E1E4E8]'
                    : 'bg-[#080A0C] border-[#1B2026] text-[#8B949E] hover:border-[#2A313A] hover:text-[#E1E4E8]',
                  savingKey && !isBusy && 'opacity-60'
                )}
              >
                <div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[11px] font-bold uppercase text-[#E1E4E8] flex items-center gap-1">
                      {preset.name}
                      {preset.badge && (
                        <span className="text-[8px] px-1 py-0.2 bg-[#20B2AA]/20 text-[#20B2AA] border border-[#20B2AA]/40 rounded-xs">
                          {preset.badge}
                        </span>
                      )}
                    </span>
                    {isBusy ? (
                      <Loader2 className="h-3 w-3 animate-spin text-[#20B2AA]" />
                    ) : isSelected ? (
                      <CheckCircle2 className="h-3 w-3 text-[#20B2AA] shrink-0" />
                    ) : null}
                  </div>
                  <div className="text-[10px] text-[#20B2AA]/90 mt-0.5 font-semibold">
                    {preset.tagline}
                  </div>
                </div>

                {!compact && (
                  <p className="text-[10px] font-sans text-[#8B949E] leading-snug">
                    {preset.summary}
                  </p>
                )}

                <div className="pt-1 border-t border-[#1B2026]/80 text-[9px] text-[#586069] flex items-center justify-between">
                  <span>@${balanceUsd.toFixed(0)} @ $0.75</span>
                  <span className="text-[#E1E4E8] font-bold tabular-nums">
                    {preview.shares} sh (~${preview.notionalUsd.toFixed(0)})
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Section 2: Concurrent Order Mode Presets (Same-Direction Locked) */}
      <div className="space-y-2 pt-2 border-t border-[#1B2026]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-[#D99B00]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#E1E4E8]">
              CONCURRENT 5M ORDER MODE
            </span>
            <PresetInfoButton guide={PRESET_HELP_GUIDES.concurrent} accentClassName="text-[#D99B00]" />
          </div>
          <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 border border-[#1B2026] bg-[#080A0C] text-[#8B949E] rounded-xs">
            MODE:{' '}
            <span className="text-[#D99B00]">
              {activeConcurrent === 'custom' ? 'CUSTOM' : CONCURRENT_MODE_PRESETS[activeConcurrent].name.toUpperCase()}
            </span>
          </span>
        </div>

        <div className={cn('grid gap-2', compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-3')}>
          {CONCURRENT_ORDER.map((modeId) => {
            const mode = CONCURRENT_MODE_PRESETS[modeId];
            const isSelected = activeConcurrent === modeId;
            const isBusy = savingKey === `conc:${modeId}`;

            return (
              <button
                key={modeId}
                type="button"
                disabled={Boolean(savingKey)}
                onClick={() => handleSelectConcurrentPreset(modeId)}
                className={cn(
                  'text-left border p-2.5 transition-all rounded-xs cursor-pointer flex flex-col justify-between gap-1',
                  isSelected
                    ? 'bg-[#D99B00]/10 border-[#D99B00]/70 text-[#E1E4E8]'
                    : 'bg-[#080A0C] border-[#1B2026] text-[#8B949E] hover:border-[#2A313A] hover:text-[#E1E4E8]',
                  savingKey && !isBusy && 'opacity-60'
                )}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[11px] font-bold uppercase text-[#E1E4E8]">
                    {mode.name}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-semibold text-[#D99B00]">
                      {mode.shortSpec}
                    </span>
                    {isBusy ? (
                      <Loader2 className="h-3 w-3 animate-spin text-[#D99B00]" />
                    ) : isSelected ? (
                      <CheckCircle2 className="h-3 w-3 text-[#D99B00]" />
                    ) : null}
                  </div>
                </div>
                {!compact && (
                  <p className="text-[10px] font-sans text-[#8B949E] leading-snug">
                    {mode.description}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Section 3: Entry & Falling-Knife Protection Strategy Presets */}
      <div className="space-y-2 pt-2 border-t border-[#1B2026]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <ShieldAlert className="h-3.5 w-3.5 text-[#10B981]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#E1E4E8]">
              ENTRY &amp; FALLING-KNIFE PROTECTION PRESET
            </span>
            <PresetInfoButton guide={PRESET_HELP_GUIDES.entry_gate} accentClassName="text-[#10B981]" />
          </div>
          <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 border border-[#1B2026] bg-[#080A0C] text-[#8B949E] rounded-xs">
            ACTIVE:{' '}
            <span className="text-[#10B981]">
              {ENTRY_GATE_PRESETS[activeEntryGate].name.toUpperCase()}
            </span>
          </span>
        </div>

        {!compact && (
          <p className="text-[11px] font-sans text-[#8B949E] leading-relaxed">
            Switch how the engine filters falling knives and scales required z-score by share price ($0.65–$0.88).
          </p>
        )}

        <div className={cn('grid gap-2', compact ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4')}>
          {ENTRY_GATE_ORDER.map((gateId) => {
            const gate = ENTRY_GATE_PRESETS[gateId];
            const isSelected = activeEntryGate === gateId;
            const isBusy = savingKey === `gate:${gateId}`;

            return (
              <button
                key={gateId}
                type="button"
                disabled={Boolean(savingKey)}
                onClick={() => handleSelectEntryGatePreset(gateId)}
                className={cn(
                  'text-left border p-2.5 transition-all rounded-xs cursor-pointer flex flex-col justify-between gap-1.5',
                  isSelected
                    ? 'bg-[#10B981]/10 border-[#10B981]/70 text-[#E1E4E8]'
                    : 'bg-[#080A0C] border-[#1B2026] text-[#8B949E] hover:border-[#2A313A] hover:text-[#E1E4E8]',
                  savingKey && !isBusy && 'opacity-60'
                )}
              >
                <div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[11px] font-bold uppercase text-[#E1E4E8] flex items-center gap-1">
                      {gate.name}
                      {gate.badge && (
                        <span className="text-[8px] px-1 py-0.2 bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40 rounded-xs">
                          {gate.badge}
                        </span>
                      )}
                    </span>
                    {isBusy ? (
                      <Loader2 className="h-3 w-3 animate-spin text-[#10B981]" />
                    ) : isSelected ? (
                      <CheckCircle2 className="h-3 w-3 text-[#10B981] shrink-0" />
                    ) : null}
                  </div>
                  <div className="text-[10px] text-[#10B981]/90 mt-0.5 font-semibold">
                    {gate.tagline}
                  </div>
                </div>

                {!compact && (
                  <p className="text-[10px] font-sans text-[#8B949E] leading-snug">
                    {gate.summary}
                  </p>
                )}

                <div className="pt-1 border-t border-[#1B2026]/80 text-[9px] text-[#E1E4E8] font-bold tabular-nums">
                  {gate.stats}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Section 4: Same-Window Coin Correlation Cap (5m) */}
      <div className="space-y-2 pt-2 border-t border-[#1B2026]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-[#38BDF8]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#E1E4E8]">
              SAME-WINDOW COIN CAP (5M)
            </span>
            <PresetInfoButton guide={PRESET_HELP_GUIDES.coin_cap} accentClassName="text-[#38BDF8]" />
          </div>
          <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 border border-[#1B2026] bg-[#080A0C] text-[#8B949E] rounded-xs">
            ACTIVE:{' '}
            <span className="text-[#38BDF8]">
              {maxSameDirCoins === 0 ? 'OFF (UNLIMITED)' : `MAX ${maxSameDirCoins} COINS`}
            </span>
          </span>
        </div>

        {!compact && (
          <p className="text-[11px] font-sans text-[#8B949E] leading-relaxed">
            Limits how many 5m coins can enter the same direction in one 5-minute candle to prevent correlated crash drawdowns.
          </p>
        )}

        <div className="grid grid-cols-3 gap-2">
          {([
            { val: 0 as const, label: 'OFF', spec: 'Unlimited', desc: 'All 7 coins can enter together.' },
            { val: 3 as const, label: 'MAX 3 COINS', spec: 'Recommended', desc: 'Up to 3 same-side coins per 5m window.' },
            { val: 2 as const, label: 'MAX 2 COINS', spec: 'Strict', desc: 'Up to 2 same-side coins per 5m window.' },
          ]).map((opt) => {
            const isSelected = maxSameDirCoins === opt.val;
            const isBusy = savingKey === `coincap:${opt.val}`;
            return (
              <button
                key={opt.val}
                type="button"
                disabled={Boolean(savingKey)}
                onClick={() => handleSelectSameDirCoinCap(opt.val)}
                className={cn(
                  'text-left border p-2.5 transition-all rounded-xs cursor-pointer flex flex-col justify-between gap-1',
                  isSelected
                    ? 'bg-[#38BDF8]/10 border-[#38BDF8]/70 text-[#E1E4E8]'
                    : 'bg-[#080A0C] border-[#1B2026] text-[#8B949E] hover:border-[#2A313A] hover:text-[#E1E4E8]',
                  savingKey && !isBusy && 'opacity-60'
                )}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[11px] font-bold uppercase text-[#E1E4E8]">{opt.label}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] font-semibold text-[#38BDF8]">{opt.spec}</span>
                    {isBusy ? (
                      <Loader2 className="h-3 w-3 animate-spin text-[#38BDF8]" />
                    ) : isSelected ? (
                      <CheckCircle2 className="h-3 w-3 text-[#38BDF8]" />
                    ) : null}
                  </div>
                </div>
                {!compact && (
                  <p className="text-[10px] font-sans text-[#8B949E] leading-snug">{opt.desc}</p>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Section 6: Orderbook Depth Guard (+2¢ live WS depth) */}
      <div className="space-y-2 pt-2 border-t border-[#1B2026]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5 text-[#A78BFA]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#E1E4E8]">
              ORDERBOOK DEPTH GUARD (+2¢ LIVE WS)
            </span>
            <PresetInfoButton guide={PRESET_HELP_GUIDES.depth_guard} accentClassName="text-[#A78BFA]" />
          </div>
          <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 border border-[#1B2026] bg-[#080A0C] text-[#8B949E] rounded-xs">
            ACTIVE:{' '}
            <span className="text-[#A78BFA]">
              {orderbookDepthMode === 'off' ? 'OFF' : orderbookDepthMode === 'cap_size' ? 'CAP SIZE' : 'STRICT SKIP'}
            </span>
          </span>
        </div>

        {!compact && (
          <p className="text-[11px] font-sans text-[#8B949E] leading-relaxed">
            Checks in-memory Polymarket ask depth within +2¢ (zero added latency) and clamps fill limits to fair value minus min edge.
          </p>
        )}

        <div className="grid grid-cols-3 gap-2">
          {([
            { val: 'off' as const, label: 'OFF', spec: 'Ignore Book', desc: 'Always fire full target shares.' },
            { val: 'cap_size' as const, label: 'CAP SIZE', spec: 'Recommended', desc: 'Shrinks order to live +2¢ depth (skips <5sh).' },
            { val: 'strict_skip' as const, label: 'STRICT SKIP', spec: 'Full Only', desc: 'Skips trade unless +2¢ depth covers full target.' },
          ]).map((opt) => {
            const isSelected = orderbookDepthMode === opt.val;
            const isBusy = savingKey === `depth:${opt.val}`;
            return (
              <button
                key={opt.val}
                type="button"
                disabled={Boolean(savingKey)}
                onClick={() => handleSelectDepthMode(opt.val)}
                className={cn(
                  'text-left border p-2.5 transition-all rounded-xs cursor-pointer flex flex-col justify-between gap-1',
                  isSelected
                    ? 'bg-[#A78BFA]/10 border-[#A78BFA]/70 text-[#E1E4E8]'
                    : 'bg-[#080A0C] border-[#1B2026] text-[#8B949E] hover:border-[#2A313A] hover:text-[#E1E4E8]',
                  savingKey && !isBusy && 'opacity-60'
                )}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[11px] font-bold uppercase text-[#E1E4E8]">{opt.label}</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] font-semibold text-[#A78BFA]">{opt.spec}</span>
                    {isBusy ? (
                      <Loader2 className="h-3 w-3 animate-spin text-[#A78BFA]" />
                    ) : isSelected ? (
                      <CheckCircle2 className="h-3 w-3 text-[#A78BFA]" />
                    ) : null}
                  </div>
                </div>
                {!compact && (
                  <p className="text-[10px] font-sans text-[#8B949E] leading-snug">{opt.desc}</p>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
