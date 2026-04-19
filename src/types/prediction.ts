import type { PriceSource } from './market';

/**
 * Prediction outcome
 */
export type PredictionOutcome = 'WIN' | 'LOSS' | 'PENDING';

/**
 * Prediction direction
 */
export type PredictionDirection = 'UP' | 'DOWN';

/**
 * AI Prediction
 */
export interface Prediction {
  _id?: string;
  timestamp_trigger: string;
  timestamp_target: string;
  market_start_time: string;
  market_end_time: string;
  direction: PredictionDirection;
  confidence: number;
  prob_up: number;
  strike_price: number;
  target_close: number;
  price_source: PriceSource;
  market_slug: string;

  // Resolution fields
  actual_close?: number;
  actual_direction?: PredictionDirection;
  outcome?: PredictionOutcome;
  resolved_at?: string;

  createdAt?: string;
  updatedAt?: string;
}

/**
 * Prediction statistics
 */
export interface PredictionStats {
  total: number;
  resolved: number;
  wins: number;
  losses: number;
  winRate: string;
}

/**
 * Prediction history response
 */
export interface PredictionHistory {
  predictions: Prediction[];
  stats: PredictionStats;
  pagination: {
    skip: number;
    limit: number;
    total: number;
  };
}
