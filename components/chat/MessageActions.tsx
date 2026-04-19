'use client'

import { useState } from 'react'
import { Copy, RefreshCw, GitBranch, Bookmark, Check } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn, copyToClipboard } from '@/lib/utils'
import { Tooltip } from '@/components/ui/Tooltip'
import type { Message } from '@/lib/types'

interface MessageActionsProps {
  message: Message
  onRegenerate?: () => void
  onBranch?: () => void
  onBookmark?: () => void
  visible: boolean
}

export function MessageActions({
  message,
  onRegenerate,
  onBranch,
  onBookmark,
  visible,
}: MessageActionsProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await copyToClipboard(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 4 }}
      transition={{ duration: 0.15 }}
      className={cn(
        'flex items-center gap-1 mt-1',
        !visible && 'pointer-events-none'
      )}
    >
      <Tooltip content={copied ? 'Copied!' : 'Copy'}>
        <button
          onClick={handleCopy}
          className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-white/5 transition-all"
        >
          {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
        </button>
      </Tooltip>

      {onRegenerate && (
        <Tooltip content="Regenerate">
          <button
            onClick={onRegenerate}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-white/5 transition-all"
          >
            <RefreshCw size={13} />
          </button>
        </Tooltip>
      )}

      {onBranch && (
        <Tooltip content="Branch conversation">
          <button
            onClick={onBranch}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-white/5 transition-all"
          >
            <GitBranch size={13} />
          </button>
        </Tooltip>
      )}

      {onBookmark && (
        <Tooltip content="Save to Vault">
          <button
            onClick={onBookmark}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-white/5 transition-all"
          >
            <Bookmark size={13} />
          </button>
        </Tooltip>
      )}
    </motion.div>
  )
}
