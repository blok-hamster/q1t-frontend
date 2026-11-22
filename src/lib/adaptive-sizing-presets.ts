import { MarketConfig, RiskConfig } from '@/types/api';

export type AdaptiveSizingPresetId = 'fixed' | 'conservative' | 'balanced' | 'growth';
export type ConcurrentPresetId = 'single_1x' | 'split_2x' | 'double_2x';
export type EntryGatePresetId = 'mode_a' | 'mode_b' | 'mode_c' | 'high_volume';

export interface EntryGatePresetMeta {
  id: EntryGatePresetId;
  name: string;
  badge?: string;
  tagline: string;
  summary: string;
  stats: string;
}

export const ENTRY_GATE_PRESETS: Record<EntryGatePresetId, EntryGatePresetMeta> = {
  mode_a: {
    id: 'mode_a',
    name: 'Mode A · Max Profit',
    badge: 'REC',
    tagline: '93.6% WR Real Books · Rising-Ask Lock',
    summary:
      'Blocks falling-ask re-entries (ask ≥ maxSeenQualAsk), raises 135–185s floor to $0.78, and scales required z by price ($0.65–$0.82: z≥1.15; $0.83–$0.85: z≥1.22; $0.86–$0.88: z≥1.38).',
    stats: '132W / 9L (93.6%) · +$2,812 Comp',
  },
  mode_b: {
    id: 'mode_b',
    name: 'Mode B · Low Drawdown',
    tagline: '$107 Max DD · Late 5s Drop Shield',
    summary:
      'Same Rising-Ask Lock as Mode A, plus auto-cuts bet size to 0.30× (10 sh/leg) if ask dropped ≥6¢ in 5s after 135s and caps $0.87–$0.88 size at 0.50×.',
    stats: '132W / 9L (93.6%) · $107 Max DD',
  },
  mode_c: {
    id: 'mode_c',
    name: 'Mode C · Ultra-Safe 96%',
    tagline: '96.0% WR Real Books · Only 4 Losses/Wk',
    summary:
      'Same Rising-Ask Lock as Mode A, plus completely blocks any late entry (≥135s) if the orderbook dropped ≥7¢ in the last 5 seconds.',
    stats: '96W / 4L (96.0%) · $118 Max DD',
  },
  high_volume: {
    id: 'high_volume',
    name: 'High-Volume Structured',
    tagline: '~50 Trades/Day · Pullbacks Allowed',
    summary:
      'Price-scaled z (1.15 / 1.22 / 1.30) with edge ≥3¢ and 135–180s mid-window floor $0.78, with Rising-Ask Lock OFF for maximum daily trade frequency.',
    stats: '319W / 41L (88.6%) · +$2,547 Comp',
  },
};

export const ENTRY_GATE_ORDER: EntryGatePresetId[] = ['mode_a', 'mode_b', 'mode_c', 'high_volume'];

export function detectEntryGatePreset(riskConfig?: RiskConfig | null): EntryGatePresetId {
  const p = riskConfig?.entry_gate_preset;
  if (p === 'mode_a' || p === 'mode_b' || p === 'mode_c' || p === 'high_volume') {
    return p;
  }
  return 'mode_a';
}

export const FIVE_MIN_CONCURRENT_MARKETS = ['btc-5m', 'eth-5m', 'sol-5m', 'doge-5m', 'bnb-5m', 'xrp-5m', 'hype-5m'] as const;

export interface AdaptivePresetMeta {
  id: AdaptiveSizingPresetId;
  name: string;
  badge?: string;
  tagline: string;
  summary: string;
  use_adaptive_sizing: boolean;
  adaptive_base_pct: number;
  max_bet_pct: number;
  adaptive_min_shares: number;
  adaptive_max_shares: number;
}

export const ADAPTIVE_SIZING_PRESETS: Record<AdaptiveSizingPresetId, AdaptivePresetMeta> = {
  fixed: {
    id: 'fixed',
    name: 'Fixed',
    tagline: 'Flat per-market shares',
    summary: 'Uses each coin’s static share count every trade instead of scaling with balance.',
    use_adaptive_sizing: false,
    adaptive_base_pct: 0.022,
    max_bet_pct: 0.05,
    adaptive_min_shares: 5,
    adaptive_max_shares: 200,
  },
  conservative: {
    id: 'conservative',
    name: 'Conservative',
    tagline: '1.8% base · 3.5% max',
    summary: 'Lower variance sizing (20–115 sh). Scales up on <$0.82 bargains and cuts thin/quiet entries.',
    use_adaptive_sizing: true,
    adaptive_base_pct: 0.018,
    max_bet_pct: 0.035,
    adaptive_min_shares: 20,
    adaptive_max_shares: 115,
  },
  balanced: {
    id: 'balanced',
    name: 'Balanced',
    badge: 'REC',
    tagline: '2.2% base · 4.0% max',
    summary: 'Default Model D v4 adaptive curve (25–140 sh) with 0.50× thin-edge & 0.65× quiet-floor defense.',
    use_adaptive_sizing: true,
    adaptive_base_pct: 0.022,
    max_bet_pct: 0.04,
    adaptive_min_shares: 25,
    adaptive_max_shares: 140,
  },
  growth: {
    id: 'growth',
    name: 'Growth',
    tagline: '2.6% base · 4.5% max',
    summary: 'Higher upside on clean <$0.82 setups (25–160 sh) while keeping the exact same loss-defense cuts.',
    use_adaptive_sizing: true,
    adaptive_base_pct: 0.026,
    max_bet_pct: 0.045,
    adaptive_min_shares: 25,
    adaptive_max_shares: 160,
  },
};

