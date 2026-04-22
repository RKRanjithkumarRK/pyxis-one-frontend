'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Zap, Cpu, Sparkles, Check } from 'lucide-react'
import { listModels } from '@/lib/api'
import { useSessionStore } from '@/store/sessionStore'
import type { AIModel } from '@/lib/types'
import { cn } from '@/lib/utils'

// ── Provider metadata ────────────────────────────────────────────────────────

const PROVIDERS = ['groq', 'gemini', 'openai'] as const
type Provider = (typeof PROVIDERS)[number]

const PROVIDER_META: Record<Provider, {
  label: string
  icon: React.ReactNode
  color: string          // text colour
  badge: string          // pill text
  badgeColor: string     // pill bg
}> = {
  groq: {
    label:      'Groq',
    icon:       <Cpu size={12} />,
    color:      'text-blue-400',
    badge:      'Free · Ultra-fast',
    badgeColor: 'bg-blue-500/10 text-blue-400',
  },
  gemini: {
    label:      'Gemini',
    icon:       <Sparkles size={12} />,
    color:      'text-violet-400',
    badge:      'Free · 1M+ ctx',
    badgeColor: 'bg-violet-500/10 text-violet-400',
  },
  openai: {
    label:      'OpenAI',
    icon:       <Zap size={12} />,
    color:      'text-emerald-400',
    badge:      'Paid',
    badgeColor: 'bg-emerald-500/10 text-emerald-400',
  },
}

// ── Static fallback models shown before API responds ─────────────────────────

const FALLBACK_MODELS: AIModel[] = [
  // Groq
  {
    id: 'llama-3.3-70b-versatile',
    name: 'Llama 3.3 70B',
    provider: 'groq',
    context_window: 128_000,
    description: "Meta's best open model — balanced speed & quality",
    tier: 'free',
    strengths: ['reasoning', 'coding'],
    available: true,
  },
  {
    id: 'llama-3.1-8b-instant',
    name: 'Llama 3.1 8B',
    provider: 'groq',
    context_window: 128_000,
    description: 'Lightning-fast — best for quick answers',
    tier: 'free',
    strengths: ['speed'],
    available: true,
  },
  {
    id: 'mixtral-8x7b-32768',
    name: 'Mixtral 8x7B',
    provider: 'groq',
    context_window: 32_768,
    description: 'Mixture-of-experts — great for long documents',
    tier: 'free',
    strengths: ['reasoning', 'long-context'],
    available: true,
  },
  {
    id: 'gemma2-9b-it',
    name: 'Gemma 2 9B',
    provider: 'groq',
    context_window: 8_192,
    description: "Google's efficient open model via Groq",
    tier: 'free',
    strengths: ['speed'],
    available: true,
  },
  // Gemini
  {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    provider: 'gemini',
    context_window: 1_048_576,
    description: "Google's fastest 2.0 model — 1M context",
    tier: 'free',
    strengths: ['speed', 'vision', 'long-context'],
    available: true,
  },
  {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    provider: 'gemini',
    context_window: 2_097_152,
    description: '2M context — strongest reasoning & analysis',
    tier: 'pro',
    strengths: ['reasoning', 'vision', 'coding'],
    available: true,
  },
  {
    id: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    provider: 'gemini',
    context_window: 1_048_576,
    description: 'Fast and efficient — 1M context',
    tier: 'free',
    strengths: ['speed', 'long-context'],
    available: true,
  },
  // OpenAI
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    context_window: 128_000,
    description: "OpenAI's flagship — best tools & coding",
    tier: 'pro',
    strengths: ['coding', 'tools', 'vision'],
    available: true,
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'openai',
    context_window: 128_000,
    description: 'Cost-efficient with strong reasoning',
    tier: 'free',
    strengths: ['speed', 'coding'],
    available: true,
  },
]

// ── Context-window label: show K or M ────────────────────────────────────────

