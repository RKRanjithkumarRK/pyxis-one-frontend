'use client'

import { Menu, Plus, Settings } from 'lucide-react'
import { useUIStore } from '@/store/uiStore'
import { useSessionStore } from '@/store/sessionStore'

export function MobileHeader() {
  const { toggleMobileSidebar, openSettings } = useUIStore()
  const { initSession } = useSessionStore()

  return (
    <div className="flex md:hidden items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-base)] flex-shrink-0">
      <button
        onClick={toggleMobileSidebar}
        className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/10 transition-all"
      >
        <Menu size={18} />
      </button>

      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
          <span className="text-white text-[10px] font-bold">P</span>
        </div>
        <span className="text-sm font-semibold text-[var(--text-primary)]">PYXIS</span>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={initSession}
          className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/10 transition-all"
        >
          <Plus size={18} />
        </button>
        <button
          onClick={openSettings}
          className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/10 transition-all"
        >
          <Settings size={18} />
        </button>
      </div>
    </div>
  )
}
