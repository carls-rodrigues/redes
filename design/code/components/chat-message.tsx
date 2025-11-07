interface ChatMessageProps {
  type: "user" | "assistant"
  content: string
  timestamp: string
}

export default function ChatMessage({ type, content, timestamp }: ChatMessageProps) {
  const isUser = type === "user"

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-md flex-shrink-0 flex items-center justify-center text-xs font-medium flex-shrink-0 ${
          isUser ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
        }`}
      >
        {isUser ? "You" : "AI"}
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
