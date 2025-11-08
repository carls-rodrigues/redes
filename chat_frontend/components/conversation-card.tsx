"use client"

interface ConversationCardProps {
  id: string | number
  title: string
  preview: string
  timestamp: string
  unread: boolean
  isSelected: boolean
  onClick: () => void
  translateTimestamp?: (key: string) => string
}

export default function ConversationCard({
  title,
  preview,
  timestamp,
  unread,
  isSelected,
  onClick,
  translateTimestamp,
}: ConversationCardProps) {
  const displayTimestamp = translateTimestamp ? translateTimestamp(timestamp) : timestamp
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-2.5 rounded-md transition-colors ${
        isSelected ? "bg-muted text-foreground" : "text-foreground hover:bg-muted/50"
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <h3 className={`text-sm truncate ${unread ? "font-semibold" : "font-medium"}`}>{title}</h3>
        <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">{displayTimestamp}</span>
      </div>

      <p className="text-xs text-muted-foreground truncate">{preview}</p>
    </button>
  )
}
