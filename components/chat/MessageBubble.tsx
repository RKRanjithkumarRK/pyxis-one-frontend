'use client'

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import {
  ChevronDown, ChevronUp, Copy, Check, ThumbsUp, ThumbsDown,
  Pencil, X, RefreshCw, Brain, AlertTriangle, Paperclip,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/Badge'
import { StreamingCursor } from './StreamingCursor'
import { MessageActions } from './MessageActions'
import ToolStatusCard from './ToolStatusCard'
import { cn, extractConfidenceTags, formatRelativeTime, copyToClipboard } from '@/lib/utils'
import { submitFeedback } from '@/lib/api'
import { useSessionStore } from '@/store/sessionStore'
import { useChat } from '@/hooks/useChat'
import type { Message, ConfidenceTag } from '@/lib/types'

const tagVariantMap: Record<ConfidenceTag, 'verified' | 'consensus' | 'debated' | 'speculative'> = {
  VERIFIED: 'verified', CONSENSUS: 'consensus', DEBATED: 'debated', SPECULATIVE: 'speculative',
}

const MODEL_LABELS: Record<string, { label: string; color: string }> = {
  'claude-sonnet-4-6':         { label: 'Sonnet',  color: 'text-orange-400' },
  'claude-opus-4-7':           { label: 'Opus',    color: 'text-orange-500' },
  'claude-haiku-4-5-20251001': { label: 'Haiku',   color: 'text-amber-400' },
  'gpt-4o':                    { label: 'GPT-4o',  color: 'text-emerald-400' },
  'gpt-4o-mini':               { label: 'Mini',    color: 'text-emerald-300' },
}

// ── Code block with copy + language label ─────────────────────────────────────
function CodeBlock({ children, language }: { children: React.ReactNode; language?: string }) {
  const [copied, setCopied] = useState(false)
  const text = typeof children === 'string' ? children : extractText(children)

  const handleCopy = async () => {
    await copyToClipboard(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative group/code my-3">
      {language && (
        <div className="flex items-center justify-between px-4 py-1.5 bg-black/60 border border-[var(--border-subtle)] rounded-t-xl border-b-0 text-xs text-white/40 font-mono">
          <span>{language}</span>
        </div>
      )}
      <pre className={cn(
        'overflow-x-auto bg-black/40 border border-[var(--border-subtle)] p-4 text-xs font-mono leading-relaxed',
        language ? 'rounded-b-xl rounded-tr-xl' : 'rounded-xl'
      )}>
        {children}
      </pre>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/10 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/20 transition-all opacity-0 group-hover/code:opacity-100 text-xs"
      >
        {copied ? <Check size={11} className="text-green-400" /> : <Copy size={11} />}
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  )
}

function extractText(node: React.ReactNode): string {
  if (typeof node === 'string') return node
  if (Array.isArray(node)) return node.map(extractText).join('')
  if (node && typeof node === 'object' && 'props' in (node as object)) {
    return extractText((node as React.ReactElement).props.children)
  }
  return ''
}

// ── Collapsible tier sections ─────────────────────────────────────────────────
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

// ── Thinking block ────────────────────────────────────────────────────────────
function ThinkingBlock({ content }: { content: string }) {
  const [open, setOpen] = useState(false)
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mb-2 rounded-xl border border-violet-500/20 bg-violet-500/5 overflow-hidden"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-violet-400 hover:bg-violet-500/10 transition-colors"
      >
        <Brain size={12} />
        <span className="font-medium">Reasoning</span>
        {open ? <ChevronUp size={11} className="ml-auto" /> : <ChevronDown size={11} className="ml-auto" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 text-xs text-white/40 font-mono leading-relaxed whitespace-pre-wrap border-t border-violet-500/10">
              {content}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Error recovery card ───────────────────────────────────────────────────────
function ErrorCard({ message, onRetry }: { message: Message; onRetry?: () => void }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 mt-1">
      <AlertTriangle size={14} className="text-red-400 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-red-400">Response interrupted</p>
        <p className="text-xs text-white/40 mt-0.5">
          {message.content || 'The model stopped responding unexpectedly.'}
        </p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-white/60 hover:text-white transition-colors"
        >
          <RefreshCw size={11} />
          Retry
        </button>
      )}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
interface MessageBubbleProps {
  message: Message
  isLast: boolean
  onRegenerate?: () => void
  onBranch?: () => void
  onBookmark?: () => void
  onEdit?: (id: string, newContent: string) => void
}

export function MessageBubble({
  message, isLast, onRegenerate, onBranch, onBookmark, onEdit,
}: MessageBubbleProps) {
  const [hovered, setHovered] = useState(false)
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null)
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState(message.content)
  const { sessionId } = useSessionStore()
  const isUser = message.role === 'user'
  const confidenceTags = extractConfidenceTags(message.content)
  const modelMeta = message.model ? MODEL_LABELS[message.model] : null

  const handleFeedback = useCallback(async (rating: 'up' | 'down') => {
    const next = feedback === rating ? null : rating
    setFeedback(next)
    if (next) {
      try {
        await submitFeedback(message.id, sessionId, next)
        toast.success(next === 'up' ? 'Thanks for the feedback!' : 'Noted — we\'ll improve.', { duration: 2000 })
      } catch { /* non-critical */ }
    }
  }, [feedback, message.id, sessionId])

  const handleSaveEdit = useCallback(() => {
    if (editValue.trim() && onEdit) onEdit(message.id, editValue.trim())
    setEditing(false)
  }, [editValue, message.id, onEdit])

  // Clean content: strip confidence tags for display
  const displayContent = message.content
    .replace(/\[VERIFIED\]/g, '').replace(/\[CONSENSUS\]/g, '')
    .replace(/\[DEBATED\]/g, '').replace(/\[SPECULATIVE\]/g, '')

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={cn('flex gap-3 px-4 py-3 group', isUser ? 'justify-end' : 'justify-start')}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* AI avatar */}
      {!isUser && (
        <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-glow">
          <span className="text-white text-xs font-bold">P</span>
        </div>
      )}

      {/* Content column */}
      <div className={cn('flex flex-col gap-1', isUser ? 'items-end max-w-[72%]' : 'flex-1 min-w-0')}>

        {/* File attachments (user messages) */}
        {isUser && message.attachments && message.attachments.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-1">
            {message.attachments.map((f) => (
              <div
                key={f.file_id}
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/10 text-xs text-white/70"
              >
                <Paperclip size={11} />
                <span className="max-w-[120px] truncate">{f.filename}</span>
              </div>
            ))}
          </div>
        )}

        {/* Tool status cards (before content, for AI messages) */}
        {!isUser && message.toolCalls && message.toolCalls.length > 0 && (
          <div className="flex flex-col gap-1 mb-1">
            {message.toolCalls.map((tool) => (
              <ToolStatusCard key={tool.id} tool={tool} />
            ))}
          </div>
        )}

        {/* Thinking block */}
        {!isUser && message.thinkingContent && (
          <ThinkingBlock content={message.thinkingContent} />
        )}

        {/* Bubble */}
        <div className={cn(
          'rounded-2xl px-4 py-3 relative w-full',
          isUser
            ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-br-sm'
            : 'glass-elevated text-[var(--text-primary)] rounded-bl-sm',
          message.isError && !isUser && 'border border-red-500/20'
        )}>
          {isUser ? (
            /* User message — plain text or edit mode */
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
                    Save &amp; Resend
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
            )
          ) : (
            /* AI message — markdown rendered */
            <div className="prose-pyxis">
              {message.isError && !message.content ? (
                <p className="text-sm text-white/50 italic">Response was interrupted.</p>
              ) : (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                  components={{
                    code({ children, className }) {
                      const lang = className?.replace('language-', '')
                      // Inline code
                      if (!className) {
                        return <code className="font-mono text-xs bg-white/10 px-1 py-0.5 rounded">{children}</code>
                      }
                      return <code className={cn('font-mono text-xs', className)}>{children}</code>
                    },
                    pre({ children }) {
                      // Extract language from child code element
                      let lang: string | undefined
                      if (children && typeof children === 'object' && 'props' in (children as object)) {
                        const cls = (children as React.ReactElement).props?.className as string | undefined
                        lang = cls?.replace('language-', '')
                      }
                      return <CodeBlock language={lang}>{extractText(children)}</CodeBlock>
                    },
                  }}
                >
                  {displayContent}
                </ReactMarkdown>
              )}
              {message.isStreaming && !message.isError && <StreamingCursor />}
            </div>
          )}
        </div>

        {/* Error recovery card */}
        {message.isError && (
          <ErrorCard message={message} onRetry={onRegenerate} />
        )}

        {/* Confidence tags */}
        {!isUser && confidenceTags.length > 0 && (
          <div className="flex flex-wrap gap-1 px-1">
            {confidenceTags.map((tag) => (
              <Badge key={tag} variant={tagVariantMap[tag]}>{tag}</Badge>
            ))}
          </div>
        )}

        {/* Collapsible tier sections */}
        {!isUser && !message.isStreaming && displayContent.includes('SURFACE:') && (
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
          {/* Model label */}
          {!isUser && modelMeta && !message.isStreaming && (
            <span className={cn('text-xs px-1 mr-1', modelMeta.color, 'opacity-50')}>
              {modelMeta.label}
            </span>
          )}

          {/* Edit (user messages) */}
          {isUser && !editing && hovered && (
            <motion.button
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
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
                onRegenerate={isLast ? onRegenerate : undefined}
                onBranch={onBranch}
                onBookmark={onBookmark}
                visible={hovered && !message.isStreaming}
              />
              {hovered && !message.isStreaming && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-0.5 ml-1">
                  <button
                    onClick={() => void handleFeedback('up')}
                    className={cn('p-1.5 rounded-lg transition-all',
                      feedback === 'up' ? 'text-green-400 bg-green-400/10' : 'text-[var(--text-muted)] hover:text-green-400 hover:bg-green-400/10'
                    )}
                  >
                    <ThumbsUp size={12} />
                  </button>
                  <button
                    onClick={() => void handleFeedback('down')}
                    className={cn('p-1.5 rounded-lg transition-all',
                      feedback === 'down' ? 'text-red-400 bg-red-400/10' : 'text-[var(--text-muted)] hover:text-red-400 hover:bg-red-400/10'
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

      {/* User avatar */}
      {isUser && (
        <div className="w-7 h-7 rounded-xl bg-[var(--bg-overlay)] border border-[var(--border-default)] flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-xs font-bold text-[var(--text-secondary)]">U</span>
        </div>
      )}
    </motion.div>
  )
}
