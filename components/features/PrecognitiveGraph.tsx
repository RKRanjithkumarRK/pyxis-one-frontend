'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp } from 'lucide-react'
import { getPrecognition } from '@/lib/api'
import { useSessionStore } from '@/store/sessionStore'
import { Skeleton, SkeletonText } from '@/components/ui/Skeleton'

interface PrecognitionData {
  predicted_topics: string[]
  knowledge_trajectory: string
  recommended_next: string[]
  confidence_score: number
}

export function PrecognitiveGraph() {
  const { sessionId } = useSessionStore()
  const [data, setData] = useState<PrecognitionData | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    getPrecognition(sessionId)
      .then((d) => setData(d as PrecognitionData))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [sessionId])

  return (
    <div className="h-full flex flex-col gap-4 p-4 overflow-y-auto">
      <div>
        <h2 className="text-display-sm text-[var(--text-primary)]">Precognitive Graph</h2>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">Predicts your next knowledge needs before you know them</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="w-full h-20 rounded-2xl" />
          <SkeletonText lines={5} />
        </div>
      ) : data ? (
        <>
          <div className="glass-elevated rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[var(--text-secondary)]">Knowledge Trajectory</span>
              <span className="text-xs text-indigo-400 font-bold">{Math.round(data.confidence_score * 100)}% confidence</span>
            </div>
            <div className="w-full bg-white/5 rounded-full h-2 mb-3">
              <motion.div
                className="h-full bg-indigo-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${data.confidence_score * 100}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
            <p className="text-xs text-[var(--text-secondary)]">{data.knowledge_trajectory}</p>
          </div>

          <div className="glass-elevated rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={14} className="text-indigo-400" />
              <span className="text-xs font-semibold text-[var(--text-secondary)]">Predicted Topics</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {data.predicted_topics.map((topic, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="text-xs px-2 py-1 rounded-lg bg-indigo-500/15 text-indigo-300 border border-indigo-500/20"
                >
                  {topic}
                </motion.span>
              ))}
            </div>
          </div>

          <div className="glass-elevated rounded-2xl p-4">
            <div className="text-xs font-semibold text-[var(--text-secondary)] mb-3">Recommended Next</div>
            {data.recommended_next.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07 }}
                className="flex items-start gap-2 py-1.5"
              >
                <span className="text-indigo-400 text-xs mt-0.5">{i + 1}.</span>
                <span className="text-xs text-[var(--text-secondary)]">{item}</span>
              </motion.div>
            ))}
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center text-[var(--text-muted)] text-sm">
          No predictions yet — start learning to activate the graph
        </div>
      )}
    </div>
  )
}
