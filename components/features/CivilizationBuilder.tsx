'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Globe } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { getCivilization, civilizationDecision } from '@/lib/api'
import { useSessionStore } from '@/store/sessionStore'
import { Textarea } from '@/components/ui/Textarea'
import ReactMarkdown from 'react-markdown'

export function CivilizationBuilder() {
  const { sessionId } = useSessionStore()
  const [civ, setCiv] = useState<{ era?: string; turn?: number; resources?: Record<string, unknown>; current_challenge?: string } | null>(null)
  const [decision, setDecision] = useState('')
  const [feedback, setFeedback] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getCivilization(sessionId).then((d) => setCiv(d as typeof civ)).catch(() => {})
  }, [sessionId])

  const handleDecide = async () => {
    if (!decision.trim() || loading) return
    setLoading(true)
    try {
      const result = await civilizationDecision(sessionId, decision) as { outcome?: string; state?: typeof civ }
      setFeedback(result.outcome ?? '')
      if (result.state) setCiv(result.state)
    } catch {
      setFeedback('Decision failed.')
    } finally {
      setLoading(false)
      setDecision('')
    }
  }

  return (
    <div className="h-full flex flex-col gap-4 p-4 overflow-y-auto">
      <div>
        <h2 className="text-display-sm text-[var(--text-primary)]">Civilization Builder</h2>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">Your knowledge decisions shape a growing civilization</p>
      </div>

      {civ && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-elevated rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <Globe size={18} className="text-emerald-400" />
            <div>
              <div className="text-sm font-semibold text-[var(--text-primary)]">{civ.era ?? 'Age of Awakening'}</div>
              <div className="text-xs text-[var(--text-muted)]">Turn {civ.turn ?? 1}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(civ.resources ?? {}).map(([k, v]) => (
              <div key={k} className="text-xs text-[var(--text-secondary)]">
                <span className="text-[var(--text-muted)]">{k}: </span>
                <span className="font-medium">{String(v)}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {civ?.current_challenge && (
        <div className="glass-elevated rounded-2xl p-4 border border-emerald-500/20">
          <div className="text-xs font-semibold text-emerald-400 mb-2">Current Challenge</div>
          <p className="text-sm text-[var(--text-secondary)]">{civ.current_challenge}</p>
        </div>
      )}

      <div className="glass-elevated rounded-2xl p-3">
        <Textarea
          value={decision}
          onChange={(e) => setDecision(e.target.value)}
          placeholder="How does your civilization respond?"
          autoGrow
          minRows={2}
          maxRows={5}
        />
        <div className="flex justify-end mt-2">
          <Button variant="primary" size="sm" onClick={handleDecide} disabled={!decision.trim() || loading}>
            {loading ? 'Deciding...' : 'Make Decision'}
          </Button>
        </div>
      </div>

      {feedback && (
        <div className="glass-elevated rounded-2xl p-4 prose-pyxis">
          <ReactMarkdown>{feedback}</ReactMarkdown>
        </div>
      )}
    </div>
  )
}
