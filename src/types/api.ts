/**
 * API Response and Request Types
 */

/**
 * Standard API error response
 */
export interface ApiError {
  error: string;
  details?: any;
  code?: string;
}

/**
 * API exception class
 */
export class ApiException extends Error {
  constructor(
    public statusCode: number,
    public error: string,
    public details?: any
  ) {
    super(error);
    this.name = 'ApiException';
  }
}

/**
 * Auth responses
 */
export interface AuthResponse {
  message: string;
  token: string;
}

export interface TwoFactorSetupResponse {
  secret: string;
  qrCodeUrl: string;
  manualEntryKey: string;
}

export interface TwoFactorRequiredError extends ApiError {
  requires2FA: true;
}

export interface TwoFactorInvalidError extends ApiError {
  attemptsRemaining: number;
}

/**
 * Portfolio responses
 */
export interface Balance {
  matic: number;
  usdc: number;
  totalUsd: number;
}

export interface DepositAddressResponse {
  address: string;
  wallet_type?: 'eoa' | 'proxy';
}

export interface WithdrawResponse {
  message: string;
  txHash: string;
}

export interface PrivateKeyResponse {
  private_key: string;
}

/**
 * Settings responses
 */
export interface SettingsResponse {
  email: string;
  twoFactorEnabled: boolean;
  riskConfig: RiskConfig;
  midMarketConfig: MidMarketConfig;
  strategySelection: StrategySelection;
  marketConfigs: MarketConfig[];
  aiV2Configs: AiV2Config[];
  isActive: boolean;
  hasPrivateKey: boolean;
  wallet_address: string | null;
  wallet_type: 'eoa' | 'proxy';
  proxy_wallet_address: string | null;
  polymarket_funding_address: string | null;
  requires_pol: boolean;
  isAdmin: boolean;
  accountStatus: 'active' | 'suspended' | 'pending';
  auto_claim: boolean;
  vault_uuid: string | null;
}

export interface StrategySelection {
  active_strategies: string[];
  mid_market_markets: string[];
}

export interface MarketConfig {
  market_type: string;
  enabled: boolean;
  entry_share_price: number;
  max_entry_price: number;
  stop_loss_price?: number;
  num_shares: number;
  max_daily_trades: number;
  max_concurrent: number;
  cooldown_after_stop_seconds: number;
  watch_start_seconds: number;
  watch_end_seconds: number;
  // Model D: Black-Scholes Binary Fair-Value Alpha
  fair_value_enabled?: boolean;
  min_fair_value_edge?: number;
  fair_value_sigma?: number;
  fair_value_stop_prob?: number;
  fair_value_stop_bid?: number;
  // Kronos volatility gating
  volatility_gate_enabled: boolean;
  min_kronos_spread: number;
  // Fade mode
  fade_enabled: boolean;
  fade_vol_ceiling: number;
  fade_trigger_price: number;
  fade_mqs_max: number;
  fade_num_shares: number;
  fade_stop_loss: number;
  // Stop-loss debounce
  stop_loss_debounce_ticks?: number;
  // Order execution buffers
  fok_buffer_cents?: number;
  sell_buffer_cents?: number;
  blocked_hours_utc?: number[];
  max_losses_per_window?: number;
  entry_dedup_seconds?: number;
  // Coin streak: auto-pause cold coins and resume only after a win streak
  streak_enabled?: boolean;
  streak_lookback?: number;
  streak_min_wins?: number;
  streak_resume_wins?: number;
  streak_probe_shares?: number;
  // Tail breaker & Auto-scale
  breaker_enabled?: boolean;
  breaker_window_count?: number;
  breaker_threshold?: number;
  breaker_hold_windows?: number;
  auto_scale_enabled?: boolean;
  auto_scale_min_shares?: number;
  auto_scale_target_shares?: number;
  auto_scale_lookback_hours?: number;
  auto_scale_promote_hours?: number;
  auto_scale_min_trades?: number;
  auto_scale_promote_min_trades?: number;
  auto_scale_flip_hold_minutes?: number;
  auto_scale_wr_promote?: number;
  auto_scale_stop_rate_promote?: number;
  auto_scale_wr_demote?: number;
  auto_scale_stop_rate_demote?: number;
  auto_scale_eval_seconds?: number;
  // Reversal-fade suppression: skip entering the opposite side of a window the user already won.
  reversal_fade_suppress_enabled?: boolean;
}

export interface AiV2Config {
  market_type: string;
  enabled: boolean;
  entry_price_min: number;
  entry_price_max: number;
  take_profit_price: number;
  stop_loss_delta: number;
  min_stop_floor: number;
  num_shares: number;
  max_daily_trades: number;
  max_concurrent: number;
  cooldown_after_loss_seconds: number;
  sl_debounce_ticks: number;
  exit_before_end_seconds: number;
}

export interface RiskConfig {
  max_bet_pct: number;
  min_confidence: number;
  use_kelly: boolean;
  use_adaptive_sizing?: boolean;
  adaptive_min_shares?: number;
  adaptive_max_shares?: number;
}

export interface RiskConfigUpdateResponse {
  message: string;
  riskConfig: RiskConfig;
}

export interface MidMarketConfig {
  enabled: boolean;
  entry_share_price: number;
  min_price_distance: number;
  max_entry_price: number;
  stop_loss_price: number;
  num_shares: number;
  max_daily_trades: number;
  max_concurrent: number;
  cooldown_after_stop_seconds: number;
  watch_start_seconds: number;
  watch_end_seconds: number;
  mqs_enabled: boolean;
  mqs_threshold: number;
}

export interface MidMarketConfigUpdateResponse {
  message: string;
  midMarketConfig: MidMarketConfig;
}

/**
 * Market responses
 */
export interface MarketDetails {
  slug: string;
  question: string;
  end_date: string;
  yes_price: number;
  no_price: number;
  volume: number;
  liquidity: number;
}

export interface OrderbookLevel {
  price: number;
  size: number;
}

export interface Orderbook {
  bids: OrderbookLevel[];
  asks: OrderbookLevel[];
  spread: number;
  mid_price: number;
}

/**
 * Health check responses
 */
export interface HealthResponse {
  status: 'healthy' | 'degraded';
  service: string;
}

export interface DependencyHealth {
  service: string;
  healthy: boolean;
  latency: number;
  error?: string;
}

export interface DetailedHealthResponse extends HealthResponse {
  dependencies: {
    'ai-service': DependencyHealth;
    'execution-service': DependencyHealth;
  };
  timestamp: string;
}
