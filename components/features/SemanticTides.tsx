'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { getSemanticTides } from '@/lib/api'
import { useSessionStore } from '@/store/sessionStore'
import { Skeleton } from '@/components/ui/Skeleton'

interface TideData {
  rising: string[]
  falling: string[]
  stable: string[]
  summary: string
}

export function SemanticTides() {
  const { sessionId } = useSessionStore()
  const [data, setData] = useState<TideData | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    getSemanticTides(sessionId)
      .then((d) => setData(d as TideData | null))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [sessionId])

  const Section = ({ title, items, color, icon }: { title: string; items: string[]; color: string; icon: string }) => (
    <div className="glass-elevated rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <span>{icon}</span>
        <span className="text-xs font-semibold" style={{ color }}>{title}</span>
      </div>
      {items.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {items.map((item, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="text-xs px-2 py-1 rounded-lg"
              style={{ backgroundColor: `${color}15`, color, border: `1px solid ${color}30` }}
            >
              {item}
            </motion.span>
          ))}
        </div>
      ) : (
        <span className="text-xs text-[var(--text-muted)]">None detected</span>
      )}
    </div>
  )

  return (
    <div className="h-full flex flex-col gap-4 p-4 overflow-y-auto">
      <div>
        <h2 className="text-display-sm text-[var(--text-primary)]">Semantic Tides</h2>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">Concepts rising, falling, and stabilising in your understanding</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="w-full h-24 rounded-2xl" />)}
        </div>
      ) : data ? (
        <>
          {data.summary && (
            <div className="glass-elevated rounded-2xl p-4">
              <p className="text-xs text-[var(--text-secondary)]">{data.summary}</p>
            </div>
          )}
          <Section title="Rising Tide" items={data.rising} color="#10b981" icon="🌊" />
          <Section title="Stable Ground" items={data.stable} color="#6366f1" icon="⚓" />
          <Section title="Ebbing Away" items={data.falling} color="#ef4444" icon="📉" />
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center text-[var(--text-muted)] text-sm">
          Semantic tides form over multiple conversations
        </div>
      )}
    </div>
  )
}
