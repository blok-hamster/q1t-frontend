'use client';

import { io, Socket } from 'socket.io-client';
import { WS_URL } from '@/lib/constants';

/**
 * Create and configure Socket.io client
 */
export function createSocket(token: string): Socket {
  console.log('🔌 Connecting to WebSocket:', WS_URL);

  const socket = io(WS_URL, {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
    timeout: 10000,
  });

  // Connection event handlers
  socket.on('connect', () => {
    console.log('✅ WebSocket connected:', socket.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('❌ WebSocket disconnected:', reason);

    if (reason === 'io server disconnect') {
      // Server disconnected, try to reconnect
      socket.connect();
    }
  });

  socket.on('connect_error', (error) => {
    console.error('🔴 WebSocket connection error:', error.message);
  });

  socket.on('reconnect_attempt', (attempt) => {
    console.log(`🔄 Reconnection attempt ${attempt}...`);
  });

  socket.on('reconnect', (attempt) => {
    console.log(`✅ Reconnected after ${attempt} attempts`);
  });

  socket.on('reconnect_failed', () => {
    console.error('🔴 Reconnection failed after max attempts');
  });

  return socket;
}

/**
 * Disconnect and cleanup socket
 */
export function disconnectSocket(socket: Socket | null) {
  if (!socket) return;

  console.log('🔌 Disconnecting WebSocket...');
  socket.removeAllListeners();
  socket.disconnect();
}