function ctxLabel(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)}M`
  return `${Math.round(n / 1_000)}K`
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ModelSelector() {
  const { selectedModel, setSelectedModel } = useSessionStore()
  const [open, setOpen] = useState(false)
  const [models, setModels] = useState<AIModel[]>(FALLBACK_MODELS)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Load live model list from backend
  useEffect(() => {
    listModels()
      .then((data) => { if (data.models.length > 0) setModels(data.models) })
      .catch(() => { /* keep fallback */ })
  }, [])

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const current = models.find((m) => m.id === selectedModel) ?? models[0]
  if (!current) return null

  const meta = PROVIDER_META[current.provider as Provider]

  return (
    <div ref={dropdownRef} className="relative">
      {/* Trigger button */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all',
          'text-white/60 hover:text-white/90 hover:bg-white/5',
          open && 'bg-white/5 text-white/90'
        )}
      >
        <span className={meta.color}>{meta.icon}</span>
        <span className="max-w-[90px] truncate">{current.name}</span>
        <ChevronDown
          size={11}
          className={cn('transition-transform flex-shrink-0', open && 'rotate-180')}
        />
      </button>

      {/* Dropdown panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.12 }}
            className="absolute bottom-full left-0 mb-2 w-80 rounded-xl bg-zinc-950 border border-white/10 shadow-2xl overflow-hidden z-50"
          >
            {/* Header */}
            <div className="px-3 pt-2.5 pb-2 border-b border-white/5">
              <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">
                Select Model
              </p>
            </div>

            {/* Provider sections */}
            <div className="max-h-[420px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
              {PROVIDERS.map((provider) => {
                const providerModels = models.filter((m) => m.provider === provider)
                if (providerModels.length === 0) return null
                const pmeta = PROVIDER_META[provider]

                return (
                  <div key={provider}>
                    {/* Provider header */}
                    <div className="flex items-center justify-between px-3 pt-3 pb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className={pmeta.color}>{pmeta.icon}</span>
                        <span className={cn('text-xs font-semibold', pmeta.color)}>
                          {pmeta.label}
                        </span>
                      </div>
                      <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-medium', pmeta.badgeColor)}>
                        {pmeta.badge}
                      </span>
                    </div>

                    {/* Model rows */}
                    {providerModels.map((model) => (
                      <ModelRow
                        key={model.id}
                        model={model}
                        isSelected={selectedModel === model.id}
                        providerColor={pmeta.color}
                        onSelect={() => { setSelectedModel(model.id); setOpen(false) }}
                      />
                    ))}

                    {/* Divider between providers */}
                    <div className="mx-3 mt-1 border-t border-white/5" />
                  </div>
                )
              })}
            </div>

            {/* Footer note */}
            <div className="px-3 py-2 border-t border-white/5">
              <p className="text-[10px] text-white/25">
                Auto-routing picks the best model per query. Override anytime.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Model row ─────────────────────────────────────────────────────────────────

function ModelRow({
  model,
  isSelected,
  providerColor,
  onSelect,
}: {
  model: AIModel
  isSelected: boolean
  providerColor: string
  onSelect: () => void
}) {
  return (
    <button
      onClick={onSelect}
      disabled={!model.available}
      className={cn(
        'w-full flex items-start gap-3 px-3 py-2 text-left transition-colors',
        isSelected
          ? 'bg-white/8 text-white'
          : 'text-white/70 hover:bg-white/5 hover:text-white/90',
        !model.available && 'opacity-40 cursor-not-allowed'
      )}
    >
      {/* Selected indicator */}
      <div className="mt-1 w-3 flex-shrink-0 flex items-center justify-center">
        {isSelected && <Check size={11} className="text-emerald-400" />}
      </div>

      {/* Name + description */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium truncate">{model.name}</span>
          {model.tier === 'pro' && (
            <span className="text-[9px] px-1 py-0.5 rounded bg-amber-500/15 text-amber-400 font-semibold tracking-wide flex-shrink-0">
              PRO
            </span>
          )}
        </div>
        <p className="text-[11px] text-white/35 mt-0.5 truncate">{model.description}</p>
      </div>

      {/* Context window */}
      <span className={cn('shrink-0 text-[11px] tabular-nums mt-0.5', providerColor)}>
        {ctxLabel(model.context_window)}
      </span>
    </button>
  )
}