export interface ConcurrentModePresetMeta {
  id: ConcurrentPresetId;
  name: string;
  shortSpec: string;
  description: string;
  max_concurrent: 1 | 2;
  concurrent_sizing_mode: 'split' | 'double';
}

export const CONCURRENT_MODE_PRESETS: Record<ConcurrentPresetId, ConcurrentModePresetMeta> = {
  single_1x: {
    id: 'single_1x',
    name: '1× Single',
    shortSpec: '1 order · standard risk',
    description: 'Opens one trade per qualifying window across 5m markets.',
    max_concurrent: 1,
    concurrent_sizing_mode: 'split',
  },
  split_2x: {
    id: 'split_2x',
    name: '2× Split',
    shortSpec: '2 orders · same risk',
    description: 'Fires 2 same-direction orders at once, splitting 1 bet budget to double trade volume safely.',
    max_concurrent: 2,
    concurrent_sizing_mode: 'split',
  },
  double_2x: {
    id: 'double_2x',
    name: '2× Double',
    shortSpec: '2 orders · 2× budget (12% cap)',
    description: 'Fires 2 full-sized same-direction orders at once (up to 2× max bet, capped at 12% of balance).',
    max_concurrent: 2,
    concurrent_sizing_mode: 'double',
  },
};

export const PRESET_ORDER: AdaptiveSizingPresetId[] = ['fixed', 'conservative', 'balanced', 'growth'];
export const CONCURRENT_ORDER: ConcurrentPresetId[] = ['single_1x', 'split_2x', 'double_2x'];

/** Preview share counts across representative $0.75 (active) and $0.88 (quiet floor) entries. */
export function previewPresetExample(
  presetId: AdaptiveSizingPresetId,
  balanceUsd: number,
  sampleAsk = 0.75,
  fixedSharesFallback = 20
): { shares: number; notionalUsd: number } {
  if (presetId === 'fixed') {
    const shares = Math.max(5, Math.round(fixedSharesFallback));
    return { shares, notionalUsd: shares * sampleAsk };
  }
  const p = ADAPTIVE_SIZING_PRESETS[presetId];
  const safeBal = Number.isFinite(balanceUsd) && balanceUsd > 0 ? balanceUsd : 1000;
  const oddsMult = sampleAsk < 0.82 ? 1.50 : 1.0;
  const targetPct = Math.min(p.max_bet_pct, Math.max(0.005, p.adaptive_base_pct * oddsMult));
  const rawShares = Math.round((targetPct * safeBal) / sampleAsk);
  const shares = Math.max(p.adaptive_min_shares, Math.min(p.adaptive_max_shares, rawShares));
  return { shares, notionalUsd: shares * sampleAsk };
}

export function detectActiveAdaptivePreset(riskConfig?: RiskConfig | null): AdaptiveSizingPresetId | 'custom' {
  if (!riskConfig) return 'fixed';
  const explicit = riskConfig.adaptive_preset;
  if (explicit === 'fixed' || explicit === 'conservative' || explicit === 'balanced' || explicit === 'growth') {
    return explicit;
  }
  if (!riskConfig.use_adaptive_sizing) return 'fixed';
  for (const id of PRESET_ORDER) {
    if (id === 'fixed') continue;
    const p = ADAPTIVE_SIZING_PRESETS[id];
    if (
      Math.abs((riskConfig.adaptive_base_pct ?? 0.022) - p.adaptive_base_pct) < 1e-4 &&
      Math.abs(riskConfig.max_bet_pct - p.max_bet_pct) < 1e-4 &&
      (riskConfig.adaptive_min_shares ?? 25) === p.adaptive_min_shares &&
      (riskConfig.adaptive_max_shares ?? 140) === p.adaptive_max_shares
    ) {
      return id;
    }
  }
  return 'custom';
}

export function detectConcurrentPreset(
  marketConfigs: MarketConfig[],
  riskConfig?: RiskConfig | null
): ConcurrentPresetId | 'custom' {
  const fiveMin = marketConfigs.filter((c) =>
    (FIVE_MIN_CONCURRENT_MARKETS as readonly string[]).includes(c.market_type)
  );
  const counts = fiveMin.map((c) => Math.max(1, Number(c.max_concurrent ?? 1)));
  const allSingle = counts.length > 0 && counts.every((n) => n === 1);
  const allDouble = counts.length > 0 && counts.every((n) => n === 2);

  if (allSingle) return 'single_1x';
  if (allDouble) {
    return riskConfig?.concurrent_sizing_mode === 'double' ? 'double_2x' : 'split_2x';
  }
  // Mixed max_concurrent across coins — still highlight base intent if no 5m configs loaded
  if (fiveMin.length === 0) {
    return riskConfig?.concurrent_sizing_mode === 'double' ? 'double_2x' : 'single_1x';
  }
  return 'custom';
}

