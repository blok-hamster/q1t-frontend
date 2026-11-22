import type { MarketConfig } from '@/types/api';

export const FIVE_MIN_MARKET_TYPES = ['btc-5m', 'eth-5m', 'sol-5m', 'doge-5m', 'bnb-5m', 'xrp-5m', 'hype-5m'] as const;
export type FiveMinMarketType = (typeof FIVE_MIN_MARKET_TYPES)[number];

export type MidMarketPresetId = 'v5-default' | 'option-a' | 'option-c' | 'option-b' | 'calibrated';

export interface MidMarketPresetFields {
  entry_share_price: number;
  max_entry_price: number;
  min_fair_value_edge: number;
  entry_min_elapsed_seconds: number;
  entry_max_elapsed_seconds: number;
  first_impression_only: boolean;
  sigma_vol_multiplier: number;
  sigma_min_floor_ratio: number;
  high_conviction_z: number;
  high_conviction_min_edge: number;
  high_conviction_max_ask: number;
}

export interface MidMarketPreset {
  id: MidMarketPresetId;
  shortLabel: string;
  label: string;
  tag: string;
  summary: string;
  description: string;
  fields: MidMarketPresetFields;
}

/**
 * Canonical Model D v4 5m presets — matches backend `apply-model-d-v4.ts`.
 */
export const MID_MARKET_PRESETS: readonly MidMarketPreset[] = [
  {
    id: 'v5-default',
    shortLabel: 'Model D v5',
    label: 'Model D v5 — Price & Time Structured ($0.65–$0.88)',
    tag: 'Recommended',
    summary: '$0.65–$0.88 · 90–220s · z≥1.15 · edge≥4¢',
    description: 'Matches Mode A / B / C / High-Volume Rising-Ask presets with $0.05 max spread.',
    fields: {
      entry_share_price: 0.65,
      max_entry_price: 0.88,
      min_fair_value_edge: 0.99,
      entry_min_elapsed_seconds: 90,
      entry_max_elapsed_seconds: 220,
      first_impression_only: false,
      sigma_vol_multiplier: 1.35,
      sigma_min_floor_ratio: 1.2,
      high_conviction_z: 1.15,
      high_conviction_min_edge: 0.04,
      high_conviction_max_ask: 0.88,
    },
  },
  {
    id: 'option-a',
    shortLabel: 'Legacy Opt A',
    label: 'Legacy Option A — Balanced ($0.88)',
    tag: 'Legacy v4',
    summary: '$0.55–$0.88 · 90–220s · z≥1.4 · edge≥0¢',
    description: 'Best volume + WR balance (z≥1.4, $0.88 cap) with 90–220s wait window.',
    fields: {
      entry_share_price: 0.55,
      max_entry_price: 0.88,
      min_fair_value_edge: 0.99,
      entry_min_elapsed_seconds: 90,
      entry_max_elapsed_seconds: 220,
      first_impression_only: false,
      sigma_vol_multiplier: 1.35,
      sigma_min_floor_ratio: 1.2,
      high_conviction_z: 1.4,
      high_conviction_min_edge: 0.0,
      high_conviction_max_ask: 0.88,
    },
  },
  {
    id: 'option-c',
    shortLabel: 'Option C',
    label: 'Option C — Tight Cap ($0.86)',
    tag: 'Highest PF',
    summary: '$0.55–$0.86 · 90–220s · z≥1.4 · edge≥2¢',
    description: 'Tighter $0.86 ask cap (z≥1.4, +2¢ edge) for fewer, higher-R:R entries.',
    fields: {
      entry_share_price: 0.55,
      max_entry_price: 0.86,
      min_fair_value_edge: 0.99,
      entry_min_elapsed_seconds: 90,
      entry_max_elapsed_seconds: 220,
      first_impression_only: false,
      sigma_vol_multiplier: 1.35,
      sigma_min_floor_ratio: 1.2,
      high_conviction_z: 1.4,
      high_conviction_min_edge: 0.02,
      high_conviction_max_ask: 0.86,
    },
  },
  {
    id: 'option-b',
    shortLabel: 'Option B',
    label: 'Option B — Lower z ($0.85)',
    tag: 'High Vol',
    summary: '$0.55–$0.85 · 90–220s · z≥1.0 · edge≥5¢',
    description: 'Lower conviction floor (z≥1.0) with +5¢ edge gate and $0.85 cap.',
    fields: {
      entry_share_price: 0.55,
      max_entry_price: 0.85,
      min_fair_value_edge: 0.99,
      entry_min_elapsed_seconds: 90,
      entry_max_elapsed_seconds: 220,
      first_impression_only: false,
      sigma_vol_multiplier: 1.35,
      sigma_min_floor_ratio: 1.2,
      high_conviction_z: 1.0,
      high_conviction_min_edge: 0.05,
      high_conviction_max_ask: 0.85,
    },
  },
  {
    id: 'calibrated',
    shortLabel: 'Calibrated v4',
    label: 'Calibrated v4 — Baseline',
    tag: 'Baseline',
    summary: '$0.65–$0.91 · 30–220s · z≥1.5 · edge≥0¢',
    description: 'Original v4 baseline with $0.91 cap and earlier 30s entry start.',
    fields: {
      entry_share_price: 0.65,
      max_entry_price: 0.91,
      min_fair_value_edge: 0.99,
      entry_min_elapsed_seconds: 30,
      entry_max_elapsed_seconds: 220,
      first_impression_only: false,
      sigma_vol_multiplier: 1.35,
      sigma_min_floor_ratio: 1.2,
      high_conviction_z: 1.5,
      high_conviction_min_edge: 0.0,
      high_conviction_max_ask: 0.91,
    },
  },
] as const;

