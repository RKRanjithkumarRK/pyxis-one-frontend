'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

export default function ChatError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Pyxis chat error:', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 p-8 text-center">
      <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
        <AlertTriangle size={22} className="text-red-400" />
      </div>

      <div>
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
          A component crashed
        </h2>
        <p className="text-sm text-[var(--text-secondary)] max-w-sm leading-relaxed">
          One of Pyxis&apos;s learning modules encountered an error. Your session data is intact.
        </p>
      </div>

      {error.message && (
        <pre className="text-xs text-[var(--text-muted)] bg-black/30 rounded-xl px-4 py-3 max-w-sm overflow-auto text-left border border-[var(--border-subtle)]">
          {error.message}
        </pre>
      )}

      <div className="flex gap-3">
        <button
          onClick={reset}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 border border-indigo-500/30 text-sm font-medium transition-all"
        >
          <RefreshCw size={14} />
          Reload module
        </button>
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl glass text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-sm font-medium transition-all"
        >
          <Home size={14} />
          Full reload
        </button>
      </div>
    </div>
  )
}
