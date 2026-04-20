'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { ChevronDown, ChevronUp, Copy, Check, ThumbsUp, ThumbsDown, Pencil, X } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { StreamingCursor } from './StreamingCursor'
import { MessageActions } from './MessageActions'
import { cn, extractConfidenceTags, formatRelativeTime, copyToClipboard } from '@/lib/utils'
import type { Message, ConfidenceTag } from '@/lib/types'

const tagVariantMap: Record<ConfidenceTag, 'verified' | 'consensus' | 'debated' | 'speculative'> = {
  VERIFIED: 'verified',
  CONSENSUS: 'consensus',
  DEBATED: 'debated',
  SPECULATIVE: 'speculative',
}

function TierSection({ title, content, defaultOpen = false }: { title: string; content: string; defaultOpen?: boolean }) {
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

function CodeBlock({ children }: { children: React.ReactNode }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = async () => {
    const text = typeof children === 'string' ? children : ''
    await copyToClipboard(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div className="relative group/code my-3">
      <pre className="overflow-x-auto rounded-xl bg-black/40 border border-[var(--border-subtle)] p-4 text-xs font-mono leading-relaxed">
        {children}
      </pre>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/10 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/20 transition-all opacity-0 group-hover/code:opacity-100"
      >
        {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
      </button>
    </div>
  )
}

interface MessageBubbleProps {
  message: Message
  onRegenerate?: () => void
  onBranch?: () => void
  onBookmark?: () => void
  onEdit?: (id: string, newContent: string) => void
}

export function MessageBubble({ message, onRegenerate, onBranch, onBookmark, onEdit }: MessageBubbleProps) {
  const [hovered, setHovered] = useState(false)
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null)
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState(message.content)
  const isUser = message.role === 'user'
  const confidenceTags = extractConfidenceTags(message.content)

  const handleSaveEdit = useCallback(() => {
    if (editValue.trim() && onEdit) {
      onEdit(message.id, editValue.trim())
    }
    setEditing(false)
  }, [editValue, message.id, onEdit])

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={cn('flex gap-3 px-4 py-3 group', isUser ? 'justify-end' : 'justify-start')}
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
            'rounded-2xl px-4 py-3 relative w-full',
            isUser
              ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-br-sm'
              : 'glass-elevated text-[var(--text-primary)] rounded-bl-sm'
          )}
        >
          {isUser ? (
            editing ? (
              <div className="flex flex-col gap-2">
                <textarea
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="w-full bg-white/10 rounded-xl p-2 text-sm text-white placeholder:text-white/50 resize-none outline-none border border-white/20 min-h-[60px]"
                  autoFocus
                  onKeyDown={(e) => { if (e.key === 'Enter' && e.metaKey) handleSaveEdit() }}
                />
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setEditing(false)} className="text-white/60 hover:text-white p-1 rounded-lg transition-colors">
                    <X size={14} />
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-xs text-white font-medium transition-colors"
                  >
                    Save & Resend
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
            )
          ) : (
            <div className="prose-pyxis">
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={{
                  code({ children, className }) {
                    return <code className={cn('font-mono text-xs', className)}>{children}</code>
                  },
                  pre({ children }) {
                    // Extract text from children for copy
                    const extractText = (node: React.ReactNode): string => {
                      if (typeof node === 'string') return node
                      if (Array.isArray(node)) return node.map(extractText).join('')
                      if (node && typeof node === 'object' && 'props' in (node as object)) {
                        return extractText((node as React.ReactElement).props.children)
                      }
                      return ''
                    }
                    return <CodeBlock>{extractText(children)}</CodeBlock>
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
              <Badge key={tag} variant={tagVariantMap[tag]}>{tag}</Badge>
            ))}
          </div>
        )}

        {/* Tier sections */}
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

        {/* Actions row */}
        <div className={cn('flex items-center gap-1 mt-0.5', isUser ? 'justify-end' : 'justify-start')}>
          {/* Edit button for user messages */}
          {isUser && !editing && hovered && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => { setEditValue(message.content); setEditing(true) }}
              className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all"
            >
              <Pencil size={12} />
            </motion.button>
          )}

          {/* AI message actions */}
          {!isUser && (
            <>
              <MessageActions
                message={message}
                onRegenerate={onRegenerate}
                onBranch={onBranch}
                onBookmark={onBookmark}
                visible={hovered && !message.isStreaming}
              />
              {/* Thumbs up/down */}
              {hovered && !message.isStreaming && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-0.5 ml-1">
                  <button
                    onClick={() => setFeedback(f => f === 'up' ? null : 'up')}
                    className={cn(
                      'p-1.5 rounded-lg transition-all',
                      feedback === 'up'
                        ? 'text-green-400 bg-green-400/10'
                        : 'text-[var(--text-muted)] hover:text-green-400 hover:bg-green-400/10'
                    )}
                  >
                    <ThumbsUp size={12} />
                  </button>
                  <button
                    onClick={() => setFeedback(f => f === 'down' ? null : 'down')}
                    className={cn(
                      'p-1.5 rounded-lg transition-all',
                      feedback === 'down'
                        ? 'text-red-400 bg-red-400/10'
                        : 'text-[var(--text-muted)] hover:text-red-400 hover:bg-red-400/10'
                    )}
                  >
                    <ThumbsDown size={12} />
                  </button>
                </motion.div>
              )}
            </>
          )}

          {/* Timestamp */}
          <span className={cn('text-xs text-[var(--text-muted)] px-1 transition-opacity', hovered ? 'opacity-100' : 'opacity-0')}>
            {formatRelativeTime(message.timestamp)}
          </span>
        </div>
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
