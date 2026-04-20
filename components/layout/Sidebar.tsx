'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft, ChevronRight, Sparkles, Plus, MessageSquare,
  Trash2, ChevronDown, Settings,
} from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import { useUIStore } from '@/store/uiStore'
import { useSessionStore } from '@/store/sessionStore'
import { NAV_ITEMS } from '@/lib/constants'
import { Tooltip } from '@/components/ui/Tooltip'
import { cn, formatRelativeTime } from '@/lib/utils'
import type { FeatureMode } from '@/lib/types'

type LucideIconName = keyof typeof LucideIcons

function NavIcon({ name }: { name: string }) {
  const Icon = LucideIcons[name as LucideIconName] as React.ComponentType<{ size?: number }> | undefined
  if (!Icon) return <Sparkles size={16} />
  return <Icon size={16} />
}

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar, openSettings } = useUIStore()
  const { currentFeature, setFeature, sessions, initSession, switchSession, deleteSession, sessionId } = useSessionStore()
  const [historyOpen, setHistoryOpen] = useState(true)
  const [hoveredSession, setHoveredSession] = useState<string | null>(null)

  return (
    <motion.aside
      animate={{ width: sidebarCollapsed ? 64 : 280 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="flex flex-col h-full glass border-r border-[var(--border-subtle)] flex-shrink-0 overflow-hidden z-20"
    >
      {/* Logo + New Chat */}
      <div className="flex items-center gap-2 px-3 py-3 border-b border-[var(--border-subtle)] flex-shrink-0">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0 shadow-glow">
          <span className="text-white text-xs font-bold">P</span>
        </div>
        <AnimatePresence>
          {!sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
              className="flex-1 overflow-hidden"
            >
              <div className="text-sm font-semibold text-[var(--text-primary)] whitespace-nowrap">PYXIS</div>
              <div className="text-xs text-[var(--text-muted)] whitespace-nowrap">Sovereign Edition</div>
            </motion.div>
          )}
        </AnimatePresence>
        <Tooltip content="New Chat" side="right">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={initSession}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/10 transition-all flex-shrink-0"
          >
            <Plus size={16} />
          </motion.button>
        </Tooltip>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden py-2 px-2 space-y-1">

        {/* Conversation History */}
        {!sidebarCollapsed && sessions.length > 0 && (
          <div className="mb-1">
            <button
              onClick={() => setHistoryOpen((p) => !p)}
              className="w-full flex items-center gap-2 px-2 py-1.5 text-[10px] font-semibold tracking-widest uppercase text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
            >
              <MessageSquare size={10} />
              <span className="flex-1 text-left">Recents</span>
              <ChevronDown
                size={10}
                className={cn('transition-transform', historyOpen ? 'rotate-0' : '-rotate-90')}
              />
            </button>

            <AnimatePresence initial={false}>
              {historyOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden space-y-0.5"
                >
                  {sessions.slice(0, 15).map((session) => {
                    const isActive = session.id === sessionId
                    return (
                      <div
                        key={session.id}
                        onMouseEnter={() => setHoveredSession(session.id)}
                        onMouseLeave={() => setHoveredSession(null)}
                        className={cn(
                          'group flex items-center gap-2 rounded-xl px-3 py-2 cursor-pointer transition-all',
                          isActive
                            ? 'bg-indigo-500/10 border border-indigo-500/20'
                            : 'hover:bg-white/5'
                        )}
                        onClick={() => switchSession(session.id)}
                      >
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            'text-xs truncate',
                            isActive ? 'text-indigo-300' : 'text-[var(--text-secondary)]'
                          )}>
                            {session.title}
                          </p>
                          <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                            {formatRelativeTime(session.timestamp)} · {session.messageCount} msgs
                          </p>
                        </div>
                        {hoveredSession === session.id && !isActive && (
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteSession(session.id) }}
                            className="p-1 rounded-lg text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-all flex-shrink-0"
                          >
                            <Trash2 size={11} />
                          </button>
                        )}
                      </div>
                    )
                  })}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="h-px bg-[var(--border-subtle)] mx-2 my-2" />
          </div>
        )}

        {/* Collapsed: New Chat icon at top */}
        {sidebarCollapsed && (
          <Tooltip content="New Chat" side="right">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={initSession}
              className="w-full flex items-center justify-center py-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/5 transition-all"
            >
              <Plus size={16} />
            </motion.button>
          </Tooltip>
        )}

        {/* Section label */}
        {!sidebarCollapsed && (
          <p className="px-2 py-1 text-[10px] font-semibold tracking-widest uppercase text-[var(--text-muted)]">
            Modes
          </p>
        )}

        {/* Nav Items */}
        <nav className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive = currentFeature === item.id
            const button = (
              <motion.button
                key={item.id}
                onClick={() => setFeature(item.id as FeatureMode)}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className={cn(
                  'w-full flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-all duration-150',
                  'text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500/50',
                  isActive
                    ? 'text-white'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5'
                )}
                style={isActive ? { backgroundColor: `${item.color}20`, boxShadow: `0 0 0 1px ${item.color}40` } : {}}
              >
                <span className="flex-shrink-0" style={isActive ? { color: item.color } : {}}>
                  <NavIcon name={item.icon} />
                </span>
                <AnimatePresence>
                  {!sidebarCollapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex-1 truncate text-xs font-medium whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {!sidebarCollapsed && item.shortcut && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-xs text-[var(--text-muted)] flex-shrink-0"
                  >
                    {item.shortcut}
                  </motion.span>
                )}
              </motion.button>
            )

            if (sidebarCollapsed) {
              return (
                <Tooltip key={item.id} content={item.label} side="right">
                  {button}
                </Tooltip>
              )
            }
            return button
          })}
        </nav>
      </div>

      {/* Bottom Bar: Settings + Collapse */}
      <div className="p-2 border-t border-[var(--border-subtle)] flex-shrink-0 flex items-center gap-1">
        <Tooltip content="Settings" side="right">
          <button
            onClick={openSettings}
            className={cn(
              'flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-white/5 transition-all',
              sidebarCollapsed ? 'w-full' : 'flex-1'
            )}
          >
            <Settings size={14} />
            {!sidebarCollapsed && <span>Settings</span>}
          </button>
        </Tooltip>

        <Tooltip content={sidebarCollapsed ? 'Expand' : 'Collapse'} side="right">
          <button
            onClick={toggleSidebar}
            className="flex items-center justify-center px-2 py-2 rounded-xl text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-white/5 transition-all"
          >
            {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </Tooltip>
      </div>
    </motion.aside>
  )
}
