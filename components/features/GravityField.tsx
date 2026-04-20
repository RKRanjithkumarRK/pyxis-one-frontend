'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import { getGravityField } from '@/lib/api'
import { useSessionStore } from '@/store/sessionStore'
import { Skeleton } from '@/components/ui/Skeleton'

const GravityField3D = dynamic(
  () => import('@/components/three/GravityField3D').then((m) => m.GravityField3D),
  { ssr: false, loading: () => <Skeleton className="w-full h-full rounded-2xl" /> }
)

interface ConceptNode {
  id: string
  label: string
  weight: number
  connections: string[]
}

export function GravityField() {
  const { sessionId } = useSessionStore()
  const [nodes, setNodes] = useState<ConceptNode[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    getGravityField(sessionId)
      .then((d) => setNodes(((d as Record<string, unknown>)?.nodes as ConceptNode[] | undefined) ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [sessionId])

  return (
    <div className="h-full flex flex-col gap-4 p-4 overflow-y-auto">
      <div>
        <h2 className="text-display-sm text-[var(--text-primary)]">Gravity Field</h2>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">Concepts orbit each other by gravitational knowledge mass</p>
      </div>

      <div className="h-48 rounded-2xl overflow-hidden glass-elevated">
        <GravityField3D />
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="w-full h-12 rounded-xl" />)}
        </div>
      ) : nodes.length > 0 ? (
        <div className="space-y-2">
          {nodes.map((node, i) => (
            <motion.div
              key={node.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="glass-elevated rounded-xl p-3 flex items-center gap-3"
            >
              <div
                className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white"
                style={{ background: `radial-gradient(circle, #6366f1, #4338ca)`, fontSize: Math.max(8, node.weight * 2) }}
              >
                {node.weight}
              </div>
              <div>
                <div className="text-xs font-medium text-[var(--text-primary)]">{node.label}</div>
                <div className="text-xs text-[var(--text-muted)]">{node.connections.length} connections</div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-[var(--text-muted)] text-sm">
          Gravity forms as you learn more concepts
        </div>
      )}
    </div>
  )
}
