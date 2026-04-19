'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Flame, Lock, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Progress } from '@/components/ui/Progress'
import { Textarea } from '@/components/ui/Textarea'
import { FORGE_STAGES } from '@/lib/constants'
import { getForgeProgress } from '@/lib/api'
import { useSessionStore } from '@/store/sessionStore'
import ReactMarkdown from 'react-markdown'
import { StreamingCursor } from '@/components/chat/StreamingCursor'

export function CognitiveForge() {
  const { sessionId } = useSessionStore()
  const [forgeData, setForgeData] = useState<{ current_stage?: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [input, setInput] = useState('')

  useEffect(() => {
    getForgeProgress(sessionId).then((d) => setForgeData(d as { current_stage?: number })).catch(() => {})
  }, [sessionId])

  const currentStage = forgeData?.current_stage ?? 0
  const stageInfo = FORGE_STAGES[currentStage] ?? FORGE_STAGES[0]

  const handleAdvance = async () => {
    if (!input.trim() || loading) return
    setLoading(true)
    setStreaming(true)
    setResponse('')
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'}/api/forge/advance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, concept: input }),
      })
      if (res.ok && res.body) {
        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const text = decoder.decode(value, { stream: true })
          for (const line of text.split('\n')) {
            if (!line.startsWith('data: ')) continue
            try {
              const data = JSON.parse(line.slice(6)) as { content?: string }
              if (data.content) setResponse((p) => p + data.content)
            } catch {}
          }
        }
      }
    } catch {
      setResponse('Forge advance failed.')
    } finally {
      setLoading(false)
      setStreaming(false)
      setInput('')
    }
  }

  return (
    <div className="h-full flex flex-col gap-4 p-4 overflow-y-auto">
      <div>
        <h2 className="text-display-sm text-[var(--text-primary)]">Cognitive Forge</h2>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">Seven-stage mastery furnace — forge understanding under pressure</p>
      </div>

      {/* Stage progress */}
      <div className="glass-elevated rounded-2xl p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
            <Flame size={20} className="text-orange-400" />
          </div>
          <div>
            <div className="text-sm font-semibold text-[var(--text-primary)]">{stageInfo.label}</div>
            <div className="text-xs text-[var(--text-muted)]">Stage {currentStage + 1} of {FORGE_STAGES.length}</div>
          </div>
        </div>
        <Progress value={((currentStage) / FORGE_STAGES.length) * 100} color="#f97316" />
        <p className="text-xs text-[var(--text-secondary)] mt-2">{stageInfo.description}</p>
      </div>

      {/* Stage list */}
      <div className="space-y-2">
        {FORGE_STAGES.map((stage, i) => {
          const done = i < currentStage
          const active = i === currentStage
          return (
            <motion.div
              key={stage.id}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-colors ${
                active ? 'bg-orange-500/10 border border-orange-500/30' :
                done ? 'opacity-60' : 'opacity-40'
              }`}
            >
              {done ? (
                <CheckCircle size={14} className="text-green-400 flex-shrink-0" />
              ) : active ? (
                <Flame size={14} className="text-orange-400 flex-shrink-0" />
              ) : (
                <Lock size={14} className="text-[var(--text-muted)] flex-shrink-0" />
              )}
              <span className={`text-xs ${active ? 'text-orange-300 font-medium' : 'text-[var(--text-muted)]'}`}>
                {stage.label}
              </span>
            </motion.div>
          )
        })}
      </div>

      {/* Input */}
      <div className="glass-elevated rounded-2xl p-3">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`${stageInfo.prompt}...`}
          autoGrow
          minRows={2}
          maxRows={5}
        />
        <div className="flex justify-end mt-2">
          <Button variant="primary" size="sm" icon={<Flame size={13} />} onClick={handleAdvance} disabled={!input.trim() || loading}>
            {loading ? 'Forging...' : 'Submit'}
          </Button>
        </div>
      </div>

      {/* Response */}
      {(response || streaming) && (
        <div className="glass-elevated rounded-2xl p-4 prose-pyxis">
          <ReactMarkdown>{response}</ReactMarkdown>
          {streaming && <StreamingCursor />}
        </div>
      )}
    </div>
  )
}
