'use client'

import {
  forwardRef,
  useEffect,
  useRef,
  type TextareaHTMLAttributes,
} from 'react'
import { cn } from '@/lib/utils'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  autoGrow?: boolean
  minRows?: number
  maxRows?: number
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    { autoGrow = false, minRows = 1, maxRows = 8, className, onChange, ...props },
    forwardedRef
  ) => {
    const innerRef = useRef<HTMLTextAreaElement | null>(null)

    const setRef = (el: HTMLTextAreaElement | null) => {
      innerRef.current = el
      if (typeof forwardedRef === 'function') forwardedRef(el)
      else if (forwardedRef) forwardedRef.current = el
    }

    useEffect(() => {
      if (!autoGrow || !innerRef.current) return
      const el = innerRef.current
      el.style.height = 'auto'
      const lineHeight = parseInt(getComputedStyle(el).lineHeight, 10) || 24
      const minH = lineHeight * minRows
      const maxH = lineHeight * maxRows
      el.style.height = `${Math.min(Math.max(el.scrollHeight, minH), maxH)}px`
      el.style.overflowY = el.scrollHeight > maxH ? 'auto' : 'hidden'
    })

    return (
      <textarea
        ref={setRef}
        rows={minRows}
        onChange={onChange}
        className={cn(
          'w-full bg-transparent resize-none',
          'text-[var(--text-primary)] placeholder:text-[var(--text-muted)]',
          'text-sm leading-relaxed',
          'focus:outline-none',
          'transition-all duration-150',
          className
        )}
        {...props}
      />
    )
  }
)

Textarea.displayName = 'Textarea'
