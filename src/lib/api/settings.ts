import { api } from './client';
import { API_ENDPOINTS } from '@/lib/constants';
import type {
  SettingsResponse,
  RiskConfig,
  RiskConfigUpdateResponse,
  MidMarketConfig,
  MidMarketConfigUpdateResponse,
  StrategySelection,
  MarketConfig,
  AiV2Config,
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
   * Get user risk configuration
   */
  getRiskConfig: async (): Promise<{ riskConfig: RiskConfig }> => {
    return api.get<{ riskConfig: RiskConfig }>(API_ENDPOINTS.SETTINGS_RISK_CONFIG);
  },

  /**
   * Update risk configuration, adaptive presets & 5m concurrent mode
   */
  updateRiskConfig: async (
    riskConfig: Partial<RiskConfig> & { sync_5m_concurrent?: 1 | 2 }
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
    privateKeyOrOptions:
      | string
      | {
          private_key: string;
          wallet_type?: 'eoa' | 'proxy';
          polymarket_funding_address?: string;
          totp_code?: string;
        },
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
    if (typeof privateKeyOrOptions === 'object') {
      return api.post(API_ENDPOINTS.SETTINGS_PRIVATE_KEY, privateKeyOrOptions);
    }
    return api.post(API_ENDPOINTS.SETTINGS_PRIVATE_KEY, {
      private_key: privateKeyOrOptions,
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
    wallet_type?: 'eoa' | 'proxy';
    proxy_wallet_address?: string;
    polymarket_funding_address?: string;
  }> => {
    return api.get(API_ENDPOINTS.SETTINGS_PRIVATE_KEY_CHECK);
  },

  hasPrivateKey: async (): Promise<{
    hasPrivateKey: boolean;
    wallet_address?: string;
    wallet_type?: 'eoa' | 'proxy';
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

  /**
   * Get mid-market momentum configuration
   */
  getMidMarketConfig: async (): Promise<{ midMarketConfig: MidMarketConfig }> => {
    return api.get(API_ENDPOINTS.SETTINGS_MID_MARKET_CONFIG);
  },

  /**
   * Update mid-market momentum configuration
   */
  updateMidMarketConfig: async (
    config: Partial<MidMarketConfig>
  ): Promise<MidMarketConfigUpdateResponse> => {
    return api.post<MidMarketConfigUpdateResponse>(
      API_ENDPOINTS.SETTINGS_MID_MARKET_CONFIG,
      config
    );
  },

  /**
   * Get strategy selection
   */
  getStrategySelection: async (): Promise<{
    strategySelection: StrategySelection;
    supportedMarkets: string[];
  }> => {
    return api.get(API_ENDPOINTS.SETTINGS_STRATEGY);
  },

  /**
   * Update strategy selection
   */
  updateStrategySelection: async (
    strategy: Partial<StrategySelection>
  ): Promise<{ message: string; strategySelection: StrategySelection }> => {
    return api.put(API_ENDPOINTS.SETTINGS_STRATEGY, strategy);
  },

  /**
   * Get all market configs
   */
  getMarketConfigs: async (): Promise<{
    marketConfigs: MarketConfig[];
    supportedMarkets: string[];
  }> => {
    return api.get(API_ENDPOINTS.SETTINGS_MARKETS);
  },

  /**
   * Get single market config
   */
  getMarketConfig: async (
    marketType: string
  ): Promise<{ marketConfig: MarketConfig | null; market_type?: string }> => {
    return api.get(API_ENDPOINTS.SETTINGS_MARKET(marketType));
  },

  /**
   * Update single market config
   */
  updateMarketConfig: async (
    marketType: string,
    config: Partial<MarketConfig>
  ): Promise<{ message: string; marketConfig: MarketConfig }> => {
    return api.put(API_ENDPOINTS.SETTINGS_MARKET(marketType), config);
  },

  /**
   * Update paper trading balance
   */
  updatePaperBalance: async (
    balance: number
  ): Promise<{ paperBalance: number }> => {
    return api.put(`${API_ENDPOINTS.SETTINGS}/paper-balance`, { balance });
  },

  /**
   * Reset paper trading balance
   */
  resetPaperBalance: async (
    amount?: number
  ): Promise<{ paperBalance: number }> => {
    return api.post(`${API_ENDPOINTS.SETTINGS}/paper-balance/reset`, { amount });
  },

  /**
   * Get all AI V2 per-market configs
   */
  getAiV2Configs: async (): Promise<{
    aiV2Configs: AiV2Config[];
    supportedMarkets: string[];
  }> => {
    return api.get(API_ENDPOINTS.SETTINGS_AI_V2);
  },

  /**
   * Get single AI V2 market config
   */
  getAiV2Config: async (
    marketType: string
  ): Promise<{ aiV2Config: AiV2Config | null; market_type?: string }> => {
    return api.get(API_ENDPOINTS.SETTINGS_AI_V2_MARKET(marketType));
  },

  /**
   * Update single AI V2 market config
   */
  updateAiV2Config: async (
    marketType: string,
    config: Partial<AiV2Config>
  ): Promise<{ message: string; aiV2Config: AiV2Config }> => {
    return api.put(API_ENDPOINTS.SETTINGS_AI_V2_MARKET(marketType), config);
  },
};
