import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User, Chat, Message, Session, AuthState, ChatState } from '../../types'

interface AppStore extends AuthState, ChatState {
  // Auth actions
  setUser: (user: User | null) => void
  setSession: (session: Session | null) => void
  logout: () => void

  // Chat actions
  setChats: (chats: Chat[]) => void
  addChat: (chat: Chat) => void
  selectChat: (chat: Chat | null) => void
  updateChatMessages: (messages: Message[]) => void
  addMessage: (message: Message) => void
  setLoadingChats: (loading: boolean) => void
  setLoadingMessages: (loading: boolean) => void
}

const STORAGE_KEY = 'redes-chat-session'

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      // Initial state - Auth
      user: null,
      session: null,
      isAuthenticated: false,

      // Initial state - Chat
      chats: [],
      selectedChat: null,
      messages: [],
      isLoadingChats: false,
      isLoadingMessages: false,

      // Auth actions
      setUser: (user: User | null) =>
        set({
          user,
          isAuthenticated: user !== null
        }),

      setSession: (session: Session | null) =>
        set({ session }),

      logout: () => {
        // Clear localStorage
        localStorage.removeItem(STORAGE_KEY)
        set({
          user: null,
          session: null,
          isAuthenticated: false,
          chats: [],
          selectedChat: null,
          messages: []
        })
      },

      // Chat actions
      setChats: (chats: Chat[]) =>
        set({ chats }),

      addChat: (chat: Chat) =>
        set((state) => ({
          chats: [chat, ...state.chats]
        })),

      selectChat: (chat: Chat | null) =>
        set({
          selectedChat: chat,
          messages: []
        }),

      updateChatMessages: (messages: Message[]) =>
        set({ messages }),

      addMessage: (message: Message) =>
        set((state) => ({
          messages: [...state.messages, message],
          chats: state.chats.map((chat) =>
            chat.id === message.chat_session_id
              ? { ...chat, last_message: message, updated_at: message.timestamp }
              : chat
          )
        })),

      setLoadingChats: (loading: boolean) =>
        set({ isLoadingChats: loading }),

      setLoadingMessages: (loading: boolean) =>
        set({ isLoadingMessages: loading })
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({
        user: state.user,
        session: state.session,
        isAuthenticated: state.isAuthenticated,
        chats: state.chats,
        selectedChat: state.selectedChat,
        messages: state.messages
      })
    }
  )
)
