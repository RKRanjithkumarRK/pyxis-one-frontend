'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Radar, Shield, AlertTriangle, XCircle, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useSessionStore } from '@/store/sessionStore'
import ReactMarkdown from 'react-markdown'
import { StreamingCursor } from '@/components/chat/StreamingCursor'

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

const SCAN_PHASES = [
  { label: 'Surface Knowledge', color: '#34d399', icon: Shield },
  { label: 'Deep Structure', color: '#fbbf24', icon: AlertTriangle },
  { label: 'Critical Gaps', color: '#f87171', icon: XCircle },
]

export function DominionScan() {
  const { sessionId } = useSessionStore()
  const [topic, setTopic] = useState('')
  const [scanning, setScanning] = useState(false)
  const [phase, setPhase] = useState(-1)
  const [report, setReport] = useState('')

  const handleScan = async () => {
    if (!topic.trim() || scanning) return
    setScanning(true)
    setReport('')
    setPhase(0)

    const phaseTimer = setInterval(() => {
      setPhase(p => (p < 2 ? p + 1 : p))
    }, 1200)

    try {
      const prompt = `DOMINION SCAN initiated on: "${topic}". Map my complete knowledge territory. Identify: (1) what I genuinely master, (2) what I think I know but don't, (3) critical gaps that could undermine everything. Be surgical and ruthless. Produce a complete dominion map.`
      const res = await fetch(`${BASE}/api/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, message: prompt, feature_mode: 'dominion' }),
      })
      if (!res.ok || !res.body) throw new Error('Scan failed')
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        for (const line of decoder.decode(value, { stream: true }).split('\n')) {
          if (!line.startsWith('data: ')) continue
          try {
            const d = JSON.parse(line.slice(6))
            if (d.type === 'text' && d.content) setReport(p => p + d.content)
            if (d.type === 'done' || d.type === 'error') { setScanning(false); return }
          } catch {}
        }
      }
    } catch {
      setReport('Dominion scan failed.')
    } finally {
      clearInterval(phaseTimer)
      setPhase(2)
      setScanning(false)
    }
  }

  return (
    <div className="h-full flex flex-col gap-4 p-4 overflow-y-auto">
      <div className="flex items-center gap-3">
        <motion.div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #4c1d95)' }}
          animate={scanning ? { rotate: [0, 360] } : {}}
          transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
        >
          <Radar size={20} className="text-white" />
        </motion.div>
        <div>
          <h2 className="text-display-sm text-[var(--text-primary)]">Dominion Scan</h2>
          <p className="text-xs text-[var(--text-muted)]">Complete knowledge territory mapping — what you own, what you don&apos;t</p>
        </div>
      </div>

      {scanning && (
        <div className="space-y-2">
          {SCAN_PHASES.map((p, i) => (
            <motion.div
              key={p.label}
              className="glass-elevated rounded-xl px-4 py-3 flex items-center gap-3"
              initial={{ opacity: 0.3 }}
              animate={{ opacity: i <= phase ? 1 : 0.3 }}
            >
              <motion.div
                animate={i === phase && scanning ? { scale: [1, 1.3, 1] } : {}}
                transition={{ repeat: Infinity, duration: 0.8 }}
              >
                <p.icon size={16} style={{ color: p.color }} />
              </motion.div>
              <span className="text-sm text-[var(--text-secondary)]">{p.label}</span>
              {i < phase && <ChevronRight size={14} className="ml-auto text-[var(--text-muted)]" />}
              {i === phase && scanning && (
                <span className="ml-auto text-[10px] tracking-widest" style={{ color: p.color }}>SCANNING...</span>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {!scanning && (
        <div className="glass-elevated rounded-2xl p-3">
          <input
            value={topic}
            onChange={e => setTopic(e.target.value)}
            placeholder="Enter a domain, subject, or skill to scan..."
            className="w-full bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none"
            onKeyDown={e => { if (e.key === 'Enter') handleScan() }}
          />
          <div className="flex justify-end mt-3">
            <Button variant="primary" size="sm" onClick={handleScan} disabled={!topic.trim()}>
              INITIATE SCAN
            </Button>
          </div>
        </div>
      )}

      <AnimatePresence>
        {report && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-elevated rounded-2xl p-4 prose-pyxis"
            style={{ borderColor: '#7c3aed40', border: '1px solid' }}
          >
            <ReactMarkdown>{report}</ReactMarkdown>
            {scanning && <StreamingCursor />}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
