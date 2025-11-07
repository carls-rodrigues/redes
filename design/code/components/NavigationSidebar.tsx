import React from "react"

import { MessageCircle, Settings, Home, LogOut } from "lucide-react"
import { useAppStore } from "../store"

export default function NavigationSidebar() {
  const user = useAppStore((state) => state.user)
  const logout = useAppStore((state) => state.logout)

  return (
    <div className="w-16 bg-[#3B4FE4] flex flex-col items-center justify-between py-6 flex-shrink-0">
      {/* Logo/Brand Icon */}
      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
        <MessageCircle className="w-5 h-5 text-[#3B4FE4]" />
      </div>

      {/* Navigation Icons */}
      <div className="flex flex-col gap-6">
        <button className="p-2 rounded-lg hover:bg-white/20 text-white transition-colors">
          <Home className="w-6 h-6" strokeWidth={1.5} />
        </button>
        <button className="p-2 rounded-lg hover:bg-white/20 text-white/50 transition-colors">
          <MessageCircle className="w-6 h-6" strokeWidth={1.5} />
        </button>
      </div>

      {/* Settings and Avatar */}
      <div className="flex flex-col gap-4">
        <button className="p-2 rounded-lg hover:bg-white/20 text-white/50 transition-colors">
          <Settings className="w-6 h-6" strokeWidth={1.5} />
        </button>
        <div className="w-8 h-8 rounded-full bg-white/30 hover:bg-white/50 transition-colors cursor-pointer flex items-center justify-center">
          <span className="text-white text-sm font-semibold">{user?.username.charAt(0).toUpperCase()}</span>
        </div>
        <button
          onClick={logout}
          className="p-2 rounded-lg hover:bg-white/20 text-white/50 transition-colors"
          title="Logout"
        >
          <LogOut className="w-6 h-6" strokeWidth={1.5} />
        </button>
      </div>
    </div>
  )
}
