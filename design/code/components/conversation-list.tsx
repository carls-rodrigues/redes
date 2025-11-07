import * as React from "react"

import { Plus, Search } from "lucide-react"
import { useState } from "react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import ConversationCard from "./conversation-card"

interface ConversationListProps {
  conversations: Array<{
    id: number
    title: string
    preview: string
    timestamp: string
    unread: boolean
  }>
  selectedId: number
  onSelect: (id: number) => void
  onNewChat: () => void
}

export default function ConversationList({ 
  conversations, 
  selectedId, 
  onSelect,
  onNewChat 
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredConversations = conversations.filter((conv) =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.preview.toLowerCase().includes(searchQuery.toLowerCase())
  )
  return (
    <div className="w-64 bg-background flex flex-col flex-shrink-0 border-r border-border">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Conversations</h2>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onNewChat}>
          <Plus className="w-4 h-4" strokeWidth={1.5} />
        </Button>
      </div>

      {/* Search */}
      <div className="px-3 py-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
          <Input 
            placeholder="Search conversations..." 
            className="pl-8 h-8 text-xs"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Scrollable Conversation List */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-2 space-y-1">
          {filteredConversations.map((conv) => (
            <ConversationCard
              key={conv.id}
              {...conv}
              isSelected={selectedId === conv.id}
              onClick={() => onSelect(conv.id)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
