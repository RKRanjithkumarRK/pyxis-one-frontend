'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Eye } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { getDarkKnowledge } from '@/lib/api'
import { useSessionStore } from '@/store/sessionStore'
import { StreamingCursor } from '@/components/chat/StreamingCursor'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export function DarkKnowledge() {
  const { sessionId } = useSessionStore()
  const [topic, setTopic] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)

  const handleReveal = async () => {
    if (!topic.trim() || loading) return
    setLoading(true)
    setContent('')
    try {
      const controller = getDarkKnowledge(sessionId, topic, (chunk) => setContent((p) => p + chunk))
      await new Promise<void>((resolve) => setTimeout(resolve, 20000))
      controller.abort()
    } catch {
      setContent('Revelation failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-full flex flex-col gap-4 p-4 overflow-y-auto">
      <div>
        <h2 className="text-display-sm text-[var(--text-primary)]">Dark Knowledge</h2>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">The forbidden, contrarian, and counterintuitive side of any topic</p>
      </div>

      <div className="glass-elevated rounded-2xl p-3">
        <Textarea
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="What topic should I expose the dark side of?"
          autoGrow
          minRows={2}
          maxRows={4}
        />
        <div className="flex justify-end mt-2">
          <Button variant="primary" size="sm" icon={<Eye size={13} />} onClick={handleReveal} disabled={!topic.trim() || loading}>
            {loading ? 'Revealing...' : 'Reveal Dark Side'}
          </Button>
        </div>
      </div>

      {(content || loading) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-elevated rounded-2xl p-4 border border-red-500/20 prose-pyxis"
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-red-400 text-xs font-semibold uppercase tracking-wider">⚠ Classified Knowledge</span>
          </div>
          <div className="text-sm text-[var(--text-secondary)]">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            {loading && <StreamingCursor />}
          </div>
        </motion.div>
      )}
    </div>
  )
}
