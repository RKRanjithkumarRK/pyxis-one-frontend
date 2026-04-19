'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Search } from 'lucide-react'
import { getBlindSpots } from '@/lib/api'
import { useSessionStore } from '@/store/sessionStore'
import { Skeleton, SkeletonText } from '@/components/ui/Skeleton'
import ReactMarkdown from 'react-markdown'

interface BlindSpot {
  concept: string
  description: string
  severity: 'low' | 'medium' | 'high'
  excavation: string
}

const severityColors = { low: '#10b981', medium: '#f59e0b', high: '#ef4444' }

export function BlindSpotArchaeology() {
  const { sessionId } = useSessionStore()
  const [spots, setSpots] = useState<BlindSpot[]>([])
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState<number | null>(null)

  useEffect(() => {
    setLoading(true)
    getBlindSpots(sessionId)
      .then((d) => setSpots(((d as Record<string, unknown>)?.blind_spots as BlindSpot[] | undefined) ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [sessionId])

  return (
    <div className="h-full flex flex-col gap-4 p-4 overflow-y-auto">
      <div>
        <h2 className="text-display-sm text-[var(--text-primary)]">Blind Spot Archaeology</h2>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">Excavate the knowledge gaps you didn't know you had</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="w-full h-20 rounded-2xl" />)}
        </div>
      ) : spots.length > 0 ? (
        <div className="space-y-2">
          {spots.map((spot, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="glass-elevated rounded-2xl overflow-hidden"
            >
              <button
                onClick={() => setExpanded(expanded === i ? null : i)}
                className="w-full flex items-center gap-3 p-3 text-left hover:bg-white/5 transition-colors"
              >
                <Search size={14} style={{ color: severityColors[spot.severity] }} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-[var(--text-primary)] truncate">{spot.concept}</div>
                  <div className="text-xs text-[var(--text-muted)] truncate">{spot.description}</div>
                </div>
                <span
                  className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: `${severityColors[spot.severity]}20`, color: severityColors[spot.severity] }}
                >
                  {spot.severity}
                </span>
              </button>
              {expanded === i && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  className="border-t border-[var(--border-subtle)] px-4 py-3 prose-pyxis"
                >
                  <div className="text-xs font-semibold text-[var(--text-secondary)] mb-2">Excavation Path</div>
                  <div className="text-xs text-[var(--text-secondary)]">
                    <ReactMarkdown>{spot.excavation}</ReactMarkdown>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-[var(--text-muted)] text-sm">
          No blind spots detected yet — keep learning
        </div>
      )}
    </div>
  )
}
