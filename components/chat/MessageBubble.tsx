'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { StreamingCursor } from './StreamingCursor'
import { MessageActions } from './MessageActions'
import { cn, extractConfidenceTags, formatRelativeTime } from '@/lib/utils'
import type { Message, ConfidenceTag } from '@/lib/types'

// Map confidence tags to badge variants
const tagVariantMap: Record<ConfidenceTag, 'verified' | 'consensus' | 'debated' | 'speculative'> = {
  VERIFIED: 'verified',
  CONSENSUS: 'consensus',
  DEBATED: 'debated',
  SPECULATIVE: 'speculative',
}

// Collapsible tier section
function TierSection({
  title,
  content,
  defaultOpen = false,
}: {
  title: string
  content: string
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="border border-[var(--border-subtle)] rounded-xl overflow-hidden mt-2">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-medium text-[var(--text-secondary)] hover:bg-white/5 transition-colors"
      >
        <span>{title}</span>
        {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="overflow-hidden"
          >
            <div className="px-4 py-3 text-sm text-[var(--text-secondary)] border-t border-[var(--border-subtle)]">
              {content}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

interface MessageBubbleProps {
  message: Message
  onRegenerate?: () => void
  onBranch?: () => void
  onBookmark?: () => void
}

export function MessageBubble({ message, onRegenerate, onBranch, onBookmark }: MessageBubbleProps) {
  const [hovered, setHovered] = useState(false)
  const isUser = message.role === 'user'
  const confidenceTags = extractConfidenceTags(message.content)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={cn(
        'flex gap-3 px-4 py-3 group',
        isUser ? 'justify-end' : 'justify-start'
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Avatar - AI */}
      {!isUser && (
        <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-glow">
          <span className="text-white text-xs font-bold">P</span>
        </div>
      )}

      {/* Content */}
      <div className={cn('flex flex-col gap-1', isUser ? 'items-end max-w-[70%]' : 'flex-1 min-w-0')}>
        {/* Bubble */}
        <div
          className={cn(
            'rounded-2xl px-4 py-3 relative',
            isUser
              ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-br-sm'
              : 'glass-elevated text-[var(--text-primary)] rounded-bl-sm'
          )}
        >
          {isUser ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose-pyxis">
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={{
                  code({ children, className }) {
                    return (
                      <code className={cn('font-mono text-xs', className)}>
                        {children}
                      </code>
                    )
                  },
                  pre({ children }) {
                    return (
                      <pre className="my-3 overflow-x-auto rounded-xl bg-black/40 border border-[var(--border-subtle)] p-4 text-xs font-mono leading-relaxed">
                        {children}
                      </pre>
                    )
                  },
                }}
              >
                {message.content
                  .replace(/\[VERIFIED\]/g, '')
                  .replace(/\[CONSENSUS\]/g, '')
                  .replace(/\[DEBATED\]/g, '')
                  .replace(/\[SPECULATIVE\]/g, '')}
              </ReactMarkdown>
              {message.isStreaming && <StreamingCursor />}
            </div>
          )}
        </div>

        {/* Confidence tags */}
        {!isUser && confidenceTags.length > 0 && (
          <div className="flex flex-wrap gap-1 px-1">
            {confidenceTags.map((tag) => (
              <Badge key={tag} variant={tagVariantMap[tag]}>
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Tier sections for structured responses */}
        {!isUser && !message.isStreaming && message.content.includes('SURFACE:') && (
          <div className="w-full mt-1 space-y-1">
            {['SURFACE', 'STRUCTURAL', 'EXPERT'].map((tier, i) => {
              const regex = new RegExp(`${tier}:\\s*([\\s\\S]*?)(?=STRUCTURAL:|EXPERT:|EXAMPLES:|VISUAL:|EDGE CASES:|CROSS DOMAIN:|FRONTIER:|TEST YOURSELF:|NEXT MOVE:|$)`)
              const match = message.content.match(regex)
              if (!match?.[1]?.trim()) return null
              return (
                <TierSection
                  key={tier}
                  title={`${['🌊', '🏗️', '🔬'][i]} ${tier}`}
                  content={match[1].trim()}
                  defaultOpen={i === 0}
                />
              )
            })}
          </div>
        )}

        {/* Actions */}
        {!isUser && (
          <MessageActions
            message={message}
            onRegenerate={onRegenerate}
            onBranch={onBranch}
            onBookmark={onBookmark}
            visible={hovered && !message.isStreaming}
          />
        )}

        {/* Timestamp */}
        <span
          className={cn(
            'text-xs text-[var(--text-muted)] px-1 transition-opacity',
            hovered ? 'opacity-100' : 'opacity-0'
          )}
        >
          {formatRelativeTime(message.timestamp)}
        </span>
      </div>

      {/* Avatar - User */}
      {isUser && (
        <div className="w-7 h-7 rounded-xl bg-[var(--bg-overlay)] border border-[var(--border-default)] flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-xs font-bold text-[var(--text-secondary)]">U</span>
        </div>
      )}
    </motion.div>
  )
}
