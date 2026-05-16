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
}

export interface MidMarketState {
  type: 'price_tick' | 'entry' | 'stop_sell' | 'stop_loss' | 'window_start' | 'window_end' | 'outcome' | 'heartbeat';
  up_price: number | null;
  down_price: number | null;
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
