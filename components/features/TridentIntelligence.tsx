'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { tridentAnalysis } from '@/lib/api'
import { useSessionStore } from '@/store/sessionStore'
import { StreamingCursor } from '@/components/chat/StreamingCursor'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const LENSES = [
  { key: 'analytical', label: 'Analytical', color: '#6366f1', emoji: '🔬' },
  { key: 'creative', label: 'Creative', color: '#8b5cf6', emoji: '🎨' },
  { key: 'critical', label: 'Critical', color: '#06b6d4', emoji: '⚡' },
]

export function TridentIntelligence() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const { sessionId } = useSessionStore()

  const handleAnalyze = async () => {
    if (!query.trim() || loading) return
    setLoading(true)
    setResults({})
    try {
      const data = await tridentAnalysis(sessionId, query)
      setResults(data)
    } catch {
      setResults({ analytical: 'Analysis failed.', creative: '', critical: '' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-full flex flex-col gap-4 p-4 overflow-y-auto">
      <div>
        <h2 className="text-display-sm text-[var(--text-primary)]">Trident Intelligence</h2>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">Three simultaneous cognitive lenses on any question</p>
      </div>

      <div className="glass-elevated rounded-2xl p-3">
        <Textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter a concept or question to analyze from three angles..."
          autoGrow
          minRows={2}
          maxRows={5}
        />
        <div className="flex justify-end mt-2">
          <Button variant="primary" size="sm" icon={<Zap size={13} />} onClick={handleAnalyze} disabled={!query.trim() || loading}>
            {loading ? 'Analyzing...' : 'Analyze'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {LENSES.map((lens, i) => (
          <motion.div
            key={lens.key}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="glass-elevated rounded-2xl p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-base">{lens.emoji}</span>
              <span className="text-sm font-semibold" style={{ color: lens.color }}>{lens.label}</span>
            </div>
            <div className="text-sm text-[var(--text-secondary)] prose-pyxis">
              {loading && !results[lens.key] ? (
                <div className="flex items-center gap-2 text-[var(--text-muted)]">
                  <StreamingCursor />
                  <span className="text-xs">Thinking...</span>
                </div>
              ) : results[lens.key] ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{results[lens.key]}</ReactMarkdown>
              ) : (
                <span className="text-[var(--text-muted)] text-xs">Awaiting query...</span>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
