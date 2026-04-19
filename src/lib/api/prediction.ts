import { api } from './client';
import { API_ENDPOINTS } from '@/lib/constants';
import type { Prediction, PredictionHistory, PredictionStats } from '@/types/prediction';

/**
 * Prediction API endpoints
 */
export const predictionApi = {
  /**
   * Get the current active prediction
   */
  getCurrent: async (): Promise<{ prediction: Prediction } | null> => {
    try {
      return await api.get<{ prediction: Prediction }>(API_ENDPOINTS.PREDICTIONS_CURRENT);
    } catch (error: any) {
      // 404 means no active prediction - return null instead of throwing
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  /**
   * Get prediction history with statistics
   */
  getHistory: async (params?: {
    limit?: number;
    skip?: number;
  }): Promise<PredictionHistory> => {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.skip) queryParams.set('skip', params.skip.toString());

    const url = queryParams.toString()
      ? `${API_ENDPOINTS.PREDICTIONS_HISTORY}?${queryParams}`
      : API_ENDPOINTS.PREDICTIONS_HISTORY;

    return api.get<PredictionHistory>(url);
  },

  /**
   * Get a specific prediction by ID
   */
  getById: async (id: string): Promise<{ prediction: Prediction }> => {
    return api.get<{ prediction: Prediction }>(API_ENDPOINTS.PREDICTIONS_BY_ID(id));
  },
};
