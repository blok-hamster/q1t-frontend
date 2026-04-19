import { api } from './client';
import { API_ENDPOINTS } from '@/lib/constants';

/**
 * Dashboard metrics response type
 */
export interface DashboardMetrics {
  balance: number;
  balanceChange: number;
  openTrades: number;
  pnl24h: number;
  pnl24hChange: number;
  winRate: number;
  winRateChange: number;
  timestamp: string;
}

/**
 * Transaction type
 */
export interface Transaction {
  id: string;
  type: 'trade_win' | 'trade_loss' | 'deposit' | 'withdrawal';
  amount: number;
  market?: string;
  direction?: string;
  status: 'completed' | 'pending' | 'failed';
  timestamp: string;
  pnl?: number;
}

/**
 * Transaction history response type
 */
export interface TransactionHistoryResponse {
  transactions: Transaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Portfolio position type
 */
export interface PortfolioPosition {
  id: string;
  market: string;
  direction: string;
  size: number;
  entryPrice: number | null;
  timestamp: string;
}

/**
 * Portfolio summary response type
 */
export interface PortfolioSummary {
  totalValue: number;
  openPositions: PortfolioPosition[];
  openPositionsValue: number;
  closedPositionsCount: number;
  allTimePnL: number;
  timestamp: string;
}

/**
 * Dashboard API endpoints
 */
export const dashboardApi = {
  /**
   * Get dashboard metrics
   */
  getMetrics: async (): Promise<DashboardMetrics> => {
    return api.get<DashboardMetrics>(API_ENDPOINTS.DASHBOARD_METRICS);
  },

  /**
   * Get transaction history
   */
  getTransactions: async (page: number = 1, limit: number = 10): Promise<TransactionHistoryResponse> => {
    return api.get<TransactionHistoryResponse>(
      `${API_ENDPOINTS.DASHBOARD_TRANSACTIONS}?page=${page}&limit=${limit}`
    );
  },

  /**
   * Get portfolio summary
   */
  getPortfolioSummary: async (): Promise<PortfolioSummary> => {
    return api.get<PortfolioSummary>(API_ENDPOINTS.DASHBOARD_PORTFOLIO);
  },
};
