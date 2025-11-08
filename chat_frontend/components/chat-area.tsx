"use client"

import { Send, Paperclip, MoreVertical, ArrowLeft, Users, LogOut, Trash2, Settings } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import ChatMessage from "./chat-message"
import { useWebSocket } from "@/lib/websocket-context"

interface Message {
  id: string
  sender_id: string
  sender_username: string
  content: string
  timestamp: string
}

interface ChatAreaProps {
  conversationId: string | number | null
  conversationTitle?: string
  onBack?: () => void
  showBackButton?: boolean
}

export default function ChatArea({ conversationId, conversationTitle, onBack, showBackButton }: ChatAreaProps) {
  const { sendMessage, lastMessage, isConnected } = useWebSocket()
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Modal states
  const [showMembersDialog, setShowMembersDialog] = useState(false)
  const [showSettingsDialog, setShowSettingsDialog] = useState(false)
  const [showClearChatDialog, setShowClearChatDialog] = useState(false)
  const [showLeaveGroupDialog, setShowLeaveGroupDialog] = useState(false)
  const [groupMembers, setGroupMembers] = useState<any[]>([])
  const [groupInfo, setGroupInfo] = useState<any>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const scrollToBottom = () => {
    // Use setTimeout to ensure DOM is updated before scrolling
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
    }, 100)
  }

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Load messages when conversation changes
  useEffect(() => {
    if (conversationId && isConnected) {
      loadMessages()
    } else if (!conversationId) {
      setMessages([])
    }
  }, [conversationId, isConnected])

  // Handle WebSocket responses
  useEffect(() => {
    if (lastMessage) {
      console.log('ChatArea received WebSocket message:', lastMessage)

      if (lastMessage.status === 'ok' && lastMessage.messages) {
        const receivedMessages = lastMessage.messages || []
        setMessages(receivedMessages)
        setLoading(false)
      }

      // Handle real-time new messages
      if (lastMessage.type === 'message:new') {
        console.log('Received message:new, conversationId:', conversationId, 'message chat_session_id:', lastMessage.chat_session_id)

        // Check if this message belongs to the current conversation
        const messageChatId = lastMessage.chat_session_id || lastMessage.chat_id || lastMessage.payload?.chat_session_id
        if (messageChatId === conversationId) {
          console.log('Adding new message to current conversation')
          const newMessage = lastMessage.payload || lastMessage

          setMessages(prev => {
            // Check if this replaces a temporary message from the current user
            const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
            const tempMessageIndex = prev.findIndex(msg =>
              msg.id.startsWith('temp-') &&
              msg.sender_id === currentUser.id &&
              msg.content === newMessage.content
            )

            if (tempMessageIndex !== -1) {
              // Replace the temporary message with the real one
              const updatedMessages = [...prev]
              updatedMessages[tempMessageIndex] = newMessage
              return updatedMessages
            } else {
              // Check for regular duplicates
              const exists = prev.some(msg => msg.id === newMessage.id)
              if (!exists) {
                return [...prev, newMessage]
              }
              return prev
            }
          })
        } else {
          console.log('Message is for different conversation:', messageChatId, 'vs current:', conversationId)
        }
      }

      // Handle group members and info response (using get_chat)
      if (lastMessage.status === 'ok' && lastMessage.chat) {
        // Set members
        if (lastMessage.chat.participants) {
          setGroupMembers(lastMessage.chat.participants)
        }
        // Set group info (map backend fields to frontend expectations)
        if (lastMessage.chat.type === 'group') {
          setGroupInfo({
            name: lastMessage.chat.group_name,
            created_at: lastMessage.chat.created_at
          })
        }
      }

      // Handle clear chat response
      if (lastMessage.type === 'chat_cleared' && lastMessage.status === 'ok') {
        setMessages([])
      }

      // Handle leave group response
      if (lastMessage.type === 'group_left' && lastMessage.status === 'ok') {
        // Group left successfully
        console.log('Successfully left group')
      }
    }
  }, [lastMessage, conversationId])

  const loadMessages = () => {
    if (!conversationId) return

    setLoading(true)
    console.log('Loading messages for conversation:', conversationId)
    sendMessage({
      type: 'get_messages',
      chat_id: conversationId
    })
  }

  const handleSend = () => {
    if (inputValue.trim() && conversationId) {
      const messageContent = inputValue.trim()

      // Create temporary message for immediate UI feedback
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
      const tempId = `temp-${Date.now()}`
      const tempMessage: Message = {
        id: tempId,
        sender_id: currentUser.id,
        sender_username: currentUser.username,
        content: messageContent,
        timestamp: new Date().toISOString()
      }

      // Add message to UI immediately
      setMessages(prev => [...prev, tempMessage])

      // Send via WebSocket
      sendMessage({
        type: 'message',
        chat_id: conversationId,
        content: messageContent,
        temp_id: tempId // Include temp ID so backend can reference it
      })

      setInputValue("")
    }
  }

  // Chat options handlers
  const handleViewMembers = () => {
    if (conversationId) {
      sendMessage({
        type: 'get_chat',
        chatId: conversationId
      })
      setShowMembersDialog(true)
      setDropdownOpen(false) // Close dropdown when opening dialog
    }
  }

  const handleGroupSettings = () => {
    if (conversationId) {
      sendMessage({
        type: 'get_chat',
        chatId: conversationId
      })
      setShowSettingsDialog(true)
      setDropdownOpen(false) // Close dropdown when opening dialog
    }
  }

  const handleClearChat = () => {
    setShowClearChatDialog(true)
    setDropdownOpen(false) // Close dropdown when opening dialog
  }

  const confirmClearChat = () => {
    if (conversationId) {
      sendMessage({
        type: 'clear_chat',
        chat_id: conversationId
      })
      setMessages([])
      setShowClearChatDialog(false)
    }
  }

  const handleLeaveGroup = () => {
    setShowLeaveGroupDialog(true)
    setDropdownOpen(false) // Close dropdown when opening dialog
  }

  const confirmLeaveGroup = () => {
    if (conversationId) {
      sendMessage({
        type: 'leave_group',
        chat_id: conversationId
      })
      setShowLeaveGroupDialog(false)
      // Navigate back to conversation list
      if (onBack) onBack()
    }
  }

  return (
    <>
      <div className="flex-1 flex flex-col bg-background">
      {/* Header */}
      <div className="h-16 border-b border-border px-4 md:px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          {showBackButton && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 md:hidden" 
              onClick={onBack}
            >
              <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
            </Button>
          )}
          <div>
            <h1 className="text-sm font-semibold text-foreground">
              {conversationTitle || (conversationId ? "Chat" : "Welcome")}
            </h1>
            <p className="text-xs text-muted-foreground">
              {conversationId ? "Active conversation" : "Select a chat to start messaging"}
            </p>
          </div>
        </div>
        <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="w-4 h-4" strokeWidth={1.5} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={handleViewMembers}>
              <Users className="w-4 h-4 mr-2" />
              View Members
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleGroupSettings}>
              <Settings className="w-4 h-4 mr-2" />
              Group Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleClearChat}>
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Chat
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLeaveGroup} className="text-destructive">
              <LogOut className="w-4 h-4 mr-2" />
              Leave Group
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-sm text-muted-foreground">Loading messages...</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-sm text-muted-foreground text-center">
              {conversationId ? "No messages yet. Start the conversation!" : (
                <div className="max-w-md mx-auto space-y-6">
                  <div className="text-center space-y-4">
                    {/* WhatsApp-style welcome icon */}
                    <div className="mx-auto w-24 h-24 bg-linear-to-br from-primary to-primary/80 rounded-full flex items-center justify-center shadow-lg">
                      <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12c0 1.54.36 3.05 1.05 4.42L2 22l5.58-1.05C9.95 21.64 11.46 22 13 22h7c1.1 0 2-.9 2-2V12c0-5.52-4.48-10-10-10zM8.5 14.5l1.5-1.5 1.5 1.5 3.5-3.5L13 9.5l1.5-1.5-3.5-3.5-3.5 3.5 1.5 1.5L8.5 9.5l-3.5 3.5 3.5 3.5z"/>
                      </svg>
                    </div>

                    {/* Welcome text */}
                    <div className="space-y-2">
                      <h2 className="text-2xl font-semibold text-foreground">Welcome to RedES Chat!</h2>
                      <p className="text-muted-foreground max-w-sm mx-auto leading-relaxed">
                        Connect with friends and family. Start a conversation by selecting a chat from the sidebar.
                      </p>
                    </div>

                    {/* Feature hints */}
                    <div className="grid grid-cols-1 gap-3 mt-8 text-sm">
                      <div className="flex items-center space-x-3 text-muted-foreground">
                        <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        </div>
                        <span>Start conversations with anyone</span>
                      </div>

                      <div className="flex items-center space-x-3 text-muted-foreground">
                        <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                        <span>Create group chats</span>
                      </div>

                      <div className="flex items-center space-x-3 text-muted-foreground">
                        <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                        <span>Send messages instantly</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          messages.map((message) => {
            const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
            const isCurrentUser = message.sender_id === currentUser.id
            return (
              <ChatMessage
                key={message.id}
                type={isCurrentUser ? "user" : "assistant"}
                content={message.content}
                timestamp={new Date(message.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                senderName={message.sender_username}
              />
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - Only show when a conversation is selected */}
      {conversationId && (
        <div className="border-t border-border px-4 md:px-6 py-4 shrink-0">
          <div className="flex gap-2 items-end">
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
              <Paperclip className="w-4 h-4" strokeWidth={1.5} />
            </Button>

            <div className="flex-1 flex gap-2">
              <Input
                type="text"
                placeholder="Message..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                className="h-9 text-sm"
              />
              <Button onClick={handleSend} size="icon" className="h-9 w-9 shrink-0">
                <Send className="w-4 h-4" strokeWidth={1.5} />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>

    {/* Members Dialog */}
    <Dialog open={showMembersDialog} onOpenChange={setShowMembersDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Group Members</DialogTitle>
          <DialogDescription>
            Members of this group conversation
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          {groupMembers.length > 0 ? (
            groupMembers.map((member: any) => (
              <div key={member.id} className="flex items-center gap-3 p-2 rounded-lg border">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-primary">
                    {member.username?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <span className="text-sm">{member.username}</span>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">Loading members...</p>
          )}
        </div>
      </DialogContent>
    </Dialog>

    {/* Group Settings Dialog */}
    <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Group Settings</DialogTitle>
          <DialogDescription>
            Manage group settings and information
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {groupInfo ? (
            <>
              <div>
                <label className="text-sm font-medium">Group Name</label>
                <p className="text-sm text-muted-foreground">{groupInfo.name || conversationTitle}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Created</label>
                <p className="text-sm text-muted-foreground">
                  {groupInfo.created_at ? new Date(groupInfo.created_at).toLocaleDateString() : 'Unknown'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">Members</label>
                <p className="text-sm text-muted-foreground">{groupMembers.length} members</p>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Loading group information...</p>
          )}
        </div>
      </DialogContent>
    </Dialog>

    {/* Clear Chat Confirmation Dialog */}
    <Dialog open={showClearChatDialog} onOpenChange={setShowClearChatDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Clear Chat</DialogTitle>
          <DialogDescription>
            Are you sure you want to clear all messages in this conversation? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowClearChatDialog(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={confirmClearChat}>
            Clear Chat
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Leave Group Confirmation Dialog */}
    <Dialog open={showLeaveGroupDialog} onOpenChange={setShowLeaveGroupDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Leave Group</DialogTitle>
          <DialogDescription>
            Are you sure you want to leave this group? You will no longer receive messages from this conversation.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowLeaveGroupDialog(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={confirmLeaveGroup}>
            Leave Group
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  )
}
