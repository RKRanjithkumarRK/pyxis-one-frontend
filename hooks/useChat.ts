'use client'

import { useCallback, useRef } from 'react'
import { useSessionStore } from '@/store/sessionStore'
import { streamChat } from '@/lib/api'
import { estimateTokens, generateId } from '@/lib/utils'

export function useChat() {
  const {
    sessionId,
    currentFeature,
    addMessage,
    updateLastAssistantMessage,
    finalizeLastMessage,
    setStreaming,
    isStreaming,
    addTokens,
  } = useSessionStore()

  const abortRef = useRef<AbortController | null>(null)

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isStreaming) return

      // Add user message
      addMessage({ role: 'user', content, feature_mode: currentFeature })

      // Add empty assistant message placeholder
      addMessage({ role: 'assistant', content: '', feature_mode: currentFeature, isStreaming: true })

      setStreaming(true)
      addTokens(estimateTokens(content))

      const messages = [{ role: 'user', content }]

      abortRef.current = await streamChat(
        sessionId,
        messages,
        currentFeature,
        (chunk) => {
          updateLastAssistantMessage(chunk)
          addTokens(estimateTokens(chunk))
        },
        () => {
          finalizeLastMessage()
        },
        (err) => {
          console.error('Chat stream error:', err)
          updateLastAssistantMessage(
            err.message.includes('credit') || err.message.includes('billing')
              ? '⚠️ The AI service is temporarily unavailable (billing issue). Please try again later.'
              : `⚠️ ${err.message}`
          )
          finalizeLastMessage()
        }
      )
    },
    [
      sessionId,
      currentFeature,
      isStreaming,
      addMessage,
      updateLastAssistantMessage,
      finalizeLastMessage,
      setStreaming,
      addTokens,
    ]
  )

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort()
    finalizeLastMessage()
  }, [finalizeLastMessage])

  return { sendMessage, stopStreaming, isStreaming }
}
