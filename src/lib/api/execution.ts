import { api } from './client';
import { API_ENDPOINTS } from '@/lib/constants';
import type { TradeLedger } from '@/types/trade';

export interface MarketStats {
  trades: number;
  wins: number;
  losses: number;
  pnl: number;
}

export interface PositionInfo {
  direction: string;
  entry_price: number;
  num_shares?: number;
}

export interface MidMarketDailyStats {
  daily_trades: number;
  daily_wins: number;
  daily_losses: number;
  daily_pnl: number;
  per_market: Record<string, MarketStats>;
  positions: Record<string, PositionInfo>;
}

export interface ScalpPositionInfo {
  direction: string;
  entry_price: number;
  num_shares?: number;
  take_profit_price?: number;
  stop_loss_price?: number;
  max_hold_until?: number;
}

export interface ScalpDailyStats {
  daily_trades: number;
  daily_wins: number;
  daily_losses: number;
  daily_pnl: number;
  per_market: Record<string, MarketStats>;
  positions: Record<string, ScalpPositionInfo>;
}

/**
 * Execution API endpoints
 */
export const executionApi = {
  /**
   * Get trade history/ledger with optional cursor pagination
   */
  getTrades: async (params?: { cursor?: string; limit?: number; strategy?: string }): Promise<TradeLedger> => {
    const query = new URLSearchParams();
    if (params?.cursor) query.set('cursor', params.cursor);
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.strategy) query.set('strategy', params.strategy);
    const qs = query.toString();
    return api.get<TradeLedger>(`${API_ENDPOINTS.EXECUTION_LEDGER}${qs ? `?${qs}` : ''}`);
  },

  /**
   * Get mid-market daily stats (persisted in Redis)
   */
  getMidMarketStats: async (): Promise<MidMarketDailyStats> => {
    return api.get<MidMarketDailyStats>(API_ENDPOINTS.EXECUTION_MID_MARKET_STATS);
  },

  /**
   * Get scalp strategy daily stats
   */
  getScalpStats: async (): Promise<ScalpDailyStats> => {
    return api.get<ScalpDailyStats>(API_ENDPOINTS.EXECUTION_SCALP_STATS);
  },
};
