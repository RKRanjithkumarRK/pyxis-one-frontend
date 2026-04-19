'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { PHILOSOPHERS } from '@/lib/constants'
import { parliamentDebate } from '@/lib/api'
import { useSessionStore } from '@/store/sessionStore'
import ReactMarkdown from 'react-markdown'

export function PersonaParliament() {
  const { sessionId } = useSessionStore()
  const [query, setQuery] = useState('')
  const [responses, setResponses] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)

  const handleDebate = async () => {
    if (!query.trim() || loading) return
    setLoading(true)
    setResponses({})
    try {
      const data = await parliamentDebate(sessionId, query)
      setResponses(data)
    } catch {
      setResponses({})
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-full flex flex-col gap-4 p-4 overflow-y-auto">
      <div>
        <h2 className="text-display-sm text-[var(--text-primary)]">Persona Parliament</h2>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">12 historical philosophers debate your question simultaneously</p>
      </div>

      <div className="glass-elevated rounded-2xl p-3">
        <Textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Pose a philosophical question or dilemma..."
          autoGrow
          minRows={2}
          maxRows={4}
        />
        <div className="flex justify-end mt-2">
          <Button variant="primary" size="sm" icon={<Users size={13} />} onClick={handleDebate} disabled={!query.trim() || loading}>
            {loading ? 'Convening...' : 'Convene Parliament'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {PHILOSOPHERS.map((phil, i) => {
          const resp = responses[phil.id]
          const isSelected = selected === phil.id
          return (
            <motion.div
              key={phil.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => setSelected(isSelected ? null : phil.id)}
              className="glass-elevated rounded-xl p-3 cursor-pointer hover:border-[var(--border-accent)] transition-all border border-transparent"
            >
              <div className="flex items-center gap-2 mb-1">
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold"
                  style={{ backgroundColor: `${phil.color}20`, color: phil.color }}
                >
                  {phil.name[0]}
                </div>
                <span className="text-xs font-medium text-[var(--text-primary)] truncate">{phil.name}</span>
              </div>
              <p className="text-xs text-[var(--text-muted)] truncate">{phil.era}</p>
              {loading && !resp && (
                <div className="mt-2 h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: phil.color }}
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                  />
                </div>
              )}
            </motion.div>
          )
        })}
      </div>

      <AnimatePresence>
        {selected && responses[selected] && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-elevated rounded-2xl p-4 prose-pyxis overflow-hidden"
          >
            <div className="text-xs font-semibold text-[var(--text-secondary)] mb-2">
              {PHILOSOPHERS.find((p) => p.id === selected)?.name} responds:
            </div>
            <div className="text-sm text-[var(--text-secondary)]">
              <ReactMarkdown>{responses[selected]}</ReactMarkdown>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
