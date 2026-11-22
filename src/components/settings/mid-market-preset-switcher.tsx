'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Sliders, CheckCircle2, Loader2, ExternalLink } from 'lucide-react';
import { adminApi, settingsApi } from '@/lib/api';
import { ROUTES } from '@/lib/constants';
import { toast } from '@/context/toast-context';
import { cn } from '@/lib/utils/cn';
import {
  MID_MARKET_PRESETS,
  MidMarketPreset,
  MidMarketPresetId,
  buildPresetBulkConfigs,
  detectActiveMidMarketPreset,
} from '@/lib/mid-market-presets';
import type { MarketConfig } from '@/types/api';

interface MidMarketPresetSwitcherProps {
  configs: Partial<MarketConfig>[];
  onApplied?: (freshConfigs: MarketConfig[]) => void | Promise<void>;
  showMarketConfigsLink?: boolean;
  compact?: boolean;
}

export function MidMarketPresetSwitcher({
  configs,
  onApplied,
  showMarketConfigsLink = false,
  compact = false,
}: MidMarketPresetSwitcherProps) {
  const [applyingId, setApplyingId] = useState<MidMarketPresetId | null>(null);
  const activePresetId = detectActiveMidMarketPreset(configs);

  const handleApplyPreset = async (preset: MidMarketPreset) => {
    if (applyingId) return;
    setApplyingId(preset.id);
    try {
      await adminApi.bulkApplyMarketConfigs(buildPresetBulkConfigs(preset.id));
      const fresh = await settingsApi.getMarketConfigs();
      await onApplied?.(fresh.marketConfigs || []);
      toast.success(`Switched all 5m markets to ${preset.shortLabel} (${preset.summary})`);
    } catch (error: any) {
      toast.error(error?.message || `Failed to apply ${preset.shortLabel}`);
    } finally {
      setApplyingId(null);
    }
  };

  const activePresetLabel =
    activePresetId === 'custom'
      ? 'CUSTOM'
      : activePresetId
      ? MID_MARKET_PRESETS.find((p) => p.id === activePresetId)?.shortLabel.toUpperCase() || 'ACTIVE'
      : 'LOADING';

  return (
    <div className="bg-[#0F1215] border border-[#1B2026] font-mono select-none">
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-[#1B2026] bg-[#16191E]/60 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Sliders className="h-3.5 w-3.5 text-[#20B2AA] shrink-0" />
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#E1E4E8] block">
              5M ENTRY PRESETS (1-CLICK SWITCHER)
            </span>
            <span className="text-[10px] text-[#8B949E] block">
              Applies to BTC, ETH, SOL &amp; DOGE 5m live immediately
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={cn(
              'text-[9px] font-bold uppercase px-2 py-0.5 border rounded-xs',
              activePresetId === 'custom'
                ? 'bg-[#D99B00]/10 text-[#D99B00] border-[#D99B00]/30'
                : 'bg-[#20B2AA]/15 text-[#20B2AA] border-[#20B2AA]/30'
            )}
          >
            ACTIVE: {activePresetLabel}
          </span>
          {showMarketConfigsLink && (
            <Link
              href={ROUTES.ADMIN_MARKET_CONFIGS_PAGE}
              className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-[#8B949E] hover:text-[#20B2AA] border border-[#1B2026] hover:border-[#20B2AA]/40 px-2 py-0.5 rounded-xs transition-colors"
              title="Open full JSON editor"
            >
              <span>JSON</span>
              <ExternalLink className="h-2.5 w-2.5" />
            </Link>
          )}
        </div>
      </div>

      {/* Preset Buttons */}
      <div
        className={cn(
          'p-3 grid gap-2',
          compact ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4'
        )}
      >
        {MID_MARKET_PRESETS.map((preset) => {
          const isActive = activePresetId === preset.id;
          const isApplying = applyingId === preset.id;

          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleApplyPreset(preset)}
              disabled={Boolean(applyingId)}
              className={cn(
                'p-2.5 border rounded-xs text-left transition-all cursor-pointer flex flex-col gap-1 disabled:opacity-60 disabled:cursor-wait',
                isActive
                  ? 'bg-[#16191E] border-[#20B2AA] text-[#E1E4E8] shadow-sm'
                  : 'bg-[#080A0C] border-[#1B2026] text-[#8B949E] hover:border-[#20B2AA]/50 hover:text-[#E1E4E8]'
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold uppercase text-[#E1E4E8]">
                    {preset.shortLabel}
                  </span>
                  <span
                    className={cn(
                      'text-[9px] font-bold uppercase px-1.5 py-0.2 border rounded-xs',
                      preset.id === 'option-a' || preset.id === 'option-c'
                        ? 'bg-[#20B2AA]/10 text-[#20B2AA] border-[#20B2AA]/30'
                        : 'bg-[#16191E] text-[#8B949E] border-[#1B2026]'
                    )}
                  >
                    {preset.tag}
                  </span>
                </div>

                {isApplying ? (
                  <Loader2 className="h-3.5 w-3.5 text-[#20B2AA] animate-spin shrink-0" />
                ) : isActive ? (
                  <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase text-[#20B2AA]">
                    <CheckCircle2 className="h-3 w-3" /> ACTIVE
                  </span>
                ) : (
                  <span className="text-[9px] font-bold uppercase text-[#586069]">
                    APPLY
                  </span>
                )}
              </div>

              <div className="text-[10px] font-bold text-[#20B2AA] tabular-nums">
                {preset.summary}
              </div>

              {!compact && (
                <p className="text-[10px] text-[#8B949E] leading-snug">
                  {preset.description}
                </p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

