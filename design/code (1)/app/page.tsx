"use client"

import { useState } from "react"
import NavigationSidebar from "@/components/navigation-sidebar"
import ConversationList from "@/components/conversation-list"
import ChatArea from "@/components/chat-area"

export default function Home() {
  const [selectedConversation, setSelectedConversation] = useState(0)

  return (
    <div className="flex h-screen bg-background">
      {/* Navigation Sidebar */}
      <NavigationSidebar />

      {/* Conversation List */}
      <ConversationList selectedId={selectedConversation} onSelect={setSelectedConversation} />

      {/* Main Chat Area */}
      <ChatArea conversationId={selectedConversation} />
    </div>
  )
}
