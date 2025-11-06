"use client"

import { MessageSquare } from "lucide-react"
import ConversationCard from "./conversation-card"

const MOCK_CONVERSATIONS = [
  {
    id: 0,
    title: "Design System Discussion",
    preview: "Let's discuss the new design patterns...",
    timestamp: "Today",
    unread: false,
    badge: "New",
  },
  {
    id: 1,
    title: "Project Updates",
    preview: "The latest updates on the Q4 roadmap",
    timestamp: "Yesterday",
    unread: true,
    badge: null,
  },
  {
    id: 2,
    title: "Team Feedback",
    preview: "Great work on the latest iteration...",
    timestamp: "2 days ago",
    unread: false,
    badge: null,
  },
  {
    id: 3,
    title: "Feature Planning",
    preview: "Let's plan the next sprint features",
    timestamp: "1 week ago",
    unread: false,
    badge: null,
  },
]

interface ConversationListProps {
  selectedId: number
  onSelect: (id: number) => void
}

export default function ConversationList({ selectedId, onSelect }: ConversationListProps) {
  return (
    <div className="w-72 bg-[#F5F5F7] flex flex-col flex-shrink-0 border-r border-[#E5E5EA]">
      {/* Header */}
      <div className="p-4 border-b border-[#E5E5EA] flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#1C1C1E]">Conversations</h2>
        <button className="p-1.5 hover:bg-white/50 rounded-lg transition-colors">
          <MessageSquare className="w-5 h-5 text-[#8E8E93]" strokeWidth={1.5} />
        </button>
      </div>

      {/* Scrollable Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {/* Section: Today */}
        <div className="px-4 pt-4 pb-2">
          <h3 className="text-xs font-semibold uppercase text-[#8E8E93] tracking-wide">Today</h3>
        </div>
        <div className="px-3 pb-4 space-y-2">
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
        <div className="px-4 py-2">
          <h3 className="text-xs font-semibold uppercase text-[#8E8E93] tracking-wide">Yesterday</h3>
        </div>
        <div className="px-3 pb-4 space-y-2">
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
        <div className="px-4 py-2">
          <h3 className="text-xs font-semibold uppercase text-[#8E8E93] tracking-wide">Earlier</h3>
        </div>
        <div className="px-3 space-y-2">
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
