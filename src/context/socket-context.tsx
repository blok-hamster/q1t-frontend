'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import type { Socket } from 'socket.io-client';
import { createSocket, disconnectSocket } from '@/lib/websocket/socket';
import { setupSocketListeners, removeSocketListeners } from '@/lib/websocket/events';
import { useAuth } from './auth-context';
import type { SocketEventHandlers } from '@/types/websocket';

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
  reconnecting: boolean;
  setupListeners: (handlers: SocketEventHandlers) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const { token, isAuthenticated } = useAuth();

  /**
   * Connect to WebSocket when authenticated
   */
  useEffect(() => {
    let newSocket: any = null;

    if (!isAuthenticated || !token) {
      // Disconnect if not authenticated
      if (socket) {
        disconnectSocket(socket);
        setSocket(null);
        setConnected(false);
      }
      return;
    }

    // Create socket connection
    newSocket = createSocket(token);

    // Connection state handlers
    newSocket.on('connect', () => {
      console.log('✅ Socket connected');
      setConnected(true);
      setReconnecting(false);
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
      setConnected(false);
    });

    newSocket.on('reconnect_attempt', () => {
      console.log('🔄 Reconnecting...');
      setReconnecting(true);
    });

    newSocket.on('reconnect', () => {
      console.log('✅ Reconnected');
      setConnected(true);
      setReconnecting(false);
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      if (newSocket) {
        disconnectSocket(newSocket);
      }
    };
    // socket intentionally omitted from deps to avoid reconnection loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, token]);

  /**
   * Setup event listeners
   */
  const setupListeners = useCallback((handlers: SocketEventHandlers) => {
    if (!socket) return;

    setupSocketListeners(socket, handlers);

    // Return cleanup function
    return () => {
      removeSocketListeners(socket, handlers);
    };
  }, [socket]);

  const value: SocketContextType = {
    socket,
    connected,
    reconnecting,
    setupListeners,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
}

/**
 * Hook to use socket context
 */
export function useSocket() {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
}
