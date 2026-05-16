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
  active_strategy: 'prediction' | 'mid_market' | 'both' | 'none';
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
}

export interface RiskConfig {
  max_bet_pct: number;
  min_confidence: number;
  use_kelly: boolean;
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
