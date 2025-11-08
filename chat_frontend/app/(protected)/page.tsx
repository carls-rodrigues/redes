"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import NavigationSidebar from "@/components/navigation-sidebar"
import ConversationList from "@/components/conversation-list"
import ChatArea from "@/components/chat-area"

export default function Home() {
  const [selectedConversation, setSelectedConversation] = useState<{ id: string; title: string } | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()

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
          <p className="mt-2 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Navigation Sidebar - Hidden on mobile when chat is selected */}
      <div className={`${selectedConversation ? 'hidden md:flex' : 'flex'}`}>
        <NavigationSidebar />
      </div>

      {/* Conversation List - Hidden on mobile when chat is selected */}
      <div className={`${selectedConversation ? 'hidden md:flex' : 'flex'}`}>
        <ConversationList selectedId={selectedConversation?.id || null} onSelect={setSelectedConversation} />
      </div>

      {/* Main Chat Area - Full width on mobile, normal on desktop */}
      <div className={`${selectedConversation ? 'flex' : 'hidden md:flex'} flex-1`}>
        <ChatArea 
          conversationId={selectedConversation?.id || null} 
          conversationTitle={selectedConversation?.title}
          onBack={() => setSelectedConversation(null)}
          showBackButton={!!selectedConversation}
        />
      </div>
    </div>
  )
}
