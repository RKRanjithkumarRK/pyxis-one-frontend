'use client'

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { VirtualizedMessages } from './VirtualizedMessages'
import { ChatInput } from './ChatInput'
import ConversationSidebar from '@/components/layout/ConversationSidebar'
import { useSessionStore } from '@/store/sessionStore'
import { getConversationMessages } from '@/lib/api'
import type { Conversation, FeatureMode, Message } from '@/lib/types'

// ── Shape returned by the backend for a conversation message ──────────────────
// (differs from the frontend Message shape — notably uses created_at / snake_case)
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

// Convert a raw backend ConversationMessage → frontend Message
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

// Persist sidebar open/closed state in localStorage
const SIDEBAR_KEY = 'pyxis-conv-sidebar-open'

function readSidebarPref(): boolean {
  if (typeof window === 'undefined') return true
  const stored = localStorage.getItem(SIDEBAR_KEY)
  return stored === null ? true : stored === 'true'
}

export function ChatInterface() {
  const [sidebarOpen, setSidebarOpen] = useState(readSidebarPref)
  const [loadingConversation, setLoadingConversation] = useState(false)

  const {
    sessionId,
    conversationId,
    setConversationId,
    initSession,
    setFeature,
  } = useSessionStore()

  // Persist sidebar state
  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => {
      const next = !prev
      localStorage.setItem(SIDEBAR_KEY, String(next))
      return next
    })
  }, [])

  // ── Load a past conversation ───────────────────────────────────────────
  const handleSelectConversation = useCallback(
    async (conv: Conversation) => {
      if (conv.id === conversationId) return

      setLoadingConversation(true)
      try {
        const data = await getConversationMessages(conv.id)

        const featureMode = (conv.feature_mode as FeatureMode) ?? 'standard'
        const messages: Message[] = (data.messages as unknown as RawConvMessage[]).map(
          (m) => toMessage(m, featureMode)
        )

        // Atomically update the store — no tearing between conversationId and messages
        useSessionStore.setState({
          conversationId: conv.id,
          messages,
          tokenCount: 0,
          pendingFiles: [],
          currentFeature: featureMode,
        })

        // Also reflect the feature in the UI (for feature panels etc.)
        setFeature(featureMode)
      } catch (err) {
        console.error('[ChatInterface] Failed to load conversation:', err)
      } finally {
        setLoadingConversation(false)
      }
    },
    [conversationId, setFeature]
  )

  // ── Start a new conversation ───────────────────────────────────────────
  const handleNewConversation = useCallback(() => {
    initSession()
  }, [initSession])

  return (
    <div className="flex h-full min-h-0 overflow-hidden">
      {/* ── Conversation history sidebar ── */}
      <AnimatePresence initial={false}>
        {sidebarOpen && (
          <motion.div
            key="conv-sidebar"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 260, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="flex-shrink-0 overflow-hidden h-full"
            style={{ minWidth: 0 }}
          >
            <ConversationSidebar
              sessionId={sessionId}
              activeConversationId={conversationId}
              onSelectConversation={handleSelectConversation}
              onNewConversation={handleNewConversation}
              className="h-full w-[260px]"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main chat column ── */}
      <div className="flex flex-col flex-1 min-w-0 h-full relative">
        {/* Sidebar toggle — top-left of chat area */}
        <div className="absolute top-2 left-2 z-10">
          <button
            onClick={toggleSidebar}
            title={sidebarOpen ? 'Hide conversations' : 'Show conversations'}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-white/5 transition-all"
          >
            {sidebarOpen ? <PanelLeftClose size={15} /> : <PanelLeftOpen size={15} />}
          </button>
        </div>

        <VirtualizedMessages loadingConversation={loadingConversation} />
        <ChatInput />
      </div>
    </div>
  )
}
