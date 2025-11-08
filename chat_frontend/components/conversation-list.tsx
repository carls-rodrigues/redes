"use client"

import { useEffect, useState } from "react"
import { Plus, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import ConversationCard from "./conversation-card"
import { useWebSocket } from "@/lib/websocket-context"

const MOCK_CONVERSATIONS = [
  {
    id: "0",
    title: "Design System Discussion",
    preview: "Let's discuss the new design patterns...",
    timestamp: "Today",
    unread: false,
    hasMessages: true,
  },
  {
    id: "1",
    title: "Project Updates",
    preview: "The latest updates on the Q4 roadmap",
    timestamp: "Yesterday",
    unread: true,
    hasMessages: true,
  },
  {
    id: "2",
    title: "Team Feedback",
    preview: "Great work on the latest iteration...",
    timestamp: "2 days ago",
    unread: false,
    hasMessages: true,
  },
  {
    id: "3",
    title: "Feature Planning",
    preview: "Let's plan the next sprint features",
    timestamp: "1 week ago",
    unread: false,
    hasMessages: true,
  },
]

interface Conversation {
  id: string
  title: string
  preview: string
  timestamp: string
  unread: boolean
  hasMessages?: boolean
}

interface ConversationListProps {
  selectedId: string | number | null
  onSelect: (conversation: Conversation) => void
}

export default function ConversationList({ selectedId, onSelect }: ConversationListProps) {
  const { sendMessage, lastMessage, isConnected } = useWebSocket()
  const [conversations, setConversations] = useState<typeof MOCK_CONVERSATIONS>([])
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false)
  const [groupName, setGroupName] = useState("")
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [availableUsers, setAvailableUsers] = useState<any[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [userSearchQuery, setUserSearchQuery] = useState("")

  // Load chats when component mounts or connection is established
  useEffect(() => {
    if (isConnected) {
      loadChats()
    }
  }, [isConnected])

  // Listen for WebSocket responses
  useEffect(() => {
    if (lastMessage) {
      console.log({ lastMessage })

      // Handle get_user_chats response
      if (lastMessage.status === 'ok' && lastMessage.chats) {
        const chats = lastMessage.chats || []
        const transformedConversations = chats.map(transformChatToConversation)
        setConversations(transformedConversations)
      }

      // Handle user search results
      if (lastMessage.status === 'ok' && lastMessage.users) {
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
        // Filter out current user from available users
        const filteredUsers = lastMessage.users.filter((user: any) => user.id !== currentUser.id)
        setAvailableUsers(filteredUsers)
        setLoadingUsers(false)
      }

      // Handle group creation success
      if (lastMessage.status === 'ok' && (lastMessage.type === 'create_group' || lastMessage.message === 'Group created successfully' || lastMessage.group)) {
        console.log('Group created successfully', lastMessage)
        // Refresh the chat list to show the new group
        loadChats()
        // Close modal if it's still open
        setIsCreateGroupOpen(false)
      }

      // Handle real-time message updates to refresh conversation list
      if (lastMessage.type === 'message:new') {
        console.log('New message received, refreshing conversation list')
        // Refresh the chat list to show updated previews and timestamps
        loadChats()
      }
    }
  }, [lastMessage])

  const loadChats = () => {
    console.log('Loading user chats...')
    sendMessage({
      type: 'get_user_chats'
    })
  }

  const openCreateGroupModal = () => {
    setIsCreateGroupOpen(true)
    setGroupName("")
    setSelectedUsers([])
    loadAvailableUsers()
  }

  const closeCreateGroupModal = () => {
    setIsCreateGroupOpen(false)
    setGroupName("")
    setSelectedUsers([])
  }

  const loadAvailableUsers = () => {
    setLoadingUsers(true)
    sendMessage({
      type: 'search_users',
      query: userSearchQuery
    })
  }

  const handleUserSelect = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers(prev => [...prev, userId])
    } else {
      setSelectedUsers(prev => prev.filter(id => id !== userId))
    }
  }

  const createGroup = () => {
    if (!groupName.trim() || selectedUsers.length === 0) {
      alert('Please enter a group name and select at least one member')
      return
    }

    console.log('Creating group:', { groupName: groupName.trim(), memberIds: selectedUsers })

    sendMessage({
      type: 'create_group',
      group_name: groupName.trim(),
      member_ids: selectedUsers
    })

    // Close modal immediately for better UX
    closeCreateGroupModal()

    // Fallback: refresh chats after a delay in case WebSocket response is missed
    setTimeout(() => {
      console.log('Fallback: refreshing chats after group creation')
      loadChats()
    }, 1000)
  }

  const transformChatToConversation = (chat: any) => {
    // Determine display name: group name for groups, other person for DMs
    let displayName: string
    if (chat.type === 'dm' && chat.participants) {
      // For DM, show the other person's name (not current user)
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
      displayName = chat.participants
        .filter((p: any) => p.id !== currentUser.id)
        .map((p: any) => p.username)
        .join(', ') || chat.participants.map((p: any) => p.username).join(', ')
    } else {
      // For groups, show the group name or "Unnamed Group"
      displayName = chat.group_name || 'Unnamed Group'
    }

    // Format timestamp based on last_message_time
    let timestamp = 'Today' // Default to Today for newly created groups/chats
    if (chat.last_message_time) {
      const messageDate = new Date(chat.last_message_time)
      const now = new Date()

      // Get date parts for comparison (ignoring time)
      const messageDay = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate())
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)

      if (messageDay.getTime() === today.getTime()) {
        timestamp = 'Today'
      } else if (messageDay.getTime() === yesterday.getTime()) {
        timestamp = 'Yesterday'
      } else {
        // Calculate days difference
        const diffTime = today.getTime() - messageDay.getTime()
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

        if (diffDays < 7) {
          timestamp = `${diffDays} days ago`
        } else {
          timestamp = messageDate.toLocaleDateString()
        }
      }
    }

    return {
      id: chat.id, // Keep as string
      title: displayName,
      preview: chat.last_message || 'No messages yet',
      timestamp,
      unread: false, // TODO: Implement unread status
      hasMessages: !!chat.last_message_time // Add flag to identify new chats
    }
  }

  // Group conversations by time periods
  const groupConversationsByTime = (convs: typeof MOCK_CONVERSATIONS) => {
    const today: typeof MOCK_CONVERSATIONS = []
    const yesterday: typeof MOCK_CONVERSATIONS = []
    const earlier: typeof MOCK_CONVERSATIONS = []

    // Sort conversations by timestamp (most recent first)
    // For conversations within the same time period, sort by actual recency
    const sortedConvs = [...convs].sort((a, b) => {
      // First, sort by time period
      const order = { 'Today': 0, 'Yesterday': 1 }
      const aOrder = order[a.timestamp as keyof typeof order] ?? 2
      const bOrder = order[b.timestamp as keyof typeof order] ?? 2

      if (aOrder !== bOrder) {
        return aOrder - bOrder
      }

      // Within the same time period, prioritize conversations without messages (newly created)
      const aHasMessages = a.hasMessages ?? true // Default to true for backward compatibility
      const bHasMessages = b.hasMessages ?? true

      if (!aHasMessages && bHasMessages) return -1 // a (new) comes first
      if (aHasMessages && !bHasMessages) return 1  // b (new) comes first

      // If both have same message status, maintain stable sort
      return 0
    })

    sortedConvs.forEach(conv => {
      if (conv.timestamp === 'Today') {
        today.push(conv)
      } else if (conv.timestamp === 'Yesterday') {
        yesterday.push(conv)
      } else {
        earlier.push(conv)
      }
    })

    return { today, yesterday, earlier }
  }

  const { today, yesterday, earlier } = groupConversationsByTime(conversations)

  // Filter conversations based on search query
  const filteredConversations = conversations.filter(conv =>
    userSearchQuery === "" ||
    conv.title.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    conv.preview.toLowerCase().includes(userSearchQuery.toLowerCase())
  )

  const { today: filteredToday, yesterday: filteredYesterday, earlier: filteredEarlier } = groupConversationsByTime(filteredConversations)
  return (
    <div className="w-full md:w-64 bg-background flex flex-col shrink-0 border-r border-border md:border-r">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Conversations</h2>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={openCreateGroupModal}>
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
            value={userSearchQuery}
            onChange={(e) => setUserSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Scrollable Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-sm text-muted-foreground text-center">
              {userSearchQuery ? "No conversations found" : "No conversations yet"}
            </div>
          </div>
        ) : (
          <>
            {/* Section: Today */}
            {filteredToday.length > 0 && (
              <>
                <div className="px-3 pt-3 pb-1">
                  <h3 className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">Today</h3>
                </div>
                <div className="px-2 pb-2 space-y-1">
                  {filteredToday.map((conv) => (
                    <ConversationCard
                      key={conv.id}
                      {...conv}
                      isSelected={selectedId === conv.id}
                      onClick={() => onSelect(conv)}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Section: Yesterday */}
            {filteredYesterday.length > 0 && (
              <>
                <div className="px-3 pt-2 pb-1">
                  <h3 className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">Yesterday</h3>
                </div>
                <div className="px-2 pb-2 space-y-1">
                  {filteredYesterday.map((conv) => (
                    <ConversationCard
                      key={conv.id}
                      {...conv}
                      isSelected={selectedId === conv.id}
                      onClick={() => onSelect(conv)}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Section: Earlier */}
            {filteredEarlier.length > 0 && (
              <>
                <div className="px-3 pt-2 pb-1">
                  <h3 className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">Earlier</h3>
                </div>
                <div className="px-2 space-y-1">
                  {filteredEarlier.map((conv) => (
                    <ConversationCard
                      key={conv.id}
                      {...conv}
                      isSelected={selectedId === conv.id}
                      onClick={() => onSelect(conv)}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>

      <Dialog open={isCreateGroupOpen} onOpenChange={setIsCreateGroupOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Group</DialogTitle>
            <DialogDescription>
              Create a new group chat by selecting users and giving it a name.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="group-name" className="text-right">
                Group Name
              </Label>
              <Input
                id="group-name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="col-span-3"
                placeholder="Enter group name"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="search-users" className="text-right">
                Search Users
              </Label>
              <Input
                id="search-users"
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                className="col-span-3"
                placeholder="Search for users"
                onKeyUp={(e) => {
                  if (e.key === 'Enter') {
                    loadAvailableUsers()
                  }
                }}
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-2">Select Users</Label>
              <div className="col-span-3 max-h-40 overflow-y-auto space-y-2">
                {availableUsers.map((user) => (
                  <div key={user.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`user-${user.id}`}
                      checked={selectedUsers.includes(user.id)}
                      onChange={(e) => handleUserSelect(user.id, e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor={`user-${user.id}`} className="text-sm">
                      {user.username}
                    </Label>
                  </div>
                ))}
                {availableUsers.length === 0 && userSearchQuery && (
                  <p className="text-sm text-muted-foreground">No users found</p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeCreateGroupModal}>
              Cancel
            </Button>
            <Button
              onClick={createGroup}
              disabled={!groupName.trim() || selectedUsers.length === 0}
            >
              Create Group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
