'use client'

import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useUIStore } from '@/store/uiStore'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface FeaturePanelProps {
  id: string
  title: string
  children: ReactNode
  onClose?: () => void
  className?: string
}

export function FeaturePanel({ id, title, children, onClose, className }: FeaturePanelProps) {
  return (
    <motion.div
      key={id}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={cn('flex flex-col h-full glass border-l border-[var(--border-subtle)]', className)}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)] flex-shrink-0">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </motion.div>
  )
}

interface TwoColumnLayoutProps {
  left: ReactNode
  right: ReactNode
  defaultLeftSize?: number
}

export function TwoColumnLayout({ left, right, defaultLeftSize = 60 }: TwoColumnLayoutProps) {
  return (
    <PanelGroup direction="horizontal" className="h-full">
      <Panel defaultSize={defaultLeftSize} minSize={30}>
        {left}
      </Panel>
      <PanelResizeHandle className="w-1 bg-[var(--border-subtle)] hover:bg-[var(--border-accent)] transition-colors" />
      <Panel minSize={20}>
        {right}
      </Panel>
    </PanelGroup>
  )
}

interface ThreeColumnLayoutProps {
  left: ReactNode
  center: ReactNode
  right: ReactNode
}

export function ThreeColumnLayout({ left, center, right }: ThreeColumnLayoutProps) {
  return (
    <PanelGroup direction="horizontal" className="h-full">
      <Panel defaultSize={33} minSize={20}>
        {left}
      </Panel>
      <PanelResizeHandle className="w-1 bg-[var(--border-subtle)] hover:bg-[var(--border-accent)] transition-colors" />
      <Panel defaultSize={34} minSize={20}>
        {center}
      </Panel>
      <PanelResizeHandle className="w-1 bg-[var(--border-subtle)] hover:bg-[var(--border-accent)] transition-colors" />
      <Panel defaultSize={33} minSize={20}>
        {right}
      </Panel>
    </PanelGroup>
  )
}

interface PanelSystemProps {
  left: ReactNode
  right: ReactNode
}

export function PanelSystem({ left, right }: PanelSystemProps) {
  return <TwoColumnLayout left={left} right={right} defaultLeftSize={55} />
}
