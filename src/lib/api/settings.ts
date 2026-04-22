import { api } from './client';
import { API_ENDPOINTS } from '@/lib/constants';
import type {
  SettingsResponse,
  RiskConfig,
  RiskConfigUpdateResponse,
} from '@/types/api';

/**
 * Settings API endpoints
 */
export const settingsApi = {
  /**
   * Get user settings
   */
  getSettings: async (): Promise<SettingsResponse> => {
    return api.get<SettingsResponse>(API_ENDPOINTS.SETTINGS);
  },

  /**
   * Update risk configuration
   */
  updateRiskConfig: async (
    riskConfig: RiskConfig
  ): Promise<RiskConfigUpdateResponse> => {
    return api.post<RiskConfigUpdateResponse>(
      API_ENDPOINTS.SETTINGS_RISK_CONFIG,
      riskConfig
    );
  },

  /**
   * Store private key in Vault with wallet type support
   */
  storePrivateKey: async (
    private_key: string,
    wallet_type: 'eoa' | 'proxy' = 'eoa',
    polymarket_funding_address?: string,
    totp_code?: string
  ): Promise<{
    message: string;
    wallet_address: string;
    wallet_type: string;
    proxy_wallet_address?: string;
    polymarket_funding_address?: string;
    requires_pol: boolean;
  }> => {
    return api.post(API_ENDPOINTS.SETTINGS_PRIVATE_KEY, {
      private_key,
      wallet_type,
      ...(polymarket_funding_address && { polymarket_funding_address }),
      ...(totp_code && { totp_code }),
    });
  },

  /**
   * Check if user has private key stored
   */
  checkPrivateKey: async (): Promise<{
    hasPrivateKey: boolean;
    wallet_address?: string;
    wallet_type?: string;
    proxy_wallet_address?: string;
    polymarket_funding_address?: string;
  }> => {
    return api.get(API_ENDPOINTS.SETTINGS_PRIVATE_KEY_CHECK);
  },

  /**
   * Get wallet funding requirements based on wallet type
   */
  getWalletRequirements: async (): Promise<{
    wallet_type: string;
    requires_pol: boolean;
    requires_usdc: boolean;
    funding_instructions: any;
  }> => {
    return api.get(`${API_ENDPOINTS.SETTINGS}/wallet-requirements`);
  },

  /**
   * Toggle active trading on/off
   */
  toggleTrading: async (
    enabled: boolean
  ): Promise<{ message: string; isActive: boolean }> => {
    return api.post(API_ENDPOINTS.SETTINGS_TRADING_TOGGLE, { enabled });
  },

  /**
   * Get trading status
   */
  getTradingStatus: async (): Promise<{
    isActive: boolean;
    hasPrivateKey: boolean;
    wallet_address?: string;
  }> => {
    return api.get(API_ENDPOINTS.SETTINGS_TRADING_STATUS);
  },

  /**
   * Toggle auto-claim on/off
   */
  toggleAutoClaim: async (
    enabled: boolean
  ): Promise<{ message: string; auto_claim: boolean }> => {
    return api.post(API_ENDPOINTS.SETTINGS_AUTO_CLAIM, { enabled });
  },
};
