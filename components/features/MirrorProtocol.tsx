'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { getMirrorReport } from '@/lib/api'
import { useSessionStore } from '@/store/sessionStore'
import { Skeleton, SkeletonText } from '@/components/ui/Skeleton'
import ReactMarkdown from 'react-markdown'

interface MirrorData {
  misconceptions: string[]
  strengths: string[]
  growth_areas: string[]
  narrative: string
}

export function MirrorProtocol() {
  const { sessionId } = useSessionStore()
  const [data, setData] = useState<MirrorData | null>(null)
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const result = await getMirrorReport(sessionId)
      setData(result as unknown as MirrorData)
    } catch {
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [sessionId])

  return (
    <div className="h-full flex flex-col gap-4 p-4 overflow-y-auto">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-display-sm text-[var(--text-primary)]">Mirror Protocol</h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">Pyxis reflects your thinking patterns back at you</p>
        </div>
        <Button variant="ghost" size="sm" icon={<RefreshCw size={13} />} onClick={load} disabled={loading}>Refresh</Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="w-full h-24 rounded-2xl" />
          <SkeletonText lines={6} />
        </div>
      ) : data ? (
        <>
          <div className="glass-elevated rounded-2xl p-4 prose-pyxis">
            <div className="text-xs font-semibold text-[var(--text-secondary)] mb-2">Your Reflection</div>
            <ReactMarkdown>{data.narrative}</ReactMarkdown>
          </div>

          {data.strengths.length > 0 && (
            <div className="glass-elevated rounded-2xl p-4">
              <div className="text-xs font-semibold text-green-400 mb-3">Cognitive Strengths</div>
              {data.strengths.map((s, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  className="flex items-start gap-2 py-1"
                >
                  <span className="text-green-400 text-xs mt-0.5">✓</span>
                  <span className="text-xs text-[var(--text-secondary)]">{s}</span>
                </motion.div>
              ))}
            </div>
          )}

          {data.misconceptions.length > 0 && (
            <div className="glass-elevated rounded-2xl p-4">
              <div className="text-xs font-semibold text-amber-400 mb-3">Potential Misconceptions</div>
              {data.misconceptions.map((m, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  className="flex items-start gap-2 py-1"
                >
                  <span className="text-amber-400 text-xs mt-0.5">!</span>
                  <span className="text-xs text-[var(--text-secondary)]">{m}</span>
                </motion.div>
              ))}
            </div>
          )}

          {data.growth_areas.length > 0 && (
            <div className="glass-elevated rounded-2xl p-4">
              <div className="text-xs font-semibold text-indigo-400 mb-3">Growth Areas</div>
              {data.growth_areas.map((g, i) => (
                <div key={i} className="flex items-start gap-2 py-1">
                  <span className="text-indigo-400 text-xs mt-0.5">→</span>
                  <span className="text-xs text-[var(--text-secondary)]">{g}</span>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center text-[var(--text-muted)] text-sm">
          Converse more to see your mirror
        </div>
      )}
    </div>
  )
}
