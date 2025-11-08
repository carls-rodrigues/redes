"use client";

import { useEffect, useRef, useState, useCallback } from 'react';

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
  url?: string; // Full WebSocket URL (overrides port/endpoint/hostname)
  port?: number;
  endpoint?: string;
  hostname?: string; // Optional custom hostname
  requestTimeout?: number;
  maxReconnectDelay?: number;
  autoReconnect?: boolean;
}

type WebSocketHook = {
  sendMessage: (message: WebSocketMessage) => number | null;
  isConnected: boolean;
  lastMessage: WebSocketResponse | null;
  error: string | null;
  reconnect: () => void;
  disconnect: () => void;
};

const DEFAULT_CONFIG = {
  port: 5000,
  endpoint: '/ws',
  requestTimeout: 30000,
  maxReconnectDelay: 30000,
  autoReconnect: true,
} as const;

export function useWebSocket(config: WebSocketConfig = {}): WebSocketHook {
  const finalConfig = useRef({ ...DEFAULT_CONFIG, ...config }).current;
  
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const requestIdRef = useRef(0);
  const pendingRequestsRef = useRef(new Map<number, PendingRequest>());
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const isUnmountingRef = useRef(false);

  const getReconnectDelay = useCallback(() => {
    const delay = Math.min(
      1000 * Math.pow(2, reconnectAttemptsRef.current),
      finalConfig.maxReconnectDelay
    );
    reconnectAttemptsRef.current++;
    return delay;
  }, []);

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
      }, finalConfig.requestTimeout);
      
      pendingRequestsRef.current.set(requestId, { 
        message: messageWithId, 
        timeoutId 
      });
      
      try {
        wsRef.current.send(JSON.stringify(messageWithId));
        return requestId;
      } catch (error) {
        console.error('Failed to send WebSocket message:', error);
        clearTimeout(timeoutId);
        pendingRequestsRef.current.delete(requestId);
        setError(`Failed to send message: ${error}`);
        return null;
      }
    } else {
      console.warn('WebSocket is not connected');
      setError('WebSocket is not connected');
      return null;
    }
  }, []);

  const disconnect = useCallback(() => {
    isUnmountingRef.current = true;
    clearReconnectTimeout();
    clearPendingRequests();
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setIsConnected(false);
  }, [clearReconnectTimeout, clearPendingRequests]);

  const connect = useCallback(() => {
    // Don't reconnect if unmounting or already connected
    if (isUnmountingRef.current || wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    // Close existing connection if any
    if (wsRef.current) {
      wsRef.current.close();
    }

    // If full URL provided, use it directly
    if (finalConfig.url) {
      const wsUrl = finalConfig.url;
    } else {
      // Otherwise construct URL
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const hostname = finalConfig.hostname || window.location.hostname;
      const wsUrl = `${protocol}//${hostname}:${finalConfig.port}${finalConfig.endpoint}`;
    }
    
    const wsUrl = finalConfig.url || 
      `${window.location.protocol === 'https' ? 'wss:' : 'ws:'}//` +
      `${finalConfig.hostname || window.location.hostname}:` +
      `${finalConfig.port}${finalConfig.endpoint}`;

    console.log('Attempting to connect to WebSocket:', wsUrl);
    
    try {
      wsRef.current = new WebSocket(wsUrl);
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      setError(`Failed to create WebSocket: ${error}`);
      
      // Schedule reconnect if auto-reconnect is enabled
      if (finalConfig.autoReconnect && !isUnmountingRef.current) {
        const delay = getReconnectDelay();
        console.log(`Scheduling reconnect in ${delay}ms`);
        reconnectTimeoutRef.current = setTimeout(() => connect(), delay);
      }
      return;
    }

    wsRef.current.onopen = () => {
      console.log('✅ WebSocket connected successfully to:', wsUrl);
      setIsConnected(true);
      setError(null);
      reconnectAttemptsRef.current = 0; // Reset reconnect attempts on success

      // Authenticate if we have a session
      try {
        const sessionData = localStorage.getItem('session');
        if (sessionData) {
          const session = JSON.parse(sessionData);
          if (session.session_id) {
            sendMessage({
              type: 'auth',
              token: session.session_id
            });
          }
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
        wasClean: event.wasClean,
        url: wsUrl
      });
      setIsConnected(false);
      clearPendingRequests();

      // Try to reconnect if auto-reconnect is enabled and not unmounting
      if (finalConfig.autoReconnect && !isUnmountingRef.current) {
        clearReconnectTimeout();
        const delay = getReconnectDelay();
        console.log(`Scheduling reconnect in ${delay}ms (attempt ${reconnectAttemptsRef.current})`);
        reconnectTimeoutRef.current = setTimeout(() => connect(), delay);
      }
    };

    wsRef.current.onerror = (event) => {
      console.error('❌ WebSocket error:', {
        event,
        url: wsUrl,
        readyState: wsRef.current?.readyState
      });
      setError(`WebSocket connection error`);
    };
  }, [sendMessage, getReconnectDelay, clearReconnectTimeout, clearPendingRequests]);

  const reconnect = useCallback(() => {
    console.log('Manual reconnect triggered');
    reconnectAttemptsRef.current = 0; // Reset attempts for manual reconnect
    disconnect();
    isUnmountingRef.current = false;
    connect();
  }, [connect, disconnect]);

  useEffect(() => {
    isUnmountingRef.current = false;
    connect();

    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  return {
    sendMessage,
    isConnected,
    lastMessage,
    error,
    reconnect,
    disconnect,
  };
}