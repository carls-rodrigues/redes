import * as React from 'react'

import { MessageCircle } from "lucide-react"

export default function WelcomeScreen() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
            <MessageCircle className="w-10 h-10 text-primary" strokeWidth={1.5} />
          </div>
        </div>
        
        <h2 className="text-2xl font-semibold text-foreground">
          Welcome to RedES Chat
        </h2>
        
        <p className="text-muted-foreground max-w-sm">
          Select a conversation from the list or create a new one to get started
        </p>
      </div>
    </div>
  )
}
