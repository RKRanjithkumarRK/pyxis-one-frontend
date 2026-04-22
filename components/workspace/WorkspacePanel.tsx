'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Brain, Code2, Search, LayoutDashboard, Zap, Mic, BookOpen,
  Database, Eye, Sword, Shield, Globe, Music, Layers, GitBranch,
  Clock, Atom, Target, FlaskConical, Crosshair, Cpu, Star,
  type LucideIcon,
} from 'lucide-react'
import { useSessionStore } from '@/store/sessionStore'
import { usePsycheStore } from '@/store/psycheStore'
import { getCurriculum } from '@/lib/api'
import { cn } from '@/lib/utils'
import type { FeatureMode } from '@/lib/types'

// ── Feature button ─────────────────────────────────────────────────────────────
interface FeatureBtn {
  id: FeatureMode
  label: string
  desc: string
  icon: LucideIcon
  color: string
}

function FeatureButton({ feat, onActivate }: { feat: FeatureBtn; onActivate: (id: FeatureMode) => void }) {
  const Icon = feat.icon
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      onClick={() => onActivate(feat.id)}
      className="w-full flex items-center gap-2.5 p-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-opacity-60 transition-all text-left"
      style={{ '--hover-color': feat.color } as React.CSSProperties}
    >
      <span
        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${feat.color}20`, color: feat.color }}
      >
        <Icon size={13} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-[var(--text-primary)] truncate">{feat.label}</p>
        <p className="text-[10px] text-[var(--text-muted)] truncate">{feat.desc}</p>
      </div>
    </motion.button>
  )
}

// ── Think Panel ────────────────────────────────────────────────────────────────
const THINK_FEATURES: FeatureBtn[] = [
  { id: 'psyche',       label: 'Psyche Engine',    desc: '14-dim cognitive profile', icon: Brain,     color: '#6366f1' },
  { id: 'mirror',       label: 'Mirror Protocol',  desc: 'Reflect your own reasoning', icon: Eye,     color: '#8b5cf6' },
  { id: 'shadow',       label: 'Shadow Self',      desc: 'Surface blind spots', icon: Shield,         color: '#a855f7' },
  { id: 'oracle',       label: 'Oracle',           desc: 'Predict future gaps', icon: Star,           color: '#ec4899' },
  { id: 'nemesis',      label: 'Nemesis',          desc: 'Adversarial challenge mode', icon: Sword,   color: '#ef4444' },
  { id: 'dark-knowledge', label: 'Dark Knowledge', desc: 'Counterintuitive insights', icon: Atom,    color: '#f97316' },
  { id: 'apex',         label: 'Apex Mode',        desc: 'All dimensions at once', icon: Zap,        color: '#eab308' },
  { id: 'transcendence', label: 'Transcendence',  desc: 'All lenses simultaneously', icon: Layers,   color: '#6366f1' },
]

function ThinkPanel({ sessionId }: { sessionId: string }) {
  const { dimensions, organismHealth } = usePsycheStore()
  const { setFeature } = useSessionStore()
  const hasData = Object.keys(dimensions).length > 0

  const topDimensions = Object.entries(dimensions)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)

  const LABELS: Record<string, string> = {
    reasoning_style: 'Reasoning', abstraction_tolerance: 'Abstraction',
    error_recovery: 'Recovery', curiosity_signature: 'Curiosity',
    confidence_competence_gap: 'Confidence', analogical_preference: 'Analogical',
    attention_decay: 'Attention', vocabulary_complexity: 'Vocabulary',
    question_depth: 'Depth', topic_persistence: 'Persistence',
    frustration_threshold: 'Frustration', breakthrough_pattern: 'Breakthrough',
    learning_velocity: 'Velocity', metacognitive_awareness: 'Metacognition',
  }
  const COLORS: Record<string, string> = {
    reasoning_style: '#6366f1', abstraction_tolerance: '#8b5cf6', error_recovery: '#06b6d4',
    curiosity_signature: '#10b981', confidence_competence_gap: '#f59e0b', analogical_preference: '#ef4444',
    attention_decay: '#a855f7', vocabulary_complexity: '#ec4899', question_depth: '#84cc16',
    topic_persistence: '#22c55e', frustration_threshold: '#f97316', breakthrough_pattern: '#38bdf8',
    learning_velocity: '#34d399', metacognitive_awareness: '#c084fc',
  }

  return (
    <div className="space-y-5">
      {/* Cognitive profile */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/20 flex items-center justify-center">
            <Brain size={14} className="text-indigo-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-[var(--text-primary)]">Cognitive Profile</p>
            <p className="text-[10px] text-[var(--text-muted)]">14-dimension live model</p>
          </div>
          <div className="text-xs font-semibold" style={{ color: organismHealth > 0.6 ? '#10b981' : '#f59e0b' }}>
            {hasData ? `${Math.round(organismHealth * 100)}% active` : 'Idle'}
          </div>
        </div>

        {!hasData ? (
          <div className="p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/20 text-center">
            <p className="text-xs text-[var(--text-muted)]">Send a message to activate your cognitive model</p>
          </div>
        ) : (
          <div className="space-y-2">
            {topDimensions.map(([key, value]) => (
              <div key={key}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-[var(--text-secondary)]">{LABELS[key] ?? key}</span>
                  <span className="text-xs font-semibold" style={{ color: COLORS[key] ?? '#6366f1' }}>
                    {value.toFixed(2)}
                  </span>
                </div>
                <div className="h-1 rounded-full bg-[var(--bg-overlay)] overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: COLORS[key] ?? '#6366f1' }}
                    initial={{ width: 0 }}
                    animate={{ width: `${value * 100}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Intelligence modes */}
      <div>
        <p className="text-[10px] font-semibold tracking-widest uppercase text-[var(--text-muted)] mb-2">Intelligence Modes</p>
        <div className="grid grid-cols-2 gap-1.5">
          {THINK_FEATURES.map((f) => (
            <FeatureButton key={f.id} feat={f} onActivate={setFeature} />
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Create Panel ───────────────────────────────────────────────────────────────
const CREATE_FEATURES: FeatureBtn[] = [
  { id: 'forge',        label: 'Cognitive Forge',  desc: '7-stage concept metallurgy', icon: FlaskConical, color: '#10b981' },
  { id: 'civilization', label: 'Civilization',     desc: 'Decision simulation engine', icon: Globe,        color: '#22c55e' },
  { id: 'symphony',     label: 'Symphony',         desc: 'Concepts as composition', icon: Music,           color: '#84cc16' },
  { id: 'babel-mind',   label: 'Babel Mind',       desc: 'Multi-framework translation', icon: GitBranch,  color: '#06b6d4' },
  { id: 'alien-mode',   label: 'Alien Mode',       desc: 'Explain as alien civilization', icon: Atom,     color: '#8b5cf6' },
  { id: 'cosmos-classroom', label: 'Cosmos',       desc: 'Universe as classroom', icon: Star,             color: '#ec4899' },
]

function CreatePanel({ sessionId: _sessionId }: { sessionId: string }) {
  const { setFeature } = useSessionStore()

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center">
          <Code2 size={14} className="text-emerald-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">Build Context</p>
          <p className="text-[10px] text-[var(--text-muted)]">Code-optimized responses active</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        {[
          { label: 'Syntax Highlighting', color: '#10b981' },
          { label: 'Code Explanation', color: '#10b981' },
          { label: 'Error Analysis', color: '#10b981' },
          { label: 'Refactoring Hints', color: '#10b981' },
        ].map((item) => (
          <div key={item.label} className="flex items-center justify-between p-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
            <span className="text-[10px] text-[var(--text-secondary)]">{item.label}</span>
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
          </div>
        ))}
      </div>

      <div>
        <p className="text-[10px] font-semibold tracking-widest uppercase text-[var(--text-muted)] mb-2">Creative Engines</p>
        <div className="grid grid-cols-2 gap-1.5">
          {CREATE_FEATURES.map((f) => (
            <FeatureButton key={f.id} feat={f} onActivate={setFeature} />
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Research Panel ─────────────────────────────────────────────────────────────
const RESEARCH_FEATURES: FeatureBtn[] = [
  { id: 'parliament',    label: 'Parliament',      desc: '12 philosopher personas', icon: Cpu,           color: '#06b6d4' },
  { id: 'trident',       label: 'Trident',         desc: '3-perspective synthesis', icon: GitBranch,    color: '#3b82f6' },
  { id: 'curriculum',    label: 'Curriculum',      desc: 'Adaptive learning arc', icon: BookOpen,       color: '#8b5cf6' },
  { id: 'living-syllabus', label: 'Syllabus',      desc: 'Dynamic curriculum tree', icon: Layers,      color: '#a855f7' },
  { id: 'temporal-waves', label: 'Temporal Waves', desc: 'Historical evolution', icon: Clock,           color: '#ec4899' },
  { id: 'gravity',       label: 'Gravity Field',   desc: 'Concept attraction map', icon: Atom,          color: '#f59e0b' },
  { id: 'tides',         label: 'Semantic Tides',  desc: 'Understanding shift tracker', icon: Search,   color: '#10b981' },
  { id: 'precognition',  label: 'Precognition',    desc: 'Predict future gaps', icon: Target,           color: '#ef4444' },
  { id: 'blind-spots',   label: 'Blind Spots',     desc: 'Excavate unknown unknowns', icon: Eye,        color: '#f97316' },
  { id: 'dominion',      label: 'Dominion Scan',   desc: 'Complete knowledge map', icon: Globe,         color: '#6366f1' },
]

function ResearchPanel({ sessionId: _sessionId }: { sessionId: string }) {
  const { setFeature } = useSessionStore()

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-7 h-7 rounded-lg bg-cyan-500/20 flex items-center justify-center">
          <Search size={14} className="text-cyan-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">Research Engine</p>
          <p className="text-[10px] text-[var(--text-muted)]">Multi-perspective synthesis</p>
        </div>
      </div>

      <div className="space-y-1.5">
        {[
          { label: 'Analytical Lens', desc: 'Logical, evidence-based', color: '#6366f1' },
          { label: 'Creative Lens', desc: 'Novel angles, lateral thinking', color: '#ec4899' },
          { label: 'Critical Lens', desc: 'Assumptions, counter-arguments', color: '#ef4444' },
        ].map((lens) => (
          <div key={lens.label} className="p-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
            <div className="flex items-center gap-2 mb-0.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: lens.color }} />
              <span className="text-xs font-semibold text-[var(--text-primary)]">{lens.label}</span>
            </div>
            <p className="text-[10px] text-[var(--text-muted)] pl-4">{lens.desc}</p>
          </div>
        ))}
      </div>

      <div>
        <p className="text-[10px] font-semibold tracking-widest uppercase text-[var(--text-muted)] mb-2">Research Modes</p>
        <div className="grid grid-cols-2 gap-1.5">
          {RESEARCH_FEATURES.map((f) => (
            <FeatureButton key={f.id} feat={f} onActivate={setFeature} />
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Manage Panel ───────────────────────────────────────────────────────────────
const MANAGE_FEATURES: FeatureBtn[] = [
  { id: 'vault',          label: 'The Vault',       desc: 'Encrypted memory palace', icon: Database,     color: '#f59e0b' },
  { id: 'helix',          label: 'Helix',           desc: 'Spaced repetition system', icon: GitBranch,   color: '#10b981' },
  { id: 'assessment',     label: 'Assessment',      desc: 'Targeted quiz & eval', icon: Target,          color: '#6366f1' },
  { id: 'synaptic-sprint', label: 'Synaptic Sprint', desc: 'Rapid-fire quiz mode', icon: Zap,           color: '#ef4444' },
  { id: 'final-boss',     label: 'Final Boss',      desc: 'Hardest possible exam', icon: Crosshair,      color: '#a855f7' },
  { id: 'eternal',        label: 'Eternal Archive', desc: 'Crystallize lasting knowledge', icon: Star,   color: '#ec4899' },
  { id: 'voice',          label: 'Voice Soul',      desc: 'Speak with your AI', icon: Mic,              color: '#06b6d4' },
]

function ManagePanel({ sessionId }: { sessionId: string }) {
  const { setFeature } = useSessionStore()
  const [curriculum, setCurriculum] = useState<{ moves?: Array<{ move: string; priority: number }> } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getCurriculum(sessionId)
      .then((d) => setCurriculum(d as { moves?: Array<{ move: string; priority: number }> }))
      .catch(() => setCurriculum(null))
      .finally(() => setLoading(false))
  }, [sessionId])

  const moves = curriculum?.moves?.slice(0, 3) ?? []

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center">
          <LayoutDashboard size={14} className="text-amber-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">Learning Plan</p>
          <p className="text-[10px] text-[var(--text-muted)]">AI-generated next steps</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-1.5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 rounded-xl bg-[var(--bg-elevated)] animate-pulse" style={{ opacity: 1 - i * 0.2 }} />
          ))}
        </div>
      ) : moves.length > 0 ? (
        <div className="space-y-1.5">
          {moves.map((move, i) => (
            <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
              <div className="w-5 h-5 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-[10px] font-bold text-amber-400">{i + 1}</span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{move.move}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Start a conversation to generate your personalized learning plan.
          </p>
        </div>
      )}

      <div>
        <p className="text-[10px] font-semibold tracking-widest uppercase text-[var(--text-muted)] mb-2">Power Tools</p>
        <div className="grid grid-cols-2 gap-1.5">
          {MANAGE_FEATURES.map((f) => (
            <FeatureButton key={f.id} feat={f} onActivate={setFeature} />
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Main WorkspacePanel ────────────────────────────────────────────────────────
export function WorkspacePanel() {
  const { currentWorkspace, sessionId } = useSessionStore()

  const panels: Record<string, React.ReactNode> = {
    think:    <ThinkPanel sessionId={sessionId} />,
    create:   <CreatePanel sessionId={sessionId} />,
    research: <ResearchPanel sessionId={sessionId} />,
    manage:   <ManagePanel sessionId={sessionId} />,
  }

  const meta: Record<string, { title: string; subtitle: string; color: string }> = {
    think:    { title: 'Think',    subtitle: 'Cognitive intelligence',  color: '#6366f1' },
    create:   { title: 'Create',   subtitle: 'Build workspace',         color: '#10b981' },
    research: { title: 'Research', subtitle: 'Knowledge synthesis',     color: '#06b6d4' },
    manage:   { title: 'Manage',   subtitle: 'Planning & memory',       color: '#f59e0b' },
  }

  const m = meta[currentWorkspace] ?? meta.think

  return (
    <div className="h-full flex flex-col bg-[var(--bg-base)]">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[var(--border-subtle)] flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: m.color }} />
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">{m.title} Workspace</h2>
        </div>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">{m.subtitle}</p>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentWorkspace}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {panels[currentWorkspace] ?? panels.think}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
