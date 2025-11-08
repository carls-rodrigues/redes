"use client"

import { Plus, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import ConversationCard from "./conversation-card"

const MOCK_CONVERSATIONS = [
  {
    id: 0,
    title: "Design System Discussion",
    preview: "Let's discuss the new design patterns...",
    timestamp: "Today",
    unread: false,
  },
  {
    id: 1,
    title: "Project Updates",
    preview: "The latest updates on the Q4 roadmap",
    timestamp: "Yesterday",
    unread: true,
  },
  {
    id: 2,
    title: "Team Feedback",
    preview: "Great work on the latest iteration...",
    timestamp: "2 days ago",
    unread: false,
  },
  {
    id: 3,
    title: "Feature Planning",
    preview: "Let's plan the next sprint features",
    timestamp: "1 week ago",
    unread: false,
  },
]

interface ConversationListProps {
  selectedId: number
  onSelect: (id: number) => void
}

export default function ConversationList({ selectedId, onSelect }: ConversationListProps) {
  return (
    <div className="w-64 bg-background flex flex-col flex-shrink-0 border-r border-border">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Conversations</h2>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Plus className="w-4 h-4" strokeWidth={1.5} />
        </Button>
      </div>

      {/* Search */}
      <div className="px-3 py-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
          <Input placeholder="Search conversations..." className="pl-8 h-8 text-xs" />
        </div>
      </div>

      {/* Scrollable Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {/* Section: Today */}
        <div className="px-3 pt-3 pb-1">
          <h3 className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">Today</h3>
        </div>
        <div className="px-2 pb-2 space-y-1">
          {MOCK_CONVERSATIONS.slice(0, 1).map((conv) => (
            <ConversationCard
              key={conv.id}
              {...conv}
              isSelected={selectedId === conv.id}
              onClick={() => onSelect(conv.id)}
            />
          ))}
        </div>

        {/* Section: Yesterday */}
        <div className="px-3 pt-2 pb-1">
          <h3 className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">Yesterday</h3>
        </div>
        <div className="px-2 pb-2 space-y-1">
          {MOCK_CONVERSATIONS.slice(1, 2).map((conv) => (
            <ConversationCard
              key={conv.id}
              {...conv}
              isSelected={selectedId === conv.id}
              onClick={() => onSelect(conv.id)}
            />
          ))}
        </div>

        {/* Section: Earlier */}
        <div className="px-3 pt-2 pb-1">
          <h3 className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">Earlier</h3>
        </div>
        <div className="px-2 space-y-1">
          {MOCK_CONVERSATIONS.slice(2).map((conv) => (
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
