'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft, ChevronRight, Plus, Trash2,
  ChevronDown, Settings, Brain, Code2,
  Search, LayoutDashboard, Zap, Shield,
  type LucideIcon,
} from 'lucide-react'
import Link from 'next/link'
import { useUIStore } from '@/store/uiStore'
import { useSessionStore } from '@/store/sessionStore'
import { usePsycheStore } from '@/store/psycheStore'
import { useAuthStore } from '@/store/authStore'
import { Tooltip } from '@/components/ui/Tooltip'
import { cn, formatRelativeTime } from '@/lib/utils'
import type { Workspace } from '@/lib/types'

const WORKSPACES: Array<{
  id: Workspace
  label: string
  description: string
  icon: LucideIcon
  color: string
}> = [
  { id: 'think', label: 'Think', description: 'Reason, learn, explore ideas', icon: Brain, color: '#6366f1' },
  { id: 'create', label: 'Create', description: 'Code, write, build things', icon: Code2, color: '#10b981' },
  { id: 'research', label: 'Research', description: 'Find, verify, synthesize', icon: Search, color: '#06b6d4' },
  { id: 'manage', label: 'Manage', description: 'Plan, track, organize', icon: LayoutDashboard, color: '#f59e0b' },
]

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar, openSettings } = useUIStore()
  const { currentWorkspace, setWorkspace, sessions, initSession, switchSession, deleteSession, sessionId } = useSessionStore()
  const { organismHealth } = usePsycheStore()
  const { isAdmin } = useAuthStore()
  const [sessionsOpen, setSessionsOpen] = useState(true)
  const [intelligenceOpen, setIntelligenceOpen] = useState(true)
  const [hoveredSession, setHoveredSession] = useState<string | null>(null)

  return (
    <motion.aside
      animate={{ width: sidebarCollapsed ? 64 : 280 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="flex flex-col h-full glass border-r border-[var(--border-subtle)] flex-shrink-0 overflow-hidden z-20"
    >
      {/* ── Header ── */}
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
              <div className="text-[10px] text-[var(--text-muted)] whitespace-nowrap">Intelligence OS</div>
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

      <div className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 space-y-4">

        {/* ── Workspaces ── */}
        <div>
          {!sidebarCollapsed && (
            <p className="px-2 mb-2 text-[10px] font-semibold tracking-widest uppercase text-[var(--text-muted)]">
              Workspaces
            </p>
          )}
          <nav className="space-y-1">
            {WORKSPACES.map((ws) => {
              const isActive = currentWorkspace === ws.id
              const Icon = ws.icon
              const button = (
                <motion.button
                  key={ws.id}
                  onClick={() => setWorkspace(ws.id)}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    'w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-150 text-left',
                    isActive
                      ? 'text-white'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5'
                  )}
                  style={isActive ? { backgroundColor: `${ws.color}20`, boxShadow: `0 0 0 1px ${ws.color}40` } : {}}
                >
                  <span
                    className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center"
                    style={isActive ? { backgroundColor: `${ws.color}30`, color: ws.color } : { color: 'var(--text-muted)' }}
                  >
                    <Icon size={15} />
                  </span>
                  <AnimatePresence>
                    {!sidebarCollapsed && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex-1 min-w-0"
                      >
                        <div className="text-xs font-semibold whitespace-nowrap">{ws.label}</div>
                        <div className="text-[10px] text-[var(--text-muted)] whitespace-nowrap truncate">{ws.description}</div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {!sidebarCollapsed && isActive && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: ws.color }}
                    />
                  )}
                </motion.button>
              )
              if (sidebarCollapsed) {
                return (
                  <Tooltip key={ws.id} content={`${ws.label} — ${ws.description}`} side="right">
                    {button}
                  </Tooltip>
                )
              }
              return <div key={ws.id}>{button}</div>
            })}
          </nav>
        </div>

        {/* ── Intelligence Status ── */}
        {!sidebarCollapsed && (
          <div>
            <button
              onClick={() => setIntelligenceOpen((p) => !p)}
              className="w-full flex items-center gap-2 px-2 py-1 text-[10px] font-semibold tracking-widest uppercase text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
            >
              <Zap size={10} />
              <span className="flex-1 text-left">Intelligence</span>
              <ChevronDown size={10} className={cn('transition-transform', intelligenceOpen ? 'rotate-0' : '-rotate-90')} />
            </button>
            <AnimatePresence initial={false}>
              {intelligenceOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden mt-1"
                >
                  <div className="mx-2 rounded-xl p-3 bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-[var(--text-secondary)]">Cognitive Model</span>
                      <span className="text-xs font-semibold" style={{ color: organismHealth > 0.6 ? '#10b981' : organismHealth > 0.3 ? '#f59e0b' : '#ef4444' }}>
                        {Math.round(organismHealth * 100)}%
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[var(--bg-overlay)] overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: organismHealth > 0.6 ? '#10b981' : organismHealth > 0.3 ? '#f59e0b' : '#6366f1' }}
                        initial={{ width: 0 }}
                        animate={{ width: `${organismHealth * 100}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                      />
                    </div>
                    <p className="text-[10px] text-[var(--text-muted)] mt-1.5">
                      {organismHealth === 0 ? 'Send a message to activate' : 'Adapting to your thinking patterns'}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* ── Sessions ── */}
        {!sidebarCollapsed && sessions.length > 0 && (
          <div>
            <button
              onClick={() => setSessionsOpen((p) => !p)}
              className="w-full flex items-center gap-2 px-2 py-1 text-[10px] font-semibold tracking-widest uppercase text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
            >
              <span className="flex-1 text-left">Recent</span>
              <ChevronDown size={10} className={cn('transition-transform', sessionsOpen ? 'rotate-0' : '-rotate-90')} />
            </button>
            <AnimatePresence initial={false}>
              {sessionsOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden space-y-0.5 mt-1"
                >
                  {sessions.slice(0, 12).map((session) => {
                    const isActive = session.id === sessionId
                    return (
                      <div
                        key={session.id}
                        onMouseEnter={() => setHoveredSession(session.id)}
                        onMouseLeave={() => setHoveredSession(null)}
                        className={cn(
                          'group flex items-center gap-2 rounded-xl px-3 py-2 cursor-pointer transition-all',
                          isActive ? 'bg-indigo-500/10 border border-indigo-500/20' : 'hover:bg-white/5'
                        )}
                        onClick={() => switchSession(session.id)}
                      >
                        <div className="flex-1 min-w-0">
                          <p className={cn('text-xs truncate', isActive ? 'text-indigo-300' : 'text-[var(--text-secondary)]')}>
                            {session.title}
                          </p>
                          <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                            {formatRelativeTime(session.timestamp)}
                          </p>
                        </div>
                        {hoveredSession === session.id && !isActive && (
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteSession(session.id) }}
                            className="p-1 rounded-lg text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-all flex-shrink-0"
                          >
                            <Trash2 size={10} />
                          </button>
                        )}
                      </div>
                    )
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Collapsed: icon shortcuts */}
        {sidebarCollapsed && (
          <div className="space-y-1">
            <Tooltip content="New Chat" side="right">
              <button onClick={initSession} className="w-full flex items-center justify-center py-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/5 transition-all">
                <Plus size={16} />
              </button>
            </Tooltip>
          </div>
        )}
      </div>

      {/* ── Bottom Bar ── */}
      <div className="p-2 border-t border-[var(--border-subtle)] flex-shrink-0 flex items-center gap-1">
        {isAdmin() && (
          <Tooltip content="Admin" side="right">
            <Link
              href="/admin"
              className={cn(
                'flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs text-amber-400/80 hover:text-amber-400 hover:bg-amber-500/10 transition-all',
                sidebarCollapsed ? 'w-full' : ''
              )}
            >
              <Shield size={14} />
              {!sidebarCollapsed && <span>Admin</span>}
            </Link>
          </Tooltip>
        )}
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
