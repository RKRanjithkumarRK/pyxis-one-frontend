'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Zap, Brain, Cpu } from 'lucide-react'
import { listModels } from '@/lib/api'
import { useSessionStore } from '@/store/sessionStore'
import type { AIModel } from '@/lib/types'
import { cn } from '@/lib/utils'

const PROVIDER_ICONS: Record<string, React.ReactNode> = {
  anthropic: <Brain size={12} />,
  openai:    <Zap size={12} />,
  groq:      <Cpu size={12} />,
}

const PROVIDER_COLORS: Record<string, string> = {
  anthropic: 'text-orange-400',
  openai:    'text-emerald-400',
  groq:      'text-blue-400',
}

// Static fallback model list (shown before API loads)
const FALLBACK_MODELS: AIModel[] = [
  { id: 'claude-sonnet-4-6', name: 'Claude Sonnet', provider: 'anthropic', context_window: 200000, description: 'Deep reasoning & analysis', tier: 'pro', strengths: ['reasoning'], available: true },
  { id: 'claude-haiku-4-5-20251001', name: 'Claude Haiku', provider: 'anthropic', context_window: 200000, description: 'Fast & efficient', tier: 'free', strengths: ['speed'], available: true },
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai', context_window: 128000, description: 'Strong coding & tools', tier: 'pro', strengths: ['coding'], available: true },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai', context_window: 128000, description: 'Fast & cost-efficient', tier: 'free', strengths: ['speed'], available: true },
]

export default function ModelSelector() {
  const { selectedModel, setSelectedModel } = useSessionStore()
  const [open, setOpen] = useState(false)
  const [models, setModels] = useState<AIModel[]>(FALLBACK_MODELS)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Load real model list from backend
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

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all',
          'text-white/60 hover:text-white/90 hover:bg-white/5',
          open && 'bg-white/5 text-white/90'
        )}
      >
        <span className={PROVIDER_COLORS[current.provider]}>
          {PROVIDER_ICONS[current.provider]}
        </span>
        <span>{current.name}</span>
        <ChevronDown
          size={11}
          className={cn('transition-transform', open && 'rotate-180')}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.12 }}
            className="absolute bottom-full left-0 mb-2 w-72 rounded-xl bg-zinc-950 border border-white/10 shadow-2xl overflow-hidden z-50"
          >
            {/* Provider groups */}
            {(['anthropic', 'openai'] as const).map((provider) => {
              const providerModels = models.filter((m) => m.provider === provider)
              if (providerModels.length === 0) return null
              return (
                <div key={provider}>
                  <div className="px-3 pt-2.5 pb-1 flex items-center gap-2">
                    <span className={cn('text-xs font-semibold', PROVIDER_COLORS[provider])}>
                      {PROVIDER_ICONS[provider]}
                    </span>
                    <span className="text-xs font-semibold text-white/40 uppercase tracking-wider">
                      {provider === 'anthropic' ? 'Anthropic' : 'OpenAI'}
                    </span>
                  </div>
                  {providerModels.map((model) => (
                    <ModelOption
                      key={model.id}
                      model={model}
                      isSelected={selectedModel === model.id}
                      onSelect={() => { setSelectedModel(model.id); setOpen(false) }}
                    />
                  ))}
                </div>
              )
            })}

            {/* Auto-routing note */}
            <div className="px-3 py-2.5 border-t border-white/5">
              <p className="text-xs text-white/25">
                Auto-routing selects the best model for each query type.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function ModelOption({
  model,
  isSelected,
  onSelect,
}: {
  model: AIModel
  isSelected: boolean
  onSelect: () => void
}) {
  const ctxK = Math.round(model.context_window / 1000)

  return (
    <button
      onClick={onSelect}
      disabled={!model.available}
      className={cn(
        'w-full flex items-start gap-3 px-3 py-2.5 text-left transition-colors',
        isSelected
          ? 'bg-white/8 text-white'
          : 'text-white/70 hover:bg-white/5 hover:text-white/90',
        !model.available && 'opacity-40 cursor-not-allowed'
      )}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{model.name}</span>
          {isSelected && (
            <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-emerald-400" />
          )}
        </div>
        <p className="text-xs text-white/35 truncate mt-0.5">{model.description}</p>
      </div>
      <span className="shrink-0 text-xs text-white/25 tabular-nums mt-0.5">
        {ctxK}K
      </span>
    </button>
  )
}
