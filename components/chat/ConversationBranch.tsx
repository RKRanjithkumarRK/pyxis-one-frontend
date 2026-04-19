'use client'

import { motion } from 'framer-motion'
import { GitBranch } from 'lucide-react'
import { useSessionStore } from '@/store/sessionStore'

interface ConversationBranchProps {
  messageId: string
  onClose: () => void
}

export function ConversationBranch({ messageId, onClose }: ConversationBranchProps) {
  const { branchFrom } = useSessionStore()

  const handleBranch = () => {
    branchFrom(messageId)
    onClose()
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="glass rounded-xl p-4 max-w-xs"
    >
      <div className="flex items-center gap-2 mb-3">
        <GitBranch size={16} className="text-indigo-400" />
        <span className="text-sm font-medium text-[var(--text-primary)]">
          Branch conversation
        </span>
      </div>
      <p className="text-xs text-[var(--text-secondary)] mb-4">
        This will create a new branch from this point, discarding all messages after it.
      </p>
      <div className="flex gap-2">
        <button
          onClick={handleBranch}
          className="flex-1 py-1.5 text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-lg hover:bg-indigo-500/30 transition-colors"
        >
          Branch here
        </button>
        <button
          onClick={onClose}
          className="flex-1 py-1.5 text-xs text-[var(--text-muted)] border border-[var(--border-subtle)] rounded-lg hover:border-[var(--border-default)] transition-colors"
        >
          Cancel
        </button>
      </div>
    </motion.div>
  )
}
