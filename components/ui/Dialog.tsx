'use client'

import { useEffect, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './Button'

interface DialogProps {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  children: ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-[95vw] max-h-[95vh]',
}

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  className,
  size = 'md',
}: DialogProps) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={cn(
              'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50',
              'glass-elevated rounded-2xl w-full p-6',
              'max-h-[90vh] overflow-y-auto',
              sizeClasses[size],
              className
            )}
          >
            {title && (
              <div className="flex items-start justify-between mb-4">
                <div>
                  {title && (
                    <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                      {description}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={onClose}
                  className="ml-4 flex-shrink-0"
                  icon={<X size={16} />}
                />
              </div>
            )}
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
