'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { alienMode } from '@/lib/api'
import { useSessionStore } from '@/store/sessionStore'
import { StreamingCursor } from '@/components/chat/StreamingCursor'
import ReactMarkdown from 'react-markdown'

export function AlienMode() {
  const { sessionId } = useSessionStore()
  const [concept, setConcept] = useState('')
  const [content, setContent] = useState('')
  const [streaming, setStreaming] = useState(false)

  const handleAlienize = async () => {
    if (!concept.trim() || streaming) return
    setStreaming(true)
    setContent('')
    try {
      const controller = alienMode(sessionId, concept, (chunk) => setContent((p) => p + chunk))
      await new Promise<void>((resolve) => setTimeout(resolve, 25000))
      controller?.abort?.()
    } catch {
      setContent('The alien mind is unreachable.')
    } finally {
      setStreaming(false)
    }
  }

  return (
    <div className="h-full flex flex-col gap-4 p-4 overflow-y-auto">
      <div>
        <h2 className="text-display-sm text-[var(--text-primary)]">Alien Mode</h2>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">Re-explain any concept as if you were a fundamentally non-human intelligence</p>
      </div>

      <div className="glass-elevated rounded-2xl p-3">
        <Textarea
          value={concept}
          onChange={(e) => setConcept(e.target.value)}
          placeholder="What concept should the alien mind interpret?"
          autoGrow
          minRows={2}
          maxRows={4}
        />
        <div className="flex justify-end mt-2">
          <Button variant="primary" size="sm" icon={<Sparkles size={13} />} onClick={handleAlienize} disabled={!concept.trim() || streaming}>
            {streaming ? 'Channeling...' : 'Activate Alien Mind'}
          </Button>
        </div>
      </div>

      {(content || streaming) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-elevated rounded-2xl p-4 border border-cyan-500/20"
        >
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={13} className="text-cyan-400" />
            <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Alien Interpretation</span>
          </div>
          <div className="text-sm text-[var(--text-secondary)] prose-pyxis font-mono">
            <ReactMarkdown>{content}</ReactMarkdown>
            {streaming && <StreamingCursor />}
          </div>
        </motion.div>
      )}
    </div>
  )
}
