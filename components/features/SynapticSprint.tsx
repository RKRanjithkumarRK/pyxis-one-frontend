'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { synapticSprint } from '@/lib/api'
import { useSessionStore } from '@/store/sessionStore'

interface SprintQuestion {
  question: string
  options: string[]
  correct: number
  explanation: string
}

export function SynapticSprint() {
  const { sessionId } = useSessionStore()
  const [questions, setQuestions] = useState<SprintQuestion[]>([])
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(10)
  const [phase, setPhase] = useState<'idle' | 'active' | 'done'>('idle')
  const [loading, setLoading] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (phase === 'active' && selected === null) {
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            clearInterval(timerRef.current!)
            handleSelect(-1)
            return 0
          }
          return t - 1
        })
      }, 1000)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [phase, current, selected])

  const handleStart = async () => {
    setLoading(true)
    try {
      const data = await synapticSprint(sessionId)
      setQuestions(data.questions ?? [])
      setCurrent(0)
      setScore(0)
      setSelected(null)
      setTimeLeft(10)
      setPhase('active')
    } catch {
      setQuestions([])
    } finally {
      setLoading(false)
    }
  }

  const handleSelect = (idx: number) => {
    if (selected !== null) return
    clearInterval(timerRef.current!)
    setSelected(idx)
    if (idx === questions[current]?.correct) setScore((s) => s + 1)
    setTimeout(() => {
      if (current + 1 < questions.length) {
        setCurrent((c) => c + 1)
        setSelected(null)
        setTimeLeft(10)
      } else {
        setPhase('done')
      }
    }, 1500)
  }

  const q = questions[current]

  return (
    <div className="h-full flex flex-col gap-4 p-4 overflow-y-auto">
      <div>
        <h2 className="text-display-sm text-[var(--text-primary)]">Synaptic Sprint</h2>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">Rapid-fire recall challenge — 10 seconds per question</p>
      </div>

      <AnimatePresence mode="wait">
        {phase === 'idle' && (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center gap-4"
          >
            <div className="w-16 h-16 rounded-2xl bg-yellow-500/20 flex items-center justify-center">
              <Zap size={28} className="text-yellow-400" />
            </div>
            <p className="text-sm text-[var(--text-secondary)] text-center max-w-xs">
              5 rapid-fire questions from your recent conversations. 10 seconds each.
            </p>
            <Button variant="primary" onClick={handleStart} disabled={loading}>
              {loading ? 'Generating...' : 'Start Sprint'}
            </Button>
          </motion.div>
        )}

        {phase === 'active' && q && (
          <motion.div key={`q-${current}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="flex flex-col gap-4"
          >
            <div className="glass-elevated rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-[var(--text-muted)]">Q{current + 1}/{questions.length}</span>
                <div className={`text-sm font-bold ${timeLeft <= 3 ? 'text-red-400' : 'text-[var(--text-secondary)]'}`}>
                  {timeLeft}s
                </div>
              </div>
              <div className="w-full bg-white/5 rounded-full h-1 mb-4">
                <motion.div
                  className="h-full bg-indigo-500 rounded-full"
                  style={{ width: `${(timeLeft / 10) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <p className="text-sm text-[var(--text-primary)] font-medium">{q.question}</p>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {q.options.map((opt, i) => {
                const isCorrect = i === q.correct
                const isSelected = selected === i
                return (
                  <button
                    key={i}
                    onClick={() => handleSelect(i)}
                    disabled={selected !== null}
                    className={`text-left px-4 py-3 rounded-xl text-sm transition-all border ${
                      selected !== null
                        ? isCorrect
                          ? 'bg-green-500/20 border-green-500/50 text-green-300'
                          : isSelected
                            ? 'bg-red-500/20 border-red-500/50 text-red-300'
                            : 'opacity-40 border-transparent'
                        : 'glass border-[var(--border-subtle)] hover:border-[var(--border-accent)] text-[var(--text-secondary)]'
                    }`}
                  >
                    <span className="mr-2 text-xs opacity-60">{String.fromCharCode(65 + i)}.</span>
                    {opt}
                    {selected !== null && isCorrect && <CheckCircle size={14} className="inline ml-2 text-green-400" />}
                    {selected !== null && isSelected && !isCorrect && <XCircle size={14} className="inline ml-2 text-red-400" />}
                  </button>
                )
              })}
            </div>
            {selected !== null && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-xl p-3 text-xs text-[var(--text-secondary)]">
                {q.explanation}
              </motion.div>
            )}
          </motion.div>
        )}

        {phase === 'done' && (
          <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="flex-1 flex flex-col items-center justify-center gap-4 text-center"
          >
            <div className="text-5xl font-bold text-indigo-400">{score}/{questions.length}</div>
            <p className="text-sm text-[var(--text-secondary)]">
              {score === questions.length ? 'Perfect sprint!' : score >= questions.length / 2 ? 'Solid recall!' : 'More practice needed.'}
            </p>
            <Button variant="primary" onClick={handleStart}>Sprint Again</Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
