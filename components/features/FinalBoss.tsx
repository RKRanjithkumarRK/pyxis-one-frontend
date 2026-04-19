'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Skull } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { finalBoss } from '@/lib/api'
import { useSessionStore } from '@/store/sessionStore'
import { Textarea } from '@/components/ui/Textarea'
import ReactMarkdown from 'react-markdown'
import { StreamingCursor } from '@/components/chat/StreamingCursor'

function Particle({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <motion.div
      className="absolute w-1 h-1 rounded-full pointer-events-none"
      style={{ left: x, top: y, backgroundColor: color }}
      initial={{ opacity: 1, scale: 1 }}
      animate={{ opacity: 0, scale: 0, x: (Math.random() - 0.5) * 200, y: (Math.random() - 0.5) * 200 }}
      transition={{ duration: 1.5, ease: 'easeOut' }}
    />
  )
}

export function FinalBoss() {
  const { sessionId } = useSessionStore()
  const [phase, setPhase] = useState<'intro' | 'battle' | 'victory' | 'defeat'>('intro')
  const [challenge, setChallenge] = useState('')
  const [answer, setAnswer] = useState('')
  const [feedback, setFeedback] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; color: string }[]>([])
  const containerRef = useRef<HTMLDivElement>(null)

  const spawnParticles = () => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const newParticles = Array.from({ length: 20 }, (_, i) => ({
      id: Date.now() + i,
      x: Math.random() * rect.width,
      y: Math.random() * rect.height,
      color: ['#6366f1', '#8b5cf6', '#ef4444', '#f97316'][Math.floor(Math.random() * 4)],
    }))
    setParticles((p) => [...p, ...newParticles])
    setTimeout(() => setParticles((p) => p.slice(20)), 2000)
  }

  const handleStart = async () => {
    setPhase('battle')
    setFeedback('')
    try {
      const data = await (finalBoss(sessionId, '') as Promise<Record<string, unknown>>)
      setChallenge((data.challenge as string | undefined) ?? 'Prove your mastery. The boss awaits.')
    } catch {
      setChallenge('Explain everything you have learned in this session, without omission.')
    }
  }

  const handleSubmit = async () => {
    if (!answer.trim() || streaming) return
    setStreaming(true)
    setFeedback('')
    spawnParticles()
    try {
      const controller = finalBoss(sessionId, answer, (chunk) => setFeedback((p) => p + chunk)) as AbortController
      await new Promise<void>((resolve) => setTimeout(resolve, 25000))
      controller.abort()
      setPhase(feedback.toLowerCase().includes('fail') ? 'defeat' : 'victory')
    } catch {
      setFeedback('The boss has fallen silent.')
      setPhase('defeat')
    } finally {
      setStreaming(false)
    }
  }

  return (
    <div ref={containerRef} className="relative h-full flex flex-col gap-4 p-4 overflow-y-auto">
      {particles.map((p) => <Particle key={p.id} x={p.x} y={p.y} color={p.color} />)}

      <AnimatePresence mode="wait">
        {phase === 'intro' && (
          <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center gap-6 text-center"
          >
            <motion.div
              animate={{ scale: [1, 1.05, 1], rotate: [0, 2, -2, 0] }}
              transition={{ repeat: Infinity, duration: 3 }}
              className="w-24 h-24 rounded-3xl bg-gradient-to-br from-red-500/30 to-orange-500/30 border border-red-500/50 flex items-center justify-center"
            >
              <Skull size={40} className="text-red-400" />
            </motion.div>
            <div>
              <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">The Final Boss Awaits</h3>
              <p className="text-sm text-[var(--text-secondary)] max-w-xs">
                A gauntlet designed from everything you've learned. One shot. No hints. Prove mastery.
              </p>
            </div>
            <Button variant="danger" onClick={handleStart}>
              Enter the Gauntlet
            </Button>
          </motion.div>
        )}

        {phase === 'battle' && (
          <motion.div key="battle" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex flex-col gap-4"
          >
            <div className="glass-elevated rounded-2xl p-4 border border-red-500/30">
              <div className="flex items-center gap-2 mb-3">
                <Skull size={14} className="text-red-400" />
                <span className="text-xs font-semibold text-red-400 uppercase tracking-wider">Boss Challenge</span>
              </div>
              <p className="text-sm text-[var(--text-primary)]">{challenge}</p>
            </div>
            <Textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Your answer..."
              autoGrow
              minRows={4}
              maxRows={12}
            />
            <Button variant="danger" onClick={handleSubmit} disabled={!answer.trim() || streaming}>
              {streaming ? 'Judging...' : 'Submit Answer'}
            </Button>
            {(feedback || streaming) && (
              <div className="glass-elevated rounded-2xl p-4 prose-pyxis border border-red-500/20">
                <ReactMarkdown>{feedback}</ReactMarkdown>
                {streaming && <StreamingCursor />}
              </div>
            )}
          </motion.div>
        )}

        {(phase === 'victory' || phase === 'defeat') && (
          <motion.div key="result" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="flex-1 flex flex-col items-center justify-center gap-6 text-center"
          >
            <div className="text-5xl">{phase === 'victory' ? '🏆' : '💀'}</div>
            <div>
              <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">
                {phase === 'victory' ? 'Boss Defeated!' : 'You Fell.'}
              </h3>
              <div className="text-sm text-[var(--text-secondary)] max-w-xs prose-pyxis">
                <ReactMarkdown>{feedback}</ReactMarkdown>
              </div>
            </div>
            <Button variant="outline" onClick={() => { setPhase('intro'); setAnswer(''); setFeedback('') }}>
              Try Again
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
