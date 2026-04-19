/**
 * Candle data for charts
 */
export interface Candle {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  amount: number;
  is_closed: boolean;
}

/**
 * Lightweight charts candle format
 */
export interface LightweightCandle {
  time: number; // Unix timestamp in seconds
  open: number;
  high: number;
  low: number;
  close: number;
}

/**
 * Chart timeframe
 */
export type ChartTimeframe = '1m' | '5m' | '15m' | '1h' | '4h' | '1d';

/**
 * Price source
 */
export type PriceSource =
  | 'chainlink_data_streams'
  | 'chainlink_price_feed'
  | 'binance_spot';

/**
 * Market details
 */
export interface Market {
  slug: string;
  question: string;
  end_date: string;
  yes_price: number;
  no_price: number;
  volume: number;
  liquidity: number;
}
