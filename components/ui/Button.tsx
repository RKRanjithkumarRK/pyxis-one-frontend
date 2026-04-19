'use client'

import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'

export type ButtonVariant = 'primary' | 'ghost' | 'outline' | 'danger' | 'glass'
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  icon?: React.ReactNode
  iconRight?: React.ReactNode
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-indigo-500 hover:bg-indigo-600 text-white border border-indigo-500/50 shadow-glow hover:shadow-glow-lg',
  ghost:
    'bg-transparent hover:bg-white/5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-transparent',
  outline:
    'bg-transparent border border-[var(--border-default)] hover:border-[var(--border-accent)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
  danger:
    'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30',
  glass:
    'glass text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-accent)]',
}

const sizeClasses: Record<ButtonSize, string> = {
  xs: 'px-2 py-1 text-xs rounded-md gap-1',
  sm: 'px-3 py-1.5 text-sm rounded-lg gap-1.5',
  md: 'px-4 py-2 text-sm rounded-xl gap-2',
  lg: 'px-6 py-3 text-base rounded-xl gap-2',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'ghost',
      size = 'md',
      loading = false,
      icon,
      iconRight,
      children,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const shouldReduceMotion = useReducedMotion()

    return (
      <motion.button
        ref={ref}
        whileHover={shouldReduceMotion ? undefined : { scale: 1.02 }}
        whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className={cn(
          'inline-flex items-center justify-center font-medium transition-all duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50',
          'disabled:opacity-40 disabled:cursor-not-allowed',
          'select-none',
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        disabled={disabled ?? loading}
        {...(props as React.ComponentProps<typeof motion.button>)}
      >
        {loading ? (
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : icon ? (
          <span className="flex-shrink-0">{icon}</span>
        ) : null}
        {children && <span>{children}</span>}
        {iconRight && !loading && (
          <span className="flex-shrink-0">{iconRight}</span>
        )}
      </motion.button>
    )
  }
)

Button.displayName = 'Button'
