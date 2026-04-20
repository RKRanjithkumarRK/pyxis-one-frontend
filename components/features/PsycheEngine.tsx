'use client'

import { useEffect } from 'react'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import { usePsycheStore } from '@/store/psycheStore'
import { PSYCHE_DIMENSIONS } from '@/lib/constants'
import { Progress } from '@/components/ui/Progress'
import { Skeleton } from '@/components/ui/Skeleton'
import { getPsycheState } from '@/lib/api'
import { useSessionStore } from '@/store/sessionStore'

const PsycheOrganism = dynamic(
  () => import('@/components/three/PsycheOrganism').then((m) => m.PsycheOrganism),
  { ssr: false, loading: () => <Skeleton className="w-full h-full rounded-2xl" /> }
)

export function PsycheEngine() {
  const { dimensions, setDimensions } = usePsycheStore()
  const { sessionId } = useSessionStore()
  const hasData = Object.keys(dimensions).length > 0

  useEffect(() => {
    if (!hasData) {
      getPsycheState(sessionId).then((data) => {
        if (data?.dimensions) setDimensions(data.dimensions)
      }).catch(() => {})
    }
  }, [sessionId, hasData, setDimensions])

  return (
    <div className="h-full flex flex-col gap-4 p-4 overflow-y-auto">
      <div>
        <h2 className="text-display-sm text-[var(--text-primary)]">Psyche Engine</h2>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">Your cognitive signature — 14 dimensions mapped in real time</p>
      </div>

      <div className="h-48 rounded-2xl overflow-hidden glass-elevated">
        <PsycheOrganism />
      </div>

      <div className="grid grid-cols-1 gap-2">
        {PSYCHE_DIMENSIONS.map((dim, i) => {
          const score = dimensions[dim.id] ?? null
          return (
            <motion.div
              key={dim.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="glass rounded-xl p-3"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-[var(--text-secondary)]">{dim.label}</span>
                {score !== null ? (
                  <span className="text-xs font-bold" style={{ color: dim.color }}>{score}</span>
                ) : (
                  <Skeleton className="w-6 h-3" />
                )}
              </div>
              {score !== null ? (
                <Progress value={score} color={dim.color} />
              ) : (
                <Skeleton className="w-full h-1.5 rounded-full" />
              )}
              <p className="text-xs text-[var(--text-muted)] mt-1">{dim.description}</p>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
