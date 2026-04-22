'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useSessionStore } from '@/store/sessionStore'
import ReactMarkdown from 'react-markdown'
import { StreamingCursor } from '@/components/chat/StreamingCursor'

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

const DIMENSIONS = [
  { id: 'math', label: 'Mathematics', color: '#818cf8', emoji: '∑' },
  { id: 'philosophy', label: 'Philosophy', color: '#a855f7', emoji: '∞' },
  { id: 'engineering', label: 'Engineering', color: '#f97316', emoji: '⚙' },
  { id: 'art', label: 'Art & Culture', color: '#f43f5e', emoji: '◈' },
  { id: 'cosmic', label: 'Cosmic', color: '#06b6d4', emoji: '✦' },
  { id: 'street', label: 'Street Level', color: '#34d399', emoji: '⬡' },
]

export function TranscendenceProtocol() {
  const { sessionId } = useSessionStore()
  const [concept, setConcept] = useState('')
  const [selected, setSelected] = useState<string[]>(DIMENSIONS.map(d => d.id))
  const [response, setResponse] = useState('')
  const [streaming, setStreaming] = useState(false)

  const toggleDim = (id: string) => {
    setSelected(p => p.includes(id) ? (p.length > 1 ? p.filter(x => x !== id) : p) : [...p, id])
  }

  const handleTranscend = async () => {
    if (!concept.trim() || streaming) return
    setStreaming(true)
    setResponse('')

    const activeDims = DIMENSIONS.filter(d => selected.includes(d.id)).map(d => d.label)
    const prompt = `TRANSCENDENCE PROTOCOL — analyze "${concept}" through ALL of these simultaneous dimensions: ${activeDims.join(', ')}. For each dimension, reveal a completely different truth about this concept. Make the multi-dimensional nature feel like seeing the concept for the first time from every angle simultaneously.`

    try {
      const res = await fetch(`${BASE}/api/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, message: prompt, feature_mode: 'transcendence' }),
      })
      if (!res.ok || !res.body) throw new Error('Transcendence failed')
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        for (const line of decoder.decode(value, { stream: true }).split('\n')) {
          if (!line.startsWith('data: ')) continue
          try {
            const d = JSON.parse(line.slice(6))
            if (d.type === 'text' && d.content) setResponse(p => p + d.content)
            if (d.type === 'done' || d.type === 'error') { setStreaming(false); return }
          } catch {}
        }
      }
    } catch {
      setResponse('Transcendence protocol failed.')
    } finally {
      setStreaming(false)
    }
  }

  return (
    <div className="h-full flex flex-col gap-4 p-4 overflow-y-auto">
      <div className="flex items-center gap-3">
        <motion.div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #a855f7, #7c3aed)' }}
          animate={streaming ? { rotate: [0, 360] } : {}}
          transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
        >
          <Sparkles size={20} className="text-white" />
        </motion.div>
        <div>
          <h2 className="text-display-sm text-[var(--text-primary)]">Transcendence Protocol</h2>
          <p className="text-xs text-[var(--text-muted)]">See any concept through all dimensions simultaneously</p>
        </div>
      </div>

      <div>
        <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest mb-2">Active Dimensions</p>
        <div className="grid grid-cols-3 gap-2">
          {DIMENSIONS.map(dim => {
            const active = selected.includes(dim.id)
            return (
              <motion.button
                key={dim.id}
                onClick={() => toggleDim(dim.id)}
                whileTap={{ scale: 0.95 }}
                className={`rounded-xl py-2 px-3 text-left transition-all ${active ? 'glass-elevated' : 'opacity-30'}`}
                style={active ? { borderColor: dim.color + '60', border: '1px solid', boxShadow: `0 0 8px ${dim.color}30` } : {}}
              >
                <div className="text-lg leading-none mb-1" style={{ color: active ? dim.color : undefined }}>{dim.emoji}</div>
                <div className="text-[10px] font-medium" style={{ color: active ? dim.color : 'var(--text-muted)' }}>{dim.label}</div>
              </motion.button>
            )
          })}
        </div>
      </div>

      <div className="glass-elevated rounded-2xl p-3">
        <textarea
          value={concept}
          onChange={e => setConcept(e.target.value)}
          placeholder="Enter any concept, idea, or question..."
          className="w-full bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] resize-none outline-none min-h-[50px]"
          rows={2}
          onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) handleTranscend() }}
        />
        <div className="flex items-center justify-between mt-2">
          <span className="text-[10px] text-[var(--text-muted)]">{selected.length} dimensions active</span>
          <Button variant="primary" size="sm" onClick={handleTranscend} disabled={!concept.trim() || streaming}>
            {streaming ? 'TRANSCENDING...' : 'TRANSCEND'}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {(response || streaming) && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-elevated rounded-2xl p-4 prose-pyxis"
            style={{ borderColor: '#a855f740', border: '1px solid' }}
          >
            <ReactMarkdown>{response}</ReactMarkdown>
            {streaming && <StreamingCursor />}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
