'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { WebSocketManager } from '@/lib/websocket-manager';

// Context for the WebSocket connection
type WebSocketContextType = {
  socket: WebSocketManager | null;
  connected: boolean;
};

const WebSocketContext = createContext<WebSocketContextType>({
  socket: null,
  connected: false,
});

// Provider props
interface WebSocketProviderProps {
  children: React.ReactNode;
}

/**
 * WebSocket Provider
 * 
 * Provides a WebSocket connection to the whole app
 */
export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const [socket, setSocket] = useState<WebSocketManager | null>(null);
  const [connected, setConnected] = useState(false);
  
  // Initialize the WebSocket connection
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    
    // Create WebSocket manager
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:5000';
    const wsManager = new WebSocketManager({
      url: `${wsUrl}/ws`,
      debug: true,
    });
    
    // Set up connection status handler
    const unsubscribe = wsManager.onConnect(() => {
      setConnected(true);
      console.log('WebSocket connected and ready');
      
      // Request initial data
      wsManager.send('getInitialData');
    });
    
    // Set up error handler
    const errorUnsubscribe = wsManager.onError(() => {
      setConnected(false);
    });
    
    // Save the socket instance
    setSocket(wsManager);
    
    // Cleanup
    return () => {
      unsubscribe();
      errorUnsubscribe();
      wsManager.disconnect();
    };
  }, []);
  
  // Value for the context
  const contextValue = {
    socket,
    connected,
  };
  
  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
}

/**
 * Hook to use WebSocket in components
 */
export function useWebSocketContext() {
  return useContext(WebSocketContext);
} 