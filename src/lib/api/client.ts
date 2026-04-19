import { ApiException } from '@/types/api';
import { API_BASE_URL } from '@/lib/constants';

/**
 * Base API client with error handling and authentication
 */
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // Get token from localStorage (only on client side)
  const token = typeof window !== 'undefined'
    ? localStorage.getItem('token')
    : null;

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });

    // Handle rate limit headers
    const rateLimitRemaining = response.headers.get('RateLimit-Remaining');
    const rateLimitReset = response.headers.get('RateLimit-Reset');

    if (rateLimitRemaining && parseInt(rateLimitRemaining) < 5) {
      const resetDate = rateLimitReset
        ? new Date(parseInt(rateLimitReset) * 1000)
        : new Date();

      console.warn(
        `⚠️ API rate limit warning: ${rateLimitRemaining} requests remaining. ` +
        `Resets at ${resetDate.toLocaleTimeString()}`
      );
    }

    // Parse JSON response
    const data = await response.json().catch(() => ({}));

    // Handle error responses
    if (!response.ok) {
      const error = new ApiException(
        response.status,
        data.error || 'An error occurred',
        data
      );

      // Log error for debugging
      console.error('API Error:', {
        endpoint,
        status: response.status,
        error: error.error,
        details: error.details,
      });

      throw error;
    }

    return data;
  } catch (error) {
    // Re-throw API exceptions
    if (error instanceof ApiException) {
      throw error;
    }

    // Network errors
    console.error('Network error:', error);
    throw new ApiException(
      0,
      'Network error occurred. Please check your connection.',
      { originalError: error }
    );
  }
}

/**
 * HTTP Methods
 */
export const api = {
  /**
   * GET request
   */
  get: <T>(endpoint: string, options?: RequestInit) =>
    apiCall<T>(endpoint, {
      method: 'GET',
      ...options,
    }),

  /**
   * POST request
   */
  post: <T>(endpoint: string, body?: any, options?: RequestInit) =>
    apiCall<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    }),

  /**
   * PUT request
   */
  put: <T>(endpoint: string, body?: any, options?: RequestInit) =>
    apiCall<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    }),

  /**
   * DELETE request
   */
  delete: <T>(endpoint: string, options?: RequestInit) =>
    apiCall<T>(endpoint, {
      method: 'DELETE',
      ...options,
    }),

  /**
   * PATCH request
   */
  patch: <T>(endpoint: string, body?: any, options?: RequestInit) =>
    apiCall<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    }),
};

/**
 * Token management utilities
 */
export const tokenUtils = {
  get: () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  },

  set: (token: string) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('token', token);
  },

  remove: () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('token');
  },

  isValid: (): boolean => {
    const token = tokenUtils.get();
    if (!token) return false;

    try {
      // Decode JWT token (basic check, not cryptographic verification)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Date.now() / 1000;

      // Check if token is expired
      if (payload.exp && payload.exp < now) {
        tokenUtils.remove();
        return false;
      }

      return true;
    } catch {
      tokenUtils.remove();
      return false;
    }
  },
};
