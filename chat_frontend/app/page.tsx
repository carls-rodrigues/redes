"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import NavigationSidebar from "@/components/navigation-sidebar"
import ConversationList, { Conversation } from "@/components/conversation-list"
import ChatArea from "@/components/chat-area"
import { useTranslations } from 'next-intl';

// Desabilitar pré-renderização para esta página pois requer autenticação
export const dynamic = 'force-dynamic'

export default function Home() {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showConversationList, setShowConversationList] = useState(true) // Mostrar lista de conversas por padrão no mobile
  const router = useRouter()
  const t = useTranslations('common');

  const handleSelectConversation = (conversation: Conversation | null) => {
    setSelectedConversation(conversation ? conversation.id : null)
    // No mobile, esconder lista de conversas quando uma conversa é selecionada
    setShowConversationList(false)
  }

  const handleBackToConversationList = () => {
    setSelectedConversation(null)
    setShowConversationList(true)
  }

  const toggleConversationList = () => {
    setShowConversationList(!showConversationList)
  }

  useEffect(() => {
    // Check if user is authenticated
    const userData = localStorage.getItem('user');
    const sessionData = localStorage.getItem('session');

    if (!userData || !sessionData) {
      // Not authenticated, redirect to login
      router.push('/login');
      return;
    }

    setIsAuthenticated(true);
  }, [router]);

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">{t('checkingAuth')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Navigation Sidebar - Always visible */}
      <NavigationSidebar />

      {/* Conversation List - Hidden on mobile unless showConversationList is true */}
      <div className={`${
        showConversationList ? 'block' : 'hidden'
      } md:block`}>
        <ConversationList 
          selectedId={selectedConversation} 
          onSelect={handleSelectConversation}
          onToggleMobile={toggleConversationList}
        />
      </div>

      {/* Main Chat Area - Hidden on mobile when showConversationList is true */}
      <div className={`${
        showConversationList ? 'hidden' : 'block'
      } md:block flex-1 flex flex-col`}>
        <ChatArea 
          conversationId={selectedConversation} 
          onBack={handleBackToConversationList}
          showBackButton={true}
          onMenuClick={toggleConversationList}
        />
      </div>
    </div>
  )
}
