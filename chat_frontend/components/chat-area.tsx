"use client"

import { Send, Paperclip, MoreVertical, ArrowLeft, Users, LogOut, Trash2, Settings, Plus, Menu } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { useTranslations } from 'next-intl';

interface Message {
  id: string
  sender_id: string
  sender_username: string
  content: string
  timestamp: string
  read_by?: string[] // Array of user IDs who have read the message
  read_at?: string // Timestamp when the message was read
}

interface ChatAreaProps {
  conversationId: string | number | null
  conversationTitle?: string
  onBack?: () => void
  showBackButton?: boolean
  onMenuClick?: () => void
}

export default function ChatArea({ conversationId, conversationTitle, onBack, showBackButton, onMenuClick }: ChatAreaProps) {
  const { sendMessage, lastMessage, isConnected } = useWebSocket()
  const t = useTranslations('chat');
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Modal states
  const [showMembersDialog, setShowMembersDialog] = useState(false)
  const [showSettingsDialog, setShowSettingsDialog] = useState(false)
  const [showClearChatDialog, setShowClearChatDialog] = useState(false)
  const [showLeaveGroupDialog, setShowLeaveGroupDialog] = useState(false)
  const [showRemoveMemberDialog, setShowRemoveMemberDialog] = useState(false)
  const [showDeleteGroupDialog, setShowDeleteGroupDialog] = useState(false)
  const [memberToRemove, setMemberToRemove] = useState<any>(null)
  const [groupMembers, setGroupMembers] = useState<any[]>([])
  const [groupInfo, setGroupInfo] = useState<any>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [chatType, setChatType] = useState<'dm' | 'group' | null>(null)
  const [chatDisplayName, setChatDisplayName] = useState<string>('')
  const [isCurrentUserRemoved, setIsCurrentUserRemoved] = useState(false)
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false)
  const [availableUsers, setAvailableUsers] = useState<any[]>([])
  const [userSearchQuery, setUserSearchQuery] = useState('')
  const [selectedUsersToAdd, setSelectedUsersToAdd] = useState<string[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)

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
    console.log("ChatArea conversationId changed:", conversationId)
    if (conversationId && isConnected) {
      // Reset chat info when switching conversations
      setGroupMembers([])
      setGroupInfo(null)
      setChatType(null)
      setChatDisplayName('')
      loadMessages()
    } else if (!conversationId) {
      setMessages([])
      setGroupMembers([])
      setGroupInfo(null)
      setChatType(null)
      setChatDisplayName('')
    }
  }, [conversationId, isConnected])

  // Handle WebSocket responses
  useEffect(() => {
    console.log('ChatArea useEffect triggered, lastMessage:', lastMessage, 'conversationId:', conversationId)
    if (lastMessage) {
      console.log('ChatArea received WebSocket message:', lastMessage)

      // Handle messages response - check for messages array in various possible locations
      console.log('Checking for messages in response, available keys:', Object.keys(lastMessage))
      if (lastMessage.messages && Array.isArray(lastMessage.messages)) {
        const receivedMessages = lastMessage.messages
        console.log('Processing messages response:', receivedMessages.length, 'messages')
        setMessages(receivedMessages)
        setLoading(false)
        // Mark messages as read after loading
        setTimeout(() => markMessagesAsRead(), 100)
      } else if (lastMessage.data && lastMessage.data.messages && Array.isArray(lastMessage.data.messages)) {
        console.log('Found messages in data.messages')
        setMessages(lastMessage.data.messages)
        setLoading(false)
        // Mark messages as read after loading
        setTimeout(() => markMessagesAsRead(), 100)
      } else if (lastMessage.type === 'messages' && lastMessage.payload && Array.isArray(lastMessage.payload)) {
        console.log('Found messages in payload array')
        setMessages(lastMessage.payload)
        setLoading(false)
        // Mark messages as read after loading
        setTimeout(() => markMessagesAsRead(), 100)
      } else {
        // Check if any property contains an array that might be messages
        for (const [key, value] of Object.entries(lastMessage)) {
          if (key !== 'request_id' && key !== 'status' && key !== 'type' && Array.isArray(value) && value.length > 0) {
            // Check if the first item looks like a message (has content property)
            if (value[0] && typeof value[0] === 'object' && 'content' in value[0]) {
              console.log('Found potential messages array in property:', key, 'length:', value.length)
              setMessages(value)
              setLoading(false)
              // Mark messages as read after loading
              setTimeout(() => markMessagesAsRead(), 100)
              break
            }
          }
        }
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

      // Handle read receipts
      if (lastMessage.type === 'messages_read') {
        console.log('Received read receipts update:', lastMessage)
        const readUpdates = lastMessage.read_updates || lastMessage.updates || []
        setMessages(prev => prev.map(message => {
          const update = readUpdates.find((u: any) => u.message_id === message.id)
          if (update) {
            return {
              ...message,
              read_by: update.read_by || message.read_by,
              read_at: update.read_at || message.read_at
            }
          }
          return message
        }))
      }

      // Handle group members and info response (using get_chat)
      console.log('Checking lastMessage.chat:', lastMessage.chat, 'type:', typeof lastMessage.chat)
      if (lastMessage.chat) {
        console.log('Processing chat response')
        // Set members
        if (lastMessage.chat.participants) {
          setGroupMembers(lastMessage.chat.participants)
          // Check if current user is removed from this group
          const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
          const isRemoved = lastMessage.chat.removed_users?.includes(currentUser.id) ||
                           lastMessage.chat.participants.some((p: any) => p.id === currentUser.id && p.removed)
          setIsCurrentUserRemoved(isRemoved || false)
        }
        // Set group info (map backend fields to frontend expectations)
        if (lastMessage.chat.type === 'group') {
          setGroupInfo({
            id: lastMessage.chat.group_id,
            name: lastMessage.chat.group_name,
            created_at: lastMessage.chat.created_at,
            creator_id: lastMessage.chat.group_creator_id
          })
          setChatType('group')
          setChatDisplayName(lastMessage.chat.group_name || 'Unnamed Group')
        } else if (lastMessage.chat.type === 'dm') {
          setGroupInfo(null) // Clear group info for DMs
          setChatType('dm')
          // For DM, show the other person's name
          if (lastMessage.chat.participants) {
            const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
            const otherPerson = lastMessage.chat.participants.find((p: any) => p.id !== currentUser.id)
            setChatDisplayName(otherPerson ? otherPerson.username : 'Unknown User')
          }
        }

        // Workaround: If we received chat data but no messages, try to load messages again
        // This handles the case where the backend sends responses in the wrong order or with wrong request_ids
        if (!lastMessage.messages && conversationId) {
          console.log('Chat received but no messages loaded, retrying messages load')
          setTimeout(() => {
            sendMessage({
              type: 'get_messages',
              chat_id: conversationId
            })
          }, 100) // Small delay to avoid overwhelming the backend
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

      // Handle delete group response
      if (lastMessage.type === 'group_deleted' && lastMessage.status === 'ok') {
        // Group deleted successfully
        console.log('Successfully deleted group')
      }

      // Handle remove member response
      if (lastMessage.status === 'ok' && lastMessage.message === 'Member removed') {
        // Member removed successfully, refresh the member list
        if (conversationId) {
          sendMessage({
            type: 'get_chat',
            chatId: conversationId
          })
        }
      }

      // Handle member removed notification (when someone else removes a member)
      if (lastMessage.type === 'group:member_removed') {
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
        // If the current user was removed from a group, update their state
        if (lastMessage.payload?.user_id === currentUser.id) {
          console.log('Current user was removed from group')
          setIsCurrentUserRemoved(true)
        }
        // Refresh the member list if we're in the affected group
        if (conversationId && lastMessage.payload?.group_id === groupInfo?.id) {
          sendMessage({
            type: 'get_chat',
            chatId: conversationId
          })
        }
      }

      // Handle get users response for adding members
      if (lastMessage.users && Array.isArray(lastMessage.users)) {
        console.log('Received users for adding members:', lastMessage.users.length, 'users')
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
        console.log('Current user:', currentUser)
        console.log('Group members:', groupMembers)
        // Filter out current user and existing group members
        const filteredUsers = lastMessage.users.filter((user: any) => 
          user.id !== currentUser.id && 
          !groupMembers.some((member: any) => member.id === user.id)
        )
        console.log('Filtered users:', filteredUsers.length, 'users')
        setAvailableUsers(filteredUsers)
        setLoadingUsers(false)
      }

      // Handle add member response
      if (lastMessage.status === 'ok' && (lastMessage.message === 'Member added' || lastMessage.type === 'group:member_added')) {
        console.log('Member added successfully, refreshing chat data...')
        // Member added successfully, refresh the member list to ensure consistency
        if (conversationId) {
          sendMessage({
            type: 'get_chat',
            chatId: conversationId
          })
        }
      } else if (lastMessage.status === 'error' && (lastMessage.type === 'add_group_member' || lastMessage.message?.includes('add member'))) {
        console.log('Failed to add member, reverting optimistic update...')
        // If adding member failed, refresh the chat data to revert optimistic changes
        if (conversationId) {
          sendMessage({
            type: 'get_chat',
            chatId: conversationId
          })
        }
      }

      // Handle member added notification (when current user is added to a group)
      if (lastMessage.type === 'group:member_added' && lastMessage.payload) {
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
        // If the current user was added to a group, the conversation list will be updated by conversation-list.tsx
        if (lastMessage.payload.user_id === currentUser.id) {
          console.log('Current user was added to a group')
        }
        // If we're in the affected group, refresh the member list
        if (conversationId && lastMessage.payload.group_id === groupInfo?.id) {
          sendMessage({
            type: 'get_chat',
            chatId: conversationId
          })
        }
      }
    }
  }, [lastMessage, conversationId]) // Added conversationId back to dependencies

  const loadMessages = () => {
    if (!conversationId) return

    setLoading(true)
    console.log('Loading messages for conversation:', conversationId)
    sendMessage({
      type: 'get_messages',
      chat_id: conversationId
    })
    
    // Also get chat info to determine if it's a group and get member info
    sendMessage({
      type: 'get_chat',
      chatId: conversationId
    })
  }

  const markMessagesAsRead = () => {
    if (!conversationId || messages.length === 0) return

    const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
    if (!currentUser.id) return

    // Find unread messages sent by others
    const unreadMessageIds = messages
      .filter(message => 
        message.sender_id !== currentUser.id && // Not sent by current user
        (!message.read_by || !message.read_by.includes(currentUser.id)) // Not read by current user
      )
      .map(message => message.id)

    if (unreadMessageIds.length > 0) {
      console.log('Marking messages as read:', unreadMessageIds)
      sendMessage({
        type: 'mark_read',
        message_ids: unreadMessageIds,
        chat_id: conversationId,
        user_id: currentUser.id
      })
    }
  }

  const handleSend = () => {
    if (inputValue.trim() && conversationId) {
      // Check if user is removed from this group
      if (chatType === 'group' && isCurrentUserRemoved) {
        console.log('User is removed from this group and cannot send messages')
        return // Don't send the message
      }

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

  const handleRemoveMember = (member: any) => {
    setMemberToRemove(member)
    setShowRemoveMemberDialog(true)
  }

  const confirmRemoveMember = () => {
    if (conversationId && memberToRemove) {
      sendMessage({
        type: 'remove_group_member',
        group_id: groupInfo?.id || conversationId, // Use group ID if available
        user_id: memberToRemove.id
      })
      setShowRemoveMemberDialog(false)
      setMemberToRemove(null)
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

  const handleDeleteGroup = () => {
    setShowDeleteGroupDialog(true)
    setDropdownOpen(false) // Close dropdown when opening dialog
  }

  const confirmDeleteGroup = () => {
    if (conversationId) {
      sendMessage({
        type: 'delete_group',
        group_id: groupInfo?.id || conversationId
      })
      setShowDeleteGroupDialog(false)
      // Navigate back to conversation list
      if (onBack) onBack()
    }
  }

  // Add member functionality
  const handleAddMember = () => {
    setShowAddMemberDialog(true)
    setDropdownOpen(false) // Close dropdown when opening dialog
    loadAvailableUsers()
  }

  const loadAvailableUsers = () => {
    if (!conversationId) return

    setLoadingUsers(true)
    sendMessage({
      type: 'search_users',
      query: '' // Empty query to get all users
    })
  }

  const handleUserSelectToAdd = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsersToAdd(prev => [...prev, userId])
    } else {
      setSelectedUsersToAdd(prev => prev.filter(id => id !== userId))
    }
  }

  const addMembers = () => {
    if (!conversationId || selectedUsersToAdd.length === 0) return

    console.log('Adding members to group:', selectedUsersToAdd.length, 'users')

    // Optimistically update the UI by adding the selected users to groupMembers
    const usersToAdd = availableUsers.filter(user => selectedUsersToAdd.includes(user.id))
    console.log('Users to add:', usersToAdd)
    setGroupMembers(prev => [...prev, ...usersToAdd])

    // Add each selected user to the group
    selectedUsersToAdd.forEach(userId => {
      console.log('Adding user ID:', userId, 'to group:', groupInfo?.id || conversationId)
      sendMessage({
        type: 'add_group_member',
        group_id: groupInfo?.id || conversationId,
        user_id: userId
      })
    })

    // Close modal and reset state
    setShowAddMemberDialog(false)
    setSelectedUsersToAdd([])
    setUserSearchQuery('')
  }

  return (
    <>
      <div className="flex flex-col bg-background h-full">
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
          {onMenuClick && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 md:hidden" 
              onClick={onMenuClick}
            >
              <Menu className="w-4 h-4" strokeWidth={1.5} />
            </Button>
          )}
          <div>
            <h1 className="text-sm font-semibold text-foreground">
              {chatDisplayName || conversationTitle || (conversationId ? t('chatTitle') : t('welcomeTitle'))}
            </h1>
            <p className="text-xs text-muted-foreground">
              {conversationId ? (
                chatType === 'group' ? (
                  isCurrentUserRemoved ? 
                    t('removedFromGroup') : 
                    `${groupMembers.length} ${t('members')}`
                ) : 
                  t('directMessage')
              ) : t('selectChat')}
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
            {groupInfo ? (
              <>
                <DropdownMenuItem onClick={handleViewMembers}>
                  <Users className="w-4 h-4 mr-2" />
                  {t('viewMembers')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleGroupSettings}>
                  <Settings className="w-4 h-4 mr-2" />
                  {t('groupSettings')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleClearChat}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  {t('clearChat')}
                </DropdownMenuItem>
                {(() => {
                  const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
                  return currentUser.id === groupInfo.creator_id ? (
                    <DropdownMenuItem onClick={handleDeleteGroup} className="text-destructive">
                      <Trash2 className="w-4 h-4 mr-2" />
                      {t('deleteGroup')}
                    </DropdownMenuItem>
                  ) : null
                })()}
                <DropdownMenuItem onClick={handleLeaveGroup} className="text-destructive">
                  <LogOut className="w-4 h-4 mr-2" />
                  {t('leaveGroup')}
                </DropdownMenuItem>
              </>
            ) : (
              <DropdownMenuItem onClick={handleClearChat}>
                <Trash2 className="w-4 h-4 mr-2" />
                {t('clearChat')}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-sm text-muted-foreground">{t('loading')}</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-sm text-muted-foreground text-center">
              {conversationId ? t('noMessages') : (
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
                      <h2 className="text-2xl font-semibold text-foreground">{t('welcome')}</h2>
                      <p className="text-muted-foreground max-w-sm mx-auto leading-relaxed">
                        {t('welcomeDesc')}
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
                        <span>{t('startConversation')}</span>
                      </div>

                      <div className="flex items-center space-x-3 text-muted-foreground">
                        <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                        <span>{t('createGroups')}</span>
                      </div>

                      <div className="flex items-center space-x-3 text-muted-foreground">
                        <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                        <span>{t('sendMessages')}</span>
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
            const isRead = message.read_by && message.read_by.length > 0
            return (
              <ChatMessage
                key={message.id}
                type={isCurrentUser ? "user" : "assistant"}
                content={message.content}
                timestamp={new Date(message.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                senderName={message.sender_username}
                readBy={message.read_by}
                isRead={isRead}
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
                placeholder={chatType === 'group' && isCurrentUserRemoved ? t('removedFromGroup') : t('message')}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                disabled={chatType === 'group' && isCurrentUserRemoved}
                className="h-9 text-sm"
              />
              <Button 
                onClick={handleSend} 
                size="icon" 
                className="h-9 w-9 shrink-0"
                disabled={chatType === 'group' && isCurrentUserRemoved}
              >
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
          <DialogTitle>{t('groupMembers')}</DialogTitle>
          <DialogDescription>
            {t('membersOfGroup')}
          </DialogDescription>
        </DialogHeader>
        {(() => {
          const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
          const isGroupOwner = groupInfo?.creator_id === currentUser.id
          return isGroupOwner ? (
            <div className="flex justify-end mb-4">
              <Button onClick={handleAddMember} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                {t('addMember')}
              </Button>
            </div>
          ) : null
        })()}
        <div className="space-y-2">
          {groupMembers.length > 0 ? (
            groupMembers.map((member: any) => {
              const currentUser = JSON.parse(localStorage.getItem('user') || '{}')
              const isCurrentUser = member.id === currentUser.id
              const isGroupOwner = groupInfo?.creator_id === currentUser.id
              const isMemberOwner = groupInfo?.creator_id === member.id
              const canRemoveMember = isGroupOwner && !isMemberOwner // Owner can remove anyone except themselves

              return (
                <div key={member.id} className="flex items-center justify-between gap-3 p-2 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">
                        {member.username?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm">{member.username}</span>
                      {isMemberOwner && (
                        <span className="text-xs text-muted-foreground ml-2">{t('owner')}</span>
                      )}
                      {isCurrentUser && (
                        <span className="text-xs text-muted-foreground ml-2">{t('you')}</span>
                      )}
                    </div>
                  </div>
                  {canRemoveMember && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveMember(member)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              )
            })
          ) : (
            <p className="text-sm text-muted-foreground">{t('loadingMembers')}</p>
          )}
        </div>
      </DialogContent>
    </Dialog>

    {/* Add Member Dialog */}
    <Dialog open={showAddMemberDialog} onOpenChange={setShowAddMemberDialog}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('addMembers')}</DialogTitle>
          <DialogDescription>
            {t('addNewMembers')}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="search-users-add" className="text-right">
              {t('searchUsers')}
            </Label>
            <Input
              id="search-users-add"
              value={userSearchQuery}
              onChange={(e) => setUserSearchQuery(e.target.value)}
              className="col-span-3"
              placeholder={t('searchForUsers')}
              onKeyUp={(e) => {
                if (e.key === 'Enter') {
                  loadAvailableUsers()
                }
              }}
            />
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label className="text-right pt-2">{t('selectUsers')}</Label>
            <div className="col-span-3 max-h-40 overflow-y-auto space-y-2">
              {loadingUsers ? (
                <p className="text-sm text-muted-foreground">{t('loadingUsers')}</p>
              ) : availableUsers.length > 0 ? (
                availableUsers.map((user) => (
                  <div key={user.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`user-add-${user.id}`}
                      checked={selectedUsersToAdd.includes(user.id)}
                      onChange={(e) => handleUserSelectToAdd(user.id, e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor={`user-add-${user.id}`} className="text-sm">
                      {user.username}
                    </Label>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">{t('noUsersAvailable')}</p>
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowAddMemberDialog(false)}>
            {t('cancel')}
          </Button>
          <Button
            onClick={addMembers}
            disabled={selectedUsersToAdd.length === 0}
          >
            {t('addMembers')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Group Settings Dialog */}
    <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('groupSettings')}</DialogTitle>
          <DialogDescription>
            {t('manageGroupSettings')}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {groupInfo ? (
            <>
              <div>
                <label className="text-sm font-medium">{t('groupName')}</label>
                <p className="text-sm text-muted-foreground">{groupInfo?.name || chatDisplayName || conversationTitle}</p>
              </div>
              <div>
                <label className="text-sm font-medium">{t('created')}</label>
                <p className="text-sm text-muted-foreground">
                  {groupInfo.created_at ? new Date(groupInfo.created_at).toLocaleDateString() : t('unknown')}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium">{t('members')}</label>
                <p className="text-sm text-muted-foreground">{groupMembers.length} {t('members')}</p>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">{t('loadingGroupInfo')}</p>
          )}
        </div>
      </DialogContent>
    </Dialog>

    {/* Clear Chat Confirmation Dialog */}
    <Dialog open={showClearChatDialog} onOpenChange={setShowClearChatDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('clearChat')}</DialogTitle>
          <DialogDescription>
            {t('clearChatConfirm')}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowClearChatDialog(false)}>
            {t('cancel')}
          </Button>
          <Button variant="destructive" onClick={confirmClearChat}>
            {t('clearChat')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Leave Group Confirmation Dialog */}
    <Dialog open={showLeaveGroupDialog} onOpenChange={setShowLeaveGroupDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('leaveGroup')}</DialogTitle>
          <DialogDescription>
            {t('leaveGroupConfirm')}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowLeaveGroupDialog(false)}>
            {t('cancel')}
          </Button>
          <Button variant="destructive" onClick={confirmLeaveGroup}>
            {t('leaveGroup')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Delete Group Confirmation Dialog */}
    <Dialog open={showDeleteGroupDialog} onOpenChange={setShowDeleteGroupDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('deleteGroup')}</DialogTitle>
          <DialogDescription>
            {t('deleteGroupConfirm')}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowDeleteGroupDialog(false)}>
            {t('cancel')}
          </Button>
          <Button variant="destructive" onClick={confirmDeleteGroup}>
            {t('deleteGroup')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Remove Member Confirmation Dialog */}
    <Dialog open={showRemoveMemberDialog} onOpenChange={setShowRemoveMemberDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('removeMember')}</DialogTitle>
          <DialogDescription>
            {t('removeMemberConfirm', { username: memberToRemove?.username || 'this member' })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowRemoveMemberDialog(false)}>
            {t('cancel')}
          </Button>
          <Button variant="destructive" onClick={confirmRemoveMember}>
            {t('removeMember')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  )
}
