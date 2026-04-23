/**
 * Application constants and configuration
 */

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'q1t Trading Platform';
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
export const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';

/**
 * API Endpoints
 */
export const API_ENDPOINTS = {
  // Auth
  AUTH_REGISTER: '/api/auth/register',
  AUTH_LOGIN: '/api/auth/login',
  AUTH_LOGOUT: '/api/auth/logout',
  AUTH_VERIFY: '/api/auth/verify',
  AUTH_VERIFY_COMPLETE: '/api/auth/verify/complete',
  AUTH_UPDATE_PASSWORD: '/api/auth/password',
  AUTH_SETUP_2FA: '/api/auth/2fa/setup',
  AUTH_VERIFY_2FA: '/api/auth/2fa/verify',
  AUTH_DISABLE_2FA: '/api/auth/2fa/disable',

  // Portfolio
  PORTFOLIO_BALANCES: '/api/portfolio/balances',
  PORTFOLIO_DEPOSIT_ADDRESS: '/api/portfolio/deposit-address',
  PORTFOLIO_WITHDRAW: '/api/portfolio/withdraw',
  PORTFOLIO_PRIVATE_KEY: '/api/portfolio/private-key',

  // Execution
  EXECUTION_LEDGER: '/api/execution/ledger',

  // Market
  MARKET_DETAILS: (slug: string) => `/api/market/${slug}`,
  MARKET_ORDERBOOK: (slug: string) => `/api/market/${slug}/orderbook`,

  // Settings
  SETTINGS: '/api/settings',
  SETTINGS_RISK_CONFIG: '/api/settings/risk-config',
  SETTINGS_PRIVATE_KEY: '/api/settings/private-key',
  SETTINGS_PRIVATE_KEY_CHECK: '/api/settings/private-key/check',
  SETTINGS_TRADING_TOGGLE: '/api/settings/trading/toggle',
  SETTINGS_TRADING_STATUS: '/api/settings/trading/status',
  SETTINGS_AUTO_CLAIM: '/api/settings/auto-claim',

  // Predictions
  PREDICTIONS_CURRENT: '/api/predictions/current',
  PREDICTIONS_HISTORY: '/api/predictions/history',
  PREDICTIONS_ACCURACY: '/api/predictions/accuracy',
  PREDICTIONS_BY_ID: (id: string) => `/api/predictions/${id}`,

  // Dashboard
  DASHBOARD_METRICS: '/api/dashboard/metrics',
  DASHBOARD_TRANSACTIONS: '/api/dashboard/transactions',
  DASHBOARD_PORTFOLIO: '/api/dashboard/portfolio',

  // Health
  HEALTH: '/health',
  HEALTH_DETAILED: '/health/detailed',

  // Admin
  ADMIN_STATS: '/api/admin/stats',
  ADMIN_USERS: '/api/admin/users',
  ADMIN_USER_DETAIL: (userId: string) => `/api/admin/users/${userId}`,
  ADMIN_USER_PORTFOLIO: (userId: string) => `/api/admin/users/${userId}/portfolio`,
  ADMIN_USER_SUSPEND: (userId: string) => `/api/admin/users/${userId}/suspend`,
  ADMIN_USER_REACTIVATE: (userId: string) => `/api/admin/users/${userId}/reactivate`,
  ADMIN_INVITES_CREATE: '/api/admin/invites/create',
  ADMIN_PREDICTIONS: '/api/admin/predictions',
  ADMIN_PREDICTIONS_EXPORT: '/api/admin/predictions/export',
} as const;

/**
 * WebSocket Events
 */
export const WS_EVENTS = {
  // Client -> Server
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',

  // Server -> Client
  AI_SIGNAL_UPDATE: 'ai_signal_update',
  EXECUTION_UPDATE: 'execution_update',
  CHART_UPDATE: 'chart_update',
} as const;

/**
 * Trade statuses
 */
export const TRADE_STATUS = {
  DRAFT: 'DRAFT',
  PENDING: 'PENDING',
  OPEN: 'OPEN',
  CLOSED_WIN: 'CLOSED_WIN',
  CLOSED_LOSS: 'CLOSED_LOSS',
  REJECTED: 'REJECTED',
} as const;

/**
 * Trade status labels
 */
export const TRADE_STATUS_LABELS: Record<keyof typeof TRADE_STATUS, string> = {
  DRAFT: 'Draft',
  PENDING: 'Pending',
  OPEN: 'Open',
  CLOSED_WIN: 'Win',
  CLOSED_LOSS: 'Loss',
  REJECTED: 'Rejected',
};

/**
 * Trade status colors (Tailwind classes)
 */
export const TRADE_STATUS_COLORS: Record<keyof typeof TRADE_STATUS, { text: string; bg: string }> = {
  DRAFT: { text: 'text-text-tertiary', bg: 'bg-white/5' },
  PENDING: { text: 'text-neutral', bg: 'bg-neutral/20' },
  OPEN: { text: 'text-accent-primary', bg: 'bg-accent-muted' },
  CLOSED_WIN: { text: 'text-positive', bg: 'bg-positive/20' },
  CLOSED_LOSS: { text: 'text-negative', bg: 'bg-negative/20' },
  REJECTED: { text: 'text-negative', bg: 'bg-negative/20' },
};

