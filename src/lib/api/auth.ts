import { api } from './client';
import { API_ENDPOINTS } from '@/lib/constants';
import type { AuthResponse, TwoFactorSetupResponse } from '@/types/api';

/**
 * Authentication API endpoints
 */
export const authApi = {
  /**
   * Register a new user
   */
  register: async (email: string, password: string): Promise<AuthResponse> => {
    return api.post<AuthResponse>(API_ENDPOINTS.AUTH_REGISTER, {
      email,
      password,
    });
  },

  /**
   * Login existing user
   */
  login: async (
    email: string,
    password: string,
    totp_code?: string
  ): Promise<AuthResponse> => {
    return api.post<AuthResponse>(API_ENDPOINTS.AUTH_LOGIN, {
      email,
      password,
      ...(totp_code && { totp_code }),
    });
  },

  /**
   * Verify magic link token (step 1: check if token is valid)
   */
  verifyMagicLink: async (token: string): Promise<{ message: string; email: string; userExists: boolean }> => {
    return api.post(API_ENDPOINTS.AUTH_VERIFY, {
      token,
    });
  },

  /**
   * Complete magic link registration (step 2: set password and create account)
   */
  completeMagicLinkRegistration: async (token: string, password: string): Promise<AuthResponse> => {
    return api.post<AuthResponse>(API_ENDPOINTS.AUTH_VERIFY_COMPLETE, {
      token,
      password,
    });
  },

  /**
   * Logout - Invalidate session
   */
  logout: async (): Promise<{ message: string }> => {
    return api.post(API_ENDPOINTS.AUTH_LOGOUT);
  },

  /**
   * Update user password
   */
  updatePassword: async (
    newPassword: string,
    totp_code?: string
  ): Promise<{ message: string }> => {
    return api.post(API_ENDPOINTS.AUTH_UPDATE_PASSWORD, {
      new_password: newPassword,
      ...(totp_code && { totp_code }),
    });
  },

  /**
   * Setup 2FA - Get QR code
   */
  setup2FA: async (): Promise<TwoFactorSetupResponse> => {
    const response = await api.post<{ secret: string; otpauth_url: string; message: string }>(
      API_ENDPOINTS.AUTH_SETUP_2FA
    );

    // Transform backend response to match frontend expectations
    return {
      secret: response.secret,
      qrCodeUrl: response.otpauth_url,
      manualEntryKey: response.secret, // Same as secret
    };
  },

  /**
   * Verify 2FA code and enable 2FA
   */
  verify2FA: async (totp_code: string): Promise<{ message: string }> => {
    return api.post(API_ENDPOINTS.AUTH_VERIFY_2FA, { code: totp_code });
  },

  /**
   * Disable 2FA
   */
  disable2FA: async (totp_code: string): Promise<{ message: string }> => {
    return api.post(API_ENDPOINTS.AUTH_DISABLE_2FA, { code: totp_code });
  },
};
