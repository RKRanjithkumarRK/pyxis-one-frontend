'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Archive, Sparkles, Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useSessionStore } from '@/store/sessionStore'
import ReactMarkdown from 'react-markdown'
import { StreamingCursor } from '@/components/chat/StreamingCursor'

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

interface MemoryNode {
  id: string
  text: string
  timestamp: number
  color: string
}

const NODE_COLORS = ['#06b6d4', '#a855f7', '#34d399', '#fbbf24', '#f87171', '#818cf8']

export function EternalArchive() {
  const { sessionId } = useSessionStore()
  const [nodes, setNodes] = useState<MemoryNode[]>([])
  const [input, setInput] = useState('')
  const [query, setQuery] = useState('')
  const [response, setResponse] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [tab, setTab] = useState<'store' | 'recall'>('store')

  const handleStore = () => {
    if (!input.trim()) return
    const node: MemoryNode = {
      id: Date.now().toString(),
      text: input.trim(),
      timestamp: Date.now(),
      color: NODE_COLORS[nodes.length % NODE_COLORS.length],
    }
    setNodes(p => [node, ...p])
    setInput('')
  }

  const handleRecall = async () => {
    if (!query.trim() || streaming) return
    setStreaming(true)
    setResponse('')
    const context = nodes.length > 0
      ? `My archived memories:\n${nodes.map(n => `- ${n.text}`).join('\n')}\n\nQuery: ${query}`
      : query

    try {
      const res = await fetch(`${BASE}/api/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, message: context, feature_mode: 'eternal' }),
      })
      if (!res.ok || !res.body) throw new Error('Recall failed')
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        for (const line of decoder.decode(value, { stream: true }).split('\n')) {
          if (!line.startsWith('data: ')) continue
          try {
            const d = JSON.parse(line.slice(6))
            if (d.type === 'text' && d.content) setResponse(p => p + d.content)
            if (d.type === 'done' || d.type === 'error') { setStreaming(false); return }
          } catch {}
        }
      }
    } catch {
      setResponse('Recall failed.')
    } finally {
      setStreaming(false)
    }
  }

  return (
    <div className="h-full flex flex-col gap-4 p-4 overflow-y-auto">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #06b6d4, #0284c7)' }}>
          <Archive size={20} className="text-white" />
        </div>
        <div>
          <h2 className="text-display-sm text-[var(--text-primary)]">Eternal Archive</h2>
          <p className="text-xs text-[var(--text-muted)]">Cross-session memory empire — crystallize knowledge permanently</p>
        </div>
      </div>

      <div className="flex gap-2">
        {(['store', 'recall'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold tracking-wider uppercase transition-all ${tab === t ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}
          >
            {t === 'store' ? 'Crystallize' : 'Recall'}
          </button>
        ))}
      </div>

      {tab === 'store' && (
        <>
          <div className="glass-elevated rounded-2xl p-3">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Crystallize a key insight, concept, or breakthrough..."
              className="w-full bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] resize-none outline-none min-h-[60px]"
              rows={3}
            />
            <div className="flex justify-end mt-2">
              <Button variant="primary" size="sm" icon={<Plus size={13} />} onClick={handleStore} disabled={!input.trim()}>
                Crystallize
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <AnimatePresence>
              {nodes.map((node) => (
                <motion.div
                  key={node.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="glass-elevated rounded-xl px-4 py-3 flex items-start gap-3"
                  style={{ borderLeft: `3px solid ${node.color}` }}
                >
                  <Sparkles size={14} style={{ color: node.color }} className="mt-0.5 flex-shrink-0" />
                  <span className="text-xs text-[var(--text-secondary)] leading-relaxed">{node.text}</span>
                </motion.div>
              ))}
            </AnimatePresence>
            {nodes.length === 0 && (
              <div className="text-center py-8 text-[var(--text-muted)] text-xs">
                Your archive is empty — start crystallizing knowledge
              </div>
            )}
          </div>
        </>
      )}

      {tab === 'recall' && (
        <>
          <div className="glass-elevated rounded-2xl p-3">
            <div className="flex gap-2">
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Query your archive..."
                className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none"
                onKeyDown={e => { if (e.key === 'Enter') handleRecall() }}
              />
              <button onClick={handleRecall} disabled={!query.trim() || streaming} className="text-cyan-400 hover:text-cyan-300 disabled:opacity-40">
                <Search size={16} />
              </button>
            </div>
          </div>

          <AnimatePresence>
            {(response || streaming) && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-elevated rounded-2xl p-4 prose-pyxis"
                style={{ borderColor: '#06b6d440', border: '1px solid' }}
              >
                <ReactMarkdown>{response}</ReactMarkdown>
                {streaming && <StreamingCursor />}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  )
}
