'use client'

import { useEffect, useCallback } from 'react'
import { useSessionStore } from '@/store/sessionStore'
import { usePsycheStore } from '@/store/psycheStore'
import { getPsycheVisualization } from '@/lib/api'

export function usePsyche() {
  const { sessionId } = useSessionStore()
  const { dimensions, trends, organismHealth, setVisualization, setLoading, isLoading } =
    usePsycheStore()

  const refresh = useCallback(async () => {
    if (!sessionId) return
    setLoading(true)
    try {
      const data = await getPsycheVisualization(sessionId)
      setVisualization(data)
    } catch {
      // Silently ignore — psyche data is non-critical
    } finally {
      setLoading(false)
    }
  }, [sessionId, setVisualization, setLoading])

  // Refresh after every 5 messages
  const { messages } = useSessionStore()
  useEffect(() => {
    if (messages.length > 0 && messages.length % 5 === 0) {
      void refresh()
    }
  }, [messages.length, refresh])

  return { dimensions, trends, organismHealth, isLoading, refresh }
}
