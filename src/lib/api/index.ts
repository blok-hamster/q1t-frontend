/**
 * Central export for all API modules
 */

export * from './client';
export * from './auth';
export * from './portfolio';
export * from './execution';
export * from './market';
export * from './settings';
export * from './prediction';
export * from './admin';
export * from './dashboard';

// Re-export for convenience
export { api } from './client';
export { authApi } from './auth';
export { portfolioApi } from './portfolio';
export { executionApi } from './execution';
export { marketApi } from './market';
export { settingsApi } from './settings';
export { predictionApi } from './prediction';
export { adminApi } from './admin';
export { dashboardApi } from './dashboard';
