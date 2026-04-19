'use client'

import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
  iconRight?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, iconRight, className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && (
            <span className="absolute left-3 text-[var(--text-muted)]">{icon}</span>
          )}
          <input
            ref={ref}
            className={cn(
              'w-full bg-[var(--bg-elevated)] border border-[var(--border-default)]',
              'text-[var(--text-primary)] placeholder:text-[var(--text-muted)]',
              'rounded-xl px-3 py-2 text-sm',
              'focus:outline-none focus:border-[var(--border-accent)] focus:ring-1 focus:ring-indigo-500/30',
              'transition-all duration-150',
              icon && 'pl-9',
              iconRight && 'pr-9',
              error && 'border-red-500/50 focus:border-red-500/70',
              className
            )}
            {...props}
          />
          {iconRight && (
            <span className="absolute right-3 text-[var(--text-muted)]">{iconRight}</span>
          )}
        </div>
        {error && (
          <span className="text-xs text-red-400">{error}</span>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
