"use client"

import { MessageCircle, Settings, Home } from "lucide-react"

export default function NavigationSidebar() {
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
          <span className="text-white text-sm font-semibold">U</span>
        </div>
      </div>
    </div>
  )
}
