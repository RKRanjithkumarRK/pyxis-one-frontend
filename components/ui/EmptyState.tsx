'use client'

import { motion } from 'framer-motion'
import { type LucideIcon } from 'lucide-react'
import { Button } from './Button'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
  color?: string
}

export function EmptyState({ icon: Icon, title, description, action, color = '#6366f1' }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="flex flex-col items-center justify-center gap-4 py-16 px-8 text-center"
    >
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{ background: `${color}18`, border: `1px solid ${color}30` }}
      >
        <Icon size={28} style={{ color }} />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">{title}</h3>
        <p className="text-xs text-[var(--text-muted)] max-w-[240px] leading-relaxed">{description}</p>
      </div>
      {action && (
        <Button variant="outline" size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </motion.div>
  )
}

interface FeatureLoadingProps {
  rows?: number
  showHeader?: boolean
}

export function FeatureLoading({ rows = 4, showHeader = true }: FeatureLoadingProps) {
  return (
    <div className="flex flex-col gap-4 p-4 animate-pulse">
      {showHeader && (
        <div className="flex flex-col gap-2">
          <div className="h-5 w-40 rounded-lg bg-[var(--bg-overlay)]" />
          <div className="h-3 w-64 rounded-lg bg-[var(--bg-elevated)]" />
        </div>
      )}
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="h-16 rounded-2xl bg-gradient-to-r from-[var(--bg-elevated)] via-[var(--bg-overlay)] to-[var(--bg-elevated)] bg-[length:200%_100%] animate-[shimmer_2s_linear_infinite]"
            style={{ opacity: 1 - i * 0.15 }}
          />
        ))}
      </div>
    </div>
  )
}
