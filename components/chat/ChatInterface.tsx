'use client'

import { VirtualizedMessages } from './VirtualizedMessages'
import { ChatInput } from './ChatInput'

export function ChatInterface() {
  return (
    <div className="flex flex-col h-full min-h-0">
      <VirtualizedMessages />
      <ChatInput />
    </div>
  )
}
