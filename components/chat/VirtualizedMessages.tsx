'use client'

import {
  useRef,
  useEffect,
  useCallback,
  useState,
  type UIEvent,
} from 'react'
import { AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { MessageBubble } from './MessageBubble'
import { useSessionStore } from '@/store/sessionStore'
import { useChat } from '@/hooks/useChat'
import { storeInVault } from '@/lib/api'
import { cn } from '@/lib/utils'

export function VirtualizedMessages() {
  const { messages, sessionId, branchFrom } = useSessionStore()
  const { sendMessage } = useChat()
  const bottomRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [showScrollBtn, setShowScrollBtn] = useState(false)
  const isUserScrolledUp = useRef(false)

  const scrollToBottom = useCallback((smooth = true) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'instant' })
  }, [])

  // Auto-scroll on new messages unless user scrolled up
  useEffect(() => {
    if (!isUserScrolledUp.current) {
      scrollToBottom(false)
    }
  }, [messages, scrollToBottom])

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    isUserScrolledUp.current = distFromBottom > 100
    setShowScrollBtn(distFromBottom > 200)
  }

  const handleBookmark = async (content: string) => {
    try {
      await storeInVault(sessionId, content, [], [])
    } catch {
      // Non-critical — bookmark silently fails
    }
  }

  return (
    <div className="relative flex-1 min-h-0 overflow-hidden">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto overflow-x-hidden py-4"
      >
        {messages.length === 0 && (
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
              {['Explain quantum entanglement', 'How does consciousness arise?', 'Teach me Fourier transforms'].map(
                (prompt) => (
                  <button
                    key={prompt}
                    onClick={() => void sendMessage(prompt)}
                    className="glass rounded-xl px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-accent)] transition-all border border-[var(--border-subtle)]"
                  >
                    {prompt}
                  </button>
                )
              )}
            </div>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              onBranch={() => branchFrom(msg.id)}
              onBookmark={() => handleBookmark(msg.content)}
            />
          ))}
        </AnimatePresence>

        <div ref={bottomRef} className="h-1" />
      </div>

      {/* Scroll to bottom button */}
      <AnimatePresence>
        {showScrollBtn && (
          <button
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
          </button>
        )}
      </AnimatePresence>
    </div>
  )
}