/**
 * Trade directions
 */
export const TRADE_DIRECTIONS = {
  UP: 'UP',
  DOWN: 'DOWN',
} as const;

/**
 * Chart timeframes
 */
export const CHART_TIMEFRAMES = [
  { value: '1m', label: '1m' },
  { value: '5m', label: '5m' },
  { value: '15m', label: '15m' },
  { value: '1h', label: '1h' },
  { value: '4h', label: '4h' },
  { value: '1d', label: '1d' },
] as const;

/**
 * Risk levels
 */
export const RISK_LEVELS = {
  CONSERVATIVE: 'conservative',
  MODERATE: 'moderate',
  AGGRESSIVE: 'aggressive',
} as const;

/**
 * Risk level thresholds
 */
export const RISK_LEVEL_THRESHOLDS = {
  conservative: 30,
  moderate: 60,
} as const;

/**
 * Design tokens (from brand guide)
 */
export const DESIGN_TOKENS = {
  colors: {
    bg: {
      primary: '#0A0B0D',
      secondary: '#13151A',
      tertiary: '#1C1E26',
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#8B8D98',
      tertiary: '#5A5C66',
      disabled: '#3A3C44',
    },
    accent: {
      primary: '#00D4FF',
      hover: '#00B8E6',
      muted: 'rgba(0, 212, 255, 0.15)',
    },
    positive: '#00FF88',
    negative: '#FF3366',
    neutral: '#FFB800',
  },
  spacing: {
    xs: '8px',
    sm: '12px',
    md: '16px',
    lg: '20px',
    xl: '24px',
    xxl: '32px',
  },
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
  },
  fontSize: {
    xs: '10px',
    sm: '12px',
    base: '14px',
    lg: '16px',
    xl: '18px',
    '2xl': '20px',
    '3xl': '24px',
    '4xl': '28px',
  },
  fontWeight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  shadows: {
    sm: '0 1px 3px rgba(0, 0, 0, 0.3)',
    md: '0 4px 12px rgba(0, 0, 0, 0.3)',
    lg: '0 8px 24px rgba(0, 0, 0, 0.4)',
    xl: '0 16px 48px rgba(0, 0, 0, 0.5)',
  },
  transitions: {
    fast: '200ms',
    normal: '300ms',
    slow: '500ms',
  },
} as const;

/**
 * Breakpoints (from brand guide)
 */
export const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1440,
} as const;

/**
 * Local storage keys
 */
export const STORAGE_KEYS = {
  TOKEN: 'token',
  REMEMBER_ME: 'rememberMe',
  THEME: 'theme',
  SELECTED_TIMEFRAME: 'selectedTimeframe',
} as const;

/**
 * Navigation routes
 */
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  VERIFY: '/verify',
  SETUP_2FA: '/setup-2fa',
  DASHBOARD: '/dashboard',
  PORTFOLIO: '/portfolio',
  TRADES: '/trades',
  SETTINGS: '/settings',
  // Admin routes
  ADMIN: '/admin',
  ADMIN_USERS: '/admin/users',
  ADMIN_USER_DETAIL: (userId: string) => `/admin/users/${userId}`,
  ADMIN_INVITES: '/admin/invites',
  ADMIN_PREDICTIONS: '/admin/predictions',
} as const;

/**
 * Protected routes (require authentication)
 */
export const PROTECTED_ROUTES = [
  ROUTES.DASHBOARD,
  ROUTES.PORTFOLIO,
  ROUTES.TRADES,
  ROUTES.SETTINGS,
  ROUTES.SETUP_2FA,
];

/**
 * Public routes (no authentication required)
 */
export const PUBLIC_ROUTES = [
  ROUTES.HOME,
  ROUTES.LOGIN,
  ROUTES.REGISTER,
  ROUTES.VERIFY,
];

/**
 * Pagination
 */
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
} as const;

/**
 * Toast notification durations (ms)
 */
export const TOAST_DURATION = {
  SHORT: 3000,
  MEDIUM: 4000,
  LONG: 6000,
  ERROR: 10000,
} as const;

/**
 * Feature flags
 */
export const FEATURES = {
  ENABLE_2FA: process.env.NEXT_PUBLIC_ENABLE_2FA === 'true',
  ENABLE_ANALYTICS: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
} as const;

/**
 * Default risk configuration
 */
export const DEFAULT_RISK_CONFIG = {
  max_bet_pct: 0.05, // 5%
  min_confidence: 0.60, // 60%
  use_kelly: true,
} as const;

/**
 * Risk configuration limits
 */
export const RISK_CONFIG_LIMITS = {
  max_bet_pct: {
    min: 0.01, // 1%
    max: 0.50, // 50%
    step: 0.01,
  },
  min_confidence: {
    min: 0.50, // 50%
    max: 0.95, // 95%
    step: 0.01,
  },
} as const;
