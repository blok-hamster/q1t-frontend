import { api } from './client';
import { API_ENDPOINTS } from '@/lib/constants';
import type { TradeLedger } from '@/types/trade';

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
};
