'use client'

import {
  useRef,
  useEffect,
  useCallback,
  useState,
  type UIEvent,
} from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, Loader2 } from 'lucide-react'
import { MessageBubble } from './MessageBubble'
import { useSessionStore } from '@/store/sessionStore'
import { useChat } from '@/hooks/useChat'
import { storeInVault } from '@/lib/api'
import { cn } from '@/lib/utils'

interface VirtualizedMessagesProps {
  /** True while a past conversation is being fetched from the API */
  loadingConversation?: boolean
}

export function VirtualizedMessages({ loadingConversation = false }: VirtualizedMessagesProps) {
  const { messages, sessionId, branchFrom } = useSessionStore()
  const { sendMessage, regenerate } = useChat()

  // ── Edit / branch handlers ─────────────────────────────────────────────
  const handleEdit = useCallback(
    (id: string, newContent: string) => {
      const idx = messages.findIndex((m) => m.id === id)
      if (idx < 0) return
      // Cut back to the message before the user message being edited
      branchFrom(messages[idx - 1]?.id ?? id)
      void sendMessage(newContent)
    },
    [messages, branchFrom, sendMessage]
  )

  // ── Scroll management ─────────────────────────────────────────────────
  const bottomRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [showScrollBtn, setShowScrollBtn] = useState(false)
  const isUserScrolledUp = useRef(false)

  const scrollToBottom = useCallback((smooth = true) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'instant' })
  }, [])

  // Auto-scroll on new content unless user has scrolled up
  useEffect(() => {
    if (!isUserScrolledUp.current) {
      scrollToBottom(false)
    }
  }, [messages, scrollToBottom])

  // When a new conversation loads, always scroll to the bottom
  useEffect(() => {
    if (!loadingConversation) {
      isUserScrolledUp.current = false
      scrollToBottom(false)
    }
  }, [loadingConversation, scrollToBottom])

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    isUserScrolledUp.current = distFromBottom > 100
    setShowScrollBtn(distFromBottom > 200)
  }

  // ── Bookmark ──────────────────────────────────────────────────────────
  const handleBookmark = async (content: string) => {
    try {
      await storeInVault(sessionId, content, [], [])
    } catch {
      // Non-critical — silently ignore
    }
  }

  // ── Build regenerate handler for the last assistant message ───────────
  const buildRegenerateHandler = useCallback(
    (msgIdx: number) => {
      // Find the most recent user message before this assistant message
      const prevUser = [...messages]
        .slice(0, msgIdx)
        .reverse()
        .find((m) => m.role === 'user')
      if (!prevUser) return undefined
      return () => void regenerate(prevUser.content)
    },
    [messages, regenerate]
  )

  return (
    <div className="relative flex-1 min-h-0 overflow-hidden">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto overflow-x-hidden py-4"
      >
        {/* ── Loading overlay (conversation fetch) ── */}
        <AnimatePresence>
          {loadingConversation && (
            <motion.div
              key="conv-loader"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 flex items-center justify-center bg-[var(--bg-base)]/70 backdrop-blur-sm"
            >
              <div className="flex flex-col items-center gap-3">
                <Loader2 size={28} className="animate-spin text-indigo-400" />
                <p className="text-sm text-[var(--text-muted)]">Loading conversation…</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Empty / welcome state ── */}
        {messages.length === 0 && !loadingConversation && (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-glow-lg">
              <span className="text-white text-2xl font-bold">P</span>
            </div>
            <div>
              <h2 className="text-display-lg text-[var(--text-primary)] mb-2">
                Pyxis One
              </h2>
              <p className="text-sm text-[var(--text-secondary)] max-w-sm">
                Your intelligent learning companion. Ask anything — Pyxis adapts to your unique cognitive signature.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {[
                'Explain quantum entanglement',
                'How does consciousness arise?',
                'Teach me Fourier transforms',
              ].map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => void sendMessage(prompt)}
                  className="glass rounded-xl px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-accent)] transition-all border border-[var(--border-subtle)]"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Message list ── */}
        <AnimatePresence initial={false}>
          {messages.map((msg, idx) => {
            const isLast = idx === messages.length - 1
            return (
              <MessageBubble
                key={msg.id}
                message={msg}
                isLast={isLast}
                onRegenerate={
                  msg.role === 'assistant' && isLast
                    ? buildRegenerateHandler(idx)
                    : undefined
                }
                onBranch={() => branchFrom(msg.id)}
                onBookmark={() => void handleBookmark(msg.content)}
                onEdit={handleEdit}
              />
            )
          })}
        </AnimatePresence>

        <div ref={bottomRef} className="h-1" />
      </div>

      {/* ── Scroll-to-bottom FAB ── */}
      <AnimatePresence>
        {showScrollBtn && (
          <motion.button
            key="scroll-btn"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => {
              isUserScrolledUp.current = false
              scrollToBottom()
            }}
            className={cn(
              'absolute bottom-4 right-4 z-10',
              'glass rounded-full p-2 shadow-glow',
              'text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all'
            )}
          >
            <ChevronDown size={16} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
