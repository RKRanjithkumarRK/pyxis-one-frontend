'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { getCurriculum } from '@/lib/api'
import { useSessionStore } from '@/store/sessionStore'
import { Skeleton, SkeletonText } from '@/components/ui/Skeleton'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface CurriculumData {
  curriculum: string
  next_topics: string[]
  mastery_gaps: string[]
}

export function SentientCurriculum() {
  const { sessionId } = useSessionStore()
  const [data, setData] = useState<CurriculumData | null>(null)
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const result = await getCurriculum(sessionId)
      setData(result as CurriculumData | null)
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
          <h2 className="text-display-sm text-[var(--text-primary)]">Sentient Curriculum</h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">Adaptive learning path rebuilt after every conversation</p>
        </div>
        <Button variant="ghost" size="sm" icon={<RefreshCw size={13} />} onClick={load} disabled={loading}>
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="w-full h-32 rounded-2xl" />
          <SkeletonText lines={4} />
        </div>
      ) : data ? (
        <>
          <div className="glass-elevated rounded-2xl p-4 prose-pyxis">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{data.curriculum}</ReactMarkdown>
          </div>

          {data.next_topics.length > 0 && (
            <div className="glass-elevated rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen size={14} className="text-indigo-400" />
                <span className="text-xs font-semibold text-[var(--text-secondary)]">Next Topics</span>
              </div>
              <div className="space-y-2">
                {data.next_topics.map((topic, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-start gap-2"
                  >
                    <span className="text-indigo-400 text-xs mt-0.5">→</span>
                    <span className="text-xs text-[var(--text-secondary)]">{topic}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {data.mastery_gaps.length > 0 && (
            <div className="glass-elevated rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-amber-400 text-xs font-semibold">⚠ Mastery Gaps</span>
              </div>
              <div className="space-y-1.5">
                {data.mastery_gaps.map((gap, i) => (
                  <div key={i} className="text-xs text-[var(--text-muted)] flex items-start gap-2">
                    <span className="text-amber-400 mt-0.5">•</span>
                    <span>{gap}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center text-[var(--text-muted)] text-sm">
          Start a conversation to generate your curriculum
        </div>
      )}
    </div>
  )
}
