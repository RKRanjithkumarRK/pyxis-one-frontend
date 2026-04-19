'use client'

import {
  useState,
  useRef,
  useCallback,
  type KeyboardEvent,
  type FormEvent,
} from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Send, Mic, Square, Slash } from 'lucide-react'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { useChat } from '@/hooks/useChat'
import { useSessionStore } from '@/store/sessionStore'
import { NAV_ITEMS } from '@/lib/constants'
import { estimateTokens, cn } from '@/lib/utils'
import type { FeatureMode } from '@/lib/types'

interface SlashMenuItem {
  id: FeatureMode
  label: string
  description: string
  color: string
}

export function ChatInput() {
  const [value, setValue] = useState('')
  const [showSlashMenu, setShowSlashMenu] = useState(false)
  const [slashQuery, setSlashQuery] = useState('')
  const [slashIdx, setSlashIdx] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { sendMessage, stopStreaming, isStreaming } = useChat()
  const { setFeature } = useSessionStore()

  const tokenEstimate = estimateTokens(value)

  const filteredSlash: SlashMenuItem[] = NAV_ITEMS.filter((item) =>
    slashQuery
      ? item.label.toLowerCase().includes(slashQuery.toLowerCase()) ||
        item.id.includes(slashQuery.toLowerCase())
      : true
  ).slice(0, 8) as SlashMenuItem[]

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value
    setValue(v)

    if (v.startsWith('/')) {
      setShowSlashMenu(true)
      setSlashQuery(v.slice(1))
      setSlashIdx(0)
    } else {
      setShowSlashMenu(false)
    }
  }, [])

  const selectSlash = useCallback(
    (item: SlashMenuItem) => {
      setFeature(item.id)
      setValue('')
      setShowSlashMenu(false)
      textareaRef.current?.focus()
    },
    [setFeature]
  )

  const submit = useCallback(async () => {
    const trimmed = value.trim()
    if (!trimmed || isStreaming) return
    setValue('')
    setShowSlashMenu(false)
    await sendMessage(trimmed)
  }, [value, isStreaming, sendMessage])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (showSlashMenu) {
        if (e.key === 'ArrowDown') {
          e.preventDefault()
          setSlashIdx((i) => (i + 1) % filteredSlash.length)
          return
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault()
          setSlashIdx((i) => (i - 1 + filteredSlash.length) % filteredSlash.length)
          return
        }
        if (e.key === 'Enter') {
          e.preventDefault()
          if (filteredSlash[slashIdx]) selectSlash(filteredSlash[slashIdx])
          return
        }
        if (e.key === 'Escape') {
          setShowSlashMenu(false)
          return
        }
      }

      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        void submit()
      }
    },
    [showSlashMenu, filteredSlash, slashIdx, selectSlash, submit]
  )

  return (
    <div className="flex-shrink-0 px-4 pb-3 pt-2 border-t border-[var(--border-subtle)] relative">
      {/* Slash command menu */}
      <AnimatePresence>
        {showSlashMenu && filteredSlash.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="absolute bottom-full left-4 right-4 mb-2 glass-elevated rounded-2xl overflow-hidden z-20"
          >
            <div className="p-1">
              {filteredSlash.map((item, i) => (
                <button
                  key={item.id}
                  onClick={() => selectSlash(item)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors',
                    i === slashIdx
                      ? 'bg-[var(--accent-soft)] text-[var(--text-primary)]'
                      : 'text-[var(--text-secondary)] hover:bg-white/5'
                  )}
                >
                  <span
                    className="w-5 h-5 rounded flex items-center justify-center text-xs flex-shrink-0"
                    style={{ backgroundColor: `${item.color}20`, color: item.color }}
                  >
                    {item.label[0]}
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs font-medium truncate">{item.label}</div>
                    <div className="text-xs text-[var(--text-muted)] truncate">
                      {item.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input area */}
      <div className="glass-elevated rounded-2xl border border-[var(--border-default)] focus-within:border-[var(--border-accent)] transition-all">
        <div className="px-4 pt-3 pb-2">
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything… or type / to change mode"
            autoGrow
            minRows={1}
            maxRows={8}
            disabled={isStreaming}
            className="placeholder:text-[var(--text-muted)]"
          />
        </div>

        <div className="flex items-center justify-between px-3 pb-2">
          <div className="flex items-center gap-1">
            <button
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-white/5 transition-all"
              title="Slash commands"
              onClick={() => {
                setValue('/')
                setShowSlashMenu(true)
                setSlashQuery('')
                textareaRef.current?.focus()
              }}
            >
              <Slash size={14} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--text-muted)]">
              ~{tokenEstimate} tokens
            </span>

            {isStreaming ? (
              <Button
                variant="outline"
                size="sm"
                onClick={stopStreaming}
                icon={<Square size={13} />}
              >
                Stop
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={() => void submit()}
                disabled={!value.trim()}
                icon={<Send size={13} />}
              >
                Send
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="text-center mt-1.5">
        <span className="text-xs text-[var(--text-muted)]">
          Enter to send · Shift+Enter for newline · / for features · ⌘K for command bar
        </span>
      </div>
    </div>
  )
}
