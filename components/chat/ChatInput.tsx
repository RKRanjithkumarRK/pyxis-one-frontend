'use client'

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  type KeyboardEvent,
  type DragEvent,
} from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Send, Square, Slash, Paperclip, Globe, GlobeLock, Upload } from 'lucide-react'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { useChat } from '@/hooks/useChat'
import { useSessionStore } from '@/store/sessionStore'
import { uploadFile } from '@/lib/api'
import { NAV_ITEMS } from '@/lib/constants'
import { estimateTokens, cn } from '@/lib/utils'
import type { FeatureMode } from '@/lib/types'
import ModelSelector from './ModelSelector'
import FileUploadPreview from './FileUploadPreview'
import { toast } from 'sonner'

interface SlashMenuItem {
  id: FeatureMode
  label: string
  description: string
  color: string
}

const ACCEPTED_TYPES = [
  'application/pdf',
  'text/plain', 'text/markdown', 'text/csv',
  'application/json',
  'text/x-python', 'text/javascript', 'text/typescript',
  'image/png', 'image/jpeg', 'image/webp', 'image/gif',
]

export function ChatInput() {
  const [value, setValue] = useState('')
  const [showSlashMenu, setShowSlashMenu] = useState(false)
  const [slashQuery, setSlashQuery] = useState('')
  const [slashIdx, setSlashIdx] = useState(0)
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { sendMessage, stopStreaming, isStreaming } = useChat()
  const {
    setFeature,
    enableWebSearch,
    setWebSearch,
    sessionId,
    conversationId,
    pendingFiles,
    addPendingFile,
    removePendingFile,
  } = useSessionStore()

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
        if (e.key === 'ArrowDown') { e.preventDefault(); setSlashIdx((i) => (i + 1) % filteredSlash.length); return }
        if (e.key === 'ArrowUp')   { e.preventDefault(); setSlashIdx((i) => (i - 1 + filteredSlash.length) % filteredSlash.length); return }
        if (e.key === 'Enter')     { e.preventDefault(); if (filteredSlash[slashIdx]) selectSlash(filteredSlash[slashIdx]); return }
        if (e.key === 'Escape')    { setShowSlashMenu(false); return }
      }
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void submit() }
    },
    [showSlashMenu, filteredSlash, slashIdx, selectSlash, submit]
  )

  // ── File upload ────────────────────────────────────────────────────────

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const arr = Array.from(files)
    if (arr.length === 0) return

    // Validate types / size
    const valid = arr.filter((f) => {
      if (f.size > 20 * 1024 * 1024) { toast.error(`${f.name} is too large (max 20MB)`); return false }
      return true
    })
    if (valid.length === 0) return

    setIsUploading(true)
    try {
      await Promise.all(
        valid.map(async (file) => {
          const result = await uploadFile(file, sessionId, conversationId ?? undefined)
          addPendingFile(result)
        })
      )
    } catch (e) {
      toast.error('File upload failed. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }, [sessionId, conversationId, addPendingFile])

  const handleDragOver = (e: DragEvent) => { e.preventDefault(); setIsDragOver(true) }
  const handleDragLeave = () => setIsDragOver(false)
  const handleDrop = async (e: DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    await handleFiles(e.dataTransfer.files)
  }

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) await handleFiles(e.target.files)
    e.target.value = ''
  }

  return (
    <div
      className="flex-shrink-0 px-4 pb-3 pt-2 border-t border-[var(--border-subtle)] relative"
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
        onChange={handleFileInput}
        className="hidden"
      />

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
                    <div className="text-xs text-[var(--text-muted)] truncate">{item.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drag-over overlay */}
      <AnimatePresence>
        {isDragOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-indigo-400/60 bg-indigo-500/10 backdrop-blur-sm"
          >
            <Upload size={20} className="text-indigo-400" />
            <p className="text-sm text-indigo-300 font-medium">Drop files to attach</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* File previews */}
      <FileUploadPreview files={pendingFiles} onRemove={removePendingFile} />

      {/* Input area */}
      <div className={cn(
        'glass-elevated rounded-2xl border transition-all',
        isDragOver
          ? 'border-indigo-400/60'
          : 'border-[var(--border-default)] focus-within:border-[var(--border-accent)]'
      )}>
        <div className="px-4 pt-3 pb-2">
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={
              pendingFiles.length > 0
                ? 'Ask about the attached files…'
                : 'Ask anything… or type / to change mode'
            }
            autoGrow
            minRows={1}
            maxRows={8}
            disabled={isStreaming}
            className="placeholder:text-[var(--text-muted)]"
          />
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between px-3 pb-2 gap-2">
          {/* Left tools */}
          <div className="flex items-center gap-1">
            {/* Slash commands */}
            <IconBtn
              title="Slash commands"
              onClick={() => { setValue('/'); setShowSlashMenu(true); setSlashQuery(''); textareaRef.current?.focus() }}
            >
              <Slash size={14} />
            </IconBtn>

            {/* File upload */}
            <IconBtn
              title="Attach file (PDF, image, code…)"
              onClick={() => fileInputRef.current?.click()}
              loading={isUploading}
              active={pendingFiles.length > 0}
            >
              <Paperclip size={14} />
              {pendingFiles.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-indigo-500 text-white text-[9px] font-bold flex items-center justify-center">
                  {pendingFiles.length}
                </span>
              )}
            </IconBtn>

            {/* Web search toggle */}
            <IconBtn
              title={enableWebSearch ? 'Web search ON — click to disable' : 'Enable web search'}
              onClick={() => setWebSearch(!enableWebSearch)}
              active={enableWebSearch}
            >
              {enableWebSearch ? (
                <Globe size={14} className="text-emerald-400" />
              ) : (
                <GlobeLock size={14} />
              )}
            </IconBtn>

            {/* Model selector */}
            <div className="ml-1">
              <ModelSelector />
            </div>
          </div>

          {/* Right: token count + send/stop */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-[var(--text-muted)]">
              ~{tokenEstimate} tokens
            </span>

            {isStreaming ? (
              <Button variant="outline" size="sm" onClick={stopStreaming} icon={<Square size={13} />}>
                Stop
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={() => void submit()}
                disabled={!value.trim() && pendingFiles.length === 0}
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
          Enter to send · Shift+Enter for newline · / for modes · Drag &amp; drop files
        </span>
      </div>
    </div>
  )
}

function IconBtn({
  children, title, onClick, loading = false, active = false
}: {
  children: React.ReactNode
  title: string
  onClick: () => void
  loading?: boolean
  active?: boolean
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={loading}
      className={cn(
        'relative p-1.5 rounded-lg transition-all',
        active
          ? 'text-indigo-400 bg-indigo-500/10'
          : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-white/5',
        loading && 'animate-pulse'
      )}
    >
      {children}
    </button>
  )
}
