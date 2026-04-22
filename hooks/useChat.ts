'use client'

import { useCallback, useRef } from 'react'
import { toast } from 'sonner'
import { useSessionStore } from '@/store/sessionStore'
import { streamChat, uploadFile } from '@/lib/api'
import { estimateTokens, generateId } from '@/lib/utils'
import type { ToolCall } from '@/lib/types'

export function useChat() {
  const {
    sessionId,
    currentFeature,
    conversationId,
    selectedModel,
    enableWebSearch,
    pendingFiles,
    addMessage,
    updateLastAssistantMessage,
    finalizeLastMessage,
    setStreaming,
    isStreaming,
    addTokens,
    setConversationId,
    addToolCall,
    updateToolCall,
    setThinking,
    setLastMessageError,
    clearPendingFiles,
  } = useSessionStore()

  const abortRef = useRef<AbortController | null>(null)
  const regenAttemptRef = useRef(0)
  const currentModelRef = useRef(selectedModel)

  const sendMessage = useCallback(
    async (content: string, opts?: { regenerate?: boolean; forceModel?: string }) => {
      if (!content.trim() || isStreaming) return

      const isRegen = opts?.regenerate ?? false
      if (isRegen) {
        regenAttemptRef.current += 1
      } else {
        regenAttemptRef.current = 0
      }

      const fileIds = pendingFiles.map((f) => f.file_id)
      const attachments = [...pendingFiles]

      // Add user message (skip if regenerating)
      if (!isRegen) {
        addMessage({
          role: 'user',
          content,
          feature_mode: currentFeature,
          attachments: attachments.length > 0 ? attachments : undefined,
        })
        clearPendingFiles()
      }

      // Add assistant placeholder
      addMessage({
        role: 'assistant',
        content: '',
        feature_mode: currentFeature,
        isStreaming: true,
        model: opts?.forceModel ?? selectedModel,
        toolCalls: [],
      })

      setStreaming(true)
      addTokens(estimateTokens(content))

      const controller = streamChat({
        sessionId,
        message: content,
        featureMode: currentFeature,
        conversationId: conversationId ?? undefined,
        model: opts?.forceModel ?? selectedModel,
        branchIndex: 0,
        regenerationAttempt: regenAttemptRef.current,
        enableWebSearch,
        fileIds: fileIds.length > 0 ? fileIds : undefined,

        onChunk: (chunk) => {
          updateLastAssistantMessage(chunk)
          addTokens(estimateTokens(chunk))
        },

        onThinking: (text) => {
          setThinking(text)
        },

        onToolStart: (name, label, callId) => {
          const tool: ToolCall = {
            id: callId || generateId(),
            name,
            label,
            status: 'running',
          }
          // We use sessionId as proxy msgId — addToolCall targets last assistant msg
          addToolCall(sessionId, tool)
        },

        onToolDone: (callId, result) => {
          updateToolCall(sessionId, callId, { status: 'done', result })
        },

        onModelSelected: (model, _provider, _intent) => {
          currentModelRef.current = model
        },

        onConversationCreated: (newConvId) => {
          setConversationId(newConvId)
        },

        onUsage: (usage) => {
          finalizeLastMessage({ model: currentModelRef.current, usage })
        },

        onDone: (finishReason) => {
          if (finishReason !== 'error') {
            // onUsage already called finalizeLastMessage with usage
            // If no usage event (groq), finalize here
            finalizeLastMessage({ model: currentModelRef.current })
          }
        },

        onError: (err, code) => {
          const isAbort = err.name === 'AbortError'
          if (isAbort) {
            finalizeLastMessage()
            return
          }
          const userMsg = err.message || 'Something went wrong. Please try again.'
          if (code === '429') {
            toast.error('Rate limit reached. Please wait a moment.', { duration: 6000 })
          } else {
            toast.error(userMsg, { duration: 8000 })
          }
          setLastMessageError(userMsg, code)
        },
      })

      abortRef.current = controller
    },
    [
      sessionId,
      currentFeature,
      conversationId,
      selectedModel,
      enableWebSearch,
      pendingFiles,
      isStreaming,
      addMessage,
      updateLastAssistantMessage,
      finalizeLastMessage,
      setStreaming,
      addTokens,
      setConversationId,
      addToolCall,
      updateToolCall,
      setThinking,
      setLastMessageError,
      clearPendingFiles,
    ]
  )

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort()
    finalizeLastMessage()
  }, [finalizeLastMessage])

  const regenerate = useCallback(
    async (lastUserContent: string, forceModel?: string) => {
      if (isStreaming) return
      // Remove last assistant message
      useSessionStore.setState((state) => {
        const messages = [...state.messages]
        if (messages.length > 0 && messages[messages.length - 1].role === 'assistant') {
          messages.pop()
        }
        return { messages }
      })
      await sendMessage(lastUserContent, { regenerate: true, forceModel })
    },
    [isStreaming, sendMessage]
  )

  return { sendMessage, stopStreaming, regenerate, isStreaming }
}
