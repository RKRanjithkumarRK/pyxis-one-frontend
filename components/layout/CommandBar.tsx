'use client'

import { useEffect, useRef, useState } from 'react'
import { Command } from 'cmdk'
import { AnimatePresence, motion } from 'framer-motion'
import { Search, Brain, Code2, LayoutDashboard, Trash2, Plus, User, Bot, Zap } from 'lucide-react'
import { useUIStore } from '@/store/uiStore'
import { useSessionStore } from '@/store/sessionStore'
import type { Workspace } from '@/lib/types'
import { searchMessages } from '@/lib/api'

type SearchResult = { id: string; role: string; snippet: string; timestamp: string }

const WORKSPACES: Array<{ id: Workspace; label: string; description: string; color: string; icon: React.ReactNode }> = [
  { id: 'think',    label: 'Think',    description: 'Reason, learn, explore ideas',   color: '#6366f1', icon: <Brain size={14} /> },
  { id: 'create',   label: 'Create',   description: 'Code, write, build things',      color: '#10b981', icon: <Code2 size={14} /> },
  { id: 'research', label: 'Research', description: 'Find, verify, synthesize',       color: '#06b6d4', icon: <Search size={14} /> },
  { id: 'manage',   label: 'Manage',   description: 'Plan, track, organize',          color: '#f59e0b', icon: <LayoutDashboard size={14} /> },
]

export function CommandBar() {
  const { commandBarOpen, closeCommandBar } = useUIStore()
  const { setWorkspace, sessionId } = useSessionStore()
  const [search, setSearch] = useState('')
  const [msgResults, setMsgResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!commandBarOpen) { setSearch(''); setMsgResults([]) }
  }, [commandBarOpen])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (search.length < 3) { setMsgResults([]); return }
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const results = await searchMessages(sessionId, search, 8)
        setMsgResults(results)
      } catch { setMsgResults([]) }
      finally { setSearching(false) }
    }, 350)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [search, sessionId])

  return (
    <AnimatePresence>
      {commandBarOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={closeCommandBar}
          />
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl"
          >
            <Command className="glass-elevated rounded-2xl overflow-hidden shadow-glow-lg" shouldFilter={true}>
              {/* Search input */}
              <div className="flex items-center border-b border-[var(--border-subtle)] px-4">
                <Search size={16} className="text-[var(--text-muted)] flex-shrink-0" />
                <Command.Input
                  value={search}
                  onValueChange={setSearch}
                  placeholder="Switch workspace, search history, or run actions…"
                  className="flex-1 bg-transparent py-4 px-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none"
                  autoFocus
                />
                <kbd className="text-xs text-[var(--text-muted)] bg-[var(--bg-overlay)] px-2 py-0.5 rounded-md border border-[var(--border-subtle)]">
                  ESC
                </kbd>
              </div>

              <Command.List className="max-h-[420px] overflow-y-auto p-2">
                <Command.Empty className="py-8 text-center text-sm text-[var(--text-muted)]">
                  {searching ? (
                    <span className="flex items-center justify-center gap-2">
                      <Zap size={14} className="animate-pulse text-indigo-400" /> Searching…
                    </span>
                  ) : 'No results found.'}
                </Command.Empty>

                {/* ── Live message search results ── */}
                {msgResults.length > 0 && (
                  <Command.Group heading="Conversation History">
                    {msgResults.map((r) => (
                      <Command.Item
                        key={r.id}
                        value={`msg-${r.id}-${r.snippet}`}
                        onSelect={closeCommandBar}
                        className="flex items-start gap-3 px-3 py-2.5 rounded-xl text-sm cursor-pointer text-[var(--text-secondary)] aria-selected:bg-[var(--accent-soft)] aria-selected:text-[var(--text-primary)] transition-colors"
                      >
                        <span className="mt-0.5 flex-shrink-0 text-[var(--text-muted)]">
                          {r.role === 'user' ? <User size={12} /> : <Bot size={12} />}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs leading-relaxed text-[var(--text-secondary)] line-clamp-2">{r.snippet}</p>
                          <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                            {new Date(r.timestamp).toLocaleDateString()} · {r.role}
                          </p>
                        </div>
                      </Command.Item>
                    ))}
                  </Command.Group>
                )}

                {/* ── Workspaces ── */}
                <Command.Group heading="Workspaces">
                  {WORKSPACES.map((ws) => (
                    <Command.Item
                      key={ws.id}
                      value={`${ws.label} ${ws.description} workspace`}
                      onSelect={() => { setWorkspace(ws.id); closeCommandBar() }}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm cursor-pointer text-[var(--text-secondary)] aria-selected:bg-[var(--accent-soft)] aria-selected:text-[var(--text-primary)] transition-colors"
                    >
                      <span
                        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${ws.color}20`, color: ws.color }}
                      >
                        {ws.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{ws.label}</div>
                        <div className="text-xs text-[var(--text-muted)]">{ws.description}</div>
                      </div>
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: ws.color }} />
                    </Command.Item>
                  ))}
                </Command.Group>

                {/* ── Actions ── */}
                <Command.Group heading="Actions">
                  <Command.Item
                    value="new chat session start fresh"
                    onSelect={() => { useSessionStore.getState().initSession(); closeCommandBar() }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm cursor-pointer text-[var(--text-secondary)] aria-selected:bg-[var(--accent-soft)] aria-selected:text-[var(--text-primary)] transition-colors"
                  >
                    <span className="w-7 h-7 rounded-lg bg-[var(--bg-overlay)] flex items-center justify-center flex-shrink-0">
                      <Plus size={14} />
                    </span>
                    <div>
                      <div className="font-medium">New Chat</div>
                      <div className="text-xs text-[var(--text-muted)]">Start a fresh conversation</div>
                    </div>
                  </Command.Item>
                  <Command.Item
                    value="clear conversation messages delete"
                    onSelect={() => { useSessionStore.getState().clearMessages(); closeCommandBar() }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm cursor-pointer text-[var(--text-secondary)] aria-selected:bg-[var(--accent-soft)] aria-selected:text-[var(--text-primary)] transition-colors"
                  >
                    <span className="w-7 h-7 rounded-lg bg-[var(--bg-overlay)] flex items-center justify-center flex-shrink-0">
                      <Trash2 size={14} />
                    </span>
                    <div>
                      <div className="font-medium">Clear Messages</div>
                      <div className="text-xs text-[var(--text-muted)]">Wipe current conversation</div>
                    </div>
                  </Command.Item>
                </Command.Group>
              </Command.List>
            </Command>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
