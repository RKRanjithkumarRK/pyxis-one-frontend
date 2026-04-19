'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Eye } from 'lucide-react'
import { getOracleTimeline } from '@/lib/api'
import { useSessionStore } from '@/store/sessionStore'
import { Skeleton } from '@/components/ui/Skeleton'
import ReactMarkdown from 'react-markdown'

export function OracleMode() {
  const { sessionId } = useSessionStore()
  const [oracle, setOracle] = useState<{ timeline?: unknown[] } | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!oracle) {
      setLoading(true)
      getOracleTimeline(sessionId)
        .then((d) => setOracle(d as { timeline?: unknown[] }))
        .catch(() => {})
        .finally(() => setLoading(false))
    }
  }, [sessionId, oracle])

  const events = (oracle?.timeline ?? []) as Array<{ label: string; description: string; date?: string; probability?: number }>

  return (
    <div className="h-full flex flex-col gap-4 p-4 overflow-y-auto">
      <div>
        <h2 className="text-display-sm text-[var(--text-primary)]">Oracle Mode</h2>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">Predictive knowledge timeline — see where your learning leads</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="w-full h-16 rounded-2xl" />
          ))}
        </div>
      ) : events.length > 0 ? (
        <div className="relative">
          <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-500/60 to-transparent" />
          <div className="space-y-3 pl-12">
            {events.map((event, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07 }}
                className="relative"
              >
                <div className="absolute -left-8 top-3 w-4 h-4 rounded-full border-2 border-indigo-500 bg-[var(--bg-base)] flex items-center justify-center">
                  <Eye size={8} className="text-indigo-400" />
                </div>
                <div className="glass-elevated rounded-xl p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-indigo-400">{event.label}</span>
                    {event.probability && (
                      <span className="text-xs text-[var(--text-muted)]">{Math.round(event.probability * 100)}%</span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--text-secondary)]">{event.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-[var(--text-muted)] text-sm">
          The oracle requires more conversations to build your timeline
        </div>
      )}
    </div>
  )
}
