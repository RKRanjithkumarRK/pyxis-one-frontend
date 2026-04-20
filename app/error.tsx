'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Pyxis global error:', error)
  }, [error])

  return (
    <html lang="en">
      <body style={{ background: '#05050f', color: '#f8fafc', fontFamily: 'system-ui, sans-serif', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', maxWidth: 440, padding: '2rem' }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <AlertTriangle size={24} color="#f87171" />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.75rem' }}>Something went wrong</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
            Pyxis encountered an unexpected error. Your learning progress is saved.
          </p>
          {error.message && (
            <pre style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '0.75rem', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '1.5rem', overflow: 'auto', textAlign: 'left' }}>
              {error.message}
            </pre>
          )}
          <button
            onClick={reset}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#6366f1', color: 'white', border: 'none', borderRadius: 12, padding: '0.625rem 1.25rem', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}
          >
            <RefreshCw size={14} />
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
