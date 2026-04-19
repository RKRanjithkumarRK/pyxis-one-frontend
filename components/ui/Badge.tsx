'use client'

import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'verified' | 'consensus' | 'debated' | 'speculative' | 'outline'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-[var(--accent-soft)] text-indigo-300 border border-indigo-500/20',
  verified: 'badge-verified',
  consensus: 'badge-consensus',
  debated: 'badge-debated',
  speculative: 'badge-speculative',
  outline: 'border border-[var(--border-default)] text-[var(--text-secondary)]',
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
