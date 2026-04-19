import { api } from './client';
import { API_ENDPOINTS } from '@/lib/constants';
import type { MarketDetails, Orderbook } from '@/types/api';

/**
 * Market API endpoints
 */
export const marketApi = {
  /**
   * Get market details by slug
   */
  getMarket: async (slug: string): Promise<MarketDetails> => {
    return api.get<MarketDetails>(API_ENDPOINTS.MARKET_DETAILS(slug));
  },

  /**
   * Get CLOB orderbook for market
   */
  getOrderbook: async (slug: string): Promise<Orderbook> => {
    return api.get<Orderbook>(API_ENDPOINTS.MARKET_ORDERBOOK(slug));
  },
};
