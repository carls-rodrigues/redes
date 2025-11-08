"use client"

import { MessageCircle, Settings, Home, Plus, LogOut } from "lucide-react"
import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useWebSocket } from "@/lib/websocket-context"
import { useTranslations } from 'next-intl';
import { useLocale } from "@/lib/locale-context";
import { LanguageSwitcher } from "@/components/language-switcher";

export default function NavigationSidebar() {
  const { sendMessage, lastMessage } = useWebSocket()
  const router = useRouter()
  const { locale } = useLocale()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const t = useTranslations('nav');

  // Get user data for avatar
  const getUserInitial = () => {
    try {
      const userData = localStorage.getItem('user')
      if (userData) {
        const user = JSON.parse(userData)
        if (user.username) {
          return user.username.charAt(0).toUpperCase()
        }
      }
    } catch (error) {
      console.error('Error parsing user data:', error)
    }
    return 'U' // Fallback
  }

  // Handle logout
  const handleLogout = () => {
    sendMessage({
      type: 'logout'
    })
    setDropdownOpen(false)
  }

  // Listen for logout response
  React.useEffect(() => {
    if (lastMessage && lastMessage.type === 'logout') {
      if (lastMessage.status === 'ok') {
        // Clear local storage and redirect to login
        localStorage.removeItem('user')
        localStorage.removeItem('session')
        router.push('/login')
      }
    }
  }, [lastMessage, router])

  return (
    <div className="w-12 md:w-16 bg-card border-r border-border flex flex-col items-center justify-between py-4 shrink-0">
      {/* Logo/Brand Icon */}
      <div className="w-8 h-8 md:w-10 md:h-10 bg-primary rounded-md flex items-center justify-center">
        <MessageCircle className="w-4 h-4 md:w-5 md:h-5 text-primary-foreground" strokeWidth={1.5} />
      </div>

      {/* Navigation Icons */}
      <div className="flex flex-col gap-2">
        <Button variant="ghost" size="icon" className="text-foreground hover:bg-muted w-8 h-8 md:w-10 md:h-10">
          <Home className="w-4 h-4 md:w-5 md:h-5" strokeWidth={1.5} />
        </Button>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:bg-muted w-8 h-8 md:w-10 md:h-10">
          <MessageCircle className="w-4 h-4 md:w-5 md:h-5" strokeWidth={1.5} />
        </Button>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:bg-muted w-8 h-8 md:w-10 md:h-10">
          <Plus className="w-4 h-4 md:w-5 md:h-5" strokeWidth={1.5} />
        </Button>
      </div>

      {/* Settings and Avatar */}
      <div className="flex flex-col gap-3">
        <LanguageSwitcher />
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-muted-foreground hover:bg-muted w-8 h-8 md:w-10 md:h-10"
          onClick={handleLogout}
          title={t('logout')}
        >
          <LogOut className="w-4 h-4 md:w-5 md:h-5" strokeWidth={1.5} />
        </Button>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:bg-muted w-8 h-8 md:w-10 md:h-10">
          <Settings className="w-4 h-4 md:w-5 md:h-5" strokeWidth={1.5} />
        </Button>
        <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <button className="w-6 h-6 md:w-8 md:h-8 rounded-md bg-muted hover:bg-muted/80 transition-colors cursor-pointer flex items-center justify-center text-xs font-medium text-foreground">
              {getUserInitial()}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem className="text-muted-foreground">
              <Settings className="w-4 h-4 mr-2" />
              {t('settings')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
