'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Languages } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { babelMind } from '@/lib/api'
import { useSessionStore } from '@/store/sessionStore'
import { StreamingCursor } from '@/components/chat/StreamingCursor'
import ReactMarkdown from 'react-markdown'

const METAPHOR_LENSES = [
  { id: 'sports', label: 'Sports', emoji: '⚽' },
  { id: 'cooking', label: 'Cooking', emoji: '🍳' },
  { id: 'music', label: 'Music', emoji: '🎵' },
  { id: 'architecture', label: 'Architecture', emoji: '🏛️' },
  { id: 'nature', label: 'Nature', emoji: '🌿' },
  { id: 'military', label: 'Military', emoji: '⚔️' },
]

export function BabelMind() {
  const { sessionId } = useSessionStore()
  const [concept, setConcept] = useState('')
  const [selectedLens, setSelectedLens] = useState('sports')
  const [content, setContent] = useState('')
  const [streaming, setStreaming] = useState(false)

  const handleTranslate = async () => {
    if (!concept.trim() || streaming) return
    setStreaming(true)
    setContent('')
    try {
      const controller = babelMind(sessionId, concept, selectedLens, (chunk) => setContent((p) => p + chunk))
      await new Promise<void>((resolve) => setTimeout(resolve, 25000))
      controller?.abort?.()
    } catch {
      setContent('Translation failed.')
    } finally {
      setStreaming(false)
    }
  }

  return (
    <div className="h-full flex flex-col gap-4 p-4 overflow-y-auto">
      <div>
        <h2 className="text-display-sm text-[var(--text-primary)]">Babel Mind</h2>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">Any concept translated through any metaphorical lens</p>
      </div>

      <div className="glass-elevated rounded-2xl p-3">
        <Textarea
          value={concept}
          onChange={(e) => setConcept(e.target.value)}
          placeholder="What concept should be translated?"
          autoGrow
          minRows={2}
          maxRows={4}
        />
        <div className="mt-2 mb-2">
          <div className="text-xs text-[var(--text-muted)] mb-2">Translation lens:</div>
          <div className="flex flex-wrap gap-1.5">
            {METAPHOR_LENSES.map((lens) => (
              <button
                key={lens.id}
                onClick={() => setSelectedLens(lens.id)}
                className={`px-2.5 py-1 rounded-lg text-xs transition-all ${
                  selectedLens === lens.id
                    ? 'bg-indigo-500/30 text-indigo-300 border border-indigo-500/50'
                    : 'glass border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                }`}
              >
                {lens.emoji} {lens.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex justify-end">
          <Button variant="primary" size="sm" icon={<Languages size={13} />} onClick={handleTranslate} disabled={!concept.trim() || streaming}>
            {streaming ? 'Translating...' : 'Translate'}
          </Button>
        </div>
      </div>

      {(content || streaming) && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="glass-elevated rounded-2xl p-4 prose-pyxis"
        >
          <div className="flex items-center gap-2 mb-3">
            <Languages size={13} className="text-indigo-400" />
            <span className="text-xs font-semibold text-[var(--text-secondary)]">
              Translated via {METAPHOR_LENSES.find((l) => l.id === selectedLens)?.label} lens
            </span>
          </div>
          <ReactMarkdown>{content}</ReactMarkdown>
          {streaming && <StreamingCursor />}
        </motion.div>
      )}
    </div>
  )
}
