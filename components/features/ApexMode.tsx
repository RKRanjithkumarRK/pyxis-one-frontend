'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, Flame, Target, Search, Zap, Globe, Infinity as InfinityIcon } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useSessionStore } from '@/store/sessionStore'
import ReactMarkdown from 'react-markdown'
import { StreamingCursor } from '@/components/chat/StreamingCursor'

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

const DIMENSIONS = [
  { icon: Brain, label: 'COGNITION', color: '#c084fc', desc: 'Full psyche mapping' },
  { icon: Flame, label: 'FORGE', color: '#f97316', desc: '7-stage metallurgy' },
  { icon: Globe, label: 'COSMOS', color: '#818cf8', desc: 'Universal context' },
  { icon: Target, label: 'NEMESIS', color: '#dc2626', desc: 'Weakness targeting' },
  { icon: Search, label: 'DARK SCAN', color: '#94a3b8', desc: 'Blind spot exposure' },
  { icon: Zap, label: 'TRIDENT', color: '#f59e0b', desc: 'Triple perspectives' },
]

export function ApexMode() {
  const { sessionId } = useSessionStore()
  const [response, setResponse] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [deployed, setDeployed] = useState(false)
  const [input, setInput] = useState('')

  const handleApex = async () => {
    if (!input.trim() || streaming) return
    setDeployed(true)
    setStreaming(true)
    setResponse('')

    try {
      const res = await fetch(`${BASE}/v1/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, message: input, feature_mode: 'apex' }),
      })
      if (!res.ok || !res.body) throw new Error('Stream failed')
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
      setResponse('Apex deployment failed.')
    } finally {
      setStreaming(false)
    }
  }

  return (
    <div className="h-full flex flex-col gap-4 p-4 overflow-y-auto">
      <div className="flex items-center gap-3">
        <motion.div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)' }}
          animate={deployed ? { boxShadow: ['0 0 0px #fbbf2440', '0 0 20px #fbbf2480', '0 0 0px #fbbf2440'] } : {}}
          transition={{ repeat: Number.POSITIVE_INFINITY, duration: 2 }}
        >
          <InfinityIcon size={20} className="text-black" />
        </motion.div>
        <div>
          <h2 className="text-display-sm text-[var(--text-primary)]">Apex Mode</h2>
          <p className="text-xs text-[var(--text-muted)]">All cognitive dimensions converging — maximum intelligence deployed</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {DIMENSIONS.map((dim, i) => (
          <motion.div
            key={dim.label}
            className="glass-elevated rounded-xl p-3 flex items-center gap-2"
            animate={deployed ? {
              borderColor: [dim.color + '00', dim.color + 'aa', dim.color + '44'],
              boxShadow: [`0 0 0px ${dim.color}00`, `0 0 14px ${dim.color}60`, `0 0 6px ${dim.color}30`],
            } : {}}
            transition={{ delay: i * 0.12, duration: 0.6 }}
            style={{ border: '1px solid transparent' }}
          >
            <dim.icon size={16} style={{ color: dim.color }} />
            <div>
              <div className="text-[10px] font-bold tracking-widest" style={{ color: dim.color }}>{dim.label}</div>
              <div className="text-[10px] text-[var(--text-muted)]">{dim.desc}</div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="glass-elevated rounded-2xl p-3">
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Enter anything — APEX deploys all 6 dimensions simultaneously..."
          className="w-full bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] resize-none outline-none min-h-[60px]"
          rows={3}
          onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) handleApex() }}
        />
        <div className="flex justify-end mt-2">
          <Button variant="primary" size="sm" onClick={handleApex} disabled={!input.trim() || streaming}>
            {streaming ? 'APEX ACTIVE...' : 'DEPLOY APEX'}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {(response || streaming) && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-elevated rounded-2xl p-4 prose-pyxis"
            style={{ borderColor: '#fbbf2440', border: '1px solid' }}
          >
            <ReactMarkdown>{response}</ReactMarkdown>
            {streaming && <StreamingCursor />}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
