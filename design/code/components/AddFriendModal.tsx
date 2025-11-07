import React from "react"
import { useState, useEffect } from "react"
import { Search, X, Plus } from "lucide-react"
import { useAppStore } from "../store"
import { User } from "../../types"

interface AddFriendModalProps {
  isOpen: boolean
  onClose: () => void
  onFriendAdded: (chatId: string) => void
}

export default function AddFriendModal({ isOpen, onClose, onFriendAdded }: AddFriendModalProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isCreatingDM, setIsCreatingDM] = useState(false)
  const session = useAppStore((state) => state.session)

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    const debounceTimer = setTimeout(() => {
      handleSearch()
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [searchQuery])

  const handleSearch = async () => {
    if (!searchQuery.trim() || !session) return

    setIsSearching(true)
    try {
      const result = await window.electron.searchUsers(searchQuery, session.user_id)
      if (result.success) {
        setSearchResults(result.users)
      }
    } catch (error) {
      console.error("Error searching users:", error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleAddFriend = async (user: User) => {
    if (!session) return

    setIsCreatingDM(true)
    try {
      const result = await window.electron.createDM(session.user_id, user.id)
      if (result.success) {
        onFriendAdded(result.chatId)
        setSearchQuery("")
        setSearchResults([])
        onClose()
      }
    } catch (error) {
      console.error("Error creating DM:", error)
    } finally {
      setIsCreatingDM(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-[#1C1C1E]">Start New Chat</h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-[#F5F5F7] rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-[#8E8E93]" strokeWidth={2} />
          </button>
        </div>

        {/* Search Input */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-3 w-5 h-5 text-[#8E8E93]" strokeWidth={1.5} />
          <input
            type="text"
            placeholder="Search by username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#F5F5F7] text-[#1C1C1E] placeholder-[#8E8E93] rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#3B4FE4]"
            autoFocus
          />
          {isSearching && (
            <div className="absolute right-3 top-3">
              <div className="w-5 h-5 border-2 border-[#3B4FE4] border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Search Results */}
        <div className="max-h-96 overflow-y-auto">
          {searchQuery.trim() === "" ? (
            <div className="text-center text-[#8E8E93] py-8 text-sm">
              Start typing to search for users...
            </div>
          ) : searchResults.length === 0 ? (
            <div className="text-center text-[#8E8E93] py-8 text-sm">
              No users found matching "{searchQuery}"
            </div>
          ) : (
            <div className="space-y-2">
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-[#F5F5F7] transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#1C1C1E] truncate">{user.username}</p>
                  </div>
                  <button
                    onClick={() => handleAddFriend(user)}
                    disabled={isCreatingDM}
                    className="ml-2 p-1.5 bg-[#3B4FE4] hover:bg-[#2A3AC4] text-white rounded-lg transition-colors flex-shrink-0 disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" strokeWidth={2} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-[#E5E5EA]">
          <button
            onClick={onClose}
            className="w-full py-2 text-[#3B4FE4] hover:bg-[#F0F3FF] font-medium rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
