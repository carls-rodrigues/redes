import React from "react"
import { useState } from "react"
import { MessageSquare, Plus } from "lucide-react"
import { useAppStore } from "../store"
import { Chat } from "../../types"
import AddFriendModal from "./AddFriendModal"

interface ConversationListProps {
  onRefresh: () => void
}

export default function ConversationList({ onRefresh }: ConversationListProps) {
  const chats = useAppStore((state) => state.chats)
  const selectedChat = useAppStore((state) => state.selectedChat)
  const selectChat = useAppStore((state) => state.selectChat)
  const addChat = useAppStore((state) => state.addChat)
  const isLoadingChats = useAppStore((state) => state.isLoadingChats)
  const [isAddFriendModalOpen, setIsAddFriendModalOpen] = useState(false)

  const handleFriendAdded = async (chatId: string) => {
    // Load the newly created chat
    try {
      const result = await window.electron.getChat(chatId)
      if (result.success && result.chat) {
        addChat(result.chat)
        selectChat(result.chat)
      }
    } catch (error) {
      console.error("Error loading new chat:", error)
    }
    setIsAddFriendModalOpen(false)
  }

  return (
    <>
      <div className="w-72 bg-[#F5F5F7] flex flex-col flex-shrink-0 border-r border-[#E5E5EA]">
        {/* Header */}
        <div className="p-4 border-b border-[#E5E5EA] flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#1C1C1E]">Conversations</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setIsAddFriendModalOpen(true)}
              className="p-1.5 hover:bg-white/50 rounded-lg transition-colors"
              title="Start new chat"
            >
              <Plus className="w-5 h-5 text-[#8E8E93]" strokeWidth={1.5} />
            </button>
            <button
              onClick={onRefresh}
              disabled={isLoadingChats}
              className="p-1.5 hover:bg-white/50 rounded-lg transition-colors disabled:opacity-50"
              title="Refresh conversations"
            >
              <MessageSquare className="w-5 h-5 text-[#8E8E93]" strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* Scrollable Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {chats.length === 0 ? (
            <div className="px-4 pt-4 pb-2 text-center text-[#8E8E93] text-sm">
              No conversations yet
            </div>
          ) : (
            <div className="px-3 pb-4 space-y-2">
              {chats.map((chat) => (
                <ConversationCard
                  key={chat.id}
                  chat={chat}
                  isSelected={selectedChat?.id === chat.id}
                  onClick={() => selectChat(chat)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <AddFriendModal
        isOpen={isAddFriendModalOpen}
        onClose={() => setIsAddFriendModalOpen(false)}
        onFriendAdded={handleFriendAdded}
      />
    </>
  )
}

interface ConversationCardProps {
  chat: Chat
  isSelected: boolean
  onClick: () => void
}

function ConversationCard({ chat, isSelected, onClick }: ConversationCardProps) {
  const title = chat.participants.map((p) => p.username).join(", ")
  const preview = chat.last_message?.content || "No messages yet"
  const timestamp = chat.last_message
    ? new Date(chat.last_message.timestamp).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : ""

  return (
    <div
      onClick={onClick}
      className={`p-3 rounded-lg cursor-pointer transition-colors ${
        isSelected
          ? "bg-white border-l-4 border-[#3B4FE4]"
          : "hover:bg-white/50 border-l-4 border-transparent"
      }`}
    >
      <div className="flex items-start justify-between">
        <h3 className="text-sm font-semibold text-[#1C1C1E] truncate">{title}</h3>
        <span className="text-xs text-[#8E8E93] ml-2 flex-shrink-0">{timestamp}</span>
      </div>
      <p className="text-sm text-[#8E8E93] truncate mt-1">{preview}</p>
    </div>
  )
}
