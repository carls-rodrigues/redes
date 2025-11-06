"use client"

import { Send, Paperclip, MoreVertical } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import ChatMessage from "./chat-message"

const MOCK_MESSAGES = [
  {
    id: 1,
    type: "assistant",
    content: "Hello! How can I help you today?",
    timestamp: "10:30 AM",
  },
  {
    id: 2,
    type: "user",
    content: "I'd like to discuss the new design system implementation.",
    timestamp: "10:31 AM",
  },
  {
    id: 3,
    type: "assistant",
    content:
      "Great! I'd be happy to discuss that. The design system includes a comprehensive color palette, typography hierarchy, and component patterns. What specific aspects would you like to focus on?",
    timestamp: "10:32 AM",
  },
  {
    id: 4,
    type: "user",
    content: "I'm particularly interested in the spacing and layout guidelines.",
    timestamp: "10:33 AM",
  },
  {
    id: 5,
    type: "assistant",
    content:
      "Excellent choice. Our spacing system is based on a 4px base unit, which provides consistency across all components. For layouts, we recommend using Flexbox for most cases, with CSS Grid only for complex 2D layouts.",
    timestamp: "10:34 AM",
  },
]

interface ChatAreaProps {
  conversationId: number
}

export default function ChatArea({ conversationId }: ChatAreaProps) {
  const [messages, setMessages] = useState(MOCK_MESSAGES)
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
      const newMessage = {
        id: messages.length + 1,
        type: "user",
        content: inputValue,
        timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      }
      setMessages([...messages, newMessage])
      setInputValue("")

      // Simulate assistant response
      setTimeout(() => {
        const assistantMessage = {
          id: messages.length + 2,
          type: "assistant",
          content: "That's a great point! Let me think about that...",
          timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
        }
        setMessages((prev) => [...prev, assistantMessage])
      }, 1000)
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Header */}
      <div className="h-16 border-b border-[#E5E5EA] px-6 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-base font-medium text-[#1C1C1E]">Design System Discussion</h1>
          <p className="text-xs text-[#8E8E93]">3 participants</p>
        </div>
        <button className="p-2 hover:bg-[#F5F5F7] rounded-lg transition-colors">
          <MoreVertical className="w-5 h-5 text-[#8E8E93]" strokeWidth={1.5} />
        </button>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            type={message.type as "user" | "assistant"}
            content={message.content}
            timestamp={message.timestamp}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-[#E5E5EA] px-6 py-4 flex-shrink-0">
        <div className="flex gap-3 items-end">
          <button className="p-2 hover:bg-[#F5F5F7] rounded-lg transition-colors flex-shrink-0">
            <Paperclip className="w-5 h-5 text-[#8E8E93]" strokeWidth={1.5} />
          </button>

          <div className="flex-1 flex gap-2">
            <input
              type="text"
              placeholder="Type your message..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              className="flex-1 bg-[#F5F5F7] text-[#1C1C1E] placeholder-[#8E8E93] rounded-full px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#3B4FE4] focus:ring-offset-0"
            />
            <button
              onClick={handleSend}
              className="p-2.5 bg-[#3B4FE4] hover:bg-[#2A3AC4] text-white rounded-full transition-colors flex-shrink-0"
            >
              <Send className="w-5 h-5" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
