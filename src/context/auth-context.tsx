'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import { useRouter } from 'next/navigation';
import { authApi, settingsApi, tokenUtils } from '@/lib/api';
import type { User } from '@/types/user';
import { ROUTES } from '@/lib/constants';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, totpCode?: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  /**
   * Fetch user data
   */
  const fetchUser = useCallback(async () => {
    try {
      const userData = await settingsApi.getSettings();
      setUser(userData as any); // Cast to User type
    } catch (error) {
      console.error('Failed to fetch user:', error);
      // Token might be invalid, clear it
      tokenUtils.remove();
      setToken(null);
      setUser(null);
    }
  }, []);

  /**
   * Initialize auth state on mount
   */
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = tokenUtils.get();

      if (savedToken && tokenUtils.isValid()) {
        setToken(savedToken);
        await fetchUser();
      }

      setLoading(false);
    };

    initAuth();
  }, [fetchUser]);

  /**
   * Login
   */
  const login = async (
    email: string,
    password: string,
    totpCode?: string
  ) => {
    try {
      const response = await authApi.login(email, password, totpCode);

      setToken(response.token);
      tokenUtils.set(response.token);

      await fetchUser();

      // Redirect to dashboard
      router.push(ROUTES.DASHBOARD);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  /**
   * Register
   */
  const register = async (email: string, password: string) => {
    try {
      const response = await authApi.register(email, password);

      setToken(response.token);
      tokenUtils.set(response.token);

      await fetchUser();

      // Redirect to dashboard
      router.push(ROUTES.DASHBOARD);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  /**
   * Logout
   */
  const logout = async () => {
    try {
      // Call backend to invalidate session
      await authApi.logout();
    } catch (error) {
      console.error('Logout API call failed:', error);
      // Continue with local logout even if API call fails
    } finally {
      // Clear local state regardless of API call result
      setToken(null);
      setUser(null);
      tokenUtils.remove();

      // Redirect to home
      router.push(ROUTES.HOME);
    }
  };

  /**
   * Refresh user data
   */
  const refreshUser = async () => {
    if (token) {
      await fetchUser();
    }
  };

  const value: AuthContextType = {
    user,
    token,
    loading,
    isAuthenticated: !!token && !!user,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to use auth context
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
