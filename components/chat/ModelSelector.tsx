'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Check } from 'lucide-react'
import { listModels } from '@/lib/api'
import { useSessionStore } from '@/store/sessionStore'
import type { AIModel } from '@/lib/types'
import { cn } from '@/lib/utils'

// ── Provider badge colors ────────────────────────────────────────────────────

const PROVIDER_BADGE: Record<string, { dot: string; label: string }> = {
  groq:      { dot: '#4ade80', label: 'Groq'      },
  gemini:    { dot: '#a78bfa', label: 'Gemini'    },
  cerebras:  { dot: '#fb923c', label: 'Cerebras'  },
  mistral:   { dot: '#f472b6', label: 'Mistral'   },
  sambanova: { dot: '#fbbf24', label: 'SambaNova' },
  openai:    { dot: '#34d399', label: 'OpenAI'    },
}

// ── Static fallback (shown before API responds) ───────────────────────────────

const FALLBACK_MODELS: AIModel[] = [
  { id: 'gemini-2.0-flash',               name: 'Gemini 2.0 Flash',   provider: 'gemini',    context_window: 1_048_576, description: "Google's flagship — 1M ctx, vision",          tier: 'free', strengths: ['speed', 'vision'],        available: true },
  { id: 'llama-3.3-70b-versatile',        name: 'Llama 3.3 70B',      provider: 'groq',      context_window: 128_000,   description: 'Ultra-fast, strong reasoning',                 tier: 'free', strengths: ['reasoning', 'coding'],    available: true },
  { id: 'llama-3.1-8b-instant',           name: 'Llama 3.1 8B',       provider: 'groq',      context_window: 128_000,   description: 'Fastest — ideal for quick answers',            tier: 'free', strengths: ['speed'],                  available: true },
  { id: 'mixtral-8x7b-32768',             name: 'Mixtral 8x7B',       provider: 'groq',      context_window: 32_768,    description: 'MoE — great for long documents',               tier: 'free', strengths: ['reasoning'],              available: true },
  { id: 'gemma2-9b-it',                   name: 'Gemma 2 9B',         provider: 'groq',      context_window: 8_192,     description: 'Google open model via Groq',                   tier: 'free', strengths: ['speed'],                  available: true },
  { id: 'gemini-1.5-flash',               name: 'Gemini 1.5 Flash',   provider: 'gemini',    context_window: 1_048_576, description: 'Stable, 1M context',                           tier: 'free', strengths: ['speed'],                  available: true },
  { id: 'cerebras/llama-3.3-70b',         name: 'Llama 3.3 70B',      provider: 'cerebras',  context_window: 128_000,   description: '1,000 tok/s on WSE silicon',                   tier: 'free', strengths: ['speed', 'reasoning'],    available: true },
  { id: 'cerebras/llama3.1-8b',           name: 'Llama 3.1 8B',       provider: 'cerebras',  context_window: 128_000,   description: '2,000 tok/s — fastest 8B',                     tier: 'free', strengths: ['speed'],                  available: true },
  { id: 'mistral-small-3.1-24b-instruct', name: 'Mistral Small 3.1',  provider: 'mistral',   context_window: 128_000,   description: 'Vision + function calling',                    tier: 'free', strengths: ['reasoning', 'coding'],    available: true },
  { id: 'codestral-2501',                 name: 'Codestral',          provider: 'mistral',   context_window: 256_000,   description: 'Code specialist, 256K ctx',                    tier: 'free', strengths: ['coding'],                 available: true },
  { id: 'open-mistral-nemo',              name: 'Mistral Nemo 12B',   provider: 'mistral',   context_window: 128_000,   description: 'Compact multilingual',                         tier: 'free', strengths: ['speed'],                  available: true },
  { id: 'sambanova/deepseek-v3',          name: 'DeepSeek V3',        provider: 'sambanova', context_window: 64_000,    description: 'Top coding & reasoning, rivals GPT-4o',        tier: 'free', strengths: ['coding', 'reasoning'],    available: true },
  { id: 'sambanova/qwen2.5-72b',          name: 'Qwen 2.5 72B',       provider: 'sambanova', context_window: 32_768,    description: 'Excellent multilingual & math',                tier: 'free', strengths: ['reasoning', 'math'],      available: true },
  { id: 'sambanova/llama-3.3-70b',        name: 'Llama 3.3 70B',      provider: 'sambanova', context_window: 8_192,     description: 'Meta 70B on SambaNova silicon',                tier: 'free', strengths: ['reasoning'],              available: true },
  { id: 'gpt-4o',                         name: 'GPT-4o',             provider: 'openai',    context_window: 128_000,   description: 'Best tools, vision & coding',                  tier: 'pro',  strengths: ['coding', 'tools'],        available: true },
  { id: 'gpt-4o-mini',                    name: 'GPT-4o mini',        provider: 'openai',    context_window: 128_000,   description: 'Efficient and fast',                           tier: 'free', strengths: ['speed', 'coding'],        available: true },
]

