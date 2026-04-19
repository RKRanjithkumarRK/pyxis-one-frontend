'use client'

export function FallbackSVG({ label = 'Visualization' }: { label?: string }) {
  return (
    <div className="w-full h-full flex items-center justify-center glass rounded-2xl">
      <div className="text-center">
        <svg width="80" height="80" viewBox="0 0 80 80" className="mx-auto mb-3 opacity-30">
          <circle cx="40" cy="40" r="30" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="40" cy="40" r="20" fill="none" stroke="currentColor" strokeWidth="1" />
          <circle cx="40" cy="40" r="10" fill="none" stroke="currentColor" strokeWidth="0.75" />
          <line x1="40" y1="10" x2="40" y2="70" stroke="currentColor" strokeWidth="0.5" />
          <line x1="10" y1="40" x2="70" y2="40" stroke="currentColor" strokeWidth="0.5" />
        </svg>
        <p className="text-xs text-[var(--text-muted)]">{label}</p>
      </div>
    </div>
  )
}
