'use client'

import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/Skeleton'

const CosmosClassroom = dynamic(
  () => import('@/components/three/CosmosClassroom').then((m) => m.CosmosClassroom),
  { ssr: false, loading: () => <Skeleton className="w-full h-full" /> }
)

export function CosmosClassroomPanel() {
  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-3 border-b border-[var(--border-subtle)] flex-shrink-0">
        <h2 className="text-display-sm text-[var(--text-primary)]">Cosmos Classroom</h2>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">An infinite universe shaped by your learning — orbit, explore, discover</p>
      </div>
      <div className="flex-1 min-h-0">
        <CosmosClassroom />
      </div>
    </div>
  )
}
