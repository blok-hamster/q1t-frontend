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
  // Dynamic stop-loss (symmetric R:R)
  dynamic_stop_enabled?: boolean;
  target_rr_ratio?: number;
  min_stop_floor?: number;
  min_rr_ratio?: number;
  // Retrace limit entry
  retrace_entry_enabled?: boolean;
  limit_entry_price?: number;
  // Scalp strategy
  scalp_enabled?: boolean;
  scalp_max_entry?: number;
  scalp_min_entry?: number;
  scalp_tp_delta?: number;
  scalp_sl_delta?: number;
  scalp_max_hold_seconds?: number;
  scalp_num_shares?: number;
  scalp_watch_start?: number;
  scalp_watch_end?: number;
  scalp_mqs_enabled?: boolean;
  scalp_mqs_max?: number;
  // Scalp dynamic stop
  scalp_dynamic_stop_enabled?: boolean;
  scalp_sl_pct?: number;
  scalp_min_sl_delta?: number;
  scalp_min_rr?: number;
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
