"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useWebSocket } from '@/lib/websocket-context'

export default function SessionManager() {
  const { lastMessage, handleSessionExpired } = useWebSocket()
  const router = useRouter()

  // Handle session expiration and redirect
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
        console.log('Session expiration detected, redirecting to login');
        // Clear session data
        localStorage.removeItem('user');
        localStorage.removeItem('session');
        // Redirect to login
        router.push('/login');
      }
    }
  }, [lastMessage, router]);

  // Handle WebSocket disconnection due to auth issues
  useEffect(() => {
    const handleWebSocketClose = (event: CustomEvent) => {
      // If WebSocket closes with auth-related codes, redirect to login
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