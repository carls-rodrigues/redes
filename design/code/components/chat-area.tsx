import * as React from "react"

import { Send, Paperclip, MoreVertical, Trash2, Archive, Bell, Eraser } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import ChatMessage from "./chat-message"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"

interface ChatAreaProps {
  messages: Array<{
    id: number | string
    type: "user" | "assistant"
    content: string
    timestamp: string
  }>
  onSendMessage: (content: string) => void
  conversationTitle?: string
  participantCount?: number
}

export default function ChatArea({ 
  messages, 
  onSendMessage,
  conversationTitle = "Chat",
  participantCount = 1
}: ChatAreaProps) {
  const [inputValue, setInputValue] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = () => {
    if (inputValue.trim()) {
      onSendMessage(inputValue)
      setInputValue("")
    }
  }

  const handleDeleteConversation = () => {
    if (window.confirm(`Delete conversation "${conversationTitle}"?`)) {
      // Handler will be added when we create IPC methods
      console.log("Delete conversation:", conversationTitle)
    }
  }

  const handleArchiveConversation = () => {
    console.log("Archive conversation:", conversationTitle)
  }

  const handleMuteNotifications = () => {
    console.log("Mute notifications:", conversationTitle)
  }

  const handleClearChat = () => {
    if (window.confirm(`Clear all messages in "${conversationTitle}"?`)) {
      console.log("Clear chat:", conversationTitle)
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Header */}
      <div className="h-16 border-b border-border px-6 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-sm font-semibold text-foreground">{conversationTitle}</h1>
          <p className="text-xs text-muted-foreground">{participantCount} participant{participantCount !== 1 ? 's' : ''}</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="w-4 h-4" strokeWidth={1.5} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={handleMuteNotifications}>
              <Bell className="mr-2 h-4 w-4" />
              <span>Mute notifications</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleArchiveConversation}>
              <Archive className="mr-2 h-4 w-4" />
              <span>Archive conversation</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleClearChat}>
              <Eraser className="mr-2 h-4 w-4" />
              <span>Clear chat</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleDeleteConversation} variant="destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              <span>Delete conversation</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            type={message.type}
            content={message.content}
            timestamp={message.timestamp}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-border p-4 flex-shrink-0">
        <div className="flex gap-3 items-end">
          <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground">
            <Paperclip className="w-4 h-4" strokeWidth={1.5} />
          </Button>
          <Input
            placeholder="Type a message..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1"
          />
          <Button 
            variant="default" 
            size="icon" 
            className="h-9 w-9"
            onClick={handleSend}
          >
            <Send className="w-4 h-4" strokeWidth={1.5} />
          </Button>
        </div>
      </div>
    </div>
  )
}
