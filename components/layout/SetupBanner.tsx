'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, X, Zap } from 'lucide-react'

interface HealthData {
  status: string
  ready: boolean
  providers: string[]
  // legacy field (old backends)
  api_key_configured?: boolean
}

export function SetupBanner() {
  const [health, setHealth] = useState<HealthData | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const [backendDown, setBackendDown] = useState(false)

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'
    fetch(`${base}/health`)
      .then((r) => r.json())
      .then((d: HealthData) => setHealth(d))
      .catch(() => setBackendDown(true))
  }, [])

  if (dismissed) return null
  if (!health && !backendDown) return null

  // Support both new `ready` field and legacy `api_key_configured`
  const hasProviders =
    health?.ready ||
    health?.api_key_configured ||
    (health?.providers && health.providers.length > 0)

  const allGood = health?.status === 'ok' && hasProviders
  if (allGood) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="flex-shrink-0 px-4 py-2 bg-amber-500/10 border-b border-amber-500/30 flex items-center justify-between"
      >
        <div className="flex items-center gap-2 text-xs text-amber-300">
          <AlertTriangle size={13} className="flex-shrink-0" />
          {backendDown ? (
            <span>
              Backend offline — run{' '}
              <code className="bg-black/30 px-1 rounded">uvicorn main:app --reload</code> in{' '}
              <code className="bg-black/30 px-1 rounded">pyxis-one-backend</code>
            </span>
          ) : (
            <span>
              No AI provider configured — add at least one of{' '}
              <code className="bg-black/30 px-1 rounded">GROQ_API_KEY</code>,{' '}
              <code className="bg-black/30 px-1 rounded">GEMINI_API_KEY</code>,{' '}
              <code className="bg-black/30 px-1 rounded">OPENROUTER_API_KEY</code>, or{' '}
              <code className="bg-black/30 px-1 rounded">SAMBANOVA_API_KEY</code> to{' '}
              <code className="bg-black/30 px-1 rounded">pyxis-one-backend/.env</code> — all free
            </span>
          )}
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-amber-400 hover:text-amber-200 ml-3 flex-shrink-0"
        >
          <X size={13} />
        </button>
      </motion.div>
    </AnimatePresence>
  )
}
