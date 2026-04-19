import { api } from './client';
import { API_ENDPOINTS } from '@/lib/constants';
import type {
  Balance,
  DepositAddressResponse,
  WithdrawResponse,
  PrivateKeyResponse,
} from '@/types/api';

/**
 * Portfolio API endpoints
 */
export const portfolioApi = {
  /**
   * Get user's wallet balances
   */
  getBalances: async (): Promise<Balance> => {
    return api.get<Balance>(API_ENDPOINTS.PORTFOLIO_BALANCES);
  },

  /**
   * Get user's deposit address
   */
  getDepositAddress: async (): Promise<DepositAddressResponse> => {
    return api.get<DepositAddressResponse>(API_ENDPOINTS.PORTFOLIO_DEPOSIT_ADDRESS);
  },

  /**
   * Withdraw USDC to external address
   */
  withdraw: async (
    to_address: string,
    amount_usd: number,
    totp_code?: string
  ): Promise<WithdrawResponse> => {
    return api.post<WithdrawResponse>(API_ENDPOINTS.PORTFOLIO_WITHDRAW, {
      to_address,
      amount_usd,
      ...(totp_code && { totp_code }),
    });
  },

  /**
   * Reveal private key (DANGEROUS)
   */
  getPrivateKey: async (totp_code?: string): Promise<PrivateKeyResponse> => {
    return api.post<PrivateKeyResponse>(API_ENDPOINTS.PORTFOLIO_PRIVATE_KEY, {
      ...(totp_code && { totp_code }),
    });
  },
};