const PROVIDER_ORDER = ['gemini', 'groq', 'cerebras', 'mistral', 'sambanova', 'openai']

function ctxLabel(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)}M ctx`
  return `${Math.round(n / 1_000)}K ctx`
}

export default function ModelSelector() {
  const { selectedModel, setSelectedModel } = useSessionStore()
  const [open, setOpen]     = useState(false)
  const [models, setModels] = useState<AIModel[]>(FALLBACK_MODELS)
  const ref                 = useRef<HTMLDivElement>(null)

  useEffect(() => {
    listModels()
      .then(d => { if (d.models.length > 0) setModels(d.models) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const current = models.find(m => m.id === selectedModel) ?? models[0]
  const badge   = current ? PROVIDER_BADGE[current.provider] : null

  return (
    <div ref={ref} className="relative">
      {/* Trigger — ChatGPT style: model name + chevron, centered */}
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition-colors"
        style={{
          color:      'var(--text-primary)',
          background: open ? 'var(--bg-hover)' : 'transparent',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
        onMouseLeave={e => (e.currentTarget.style.background = open ? 'var(--bg-hover)' : 'transparent')}
      >
        {badge && (
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: badge.dot }} />
        )}
        <span>{current?.name ?? 'Select model'}</span>
        <ChevronDown
          size={14}
          className={cn('transition-transform flex-shrink-0', open && 'rotate-180')}
          style={{ color: 'var(--text-muted)' }}
        />
      </button>

      {/* Dropdown — appears below the trigger, min-w 320px */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0,  scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.1 }}
            className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-80 rounded-2xl overflow-hidden z-50 py-1.5"
            style={{
              background: '#2f2f2f',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
            }}
          >
            {PROVIDER_ORDER.map(provider => {
              const group = models.filter(m => m.provider === provider)
              if (!group.length) return null
              const pb = PROVIDER_BADGE[provider]
              return (
                <div key={provider}>
                  {/* Provider label */}
                  <div
                    className="flex items-center gap-2 px-3 pt-3 pb-1 text-xs font-medium"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: pb?.dot }} />
                    {pb?.label}
                  </div>
                  {group.map(model => (
                    <button
                      key={model.id}
                      onClick={() => { setSelectedModel(model.id); setOpen(false) }}
                      disabled={!model.available}
                      className="w-full flex items-center gap-3 px-3 py-2 text-left transition-colors"
                      style={{ color: 'var(--text-primary)' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      {/* Check */}
                      <div className="w-4 flex items-center justify-center flex-shrink-0">
                        {selectedModel === model.id && (
                          <Check size={13} style={{ color: 'var(--accent)' }} />
                        )}
                      </div>
                      {/* Name + desc */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{model.name}</span>
                          {model.tier === 'pro' && (
                            <span
                              className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                              style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24' }}
                            >
                              PRO
                            </span>
                          )}
                        </div>
                        <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                          {model.description}
                        </p>
                      </div>
                      {/* Context */}
                      <span className="text-xs flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
                        {ctxLabel(model.context_window)}
                      </span>
                    </button>
                  ))}
                </div>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
