"use client"

import { Send, Paperclip, MoreVertical } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
    <div className="flex-1 flex flex-col bg-background">
      {/* Header */}
      <div className="h-16 border-b border-border px-6 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-sm font-semibold text-foreground">Design System Discussion</h1>
          <p className="text-xs text-muted-foreground">3 participants</p>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreVertical className="w-4 h-4" strokeWidth={1.5} />
        </Button>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
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
      <div className="border-t border-border px-6 py-4 flex-shrink-0">
        <div className="flex gap-2 items-end">
          <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
            <Paperclip className="w-4 h-4" strokeWidth={1.5} />
          </Button>

          <div className="flex-1 flex gap-2">
            <Input
              type="text"
              placeholder="Message..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              className="h-9 text-sm"
            />
            <Button onClick={handleSend} size="icon" className="h-9 w-9 flex-shrink-0">
              <Send className="w-4 h-4" strokeWidth={1.5} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
