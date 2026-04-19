'use client';

import type { Socket } from 'socket.io-client';
import { WS_EVENTS } from '@/lib/constants';
import type {
  AISignal,
  ExecutionUpdate,
  ChartUpdate,
  SocketEventHandlers,
} from '@/types/websocket';

/**
 * Setup WebSocket event listeners
 */
export function setupSocketListeners(
  socket: Socket,
  handlers: SocketEventHandlers
) {
  // AI Signal updates
  if (handlers.onAISignal) {
    socket.on(WS_EVENTS.AI_SIGNAL_UPDATE, (signal: AISignal) => {
      console.log('📊 AI Signal received:', {
        direction: signal.direction,
        confidence: signal.confidence,
        market: signal.market_slug,
      });
      handlers.onAISignal?.(signal);
    });
  }

  // Execution updates
  if (handlers.onExecutionUpdate) {
    socket.on(WS_EVENTS.EXECUTION_UPDATE, (update: ExecutionUpdate) => {
      console.log('🔄 Execution update:', {
        trade_id: update.trade_id,
        status: update.status,
      });
      handlers.onExecutionUpdate?.(update);
    });
  }

  // Chart updates
  if (handlers.onChartUpdate) {
    socket.on(WS_EVENTS.CHART_UPDATE, (candle: ChartUpdate) => {
      // Only log closed candles to avoid spam
      if (candle.is_closed) {
        console.log('📈 Chart update (closed):', {
          time: candle.timestamp,
          close: candle.close,
        });
      }
      handlers.onChartUpdate?.(candle);
    });
  }

  // Connection handlers
  if (handlers.onConnect) {
    socket.on(WS_EVENTS.CONNECT, handlers.onConnect);
  }

  if (handlers.onDisconnect) {
    socket.on(WS_EVENTS.DISCONNECT, handlers.onDisconnect);
  }

  if (handlers.onError) {
    socket.on('error', handlers.onError);
  }

  return socket;
}

/**
 * Remove WebSocket event listeners
 */
export function removeSocketListeners(
  socket: Socket,
  handlers: SocketEventHandlers
) {
  if (handlers.onAISignal) {
    socket.off(WS_EVENTS.AI_SIGNAL_UPDATE);
  }

  if (handlers.onExecutionUpdate) {
    socket.off(WS_EVENTS.EXECUTION_UPDATE);
  }

  if (handlers.onChartUpdate) {
    socket.off(WS_EVENTS.CHART_UPDATE);
  }

  if (handlers.onConnect) {
    socket.off(WS_EVENTS.CONNECT);
  }

  if (handlers.onDisconnect) {
    socket.off(WS_EVENTS.DISCONNECT);
  }

  if (handlers.onError) {
    socket.off('error');
  }
}
