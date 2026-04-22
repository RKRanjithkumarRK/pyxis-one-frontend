import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'PYXIS Voice',
  description: 'Real-time AI voice assistant',
}

export default function VoiceLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: '#212121', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
        {children}
      </body>
    </html>
  )
}
