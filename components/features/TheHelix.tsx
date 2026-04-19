'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { getHelixRevolutions, reviewHelixCard } from '@/lib/api'
import { useSessionStore } from '@/store/sessionStore'
import { HELIX_REVOLUTIONS } from '@/lib/constants'
import { HelixVisualizer3D } from '@/components/three/HelixVisualizer3D'
import { Skeleton } from '@/components/ui/Skeleton'

interface CardState {
  concept: string
  next_due: string
  revolution: number
  easiness: number
}

export function TheHelix() {
  const { sessionId } = useSessionStore()
  const [cards, setCards] = useState<CardState[]>([])
  const [loading, setLoading] = useState(false)
  const [activeCard, setActiveCard] = useState<number | null>(null)
  const [reviewing, setReviewing] = useState(false)

  useEffect(() => {
    setLoading(true)
    getHelixRevolutions(sessionId)
      .then((d) => setCards(((d as Record<string, unknown>)?.cards as CardState[] | undefined) ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [sessionId])

  const handleReview = async (idx: number, quality: number) => {
    setReviewing(true)
    try {
      await reviewHelixCard(sessionId, idx, quality)
      const updated = [...cards]
      updated[idx] = { ...updated[idx], revolution: Math.min(updated[idx].revolution + 1, HELIX_REVOLUTIONS.length - 1) }
      setCards(updated)
    } catch {} finally {
      setReviewing(false)
      setActiveCard(null)
    }
  }

  const dueCards = cards.filter((c) => new Date(c.next_due) <= new Date())

  return (
    <div className="h-full flex flex-col gap-4 p-4 overflow-y-auto">
      <div>
        <h2 className="text-display-sm text-[var(--text-primary)]">The Helix</h2>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">Spaced repetition with 6 orbital revolutions — SM-2 algorithm</p>
      </div>

      <div className="h-36 rounded-2xl overflow-hidden glass-elevated">
        <HelixVisualizer3D />
      </div>

      <div className="grid grid-cols-3 gap-2">
        {HELIX_REVOLUTIONS.map((rev, i) => {
          const count = cards.filter((c) => c.revolution === i).length
          return (
            <div key={rev.id} className="glass-elevated rounded-xl p-3 text-center">
              <div className="text-lg mb-1">{rev.emoji}</div>
              <div className="text-xs font-medium text-[var(--text-primary)]">{count}</div>
              <div className="text-xs text-[var(--text-muted)] truncate">{rev.label}</div>
            </div>
          )
        })}
      </div>

      {dueCards.length > 0 && (
        <div className="glass-elevated rounded-2xl p-3 border border-amber-500/20">
          <div className="text-xs font-semibold text-amber-400 mb-2">{dueCards.length} cards due for review</div>
          <Button variant="outline" size="sm" icon={<RotateCcw size={13} />} onClick={() => setActiveCard(0)}>
            Start Review
          </Button>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="w-full h-14 rounded-xl" />)}
        </div>
      ) : activeCard !== null && cards[activeCard] ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="glass-elevated rounded-2xl p-4"
        >
          <div className="text-sm font-medium text-[var(--text-primary)] mb-4">{cards[activeCard].concept}</div>
          <div className="text-xs text-[var(--text-muted)] mb-3">How well did you recall this?</div>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((q) => (
              <button key={q} onClick={() => handleReview(activeCard, q)} disabled={reviewing}
                className="flex-1 py-2 rounded-lg text-xs font-medium transition-all hover:bg-indigo-500/20 hover:text-indigo-300 glass border border-[var(--border-subtle)]"
              >
                {q}
              </button>
            ))}
          </div>
        </motion.div>
      ) : null}
    </div>
  )
}
