'use client'

import { useState, useRef, useCallback } from 'react'
import { createSSEStream } from '@/lib/streaming'

interface UseStreamingOptions {
  url: string
  body: Record<string, unknown>
}

export function useStreaming() {
  const [content, setContent] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const start = useCallback(({ url, body }: UseStreamingOptions) => {
    setContent('')
    setIsStreaming(true)
    setError(null)

    abortRef.current = createSSEStream({
      url,
      body,
      onChunk: (chunk) => setContent((prev) => prev + chunk),
      onDone: () => setIsStreaming(false),
      onError: (err) => {
        setError(err.message)
        setIsStreaming(false)
      },
    })
  }, [])

  const stop = useCallback(() => {
    abortRef.current?.abort()
    setIsStreaming(false)
  }, [])

  const reset = useCallback(() => {
    stop()
    setContent('')
    setError(null)
  }, [stop])

  return { content, isStreaming, error, start, stop, reset }
}
