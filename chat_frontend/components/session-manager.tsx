"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useWebSocket } from '@/lib/websocket-context'
import { useLocale } from '@/lib/locale-context'

export default function SessionManager() {
  const { lastMessage, handleSessionExpired } = useWebSocket()
  const router = useRouter()
  const { locale } = useLocale()

  // Lidar com expiração de sessão e redirecionar
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
        console.log('Session expiration detected, redirecting to login');
        // Limpar dados da sessão
        localStorage.removeItem('user');
        localStorage.removeItem('session');
        // Redirecionar para login
        router.push('/login');
      }
    }
  }, [lastMessage, router]);

  // Lidar com desconexão WebSocket devido a problemas de auth
  useEffect(() => {
    const handleWebSocketClose = (event: CustomEvent) => {
      // Se WebSocket fechar com códigos relacionados a auth, redirecionar para login
      if (event.detail?.code === 4001 || event.detail?.code === 4003) {
        console.log('WebSocket closed due to authentication, redirecting to login');
        localStorage.removeItem('user');
        localStorage.removeItem('session');
        router.push('/login');
      }
    };

    window.addEventListener('websocket-close', handleWebSocketClose as EventListener);

    return () => {
      window.removeEventListener('websocket-close', handleWebSocketClose as EventListener);
    };
  }, [router]);

  return null; // This component doesn't render anything
}