'use client'

import { useState, useCallback, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import {
  Copy, Check, ThumbsUp, ThumbsDown, RefreshCw,
  AlertTriangle, Paperclip, ChevronDown, ChevronUp, Brain,
} from 'lucide-react'
import { toast } from 'sonner'
import { StreamingCursor } from './StreamingCursor'
import ToolStatusCard from './ToolStatusCard'
import { cn, copyToClipboard, formatRelativeTime } from '@/lib/utils'
import { submitFeedback } from '@/lib/api'
import { useSessionStore } from '@/store/sessionStore'
import type { Message } from '@/lib/types'

// ── Code block with copy button ───────────────────────────────────────────────

function CodeBlock({ children, language }: { children: React.ReactNode; language?: string }) {
  const [copied, setCopied] = useState(false)
  const text = extractText(children)

  const handleCopy = async () => {
    await copyToClipboard(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative group/code my-4 rounded-xl overflow-hidden" style={{ background: '#0d0d0d' }}>
      {/* Header bar */}
      <div
        className="flex items-center justify-between px-4 py-2.5 text-xs"
        style={{ background: '#1a1a1a', color: 'var(--text-muted)' }}
      >
        <span>{language ?? 'code'}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 transition-colors hover:text-white"
        >
          {copied ? <Check size={12} style={{ color: 'var(--accent)' }} /> : <Copy size={12} />}
          <span>{copied ? 'Copied!' : 'Copy code'}</span>
        </button>
      </div>
      <pre className="overflow-x-auto" style={{ background: 'transparent', margin: 0, borderRadius: 0, padding: 0 }}>
        <code
          className="block px-4 py-4 text-sm leading-7 font-mono"
          style={{ color: '#d4d4d4' }}
        >
          {children}
        </code>
      </pre>
    </div>
  )
}

function extractText(node: React.ReactNode): string {
  if (typeof node === 'string') return node
  if (Array.isArray(node)) return node.map(extractText).join('')
  if (node && typeof node === 'object' && 'props' in (node as object))
    return extractText((node as React.ReactElement).props.children)
  return ''
}

// ── Thinking block ────────────────────────────────────────────────────────────

function ThinkingBlock({ content }: { content: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div
      className="mb-3 rounded-xl overflow-hidden"
      style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}
    >
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-3 py-2.5 text-sm transition-colors"
        style={{ color: 'var(--text-muted)' }}
      >
        <Brain size={13} />
        <span>Thinking</span>
        {open ? <ChevronUp size={12} className="ml-auto" /> : <ChevronDown size={12} className="ml-auto" />}
      </button>
      {open && (
        <div
          className="px-4 pb-3 text-xs leading-relaxed font-mono whitespace-pre-wrap border-t"
          style={{ color: 'var(--text-muted)', borderColor: 'rgba(255,255,255,0.06)' }}
        >
          {content}
        </div>
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
  message, isLast, onRegenerate,
}: MessageBubbleProps) {
  const [hovered, setHovered]   = useState(false)
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null)
  const [copied, setCopied]     = useState(false)
  const { sessionId } = useSessionStore()
  const isUser = message.role === 'user'

  const handleCopyAll = async () => {
    await copyToClipboard(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleFeedback = useCallback(async (rating: 'up' | 'down') => {
    const next = feedback === rating ? null : rating
    setFeedback(next)
    if (next) {
      try {
        await submitFeedback(message.id, sessionId, next)
        toast.success(next === 'up' ? 'Thanks!' : 'Got it — we\'ll improve.', { duration: 1500 })
      } catch { /* non-critical */ }
    }
  }, [feedback, message.id, sessionId])

  // Strip confidence tags from display
  const displayContent = message.content
    .replace(/\[VERIFIED\]/g, '').replace(/\[CONSENSUS\]/g, '')
    .replace(/\[DEBATED\]/g, '').replace(/\[SPECULATIVE\]/g, '')

  return (
    <div
      className="py-2 px-4 w-full"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Center-column wrapper — ChatGPT's max-w-3xl centered layout */}
      <div className="mx-auto w-full" style={{ maxWidth: 'var(--max-content-w)' }}>
        {isUser ? (
          /* ── User message: right-aligned pill ── */
          <div className="flex justify-end">
            <div
              className="rounded-3xl px-4 py-2.5 max-w-[85%] text-sm leading-relaxed"
              style={{ background: 'var(--bg-user-msg)', color: 'var(--text-primary)' }}
            >
              {/* Attachments */}
              {message.attachments && message.attachments.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {message.attachments.map(f => (
                    <div
                      key={f.file_id}
                      className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs"
                      style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--text-secondary)' }}
                    >
                      <Paperclip size={10} />
                      <span className="max-w-[120px] truncate">{f.filename}</span>
                    </div>
                  ))}
                </div>
              )}
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ) : (
          /* ── Assistant message: full-width, no background ── */
          <div className="flex gap-4">
            {/* AI avatar */}
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-sm font-bold"
              style={{ background: 'var(--accent)', color: '#fff' }}
            >
              P
            </div>

            <div className="flex-1 min-w-0">
              {/* Tool calls */}
              {message.toolCalls && message.toolCalls.length > 0 && (
                <div className="flex flex-col gap-1.5 mb-3">
                  {message.toolCalls.map(tool => (
                    <ToolStatusCard key={tool.id} tool={tool} />
                  ))}
                </div>
              )}

              {/* Thinking */}
              {message.thinkingContent && (
                <ThinkingBlock content={message.thinkingContent} />
              )}

              {/* Error */}
              {message.isError && (
                <div
                  className="flex items-start gap-2 rounded-xl px-4 py-3 mb-2 text-sm"
                  style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
                >
                  <AlertTriangle size={14} className="shrink-0 mt-0.5" style={{ color: '#f87171' }} />
                  <div>
                    <p className="font-medium" style={{ color: '#f87171' }}>Something went wrong</p>
                    {message.content && (
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{message.content}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Markdown content */}
              {!message.isError && (
                <div className="prose-chatgpt">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                    components={{
                      code({ children, className }) {
                        const lang = className?.replace('language-', '')
                        if (!className) {
                          return (
                            <code
                              className="font-mono text-sm px-1.5 py-0.5 rounded-md"
                              style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--text-primary)' }}
                            >
                              {children}
                            </code>
                          )
                        }
                        return <code className={cn('font-mono text-sm', className)}>{children}</code>
                      },
                      pre({ children }) {
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
                  {message.isStreaming && !message.isError && <StreamingCursor />}
                </div>
              )}

              {/* Action row — appears on hover, after streaming stops */}
              {!message.isStreaming && (
                <div
                  className={cn(
                    'flex items-center gap-1 mt-2 transition-opacity',
                    hovered ? 'opacity-100' : 'opacity-0'
                  )}
                >
                  {/* Copy all */}
                  <ActionBtn onClick={handleCopyAll} title="Copy">
                    {copied ? <Check size={14} style={{ color: 'var(--accent)' }} /> : <Copy size={14} />}
                  </ActionBtn>

                  {/* Thumbs */}
                  <ActionBtn
                    onClick={() => void handleFeedback('up')}
                    title="Good response"
                    active={feedback === 'up'}
                  >
                    <ThumbsUp size={14} />
                  </ActionBtn>
                  <ActionBtn
                    onClick={() => void handleFeedback('down')}
                    title="Bad response"
                    active={feedback === 'down'}
                  >
                    <ThumbsDown size={14} />
                  </ActionBtn>

                  {/* Regenerate — only on last message */}
                  {isLast && onRegenerate && (
                    <ActionBtn onClick={onRegenerate} title="Regenerate">
                      <RefreshCw size={14} />
                    </ActionBtn>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ActionBtn({
  children, onClick, title, active = false,
}: {
  children: React.ReactNode
  onClick: () => void
  title: string
  active?: boolean
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="p-1.5 rounded-lg transition-colors"
      style={{
        color: active ? 'var(--text-primary)' : 'var(--text-muted)',
        background: active ? 'var(--bg-hover)' : 'transparent',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
      onMouseLeave={e => (e.currentTarget.style.background = active ? 'var(--bg-hover)' : 'transparent')}
    >
      {children}
    </button>
  )
}
