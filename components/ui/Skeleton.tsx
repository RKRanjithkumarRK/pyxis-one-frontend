'use client'

import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
  lines?: number
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'bg-gradient-to-r from-[var(--bg-elevated)] via-[var(--bg-overlay)] to-[var(--bg-elevated)]',
        'bg-[length:200%_100%] animate-[shimmer_2s_linear_infinite]',
        'rounded-lg',
        className
      )}
    />
  )
}

export function SkeletonText({ lines = 3 }: SkeletonProps) {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn('h-4', i === lines - 1 ? 'w-2/3' : 'w-full')}
        />
      ))}
    </div>
  )
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('glass rounded-2xl p-4 flex flex-col gap-3', className)}>
      <Skeleton className="h-5 w-1/3" />
      <SkeletonText lines={3} />
    </div>
  )
}
