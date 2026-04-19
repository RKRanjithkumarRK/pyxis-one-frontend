'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Clock } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { temporalWaves } from '@/lib/api'
import { useSessionStore } from '@/store/sessionStore'
import { StreamingCursor } from '@/components/chat/StreamingCursor'
import ReactMarkdown from 'react-markdown'

const ERAS = ['Ancient', 'Medieval', 'Industrial', 'Modern', 'Near Future', 'Far Future']

export function TemporalWaves() {
  const { sessionId } = useSessionStore()
  const [topic, setTopic] = useState('')
  const [results, setResults] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const handleAnalyze = async () => {
    if (!topic.trim() || loading) return
    setLoading(true)
    setResults({})
    try {
      const data = await temporalWaves(sessionId, topic)
      setResults(data)
    } catch {
      setResults({})
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-full flex flex-col gap-4 p-4 overflow-y-auto">
      <div>
        <h2 className="text-display-sm text-[var(--text-primary)]">Temporal Waves</h2>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">Any concept traced across six epochs of time</p>
      </div>

      <div className="glass-elevated rounded-2xl p-3">
        <Textarea
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Enter a concept to trace through time..."
          autoGrow
          minRows={2}
          maxRows={4}
        />
        <div className="flex justify-end mt-2">
          <Button variant="primary" size="sm" icon={<Clock size={13} />} onClick={handleAnalyze} disabled={!topic.trim() || loading}>
            {loading ? 'Tracing...' : 'Trace Through Time'}
          </Button>
        </div>
      </div>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-500/60 to-purple-500/20" />
        <div className="space-y-3 pl-10">
          {ERAS.map((era, i) => (
            <motion.div
              key={era}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className="relative"
            >
              <div className="absolute -left-7 top-3 w-3 h-3 rounded-full bg-indigo-500 border-2 border-[var(--bg-base)]" />
              <div className="glass-elevated rounded-xl p-3">
                <div className="text-xs font-semibold text-indigo-400 mb-1">{era}</div>
                {loading && !results[era.toLowerCase()] ? (
                  <div className="flex items-center gap-2 text-[var(--text-muted)]">
                    <StreamingCursor />
                    <span className="text-xs">Analyzing era...</span>
                  </div>
                ) : results[era.toLowerCase()] ? (
                  <div className="text-xs text-[var(--text-secondary)] prose-pyxis">
                    <ReactMarkdown>{results[era.toLowerCase()]}</ReactMarkdown>
                  </div>
                ) : (
                  <span className="text-xs text-[var(--text-muted)]">Awaiting query...</span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
