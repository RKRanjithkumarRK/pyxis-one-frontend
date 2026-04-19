'use client'

import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface ScrollAreaProps extends HTMLAttributes<HTMLDivElement> {
  fadeTop?: boolean
  fadeBottom?: boolean
}

export const ScrollArea = forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ children, className, fadeTop, fadeBottom, ...props }, ref) => {
    return (
      <div className="relative overflow-hidden flex-1 min-h-0">
        {fadeTop && (
          <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-[var(--bg-base)] to-transparent z-10 pointer-events-none" />
        )}
        <div
          ref={ref}
          className={cn(
            'h-full overflow-y-auto overflow-x-hidden',
            'scrollbar-thin',
            className
          )}
          {...props}
        >
          {children}
        </div>
        {fadeBottom && (
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[var(--bg-base)] to-transparent z-10 pointer-events-none" />
        )}
      </div>
    )
  }
)

ScrollArea.displayName = 'ScrollArea'
