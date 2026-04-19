'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Moon, Sun, Sparkles } from 'lucide-react'
import { useSessionStore } from '@/store/sessionStore'
import { useUIStore } from '@/store/uiStore'
import { formatDuration, getFeatureColor } from '@/lib/utils'
import { NAV_ITEMS } from '@/lib/constants'
import type { Theme } from '@/lib/types'

const THEMES: Theme[] = ['cosmos', 'obsidian', 'holographic']
const THEME_LABELS: Record<Theme, string> = {
  cosmos: 'Cosmos',
  obsidian: 'Obsidian',
  holographic: 'Holographic',
}

export function StatusBar() {
  const { currentFeature, isStreaming, tokenCount, sessionStart } = useSessionStore()
  const { theme, setTheme } = useUIStore()
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - sessionStart) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [sessionStart])

  const navItem = NAV_ITEMS.find((n) => n.id === currentFeature)
  const featureColor = getFeatureColor(currentFeature)

  const cycleTheme = () => {
    const idx = THEMES.indexOf(theme)
    setTheme(THEMES[(idx + 1) % THEMES.length])
  }

  return (
    <div
      className="h-8 border-t border-[var(--border-subtle)] glass flex items-center px-3 gap-4 text-xs text-[var(--text-muted)] flex-shrink-0 z-30"
      style={{ height: 'var(--statusbar-height)' }}
    >
      {/* Left: feature mode */}
      <div className="flex items-center gap-1.5 min-w-0">
        <span
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: featureColor }}
        />
        <span className="truncate text-[var(--text-secondary)]">
          {navItem?.label ?? 'Standard Chat'}
        </span>
      </div>

      {/* Center: streaming pulse */}
      <div className="flex-1 flex items-center justify-center gap-1">
        {isStreaming && (
          <div className="flex items-center gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-1 h-1 rounded-full bg-indigo-400"
                animate={{ opacity: [0.4, 1, 0.4], scale: [0.8, 1.2, 0.8] }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: 'easeInOut',
                }}
              />
            ))}
            <span className="text-indigo-400 ml-1">thinking</span>
          </div>
        )}
      </div>

      {/* Right: stats + theme */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <span>{formatDuration(elapsed)}</span>
        <span>{tokenCount.toLocaleString()} tokens</span>
        <button
          onClick={cycleTheme}
          className="flex items-center gap-1 hover:text-[var(--text-secondary)] transition-colors"
          title={`Theme: ${THEME_LABELS[theme]}`}
        >
          {theme === 'cosmos' ? (
            <Moon size={12} />
          ) : theme === 'obsidian' ? (
            <Sun size={12} />
          ) : (
            <Sparkles size={12} />
          )}
          <span>{THEME_LABELS[theme]}</span>
        </button>
      </div>
    </div>
  )
}