const NUMERIC_MATCH_KEYS: (keyof MidMarketPresetFields)[] = [
  'entry_share_price',
  'max_entry_price',
  'min_fair_value_edge',
  'entry_min_elapsed_seconds',
  'entry_max_elapsed_seconds',
  'high_conviction_z',
  'high_conviction_min_edge',
  'high_conviction_max_ask',
];

function approxEqual(a: unknown, b: number): boolean {
  return typeof a === 'number' && Math.abs(a - b) < 1e-6;
}

/**
 * Returns the active preset ID if all loaded 5m market configs match one preset,
 * `'custom'` if they diverge, or `null` if no 5m configs are available.
 */
export function detectActiveMidMarketPreset(
  configs: Partial<MarketConfig>[]
): MidMarketPresetId | 'custom' | null {
  const fiveMin = configs.filter((c) =>
    FIVE_MIN_MARKET_TYPES.includes(c.market_type as FiveMinMarketType)
  );
  if (fiveMin.length === 0) return null;

  for (const preset of MID_MARKET_PRESETS) {
    const matchesAll = fiveMin.every(
      (cfg) =>
        Boolean(cfg.first_impression_only) === preset.fields.first_impression_only &&
        NUMERIC_MATCH_KEYS.every((key) =>
          approxEqual(cfg[key], preset.fields[key] as number)
        )
    );
    if (matchesAll) return preset.id;
  }

  return 'custom';
}

export function buildPresetBulkConfigs(presetId: MidMarketPresetId) {
  const preset = MID_MARKET_PRESETS.find((p) => p.id === presetId);
  if (!preset) {
    throw new Error(`Unknown preset: ${presetId}`);
  }
  return FIVE_MIN_MARKET_TYPES.map((market_type) => ({
    market_type,
    ...preset.fields,
  }));
}

export function formatEdgeBadge(config: Partial<MarketConfig>): string {
  const edge = config.min_fair_value_edge;
  if (typeof edge === 'number' && edge >= 0.95) {
    const z = config.high_conviction_z;
    if (typeof z === 'number' && z > 0) {
      const zEdgeCents = Math.round((config.high_conviction_min_edge ?? 0) * 100);
      return zEdgeCents > 0 ? `z≥${z.toFixed(1)} · +${zEdgeCents}¢` : `z≥${z.toFixed(1)}`;
    }
    return 'z-only';
  }
  if (typeof edge === 'number') {
    return `FV +${(edge * 100).toFixed(1)}¢`;
  }
  return 'FV';
}

