'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import { useUIStore } from '@/store/uiStore'
import { useSessionStore } from '@/store/sessionStore'
import { NAV_ITEMS } from '@/lib/constants'
import { Tooltip } from '@/components/ui/Tooltip'
import { cn } from '@/lib/utils'
import type { FeatureMode } from '@/lib/types'

type LucideIconName = keyof typeof LucideIcons

function NavIcon({ name }: { name: string }) {
  const Icon = LucideIcons[name as LucideIconName] as React.ComponentType<{ size?: number }> | undefined
  if (!Icon) return <Sparkles size={16} />
  return <Icon size={16} />
}

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore()
  const { currentFeature, setFeature } = useSessionStore()

  return (
    <motion.aside
      animate={{ width: sidebarCollapsed ? 64 : 280 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="flex flex-col h-full glass border-r border-[var(--border-subtle)] flex-shrink-0 overflow-hidden z-20"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-[var(--border-subtle)] flex-shrink-0">
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
              className="overflow-hidden"
            >
              <div className="text-sm font-semibold text-[var(--text-primary)] whitespace-nowrap">
                Pyxis One
              </div>
              <div className="text-xs text-[var(--text-muted)] whitespace-nowrap">
                Omniforce Edition
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2 px-2">
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
              style={
                isActive
                  ? {
                      backgroundColor: `${item.color}20`,
                      boxShadow: `0 0 0 1px ${item.color}40`,
                    }
                  : {}
              }
            >
              <span
                className="flex-shrink-0"
                style={isActive ? { color: item.color } : {}}
              >
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
                <AnimatePresence>
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-xs text-[var(--text-muted)] flex-shrink-0"
                  >
                    {item.shortcut}
                  </motion.span>
                </AnimatePresence>
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

      {/* Collapse Toggle */}
      <div className="p-2 border-t border-[var(--border-subtle)] flex-shrink-0">
        <Tooltip content={sidebarCollapsed ? 'Expand' : 'Collapse'} side="right">
          <button
            onClick={toggleSidebar}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-white/5 transition-all"
          >
            {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            {!sidebarCollapsed && <span>Collapse</span>}
          </button>
        </Tooltip>
      </div>
    </motion.aside>
  )
}
