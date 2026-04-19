'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Swords } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { getNemesis, nemesisChallenge } from '@/lib/api'
import { useSessionStore } from '@/store/sessionStore'
import { StreamingCursor } from '@/components/chat/StreamingCursor'
import ReactMarkdown from 'react-markdown'

export function NemesisSystem() {
  const { sessionId } = useSessionStore()
  const [nemesisData, setNemesisData] = useState<{ name?: string; current_challenge?: string } | null>(null)
  const [answer, setAnswer] = useState('')
  const [response, setResponse] = useState('')
  const [streaming, setStreaming] = useState(false)

  useEffect(() => {
    getNemesis(sessionId).then((d) => setNemesisData(d as { name?: string; current_challenge?: string })).catch(() => {})
  }, [sessionId])

  const handleChallenge = async () => {
    if (!answer.trim() || streaming) return
    setStreaming(true)
    setResponse('')
    try {
      const controller = nemesisChallenge(sessionId, answer, (chunk) => setResponse((p) => p + chunk))
      await new Promise<void>((resolve) => setTimeout(resolve, 25000))
      controller?.abort?.()
    } catch {
      setResponse('The nemesis is silent.')
    } finally {
      setStreaming(false)
      setAnswer('')
    }
  }

  return (
    <div className="h-full flex flex-col gap-4 p-4 overflow-y-auto">
      <div>
        <h2 className="text-display-sm text-[var(--text-primary)]">Nemesis System</h2>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">An adversarial AI forged from your exact weaknesses</p>
      </div>

      {nemesisData && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="glass-elevated rounded-2xl p-4 border border-red-500/20"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
              <Swords size={18} className="text-red-400" />
            </div>
            <div>
              <div className="text-sm font-semibold text-[var(--text-primary)]">
                {nemesisData.name ?? 'Your Nemesis'}
              </div>
              <div className="text-xs text-[var(--text-muted)]">Adaptive adversarial profile</div>
            </div>
          </div>
          {nemesisData.current_challenge && (
            <div className="text-xs text-[var(--text-secondary)] border-t border-[var(--border-subtle)] pt-3">
              <span className="text-red-400 font-semibold block mb-1">Current Challenge:</span>
              {nemesisData.current_challenge}
            </div>
          )}
        </motion.div>
      )}

      <div className="glass-elevated rounded-2xl p-3">
        <Textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Counter the nemesis's challenge..."
          autoGrow
          minRows={2}
          maxRows={6}
        />
        <div className="flex justify-end mt-2">
          <Button variant="danger" size="sm" icon={<Swords size={13} />} onClick={handleChallenge} disabled={!answer.trim() || streaming}>
            {streaming ? 'Fighting...' : 'Challenge'}
          </Button>
        </div>
      </div>

      {(response || streaming) && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="glass-elevated rounded-2xl p-4 prose-pyxis border border-red-500/20"
        >
          <div className="text-xs font-semibold text-red-400 mb-2">Nemesis responds:</div>
          <div className="text-sm text-[var(--text-secondary)]">
            <ReactMarkdown>{response}</ReactMarkdown>
            {streaming && <StreamingCursor />}
          </div>
        </motion.div>
      )}
    </div>
  )
}
