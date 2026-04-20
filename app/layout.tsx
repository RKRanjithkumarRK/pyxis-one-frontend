import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import { ThemeProvider } from '@/components/layout/ThemeProvider'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Pyxis One',
  description: 'Your intelligent learning companion',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: 'var(--bg-overlay)',
                border: '1px solid var(--border-default)',
                color: 'var(--text-primary)',
                borderRadius: '12px',
                fontSize: '13px',
              },
            }}
            richColors
          />
        </ThemeProvider>
      </body>
    </html>
  )
}
