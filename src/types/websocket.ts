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
 * WebSocket connection state
 */
export interface SocketState {
  socket: any | null; // Socket.io socket
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
  onConnect?: () => void;
  onDisconnect?: (reason: string) => void;
  onError?: (error: Error) => void;
}
