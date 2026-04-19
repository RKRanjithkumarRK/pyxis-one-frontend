'use client'

import { Sidebar } from '@/components/layout/Sidebar'
import { StatusBar } from '@/components/layout/StatusBar'
import { CommandBar } from '@/components/layout/CommandBar'
import { KeyboardShortcuts } from '@/components/layout/KeyboardShortcuts'

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--bg-base)]">
      <KeyboardShortcuts />
      <CommandBar />
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <div className="flex-1 min-h-0 overflow-hidden">
          {children}
        </div>
        <StatusBar />
      </div>
    </div>
  )
}
