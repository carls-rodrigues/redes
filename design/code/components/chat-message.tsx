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
        className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
          isUser ? "bg-[#3B4FE4]" : "bg-[#E8EAFF]"
        }`}
      >
        <span className={`text-xs font-semibold ${isUser ? "text-white" : "text-[#3B4FE4]"}`}>
          {isUser ? "U" : "A"}
        </span>
      </div>

      {/* Message Bubble */}
      <div className={`flex flex-col ${isUser ? "items-end" : "items-start"} gap-1`}>
        <div
          className={`max-w-xs px-4 py-3 rounded-2xl ${
            isUser ? "bg-[#E8EAFF] text-[#1C1C1E]" : "bg-transparent text-[#1C1C1E]"
          }`}
        >
          <p className="text-sm leading-relaxed">{content}</p>
        </div>
        <span className="text-xs text-[#8E8E93]">{timestamp}</span>
      </div>
    </div>
  )
}
