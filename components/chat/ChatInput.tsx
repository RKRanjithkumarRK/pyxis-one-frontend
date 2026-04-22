'use client'

import {
  useState, useRef, useCallback, useEffect,
  type KeyboardEvent, type DragEvent,
} from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Paperclip, Globe, ArrowUp, Square, Upload, X, Mic } from 'lucide-react'
import { useChat } from '@/hooks/useChat'
import { useSessionStore } from '@/store/sessionStore'
import { uploadFile } from '@/lib/api'
import { cn } from '@/lib/utils'
import FileUploadPreview from './FileUploadPreview'
import { toast } from 'sonner'

const ACCEPTED_TYPES = [
  'application/pdf', 'text/plain', 'text/markdown', 'text/csv',
  'application/json', 'text/x-python', 'text/javascript', 'text/typescript',
  'image/png', 'image/jpeg', 'image/webp', 'image/gif',
]

export function ChatInput() {
  const [value, setValue]         = useState('')
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { sendMessage, stopStreaming, isStreaming } = useChat()
  const {
    enableWebSearch, setWebSearch,
    sessionId, conversationId,
    pendingFiles, addPendingFile, removePendingFile,
  } = useSessionStore()

  // Auto-grow textarea
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`
  }, [value])

  const submit = useCallback(async () => {
    const trimmed = value.trim()
    if ((!trimmed && pendingFiles.length === 0) || isStreaming) return
    setValue('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    await sendMessage(trimmed)
  }, [value, isStreaming, sendMessage, pendingFiles])

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void submit() }
  }, [submit])

  // File upload
  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const arr = Array.from(files).filter(f => {
      if (f.size > 20 * 1024 * 1024) { toast.error(`${f.name} exceeds 20 MB`); return false }
      return true
    })
    if (!arr.length) return
    setIsUploading(true)
    try {
      await Promise.all(arr.map(async file => {
        const result = await uploadFile(file, sessionId, conversationId ?? undefined)
        addPendingFile(result)
      }))
    } catch { toast.error('Upload failed. Please try again.') }
    finally { setIsUploading(false) }
  }, [sessionId, conversationId, addPendingFile])

  const handleDragOver  = (e: DragEvent) => { e.preventDefault(); setIsDragOver(true) }
  const handleDragLeave = () => setIsDragOver(false)
  const handleDrop      = async (e: DragEvent) => {
    e.preventDefault(); setIsDragOver(false)
    await handleFiles(e.dataTransfer.files)
  }

  const canSend = (value.trim().length > 0 || pendingFiles.length > 0) && !isStreaming

  return (
    <div
      className="flex-shrink-0 pb-6 pt-2 px-4"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={ACCEPTED_TYPES.join(',')}
        onChange={e => { if (e.target.files) void handleFiles(e.target.files); e.target.value = '' }}
        className="hidden"
      />

      {/* Center column — same width as messages */}
      <div className="mx-auto w-full" style={{ maxWidth: 'var(--max-content-w)' }}>
        {/* File previews */}
        {pendingFiles.length > 0 && (
          <div className="mb-2">
            <FileUploadPreview files={pendingFiles} onRemove={removePendingFile} />
          </div>
        )}

        {/* Main input box */}
        <div
          className={cn(
            'relative rounded-2xl transition-all',
            isDragOver ? 'ring-2 ring-[var(--accent)]' : ''
          )}
          style={{
            background:  'var(--bg-input)',
            boxShadow:   '0 0 0 1px rgba(255,255,255,0.08)',
          }}
        >
          {/* Drag overlay */}
          <AnimatePresence>
            {isDragOver && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 rounded-2xl"
                style={{ background: 'rgba(16,163,127,0.08)', border: '2px dashed var(--accent)' }}
              >
                <Upload size={20} style={{ color: 'var(--accent)' }} />
                <p className="text-sm font-medium" style={{ color: 'var(--accent)' }}>Drop to attach</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message Pyxis"
            rows={1}
            disabled={isStreaming}
            className="w-full bg-transparent resize-none outline-none text-sm leading-6 px-4 pt-3.5 pb-2"
            style={{
              color: 'var(--text-primary)',
              maxHeight: '200px',
              minHeight: '52px',
            }}
          />

          {/* Bottom toolbar */}
          <div className="flex items-center justify-between px-3 pb-3 pt-1 gap-2">
            {/* Left buttons */}
            <div className="flex items-center gap-1">
              {/* Attach */}
              <ToolBtn
                onClick={() => fileInputRef.current?.click()}
                title="Attach files"
                loading={isUploading}
              >
                <Paperclip size={16} />
              </ToolBtn>

              {/* Web search toggle */}
              <ToolBtn
                onClick={() => setWebSearch(!enableWebSearch)}
                title={enableWebSearch ? 'Turn off web search' : 'Search the web'}
                active={enableWebSearch}
              >
                <Globe size={16} />
                {enableWebSearch && (
                  <span className="text-xs font-medium ml-1" style={{ color: 'var(--accent)' }}>
                    Search
                  </span>
                )}
              </ToolBtn>
            </div>

            {/* Right: stop or send */}
            <div className="flex items-center gap-2">
              {isStreaming ? (
                <button
                  onClick={stopStreaming}
                  className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
                  style={{ background: 'var(--text-primary)', color: 'var(--bg-primary)' }}
                  title="Stop generating"
                >
                  <Square size={14} fill="currentColor" />
                </button>
              ) : (
                <button
                  onClick={() => void submit()}
                  disabled={!canSend}
                  className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
                  style={{
                    background: canSend ? 'var(--text-primary)' : 'rgba(255,255,255,0.15)',
                    color:      canSend ? 'var(--bg-primary)'    : 'rgba(255,255,255,0.3)',
                    cursor:     canSend ? 'pointer' : 'default',
                  }}
                  title="Send message"
                >
                  <ArrowUp size={16} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer hint */}
        <p className="text-center text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
          Pyxis can make mistakes. Check important info. Shift+Enter for new line.
        </p>
      </div>
    </div>
  )
}

function ToolBtn({
  children, onClick, title, active = false, loading = false,
}: {
  children: React.ReactNode
  onClick: () => void
  title: string
  active?: boolean
  loading?: boolean
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={loading}
      className={cn(
        'flex items-center px-2 py-1.5 rounded-lg text-sm transition-colors',
        loading && 'animate-pulse',
        active ? 'rounded-full' : ''
      )}
      style={{
        color:      active ? 'var(--accent)' : 'var(--text-muted)',
        background: active ? 'var(--accent-soft)' : 'transparent',
        border:     active ? '1px solid rgba(16,163,127,0.3)' : '1px solid transparent',
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.color = 'var(--text-secondary)' }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'var(--text-muted)' }}
    >
      {children}
    </button>
  )
}
