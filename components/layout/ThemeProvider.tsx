'use client'

import { useEffect, type ReactNode } from 'react'
import { useUIStore } from '@/store/uiStore'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useUIStore((s) => s.theme)

  useEffect(() => {
    document.documentElement.className = `theme-${theme}`
  }, [theme])

  return <>{children}</>
}
