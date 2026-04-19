'use client'

import { useEffect, useState } from 'react'
import { Command } from 'cmdk'
import { AnimatePresence, motion } from 'framer-motion'
import * as LucideIcons from 'lucide-react'
import { useUIStore } from '@/store/uiStore'
import { useSessionStore } from '@/store/sessionStore'
import { NAV_ITEMS } from '@/lib/constants'
import type { FeatureMode } from '@/lib/types'

export function CommandBar() {
  const { commandBarOpen, closeCommandBar } = useUIStore()
  const { setFeature } = useSessionStore()
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!commandBarOpen) setSearch('')
  }, [commandBarOpen])

  const runFeature = (id: FeatureMode) => {
    setFeature(id)
    closeCommandBar()
  }

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
            <Command
              className="glass-elevated rounded-2xl overflow-hidden shadow-glow-lg"
              shouldFilter={true}
            >
              <div className="flex items-center border-b border-[var(--border-subtle)] px-4">
                <LucideIcons.Search size={16} className="text-[var(--text-muted)] flex-shrink-0" />
                <Command.Input
                  value={search}
                  onValueChange={setSearch}
                  placeholder="Search features, actions, personas..."
                  className="flex-1 bg-transparent py-4 px-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none"
                  autoFocus
                />
                <kbd className="text-xs text-[var(--text-muted)] bg-[var(--bg-overlay)] px-2 py-0.5 rounded-md border border-[var(--border-subtle)]">
                  ESC
                </kbd>
              </div>

              <Command.List className="max-h-80 overflow-y-auto p-2">
                <Command.Empty className="py-8 text-center text-sm text-[var(--text-muted)]">
                  No results found.
                </Command.Empty>

                <Command.Group heading="Features">
                  {NAV_ITEMS.map((item) => (
                    <Command.Item
                      key={item.id}
                      value={`${item.label} ${item.description}`}
                      onSelect={() => runFeature(item.id as FeatureMode)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm cursor-pointer
                        text-[var(--text-secondary)] aria-selected:bg-[var(--accent-soft)] aria-selected:text-[var(--text-primary)]
                        transition-colors"
                    >
                      <span
                        className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 text-xs"
                        style={{ backgroundColor: `${item.color}20`, color: item.color }}
                      >
                        {item.label[0]}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{item.label}</div>
                        <div className="text-xs text-[var(--text-muted)] truncate">
                          {item.description}
                        </div>
                      </div>
                      {item.shortcut && (
                        <span className="text-xs text-[var(--text-muted)] flex-shrink-0">
                          {item.shortcut}
                        </span>
                      )}
                    </Command.Item>
                  ))}
                </Command.Group>

                <Command.Group heading="Actions">
                  <Command.Item
                    value="clear chat messages"
                    onSelect={() => {
                      useSessionStore.getState().clearMessages()
                      closeCommandBar()
                    }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm cursor-pointer
                      text-[var(--text-secondary)] aria-selected:bg-[var(--accent-soft)] aria-selected:text-[var(--text-primary)]"
                  >
                    <LucideIcons.Trash2 size={14} />
                    Clear conversation
                  </Command.Item>
                  <Command.Item
                    value="new session"
                    onSelect={() => {
                      useSessionStore.getState().initSession()
                      closeCommandBar()
                    }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm cursor-pointer
                      text-[var(--text-secondary)] aria-selected:bg-[var(--accent-soft)] aria-selected:text-[var(--text-primary)]"
                  >
                    <LucideIcons.Plus size={14} />
                    New session
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
