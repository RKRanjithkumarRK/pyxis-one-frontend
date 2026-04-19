'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface ProgressProps {
  value: number // 0-100
  max?: number
  className?: string
  trackClassName?: string
  fillClassName?: string
  label?: string
  showValue?: boolean
  color?: string
  animated?: boolean
}

export function Progress({
  value,
  max = 100,
  className,
  trackClassName,
  fillClassName,
  label,
  showValue = false,
  color = 'var(--accent)',
  animated = true,
}: ProgressProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {(label || showValue) && (
        <div className="flex justify-between text-xs text-[var(--text-secondary)]">
          {label && <span>{label}</span>}
          {showValue && <span>{Math.round(pct)}%</span>}
        </div>
      )}
      <div
        className={cn(
          'h-1.5 rounded-full overflow-hidden bg-[var(--bg-overlay)]',
          trackClassName
        )}
      >
        <motion.div
          className={cn('h-full rounded-full', fillClassName)}
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={
            animated
              ? { type: 'spring', stiffness: 100, damping: 20 }
              : { duration: 0 }
          }
        />
      </div>
    </div>
  )
}
