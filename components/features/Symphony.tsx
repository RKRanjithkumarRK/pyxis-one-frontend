'use client'

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Music, Play, Square } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { getSymphonySequence } from '@/lib/api'
import { useSessionStore } from '@/store/sessionStore'

const NOTES = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5']
const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#f97316', '#ec4899']

interface SequenceNote {
  note: string
  duration: number
  color: string
}

export function Symphony() {
  const { sessionId } = useSessionStore()
  const [sequence, setSequence] = useState<SequenceNote[]>([])
  const [playing, setPlaying] = useState(false)
  const [activeNote, setActiveNote] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const audioCtxRef = useRef<AudioContext | null>(null)

  const noteToFreq: Record<string, number> = {
    C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23,
    G4: 392.0, A4: 440.0, B4: 493.88, C5: 523.25,
  }

  const playNote = (freq: number, duration: number) => {
    if (!audioCtxRef.current) audioCtxRef.current = new AudioContext()
    const ctx = audioCtxRef.current
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, ctx.currentTime)
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + duration)
  }

  const handleGenerate = async () => {
    setLoading(true)
    try {
      const data = await getSymphonySequence(sessionId) as Record<string, unknown>
      const raw = (data?.sequence as Array<{ note: string; duration: number }> | undefined) ?? []
      setSequence(raw.map((n: { note: string; duration: number }, i: number) => ({
        note: NOTES[i % NOTES.length],
        duration: n.duration ?? 0.5,
        color: COLORS[i % COLORS.length],
      })))
    } catch {
      const fallback = ['C4', 'E4', 'G4', 'A4', 'G4', 'E4', 'D4', 'C4']
      setSequence(fallback.map((note, i) => ({ note, duration: 0.4, color: COLORS[i] })))
    } finally {
      setLoading(false)
    }
  }

  const handlePlay = async () => {
    if (playing || sequence.length === 0) return
    setPlaying(true)
    for (let i = 0; i < sequence.length; i++) {
      const n = sequence[i]
      setActiveNote(i)
      playNote(noteToFreq[n.note] ?? 440, n.duration)
      await new Promise((r) => setTimeout(r, n.duration * 1000 + 50))
    }
    setActiveNote(null)
    setPlaying(false)
  }

  return (
    <div className="h-full flex flex-col gap-4 p-4 overflow-y-auto">
      <div>
        <h2 className="text-display-sm text-[var(--text-primary)]">Symphony</h2>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">Your learning session composed into music</p>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" icon={<Music size={13} />} onClick={handleGenerate} disabled={loading}>
          {loading ? 'Composing...' : 'Generate Sequence'}
        </Button>
        <Button variant="primary" size="sm" icon={playing ? <Square size={13} /> : <Play size={13} />} onClick={handlePlay} disabled={!sequence.length || playing}>
          {playing ? 'Playing...' : 'Play'}
        </Button>
      </div>

      {/* Piano roll */}
      <div className="glass-elevated rounded-2xl p-4">
        <div className="flex items-end gap-1 h-24">
          {sequence.length > 0 ? sequence.map((n, i) => {
            const noteIdx = NOTES.indexOf(n.note)
            const height = 20 + noteIdx * 10
            return (
              <motion.div
                key={i}
                className="flex-1 rounded-md transition-all"
                style={{
                  height,
                  backgroundColor: n.color,
                  opacity: activeNote === i ? 1 : 0.4,
                  transform: activeNote === i ? 'scaleY(1.2)' : 'scaleY(1)',
                }}
                animate={activeNote === i ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 0.2 }}
              />
            )
          }) : (
            <div className="w-full flex items-center justify-center text-xs text-[var(--text-muted)]">
              Generate a sequence to see the piano roll
            </div>
          )}
        </div>
        {sequence.length > 0 && (
          <div className="flex gap-1 mt-1">
            {sequence.map((n, i) => (
              <div key={i} className="flex-1 text-center" style={{ color: n.color }}>
                <span className="text-xs opacity-60">{n.note.replace('4', '').replace('5', '\'')}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
