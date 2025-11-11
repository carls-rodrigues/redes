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
    console.log('Sessão expirada, limpando dados e redirecionando para login');
    // Limpar dados da sessão
    localStorage.removeItem('user');
    localStorage.removeItem('session');
    // Desconectar WebSocket
    if (wsRef.current) {
      wsRef.current.close(1000, 'Session expired');
    }
    // Redirecionar para login (será tratado pelos componentes que usam isso)
  }, []);

  // Lidar com expiração de sessão das mensagens WebSocket
  useEffect(() => {
    if (lastMessage) {
      // Verificar indicadores de expiração de sessão
      if (
        lastMessage.type === 'auth_failed' ||
        lastMessage.type === 'session_expired' ||
        lastMessage.message === 'Not authenticated' ||
        (lastMessage.status === 'error' && lastMessage.message?.includes('session')) ||
        (lastMessage.status === 'error' && lastMessage.message?.includes('auth')) ||
        (lastMessage.status === 'error' && lastMessage.message?.includes('token'))
      ) {
        console.log('Expiração de sessão detectada:', lastMessage);
        handleSessionExpired();
      }
    }
  }, [lastMessage, handleSessionExpired]);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    clearReconnectTimeout();

    // Usar variável de ambiente se disponível, caso contrário construir URL
    let wsUrl: string;
    if (process.env.NEXT_PUBLIC_WS_URL) {
      wsUrl = process.env.NEXT_PUBLIC_WS_URL;
    } else {
      // Fallback para construir URL a partir da localização atual (para desenvolvimento)
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const hostname = config.current.hostname || window.location.hostname;
      wsUrl = `${protocol}//${hostname}:${config.current.port}${config.current.endpoint}`;
    }

    console.log('Tentando conectar ao WebSocket:', wsUrl);

    try {
      wsRef.current = new WebSocket(wsUrl);
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      setError(`Failed to create WebSocket: ${error}`);
      return;
    }

    wsRef.current.onopen = () => {
      console.log('✅ WebSocket conectado com sucesso em:', wsUrl);
      setIsConnected(true);
      setError(null);

      // Autenticar se temos uma sessão
      try {
        const session = JSON.parse(localStorage.getItem('session') || '{}');
        if (session.session_id) {
          const authMessage = {
            type: 'auth',
            token: session.session_id,
            request_id: ++requestIdRef.current
          };
          console.log('Enviando mensagem de auth:', authMessage);
          wsRef.current?.send(JSON.stringify(authMessage));
        }
      } catch (error) {
        console.error('Failed to read or parse session from localStorage:', error);
      }
    };

    wsRef.current.onmessage = (event) => {
      try {
        const message: WebSocketResponse = JSON.parse(event.data);
        console.log('Mensagem WebSocket recebida:', message);

        // Sempre definir lastMessage para qualquer mensagem recebida
        setLastMessage(message);

        // Lidar com respostas para solicitações se request_id estiver presente
        if (message.request_id && pendingRequestsRef.current.has(message.request_id)) {
          const request = pendingRequestsRef.current.get(message.request_id);
          if (request) {
            clearTimeout(request.timeoutId);
            pendingRequestsRef.current.delete(message.request_id);
            console.log('Resposta correspondida à solicitação:', message.request_id);
          }
        } else if (message.request_id) {
          console.log('Recebida resposta com request_id mas sem solicitação pendente correspondente:', message.request_id);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
        setError('Failed to parse WebSocket message');
      }
    };

    wsRef.current.onclose = (event) => {
      console.log('❌ WebSocket desconectado:', {
        code: event.code,
        reason: event.reason,
        wasClean: event.wasClean
      });
      setIsConnected(false);

      // Disparar evento personalizado para gerenciamento de sessão
      window.dispatchEvent(new CustomEvent('websocket-close', {
        detail: { code: event.code, reason: event.reason, wasClean: event.wasClean }
      }));

      // Tentar reconectar se autoReconnect estiver habilitado
      if (config.current.autoReconnect) {
        const delay = Math.min(5000 + Math.random() * 5000, config.current.maxReconnectDelay);
        console.log(`Reconectando em ${delay}ms...`);
        reconnectTimeoutRef.current = setTimeout(() => connect(), delay);
      }
    };

    wsRef.current.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
      setError('WebSocket connection error');
    };
  }, [clearReconnectTimeout]);

  const sendMessage = useCallback((message: WebSocketMessage): number | null => {
    console.log('sendMessage chamado com:', message);
    console.log('Estado readyState do WebSocket:', wsRef.current?.readyState);

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const requestId = ++requestIdRef.current;
      const messageWithId = {
        ...message,
        request_id: requestId
      };

      console.log('Enviando mensagem WebSocket:', messageWithId);

      // Definir timeout para esta solicitação
      const timeoutId = setTimeout(() => {
        if (pendingRequestsRef.current.has(requestId)) {
          pendingRequestsRef.current.delete(requestId);
          console.warn(`Request ${requestId} timed out`);
          // Definir mensagem de erro para timeout
          setLastMessage({
            type: message.type,
            request_id: requestId,
            status: 'error',
            message: 'Solicitação expirou'
          });
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
    console.log('Reconexão manual solicitada');
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