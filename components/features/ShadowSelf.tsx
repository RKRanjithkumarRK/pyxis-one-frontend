'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Moon } from 'lucide-react'
import { getShadowSelf } from '@/lib/api'
import { useSessionStore } from '@/store/sessionStore'
import { Skeleton, SkeletonText } from '@/components/ui/Skeleton'
import ReactMarkdown from 'react-markdown'

export function ShadowSelf() {
  const { sessionId } = useSessionStore()
  const [profile, setProfile] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    getShadowSelf(sessionId)
      .then((d) => setProfile((d as Record<string, string> | null)?.shadow_profile ?? null))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [sessionId])

  return (
    <div className="h-full flex flex-col gap-4 p-4 overflow-y-auto">
      <div>
        <h2 className="text-display-sm text-[var(--text-primary)]">Shadow Self</h2>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">Unconscious patterns, cognitive shadows, and blind archetypes</p>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-elevated rounded-2xl p-5 border border-purple-500/20"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
            <Moon size={18} className="text-purple-400" />
          </div>
          <div>
            <div className="text-sm font-semibold text-[var(--text-primary)]">Your Shadow Profile</div>
            <div className="text-xs text-[var(--text-muted)]">Inferred from your conversation patterns</div>
          </div>
        </div>

        {loading ? (
          <SkeletonText lines={6} />
        ) : profile ? (
          <div className="prose-pyxis text-sm text-[var(--text-secondary)]">
            <ReactMarkdown>{profile}</ReactMarkdown>
          </div>
        ) : (
          <p className="text-xs text-[var(--text-muted)]">
            Have more conversations to reveal your shadow patterns. The shadow emerges from what you don't say.
          </p>
        )}
      </motion.div>
    </div>
  )
}
