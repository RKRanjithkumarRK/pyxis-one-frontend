'use client'

import { useState, useCallback } from 'react'
import { VirtualizedMessages } from './VirtualizedMessages'
import { ChatInput } from './ChatInput'
import ConversationSidebar from '@/components/layout/ConversationSidebar'
import ModelSelector from './ModelSelector'
import { useSessionStore } from '@/store/sessionStore'
import { getConversationMessages } from '@/lib/api'
import type { Conversation, FeatureMode, Message } from '@/lib/types'

interface RawConvMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  model?: string | null
  created_at?: string | null
  tool_calls?: Message['toolCalls']
  tool_results?: Message['toolResults']
  usage?: Message['usage']
  thinking_content?: string | null
}

function toMessage(raw: RawConvMessage, fallbackFeature: FeatureMode): Message {
  return {
    id: raw.id,
    role: raw.role,
    content: raw.content ?? '',
    timestamp: raw.created_at ? new Date(raw.created_at).getTime() : Date.now(),
    feature_mode: fallbackFeature,
    model: raw.model ?? undefined,
    isStreaming: false,
    toolCalls: raw.tool_calls ?? undefined,
    toolResults: raw.tool_results ?? undefined,
    usage: raw.usage ?? undefined,
    thinkingContent: raw.thinking_content ?? undefined,
  }
}

export function ChatInterface() {
  const [loadingConversation, setLoadingConversation] = useState(false)

  const { sessionId, conversationId, messages, initSession, setFeature } = useSessionStore()

  const handleSelectConversation = useCallback(
    async (conv: Conversation) => {
      if (conv.id === conversationId) return
      setLoadingConversation(true)
      try {
        const data = await getConversationMessages(conv.id)
        const featureMode = (conv.feature_mode as FeatureMode) ?? 'standard'
        const msgs: Message[] = (data.messages as unknown as RawConvMessage[]).map(
          (m) => toMessage(m, featureMode)
        )
        useSessionStore.setState({
          conversationId: conv.id,
          messages: msgs,
          tokenCount: 0,
          pendingFiles: [],
          currentFeature: featureMode,
        })
        setFeature(featureMode)
      } catch (err) {
        console.error('[ChatInterface] Failed to load conversation:', err)
      } finally {
        setLoadingConversation(false)
      }
    },
    [conversationId, setFeature]
  )

  const handleNewConversation = useCallback(() => {
    initSession()
  }, [initSession])

  const isEmpty = messages.length === 0

  return (
    <div className="flex h-full overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      {/* ── Sidebar ── */}
      <ConversationSidebar
        sessionId={sessionId}
        activeConversationId={conversationId}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
      />

      {/* ── Main chat area ── */}
      <div className="flex flex-col flex-1 min-w-0 h-full relative">
        {/* Header: model selector centered */}
        <div className="flex items-center justify-center h-12 flex-shrink-0 relative">
          <ModelSelector />
        </div>

        {/* Messages or empty state */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {isEmpty && !loadingConversation ? (
            <EmptyState />
          ) : (
            <VirtualizedMessages loadingConversation={loadingConversation} />
          )}
        </div>

        {/* Input */}
        <ChatInput />
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 px-4">
      <h1 className="text-3xl font-semibold" style={{ color: 'var(--text-primary)' }}>
        What can I help with?
      </h1>
    </div>
  )
}
