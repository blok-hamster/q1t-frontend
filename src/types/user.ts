import type { RiskConfig } from './api';

/**
 * User model
 */
export interface User {
  _id: string;
  email: string;
  vault_uuid: string | null;
  wallet_address: string | null;
  twoFactorEnabled: boolean;
  twoFactorFailedAttempts: number;
  twoFactorLockedUntil: Date | null;
  isActive: boolean;
  isAdmin: boolean;
  accountStatus: 'active' | 'suspended' | 'pending';
  riskConfig: RiskConfig;
  createdAt: string;
  updatedAt: string;
}

/**
 * Auth state
 */
export interface AuthState {
  token: string | null;
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
}
