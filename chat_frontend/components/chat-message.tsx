interface ChatMessageProps {
  type: "user" | "assistant"
  content: string
  timestamp: string
  senderName?: string
}

export default function ChatMessage({ type, content, timestamp, senderName }: ChatMessageProps) {
  const isUser = type === "user"

  // Get the first name from senderName, or fallback to "You" or "AI"
  const getDisplayName = () => {
    if (isUser) return "You"
    if (senderName) {
      // Get first name (split by space and take first part)
      return senderName.split(' ')[0]
    }
    return "AI"
  }

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar */}
      <div
        className={`min-w-8 h-8 px-2 rounded-md shrink-0 flex items-center justify-center text-xs font-medium ${
          isUser ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
        }`}
      >
        {getDisplayName()}
      </div>

      {/* Message Bubble */}
      <div className={`flex flex-col ${isUser ? "items-end" : "items-start"} gap-1`}>
        <div
          className={`max-w-xs px-3 py-2 rounded-md text-sm leading-relaxed ${
            isUser ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
          }`}
        >
          <p>{content}</p>
        </div>
        <span className="text-xs text-muted-foreground">{timestamp}</span>
      </div>
    </div>
  )
}
