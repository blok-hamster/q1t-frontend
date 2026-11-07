import type { TradeStatus } from './trade';
import type { Candle } from './market';
import type { Prediction } from './prediction';

/**
 * AI Signal from WebSocket (same as Prediction)
 */
export type AISignal = Prediction;

/**
 * Execution update from WebSocket
 */
export interface ExecutionUpdate {
  user_id: string;
  trade_id: string;
  status: TradeStatus;
  timestamp: string;
}

/**
 * Chart update from WebSocket (same as Candle)
 */
export type ChartUpdate = Candle;

/**
 * Mid-market real-time state from WebSocket
 */
export interface MidMarketPosition {
  direction: string;
  entry_price: number;
  shares: number;
  stop_price?: number;
  probe?: boolean;
  fair_value_at_entry?: number;
  fair_value_edge_at_entry?: number;
}

export interface MidMarketState {
  type: 'price_tick' | 'entry' | 'stop_sell' | 'stop_loss' | 'window_start' | 'window_end' | 'outcome' | 'heartbeat';
  market_type?: string;
  asset_price?: number;
  up_price: number | null;
  down_price: number | null;
  ask_up?: number | null;
  ask_down?: number | null;
  bid_up?: number | null;
  bid_down?: number | null;
  fair_value_up?: number;
  fair_value_down?: number;
  fv_edge_up?: number | null;
  fv_edge_down?: number | null;
  min_fv_edge?: number;
  entry_min_ask?: number;
  entry_max_ask?: number;
  fv_stop_prob?: number;
  fv_stop_bid?: number;
  btc_price: number;
  strike_price: number;
  price_distance: number;
  position: MidMarketPosition | null;
  window_start_ts: number;
  window_end_ts: number;
  time_remaining_seconds: number;
  daily_trades: number;
  daily_wins: number;
  daily_losses: number;
  daily_pnl: number;
  in_cooldown: boolean;
}

/**
 * WebSocket connection state
 */
export interface SocketState {
  socket: any | null;
  connected: boolean;
  reconnecting: boolean;
}

/**
 * WebSocket event handlers
 */
export interface SocketEventHandlers {
  onAISignal?: (signal: AISignal) => void;
  onExecutionUpdate?: (update: ExecutionUpdate) => void;
  onChartUpdate?: (candle: ChartUpdate) => void;
  onMidMarketUpdate?: (state: MidMarketState) => void;
  onConnect?: () => void;
  onDisconnect?: (reason: string) => void;
  onError?: (error: Error) => void;
}
