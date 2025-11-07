import React from "react"
import { Send, Paperclip, MoreVertical } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import ChatMessage from "./ChatMessage"
import { useAppStore } from "../store"

export default function ChatArea() {
  const session = useAppStore((state) => state.session)
  const selectedChat = useAppStore((state) => state.selectedChat)
  const messages = useAppStore((state) => state.messages)
  const isLoadingMessages = useAppStore((state) => state.isLoadingMessages)
  const updateChatMessages = useAppStore((state) => state.updateChatMessages)
  const addMessage = useAppStore((state) => state.addMessage)

  const [inputValue, setInputValue] = useState("")
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (selectedChat) {
      loadMessages()
    }
  }, [selectedChat])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const loadMessages = async () => {
    if (!selectedChat) return

    try {
      const result = await window.electron.getMessages(selectedChat.id)
      if (result.success) {
        updateChatMessages(result.messages)
      }
    } catch (error) {
      console.error("Error loading messages:", error)
    }
  }

  const handleSend = async () => {
    if (!inputValue.trim() || !selectedChat || !session || isSending) return

    const content = inputValue.trim()
    setInputValue("")
    setIsSending(true)

    try {
      const result = await window.electron.sendMessage(selectedChat.id, session.user_id, content)

      if (result.success) {
        addMessage({
          ...result.message,
          sender_username: session.username,
        })
      }
    } catch (error) {
      console.error("Error sending message:", error)
      setInputValue(content) // Restore message on error
    } finally {
      setIsSending(false)
    }
  }

  if (!selectedChat) return null

  const title = selectedChat.participants.map((p) => p.username).join(", ")
  const participantCount = selectedChat.participants.length

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Header */}
      <div className="h-16 border-b border-[#E5E5EA] px-6 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-base font-medium text-[#1C1C1E]">{title}</h1>
          <p className="text-xs text-[#8E8E93]">{participantCount} participants</p>
        </div>
        <button className="p-2 hover:bg-[#F5F5F7] rounded-lg transition-colors">
          <MoreVertical className="w-5 h-5 text-[#8E8E93]" strokeWidth={1.5} />
        </button>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        {isLoadingMessages ? (
          <div className="text-center text-[#8E8E93]">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-[#8E8E93]">No messages yet. Start the conversation!</div>
        ) : (
          messages.map((message) => (
            <ChatMessage
              key={message.id}
              type={session?.user_id === message.sender_id ? "user" : "assistant"}
              content={message.content}
              timestamp={new Date(message.timestamp).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              })}
              senderName={message.sender_username}
            />
          ))
        )}
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
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              disabled={isSending}
              className="flex-1 bg-[#F5F5F7] text-[#1C1C1E] placeholder-[#8E8E93] rounded-full px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#3B4FE4] focus:ring-offset-0 disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={isSending || !inputValue.trim()}
              className="p-2.5 bg-[#3B4FE4] hover:bg-[#2A3AC4] text-white rounded-full transition-colors flex-shrink-0 disabled:opacity-50"
            >
              <Send className="w-5 h-5" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
