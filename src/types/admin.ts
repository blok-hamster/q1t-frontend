import type { RiskConfig } from './api';
import type { Trade } from './trade';

/**
 * Platform Statistics
 */
export interface PlatformStats {
  users: {
    total: number;
    active: number;
    suspended: number;
    withWallets: number;
  };
  trades: {
    total: number;
    pending: number;
    filled: number;
    failed: number;
    totalVolume: string;
    totalProfitLoss: string;
  };
  predictions: {
    total: number;
    resolved: number;
    wins: number;
    losses: number;
    winRate: string;
  };
  recentActivity: {
    users: RecentUser[];
    trades: RecentTrade[];
  };
}

/**
 * Recent User (for activity feed)
 */
export interface RecentUser {
  email: string;
  createdAt: string;
  accountStatus: 'active' | 'suspended' | 'pending';
}

/**
 * Recent Trade (for activity feed)
 */
export interface RecentTrade {
  _id: string;
  user_id: string;
  side: 'UP' | 'DOWN';
  size_usd: number;
  status: string;
  createdAt: string;
}

/**
 * Admin User (simplified user info for lists)
 */
export interface AdminUser {
  _id: string;
  email: string;
  wallet_address: string | null;
  isActive: boolean;
  isAdmin: boolean;
  accountStatus: 'active' | 'suspended' | 'pending';
  twoFactorEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * User Detail (extended info for detail page)
 */
export interface UserDetail extends AdminUser {
  vault_uuid: string;
  hasPrivateKey: boolean;
  riskConfig: RiskConfig;
  tradeStats: {
    total: number;
    pending: number;
    filled: number;
    failed: number;
    totalVolume: number;
  };
}

/**
 * User Portfolio (portfolio view)
 */
export interface UserPortfolio {
  user: AdminUser;
  portfolio: {
    totalInvested: number;
    totalProfit: number;
    roi: string;
    tradesCount: number;
    filledCount: number;
  };
  recentTrades: Trade[];
}

/**
 * Invite Response
 */
export interface InviteResponse {
  message: string;
  email: string;
  magicLink: string;
  expiresIn: string;
}

/**
 * Prediction Record
 */
export interface PredictionRecord {
  _id: string;
  direction: 'UP' | 'DOWN';
  confidence: number;
  strike_price: number;
  target_close: number;
  actual_close: number | null;
  outcome: 'WIN' | 'LOSS' | 'PENDING';
  market_slug: string;
  createdAt: string;
  resolved_at: string | null;
}

/**
 * Paginated Response
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

/**
 * Suspend User Request
 */
export interface SuspendUserRequest {
  reason?: string;
}

/**
 * User Action Response
 */
export interface UserActionResponse {
  message: string;
  user: AdminUser;
}
