import Link from 'next/link'

export default function NotFound() {
  return (
    <html lang="en">
      <body style={{ background: '#05050f', color: '#f8fafc', fontFamily: 'system-ui, sans-serif', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', maxWidth: 400, padding: '2rem' }}>
          <div style={{ fontSize: '4rem', fontWeight: 800, color: '#6366f1', lineHeight: 1, marginBottom: '1rem' }}>404</div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.75rem' }}>Page not found</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            This page doesn&apos;t exist in the Pyxis universe.
          </p>
          <a href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#6366f1', color: 'white', textDecoration: 'none', borderRadius: 12, padding: '0.625rem 1.25rem', fontSize: '0.875rem', fontWeight: 600 }}>
            Return to Pyxis
          </a>
        </div>
      </body>
    </html>
  )
}
