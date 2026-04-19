'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, CheckCircle, X } from 'lucide-react'

interface HealthData {
  status: string
  api_key_configured: boolean
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

  const allGood = health?.status === 'ok' && health?.api_key_configured

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
              Backend offline — run <code className="bg-black/30 px-1 rounded">python main.py</code> in <code className="bg-black/30 px-1 rounded">pyxis-one-backend</code>
            </span>
          ) : !health?.api_key_configured ? (
            <span>
              Anthropic API key not set — get yours at{' '}
              <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer" className="underline hover:text-amber-200">
                console.anthropic.com
              </a>
              , then add it to <code className="bg-black/30 px-1 rounded">pyxis-one-backend/.env</code> and restart the backend
            </span>
          ) : null}
        </div>
        <button onClick={() => setDismissed(true)} className="text-amber-400 hover:text-amber-200 ml-3 flex-shrink-0">
          <X size={13} />
        </button>
      </motion.div>
    </AnimatePresence>
  )
}
