import { api } from './client';
import { API_ENDPOINTS } from '@/lib/constants';
import type { TradeLedger } from '@/types/trade';

export interface MarketStats {
  trades: number;
  wins: number;
  losses: number;
  pnl: number;
}

export interface MidMarketDailyStats {
  daily_trades: number;
  daily_wins: number;
  daily_losses: number;
  daily_pnl: number;
  per_market: Record<string, MarketStats>;
}

/**
 * Execution API endpoints
 */
export const executionApi = {
  /**
   * Get trade history/ledger
   */
  getTrades: async (): Promise<TradeLedger> => {
    return api.get<TradeLedger>(API_ENDPOINTS.EXECUTION_LEDGER);
  },

  /**
   * Get mid-market daily stats (persisted in Redis)
   */
  getMidMarketStats: async (): Promise<MidMarketDailyStats> => {
    return api.get<MidMarketDailyStats>(API_ENDPOINTS.EXECUTION_MID_MARKET_STATS);
  },
};
