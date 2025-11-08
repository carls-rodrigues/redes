"use client"

import { useEffect, useState } from "react"
import { Plus, Search, X, ArrowLeft } from "lucide-react"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import ConversationCard from "./conversation-card"
import { useWebSocket } from "@/lib/websocket-context"
import { useTranslations } from 'next-intl';

const MOCK_CONVERSATIONS = [
  {
    id: "0",
    title: "Design System Discussion",
    preview: "Let's discuss the new design patterns...",
    timestamp: "today",
    unread: false,
    hasMessages: true,
  },
  {
    id: "1",
    title: "Project Updates",
    preview: "The latest updates on the Q4 roadmap",
    timestamp: "yesterday",
    unread: true,
    hasMessages: true,
  },
  {
    id: "2",
    title: "Team Feedback",
    preview: "Great work on the latest iteration...",
    timestamp: "2_days_ago",
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

export interface Conversation {
  id: string
  title: string
  preview: string
  timestamp: string
  lastMessageTime?: Date
  unread: boolean
  hasMessages?: boolean
}

interface ConversationListProps {
  selectedId: string | number | null
  onSelect: (conversation: Conversation) => void
  onToggleMobile?: () => void
}

export default function ConversationList({ selectedId, onSelect, onToggleMobile }: ConversationListProps) {
  const { sendMessage, lastMessage, isConnected } = useWebSocket()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false)
  const [isCreateDMOpen, setIsCreateDMOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [groupName, setGroupName] = useState("")
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [availableUsers, setAvailableUsers] = useState<any[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [userSearchQuery, setUserSearchQuery] = useState("")
  const t = useTranslations('chat');
  const tNav = useTranslations('nav');
  const tCommon = useTranslations('common');

  const translateTimestamp = (key: string) => {
    // Handle specific known keys
    switch (key) {
      case 'today':
        return tCommon('today');
      case 'yesterday':
        return tCommon('yesterday');
      case '2_days_ago':
        return tCommon('2_days_ago');
      default:
        // Handle dynamic cases like "3_days_ago", "4_days_ago", etc.
        const daysMatch = key.match(/^(\d+)_days_ago$/);
        if (daysMatch) {
          const days = parseInt(daysMatch[1]);
          // For now, return a simple format. Could be enhanced with proper pluralization
          return `${days} dias atrás`;
        }
        // For dates and other cases, return as-is
        return key;
    }
  };

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
      if (lastMessage.chats || lastMessage.data) {
        console.log('Received chats response:', lastMessage)
        const chats = lastMessage.chats || lastMessage.data || []
        console.log('Chats array:', chats)
        const transformedConversations = chats.map((chat: any) => {
          console.log('Transforming chat:', chat.id, {
            updated_at: chat.updated_at,
            last_message_time: chat.last_message_time,
            created_at: chat.created_at,
            type: chat.type
          })
          return transformChatToConversation(chat)
        })
        console.log('Transformed conversations:', transformedConversations)
        setConversations(transformedConversations)
      }

      // Handle user search results
      if (lastMessage.users) {
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
        // Automatically select the new group if it exists in the response
        if (lastMessage.group) {
          const newGroup = transformChatToConversation(lastMessage.group)
          onSelect(newGroup)
        }
        // Modal is already closed in createGroup function
      }

      // Handle DM creation success
      if (lastMessage.status === 'ok' && (lastMessage.type === 'create_dm' || lastMessage.message === 'DM created successfully' || lastMessage.dm || lastMessage.chat)) {
        console.log('DM created successfully', lastMessage)
        // Wait a bit for backend to process, then refresh the chat list
        setTimeout(() => {
          console.log('Refreshing chats after DM creation')
          loadChats()
        }, 1000)
        // Automatically select the new DM if it exists in the response
        if (lastMessage.dm) {
          console.log('DM data found in response:', lastMessage.dm)
          const newDM = transformChatToConversation(lastMessage.dm)
          console.log('Transformed DM:', newDM)
          onSelect(newDM)
        } else if (lastMessage.chat) {
          console.log('Chat data found in response:', lastMessage.chat)
          const newDM = transformChatToConversation(lastMessage.chat)
          console.log('Transformed DM:', newDM)
          onSelect(newDM)
        }
        // Modal is already closed in createDM function
      }

      // Handle group member addition - refresh conversation list for newly added users
      if (lastMessage.type === 'group:member_added' || lastMessage.message === 'Member added') {
        console.log('User added to group, refreshing conversation list')
        loadChats()
      }

      // Handle group member removal - refresh conversation list
      if (lastMessage.type === 'group:member_removed' || lastMessage.message === 'Member removed') {
        console.log('User removed from group, refreshing conversation list')
        loadChats()
      }

      // Handle group deletion - refresh conversation list to remove deleted group
      if (lastMessage.type === 'group_deleted' && lastMessage.status === 'ok') {
        console.log('Group deleted successfully, refreshing conversation list')
        loadChats()
      }

      // Handle real-time message updates to refresh conversation list
      if (lastMessage.type === 'message:new') {
        console.log('New message received, updating conversation list optimistically')
        const payload = lastMessage.payload
        if (payload && payload.chat_session_id) {
          // Update the conversation list optimistically
          setConversations(prevConversations => {
            return prevConversations.map(conv => {
              if (conv.id === payload.chat_session_id) {
                // Update this conversation with the new message data
                const newTimestamp = payload.timestamp ? new Date(payload.timestamp) : new Date()
                const newPreview = payload.content || conv.preview

                // Recalculate the display timestamp based on the new message time
                const now = new Date()
                const messageDay = new Date(newTimestamp.getFullYear(), newTimestamp.getMonth(), newTimestamp.getDate())
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
                const yesterday = new Date(today)
                yesterday.setDate(yesterday.getDate() - 1)

                let displayTimestamp = 'Today'
                if (messageDay.getTime() === today.getTime()) {
                  displayTimestamp = 'Today'
                } else if (messageDay.getTime() === yesterday.getTime()) {
                  displayTimestamp = 'Yesterday'
                } else {
                  const diffTime = today.getTime() - messageDay.getTime()
                  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
                  if (diffDays < 7) {
                    displayTimestamp = `${diffDays} days ago`
                  } else {
                    displayTimestamp = newTimestamp.toLocaleDateString()
                  }
                }

                return {
                  ...conv,
                  preview: newPreview,
                  lastMessageTime: newTimestamp,
                  timestamp: displayTimestamp,
                  hasMessages: true
                }
              }
              return conv
            })
          })
        }
        // Still refresh from server as fallback, but optimistic update should be immediate
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

  const openCreateDMModal = () => {
    setIsCreateDMOpen(true)
    setSelectedUsers([])
    loadAvailableUsers()
  }

  const closeCreateDMModal = () => {
    setIsCreateDMOpen(false)
    setSelectedUsers([])
  }

  const loadAvailableUsers = () => {
    setLoadingUsers(true)
    sendMessage({
      type: 'search_users',
      query: '' // Empty query to get all users
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

  const createDM = () => {
    if (selectedUsers.length !== 1) {
      alert('Please select exactly one user for a direct message')
      return
    }

    console.log('Creating DM with user:', selectedUsers[0])
    sendMessage({
      type: 'create_dm',
      other_user_id: selectedUsers[0]
    })

    // Close modal immediately for better UX
    closeCreateDMModal()

    // Fallback: refresh chats after delays in case WebSocket response is missed
    setTimeout(() => {
      console.log('Fallback 1: refreshing chats after DM creation')
      loadChats()
    }, 500)
    setTimeout(() => {
      console.log('Fallback 2: refreshing chats after DM creation')
      loadChats()
    }, 1500)
  }

  const transformChatToConversation = (chat: any) => {
    // Determine display name: group name for groups, other person for DMs
    let displayName: string
    if ((chat.type === 'dm' || chat.type === 'direct') && (chat.participants || chat.users)) {
      // For DM, show the other person's name (not current user)
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
      const participants = chat.participants || chat.users || []
      displayName = participants
        .filter((p: any) => p.id !== currentUser.id)
        .map((p: any) => p.username)
        .join(', ') || participants.map((p: any) => p.username).join(', ')
    } else {
      // For groups, show the group name or "Unnamed Group"
      displayName = chat.group_name || chat.name || 'Unnamed Group'
    }

    // Format timestamp based on updated_at (preferred), last_message_time, or created_at
    let timestamp = 'Today' // Default to Today for newly created groups/chats
    const timestampFields = ['updated_at', 'last_message_time', 'created_at']
    let messageDate: Date | null = null

    for (const field of timestampFields) {
      if (chat[field]) {
        messageDate = new Date(chat[field])
        break
      }
    }

    if (messageDate) {
      const now = new Date()

      // Get date parts for comparison (ignoring time)
      const messageDay = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate())
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)

      if (messageDay.getTime() === today.getTime()) {
        timestamp = 'today'
      } else if (messageDay.getTime() === yesterday.getTime()) {
        timestamp = 'yesterday'
      } else {
        // Calculate days difference
        const diffTime = today.getTime() - messageDay.getTime()
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

        if (diffDays === 2) {
          timestamp = '2_days_ago'
        } else if (diffDays < 7) {
          timestamp = `${diffDays}_days_ago`
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
      lastMessageTime: messageDate || undefined,
      unread: false, // TODO: Implement unread status
      hasMessages: !!chat.last_message_time // Add flag to identify new chats
    }
  }

  // Group conversations by time periods
  const groupConversationsByTime = (convs: Conversation[]) => {
    const today: Conversation[] = []
    const yesterday: Conversation[] = []
    const earlier: Conversation[] = []

    // Sort conversations by timestamp (most recent first)
    // For conversations within the same time period, sort by actual recency
    const sortedConvs = [...convs].sort((a, b) => {
      // First, sort by time period
      const order = { 'today': 0, 'yesterday': 1 }
      const aOrder = order[a.timestamp as keyof typeof order] ?? 2
      const bOrder = order[b.timestamp as keyof typeof order] ?? 2

      if (aOrder !== bOrder) {
        return aOrder - bOrder
      }

      // Within the same time period, sort by actual last message time (most recent first)
      if (a.lastMessageTime && b.lastMessageTime) {
        return b.lastMessageTime.getTime() - a.lastMessageTime.getTime()
      }

      // If one has a message time and the other doesn't, prioritize the one with messages
      if (a.lastMessageTime && !b.lastMessageTime) return -1 // a (has messages) comes first
      if (!a.lastMessageTime && b.lastMessageTime) return 1  // b (has messages) comes first

      // If both have same message status, maintain stable sort by ID
      return a.id.localeCompare(b.id)
    })

    sortedConvs.forEach(conv => {
      if (conv.timestamp === 'today') {
        today.push(conv)
      } else if (conv.timestamp === 'yesterday') {
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
    <div className="w-full md:w-64 bg-background flex flex-col shrink-0 border-r border-border md:border-r h-full">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onToggleMobile && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 md:hidden" 
              onClick={onToggleMobile}
            >
              <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
            </Button>
          )}
          <h2 className="text-sm font-semibold text-foreground">{tNav('conversations')}</h2>
        </div>
        <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Plus className="w-4 h-4" strokeWidth={1.5} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => {
              setDropdownOpen(false)
              openCreateGroupModal()
            }}>
              {tNav('newGroup')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {
              setDropdownOpen(false)
              openCreateDMModal()
            }}>
              {tNav('newDM')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Search */}
      <div className="px-3 py-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
          <Input 
            placeholder={t('searchConversations')} 
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
            {userSearchQuery ? t('noConversationsFound') : t('noConversationsYet')}
            </div>
          </div>
        ) : (
          <>
            {/* Section: Today */}
            {filteredToday.length > 0 && (
              <>
                <div className="px-3 pt-3 pb-1">
                  <h3 className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">{tCommon('today')}</h3>
                </div>
                <div className="px-2 pb-2 space-y-1">
                  {filteredToday.map((conv) => (
                    <ConversationCard
                      key={conv.id}
                      {...conv}
                      isSelected={selectedId === conv.id}
                      onClick={() => onSelect(conv)}
                      translateTimestamp={translateTimestamp}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Section: Yesterday */}
            {filteredYesterday.length > 0 && (
              <>
                <div className="px-3 pt-2 pb-1">
                  <h3 className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">{tCommon('yesterday')}</h3>
                </div>
                <div className="px-2 pb-2 space-y-1">
                  {filteredYesterday.map((conv) => (
                    <ConversationCard
                      key={conv.id}
                      {...conv}
                      isSelected={selectedId === conv.id}
                      onClick={() => onSelect(conv)}
                      translateTimestamp={translateTimestamp}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Section: Earlier */}
            {filteredEarlier.length > 0 && (
              <>
                <div className="px-3 pt-2 pb-1">
                  <h3 className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">{tCommon('earlier')}</h3>
                </div>
                <div className="px-2 space-y-1">
                  {filteredEarlier.map((conv) => (
                    <ConversationCard
                      key={conv.id}
                      {...conv}
                      isSelected={selectedId === conv.id}
                      onClick={() => onSelect(conv)}
                      translateTimestamp={translateTimestamp}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>

      <Dialog open={isCreateGroupOpen} onOpenChange={(open) => {
        if (!open) {
          closeCreateGroupModal()
        } else {
          setIsCreateGroupOpen(true)
        }
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('createGroup')}</DialogTitle>
            <DialogDescription>
              {t('addMembers')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="group-name" className="text-right">
                {t('groupName')}
              </Label>
              <Input
                id="group-name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="col-span-3"
                placeholder={t('groupName')}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="search-users" className="text-right">
                {t('searchUsers')}
              </Label>
              <Input
                id="search-users"
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                className="col-span-3"
                placeholder={t('searchUsers')}
                onKeyUp={(e) => {
                  if (e.key === 'Enter') {
                    loadAvailableUsers()
                  }
                }}
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-2">{t('addMembers')}</Label>
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
              {t('cancel')}
            </Button>
            <Button
              onClick={createGroup}
              disabled={!groupName.trim() || selectedUsers.length === 0}
            >
              {t('create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create DM Dialog */}
      <Dialog open={isCreateDMOpen} onOpenChange={(open) => {
        if (!open) {
          closeCreateDMModal()
        } else {
          setIsCreateDMOpen(true)
        }
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('startNewDM')}</DialogTitle>
            <DialogDescription>
              {t('selectUserDM')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right pt-2">{t('addMembers')}</Label>
              <div className="col-span-3 max-h-40 overflow-y-auto space-y-2">
                {availableUsers.map((user) => (
                  <div key={user.id} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id={`dm-user-${user.id}`}
                      name="dm-user"
                      checked={selectedUsers.includes(user.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUsers([user.id])
                        }
                      }}
                      className="rounded"
                    />
                    <Label htmlFor={`dm-user-${user.id}`} className="text-sm">
                      {user.username}
                    </Label>
                  </div>
                ))}
                {availableUsers.length === 0 && userSearchQuery && (
                  <p className="text-sm text-muted-foreground">{t('noUsersFound')}</p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeCreateDMModal}>
              {t('cancel')}
            </Button>
            <Button
              onClick={createDM}
              disabled={selectedUsers.length !== 1}
            >
              {t('startDM')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
