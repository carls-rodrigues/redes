"use client"

import { MessageCircle, Settings, Home, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function NavigationSidebar() {
  return (
    <div className="w-16 bg-card border-r border-border flex flex-col items-center justify-between py-4 flex-shrink-0">
      {/* Logo/Brand Icon */}
      <div className="w-10 h-10 bg-primary rounded-md flex items-center justify-center">
        <MessageCircle className="w-5 h-5 text-primary-foreground" strokeWidth={1.5} />
      </div>

      {/* Navigation Icons */}
      <div className="flex flex-col gap-2">
        <Button variant="ghost" size="icon" className="text-foreground hover:bg-muted">
          <Home className="w-5 h-5" strokeWidth={1.5} />
        </Button>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:bg-muted">
          <MessageCircle className="w-5 h-5" strokeWidth={1.5} />
        </Button>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:bg-muted">
          <Plus className="w-5 h-5" strokeWidth={1.5} />
        </Button>
      </div>

      {/* Settings and Avatar */}
      <div className="flex flex-col gap-3">
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:bg-muted">
          <Settings className="w-5 h-5" strokeWidth={1.5} />
        </Button>
        <button className="w-8 h-8 rounded-md bg-muted hover:bg-muted/80 transition-colors cursor-pointer flex items-center justify-center text-xs font-medium text-foreground">
          U
        </button>
      </div>
    </div>
  )
}
