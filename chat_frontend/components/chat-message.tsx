interface ChatMessageProps {
  type: "user" | "assistant"
  content: string
  timestamp: string
  senderName?: string
  readBy?: string[] // Array of user IDs who have read the message
  isRead?: boolean // Whether the message has been read by at least one recipient
}

export default function ChatMessage({ type, content, timestamp, senderName, readBy, isRead }: ChatMessageProps) {
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
        <div className={`flex items-center gap-1 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
          <span className="text-xs text-muted-foreground">{timestamp}</span>
          {isUser && (
            <div className="flex items-center">
              {isRead ? (
                // Double checkmark for read messages (blue)
                <div className="flex">
                  <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <svg className="w-4 h-4 text-blue-500 -ml-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              ) : (
                // Single checkmark for sent messages (gray)
                <svg className="w-4 h-4 text-muted-foreground" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
