"use client"

interface ConversationCardProps {
  id: number
  title: string
  preview: string
  timestamp: string
  unread: boolean
  badge?: string | null
  isSelected: boolean
  onClick: () => void
}

export default function ConversationCard({
  title,
  preview,
  timestamp,
  unread,
  badge,
  isSelected,
  onClick,
}: ConversationCardProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-lg transition-all duration-150 ${
        isSelected ? "bg-white shadow-md border-l-2 border-[#3B4FE4]" : "bg-white hover:shadow-sm hover:scale-[1.01]"
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <h3 className={`text-sm font-medium truncate ${unread ? "text-[#1C1C1E] font-semibold" : "text-[#1C1C1E]"}`}>
          {title}
        </h3>
        <span className="text-xs text-[#8E8E93] whitespace-nowrap flex-shrink-0">{timestamp}</span>
      </div>

      <p className="text-xs text-[#8E8E93] truncate mb-2">{preview}</p>

      {badge && (
        <div className="inline-flex items-center gap-1 px-2 py-1 bg-[#FFD60A] rounded text-xs font-semibold text-[#1C1C1E]">
          <span className="w-1.5 h-1.5 bg-[#1C1C1E] rounded-full"></span>
          {badge}
        </div>
      )}
    </button>
  )
}
