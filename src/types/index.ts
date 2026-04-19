/**
 * Central export file for all types
 */

export * from './api';
export * from './user';
export * from './trade';
export * from './market';
export * from './websocket';

/**
 * Common types
 */

/**
 * Generic pagination
 */
export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/**
 * Generic paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}

/**
 * Generic sort options
 */
export interface SortOptions<T = string> {
  field: T;
  order: 'asc' | 'desc';
}

/**
 * Generic filter options
 */
export type FilterOptions = Record<string, any>;

/**
 * Loading state
 */
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

/**
 * Async data wrapper
 */
export interface AsyncData<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Form state
 */
export interface FormState<T = any> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  isValid: boolean;
}

/**
 * Toast notification
 */
export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Modal state
 */
export interface ModalState {
  isOpen: boolean;
  title?: string;
  content?: React.ReactNode;
  onClose?: () => void;
}

/**
 * Risk level
 */
export type RiskLevel = 'conservative' | 'moderate' | 'aggressive';
