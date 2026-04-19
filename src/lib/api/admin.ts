import { api } from './client';
import { API_ENDPOINTS } from '@/lib/constants';
import type {
  PlatformStats,
  AdminUser,
  UserDetail,
  UserPortfolio,
  InviteResponse,
  PredictionRecord,
  PaginatedResponse,
  UserActionResponse,
} from '@/types/admin';

/**
 * Admin API Client
 *
 * All endpoints require:
 * - Valid JWT token (authenticated)
 * - isAdmin: true
 * - accountStatus: 'active'
 */
export const adminApi = {
  /**
   * Get platform-wide statistics
   * @returns Platform stats including users, trades, predictions
   */
  getStats: async (): Promise<PlatformStats> => {
    return api.get(API_ENDPOINTS.ADMIN_STATS);
  },

  /**
   * Get list of all users with pagination and filtering
   * @param params Query parameters
   * @returns Paginated list of users
   */
  getUsers: async (params?: {
    page?: number;
    limit?: number;
    status?: 'active' | 'suspended' | 'pending' | 'all';
    search?: string;
  }): Promise<PaginatedResponse<AdminUser>> => {
    const queryParams = new URLSearchParams();

    if (params?.page) {
      queryParams.append('page', params.page.toString());
    }
    if (params?.limit) {
      queryParams.append('limit', params.limit.toString());
    }
    if (params?.status && params.status !== 'all') {
      queryParams.append('status', params.status);
    }
    if (params?.search) {
      queryParams.append('search', params.search);
    }

    const queryString = queryParams.toString();
    const endpoint = queryString
      ? `${API_ENDPOINTS.ADMIN_USERS}?${queryString}`
      : API_ENDPOINTS.ADMIN_USERS;

    const response = await api.get<{
      users: AdminUser[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>(endpoint);

    return {
      data: response.users,
      pagination: response.pagination,
    };
  },

  /**
   * Get detailed information about a specific user
   * @param userId User ID
   * @returns User detail with trade stats
   */
  getUserDetail: async (userId: string): Promise<UserDetail> => {
    const response = await api.get<{
      user: UserDetail;
      hasPrivateKey: boolean;
      tradeStats: {
        total: number;
        pending: number;
        filled: number;
        failed: number;
        totalVolume: number;
      };
    }>(API_ENDPOINTS.ADMIN_USER_DETAIL(userId));

    return {
      ...response.user,
      hasPrivateKey: response.hasPrivateKey,
      tradeStats: response.tradeStats,
    };
  },

  /**
   * Get user's portfolio information
   * @param userId User ID
   * @returns Portfolio summary and recent trades
   */
  getUserPortfolio: async (userId: string): Promise<UserPortfolio> => {
    return api.get<UserPortfolio>(API_ENDPOINTS.ADMIN_USER_PORTFOLIO(userId));
  },

  /**
   * Suspend a user account
   * @param userId User ID
   * @param reason Optional reason for suspension
   * @returns Success message and updated user
   */
  suspendUser: async (
    userId: string,
    reason?: string
  ): Promise<UserActionResponse> => {
    return api.post<UserActionResponse>(
      API_ENDPOINTS.ADMIN_USER_SUSPEND(userId),
      { reason }
    );
  },

  /**
   * Reactivate a suspended user account
   * @param userId User ID
   * @returns Success message and updated user
   */
  reactivateUser: async (userId: string): Promise<UserActionResponse> => {
    return api.post<UserActionResponse>(
      API_ENDPOINTS.ADMIN_USER_REACTIVATE(userId)
    );
  },

  /**
   * Create an invite link for a new user
   * @param email Email address to invite
   * @returns Magic link and expiration info
   */
  createInvite: async (email: string): Promise<InviteResponse> => {
    return api.post<InviteResponse>(API_ENDPOINTS.ADMIN_INVITES_CREATE, {
      email,
    });
  },

  /**
   * Get list of all predictions with pagination and filtering
   * @param params Query parameters
   * @returns Paginated list of predictions
   */
  getPredictions: async (params?: {
    page?: number;
    limit?: number;
    outcome?: 'WIN' | 'LOSS' | 'PENDING' | 'all';
  }): Promise<PaginatedResponse<PredictionRecord>> => {
    const queryParams = new URLSearchParams();

    if (params?.page) {
      queryParams.append('page', params.page.toString());
    }
    if (params?.limit) {
      queryParams.append('limit', params.limit.toString());
    }
    if (params?.outcome && params.outcome !== 'all') {
      queryParams.append('outcome', params.outcome);
    }

    const queryString = queryParams.toString();
    const endpoint = queryString
      ? `${API_ENDPOINTS.ADMIN_PREDICTIONS}?${queryString}`
      : API_ENDPOINTS.ADMIN_PREDICTIONS;

    const response = await api.get<{
      predictions: PredictionRecord[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>(endpoint);

    return {
      data: response.predictions,
      pagination: response.pagination,
    };
  },
};
