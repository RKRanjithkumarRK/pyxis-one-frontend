'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ClipboardList, CheckCircle, XCircle, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { generateAssessment, submitAssessment } from '@/lib/api'
import { useSessionStore } from '@/store/sessionStore'
import type { AssessmentQuestion } from '@/lib/types'

type AnswerRecord = Record<string, unknown>

export function Assessment() {
  const { sessionId } = useSessionStore()
  const [phase, setPhase] = useState<'idle' | 'answering' | 'results'>('idle')
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([])
  const [assessmentId, setAssessmentId] = useState('')
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [results, setResults] = useState<{ score: number; forensic_report: Record<string, unknown> } | null>(null)
  const [loading, setLoading] = useState(false)
  const [current, setCurrent] = useState(0)

  const handleGenerate = async () => {
    setLoading(true)
    try {
      const data = await generateAssessment(sessionId)
      setQuestions(data.questions)
      setAssessmentId(data.assessment_id)
      setAnswers({})
      setCurrent(0)
      setPhase('answering')
    } catch {
      // Backend might not have enough history
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const answerList: AnswerRecord[] = questions.map((q) => ({
        question_id: q.question_id,
        answer: answers[q.question_id] ?? '',
      }))
      const data = await submitAssessment(sessionId, assessmentId, answerList)
      setResults({ score: data.score, forensic_report: data.forensic_report })
      setPhase('results')
    } catch {
      setPhase('results')
      setResults({ score: 0, forensic_report: {} })
    } finally {
      setLoading(false)
    }
  }

  const q = questions[current]

  return (
    <div className="h-full flex flex-col gap-4 p-4 overflow-y-auto">
      <div>
        <h2 className="text-display-sm text-[var(--text-primary)]">Assessment</h2>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">Procedural examination generated from your conversations</p>
      </div>

      <AnimatePresence mode="wait">
        {phase === 'idle' && (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center gap-6 text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center">
              <ClipboardList size={28} className="text-indigo-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">Ready for assessment?</h3>
              <p className="text-xs text-[var(--text-secondary)] max-w-xs">
                Pyxis generates 5 targeted questions from your recent conversations. Answer them to reveal gaps and strengths.
              </p>
            </div>
            <Button variant="primary" onClick={handleGenerate} disabled={loading}>
              {loading ? 'Generating questions...' : 'Start Assessment'}
            </Button>
          </motion.div>
        )}

        {phase === 'answering' && q && (
          <motion.div key="answering" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex flex-col gap-4"
          >
            {/* Progress */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--text-muted)]">Question {current + 1} of {questions.length}</span>
              <span className="text-xs px-2 py-0.5 rounded-full border" style={{
                color: q.difficulty === 'hard' ? '#f87171' : q.difficulty === 'medium' ? '#fbbf24' : '#34d399',
                borderColor: q.difficulty === 'hard' ? 'rgba(248,113,113,0.3)' : q.difficulty === 'medium' ? 'rgba(251,191,36,0.3)' : 'rgba(52,211,153,0.3)',
                background: q.difficulty === 'hard' ? 'rgba(248,113,113,0.1)' : q.difficulty === 'medium' ? 'rgba(251,191,36,0.1)' : 'rgba(52,211,153,0.1)',
              }}>
                {q.difficulty}
              </span>
            </div>

            <div className="w-full bg-white/5 rounded-full h-1">
              <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${((current + 1) / questions.length) * 100}%` }} />
            </div>

            <div className="glass-elevated rounded-2xl p-4">
              <div className="text-xs text-indigo-400 mb-2 font-medium">{q.concept_tested}</div>
              <p className="text-sm text-[var(--text-primary)] leading-relaxed">{q.question}</p>
            </div>

            <Textarea
              value={answers[q.question_id] ?? ''}
              onChange={(e) => setAnswers((a) => ({ ...a, [q.question_id]: e.target.value }))}
              placeholder="Your answer..."
              autoGrow
              minRows={3}
              maxRows={10}
            />

            <div className="flex gap-2">
              {current > 0 && (
                <Button variant="outline" size="sm" onClick={() => setCurrent((c) => c - 1)}>
                  Back
                </Button>
              )}
              {current < questions.length - 1 ? (
                <Button variant="primary" size="sm" onClick={() => setCurrent((c) => c + 1)}
                  disabled={!answers[q.question_id]?.trim()}
                >
                  Next
                </Button>
              ) : (
                <Button variant="primary" size="sm" onClick={handleSubmit}
                  disabled={loading || questions.some((q) => !answers[q.question_id]?.trim())}
                >
                  {loading ? 'Submitting...' : 'Submit Assessment'}
                </Button>
              )}
            </div>

            {/* Question navigator */}
            <div className="flex gap-1.5 flex-wrap">
              {questions.map((_, i) => (
                <button key={i} onClick={() => setCurrent(i)}
                  className="w-7 h-7 rounded-lg text-xs font-medium transition-all border"
                  style={{
                    background: i === current ? 'rgba(99,102,241,0.2)' : answers[questions[i].question_id] ? 'rgba(52,211,153,0.1)' : 'rgba(255,255,255,0.05)',
                    borderColor: i === current ? 'rgba(99,102,241,0.5)' : answers[questions[i].question_id] ? 'rgba(52,211,153,0.3)' : 'rgba(255,255,255,0.1)',
                    color: i === current ? '#818cf8' : answers[questions[i].question_id] ? '#34d399' : '#94a3b8',
                  }}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {phase === 'results' && results && (
          <motion.div key="results" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col gap-4"
          >
            <div className="glass-elevated rounded-2xl p-6 text-center">
              <div className="text-4xl font-bold mb-1" style={{ color: results.score >= 80 ? '#34d399' : results.score >= 60 ? '#fbbf24' : '#f87171' }}>
                {results.score}%
              </div>
              <div className="text-sm text-[var(--text-secondary)]">
                {results.score >= 80 ? 'Excellent mastery!' : results.score >= 60 ? 'Good understanding' : 'Needs more practice'}
              </div>
            </div>

            {Object.keys(results.forensic_report).length > 0 && (
              <div className="glass rounded-xl p-4">
                <h4 className="text-xs font-semibold text-[var(--text-primary)] mb-2">Forensic Report</h4>
                <pre className="text-xs text-[var(--text-secondary)] whitespace-pre-wrap">
                  {JSON.stringify(results.forensic_report, null, 2)}
                </pre>
              </div>
            )}

            <Button variant="outline" icon={<RotateCcw size={13} />} onClick={() => { setPhase('idle'); setResults(null) }}>
              New Assessment
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
