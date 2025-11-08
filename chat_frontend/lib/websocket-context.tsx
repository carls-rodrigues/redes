"use client";

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

interface WebSocketResponse extends WebSocketMessage {
  request_id?: number;
  status?: 'ok' | 'error';
  message?: string;
  user?: any;
  session?: any;
}

interface PendingRequest {
  message: WebSocketMessage;
  timeoutId: NodeJS.Timeout;
}

interface WebSocketConfig {
  url?: string;
  port?: number;
  endpoint?: string;
  hostname?: string;
  requestTimeout?: number;
  maxReconnectDelay?: number;
  autoReconnect?: boolean;
}

interface WebSocketContextType {
  sendMessage: (message: WebSocketMessage) => number | null;
  isConnected: boolean;
  lastMessage: WebSocketResponse | null;
  error: string | null;
  reconnect: () => void;
  handleSessionExpired: () => void;
}

const DEFAULT_CONFIG = {
  port: 5000,
  endpoint: '/ws',
  hostname: undefined as string | undefined,
  requestTimeout: 30000,
  maxReconnectDelay: 30000,
  autoReconnect: true,
} as const;

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const requestIdRef = useRef(0);
  const pendingRequestsRef = useRef(new Map<number, PendingRequest>());
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const config = useRef(DEFAULT_CONFIG);

  const clearReconnectTimeout = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  const clearPendingRequests = useCallback(() => {
    pendingRequestsRef.current.forEach((request) => {
      clearTimeout(request.timeoutId);
    });
    pendingRequestsRef.current.clear();
  }, []);

  const handleSessionExpired = useCallback(() => {
    console.log('Session expired, clearing data and redirecting to login');
    // Clear session data
    localStorage.removeItem('user');
    localStorage.removeItem('session');
    // Disconnect WebSocket
    if (wsRef.current) {
      wsRef.current.close(1000, 'Session expired');
    }
    // Redirect to login (will be handled by components using this)
  }, []);

  // Handle session expiration from WebSocket messages
  useEffect(() => {
    if (lastMessage) {
      // Check for session expiration indicators
      if (
        lastMessage.type === 'auth_failed' ||
        lastMessage.type === 'session_expired' ||
        lastMessage.message === 'Not authenticated' ||
        (lastMessage.status === 'error' && lastMessage.message?.includes('session')) ||
        (lastMessage.status === 'error' && lastMessage.message?.includes('auth')) ||
        (lastMessage.status === 'error' && lastMessage.message?.includes('token'))
      ) {
        console.log('Session expiration detected:', lastMessage);
        handleSessionExpired();
      }
    }
  }, [lastMessage, handleSessionExpired]);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    clearReconnectTimeout();

    // Use environment variable if available, otherwise construct URL
    let wsUrl: string;
    if (process.env.NEXT_PUBLIC_WS_URL) {
      wsUrl = process.env.NEXT_PUBLIC_WS_URL;
    } else {
      // Fallback to constructing URL from current location (for development)
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const hostname = config.current.hostname || window.location.hostname;
      wsUrl = `${protocol}//${hostname}:${config.current.port}${config.current.endpoint}`;
    }

    console.log('Attempting to connect to WebSocket:', wsUrl);

    try {
      wsRef.current = new WebSocket(wsUrl);
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      setError(`Failed to create WebSocket: ${error}`);
      return;
    }

    wsRef.current.onopen = () => {
      console.log('✅ WebSocket connected successfully to:', wsUrl);
      setIsConnected(true);
      setError(null);

      // Authenticate if we have a session
      try {
        const session = JSON.parse(localStorage.getItem('session') || '{}');
        if (session.session_id) {
          const authMessage = {
            type: 'auth',
            token: session.session_id,
            request_id: ++requestIdRef.current
          };
          console.log('Sending auth message:', authMessage);
          wsRef.current?.send(JSON.stringify(authMessage));
        }
      } catch (error) {
        console.error('Failed to read or parse session from localStorage:', error);
      }
    };

    wsRef.current.onmessage = (event) => {
      try {
        const message: WebSocketResponse = JSON.parse(event.data);
        console.log('WebSocket message received:', message);

        // Always set lastMessage for any incoming message
        setLastMessage(message);

        // Handle responses to requests if request_id is present
        if (message.request_id && pendingRequestsRef.current.has(message.request_id)) {
          const request = pendingRequestsRef.current.get(message.request_id);
          if (request) {
            clearTimeout(request.timeoutId);
            pendingRequestsRef.current.delete(message.request_id);
            console.log('Matched response to request:', message.request_id);
          }
        } else if (message.request_id) {
          console.log('Received response with request_id but no matching pending request:', message.request_id);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
        setError('Failed to parse WebSocket message');
      }
    };

    wsRef.current.onclose = (event) => {
      console.log('❌ WebSocket disconnected:', {
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean
      });
      setIsConnected(false);

      // Dispatch custom event for session management
      window.dispatchEvent(new CustomEvent('websocket-close', {
        detail: { code: event.code, reason: event.reason, wasClean: event.wasClean }
      }));

      // Try to reconnect if autoReconnect is enabled
      if (config.current.autoReconnect) {
        const delay = Math.min(5000 + Math.random() * 5000, config.current.maxReconnectDelay);
        console.log(`Reconnecting in ${delay}ms...`);
        reconnectTimeoutRef.current = setTimeout(() => connect(), delay);
      }
    };

    wsRef.current.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
      setError('WebSocket connection error');
    };
  }, [clearReconnectTimeout]);

  const sendMessage = useCallback((message: WebSocketMessage): number | null => {
    console.log('sendMessage called with:', message);
    console.log('WebSocket readyState:', wsRef.current?.readyState);

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const requestId = ++requestIdRef.current;
      const messageWithId = {
        ...message,
        request_id: requestId
      };

      console.log('Sending WebSocket message:', messageWithId);

      // Set timeout for this request
      const timeoutId = setTimeout(() => {
        if (pendingRequestsRef.current.has(requestId)) {
          pendingRequestsRef.current.delete(requestId);
          console.warn(`Request ${requestId} timed out`);
        }
      }, config.current.requestTimeout);

      pendingRequestsRef.current.set(requestId, {
        message: messageWithId,
        timeoutId
      });

      try {
        wsRef.current.send(JSON.stringify(messageWithId));
        return requestId;
      } catch (error) {
        console.error('Failed to send WebSocket message:', error);
        pendingRequestsRef.current.delete(requestId);
        clearTimeout(timeoutId);
        return null;
      }
    } else {
      console.warn('WebSocket is not connected, cannot send message');
      return null;
    }
  }, []);

  const reconnect = useCallback(() => {
    console.log('Manual reconnect requested');
    if (wsRef.current) {
      wsRef.current.close();
    }
    connect();
  }, [connect]);

  useEffect(() => {
    connect();

    return () => {
      clearReconnectTimeout();
      clearPendingRequests();
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect, clearReconnectTimeout, clearPendingRequests]);

  const value: WebSocketContextType = {
    sendMessage,
    isConnected,
    lastMessage,
    error,
    reconnect,
    handleSessionExpired
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket(): WebSocketContextType {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}