'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, ChevronLeft, X, Brain, Sparkles, Zap, BookOpen, Lock, Check } from 'lucide-react'

const STEPS = [
  {
    icon: <Sparkles size={28} className="text-indigo-400" />,
    color: '#6366f1',
    title: 'Welcome to Pyxis One',
    subtitle: 'Your intelligent learning companion',
    body: 'Pyxis is not just a chatbot. It builds a living cognitive model of how you think, learn, and struggle — then adapts everything to your unique mind.',
  },
  {
    icon: <Brain size={28} className="text-violet-400" />,
    color: '#8b5cf6',
    title: 'Your Psyche Engine',
    subtitle: '14 cognitive dimensions tracked in real time',
    body: 'Every message you send updates your Psyche — a living fingerprint of your reasoning style, attention decay, curiosity signature, and 11 other dimensions.',
  },
  {
    icon: <Zap size={28} className="text-amber-400" />,
    color: '#f59e0b',
    title: '25+ Learning Modes',
    subtitle: 'Type / to switch between them instantly',
    body: 'Access the Forge (7-stage concept metallurgy), the Parliament (12 philosopher council), the Vault (encrypted memory palace), the Helix (spaced repetition), and much more.',
    highlight: 'Try typing /forge or /parliament in the chat input.',
  },
  {
    icon: <BookOpen size={28} className="text-emerald-400" />,
    color: '#10b981',
    title: 'How to Learn with Pyxis',
    subtitle: 'A few tips to get started',
    body: '',
    tips: [
      'Ask any question in the chat — Pyxis responds with structured tiers (Surface → Expert)',
      'Type / to open the mode menu and switch learning modes',
      'Use the sidebar to navigate all 25 features',
      'Press ⌘K to open the command bar',
      'Your session persists — come back anytime',
    ],
  },
  {
    icon: <Lock size={28} className="text-cyan-400" />,
    color: '#06b6d4',
    title: 'Your Data is Private',
    subtitle: 'Everything stays in your session',
    body: 'Your Vault entries are AES-GCM encrypted. Your Psyche profile is yours alone. Pyxis never shares your learning data with third parties.',
    cta: "Let's start learning",
  },
]

const STORAGE_KEY = 'pyxis-onboarding-complete'

export function OnboardingModal() {
  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    const done = localStorage.getItem(STORAGE_KEY)
    if (!done) setVisible(true)
  }, [])

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1')
    setVisible(false)
  }

  const next = () => {
    if (step < STEPS.length - 1) setStep((s) => s + 1)
    else dismiss()
  }

  const prev = () => setStep((s) => Math.max(0, s - 1))

  const current = STEPS[step]

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="onboarding-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(5,5,15,0.85)', backdropFilter: 'blur(12px)' }}
        >
          <motion.div
            key="onboarding-card"
            initial={{ opacity: 0, scale: 0.93, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="glass-elevated rounded-3xl border border-[var(--border-default)] w-full max-w-md relative overflow-hidden"
            style={{ boxShadow: `0 0 80px ${current.color}20, 0 32px 80px rgba(0,0,0,0.6)` }}
          >
            {/* Accent bar */}
            <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg, transparent, ${current.color}, transparent)` }} />

            {/* Close */}
            <button
              onClick={dismiss}
              className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors z-10"
            >
              <X size={16} />
            </button>

            {/* Content */}
            <div className="p-8">
              {/* Step indicator */}
              <div className="flex gap-1.5 mb-6">
                {STEPS.map((_, i) => (
                  <div
                    key={i}
                    className="h-1 rounded-full transition-all duration-300"
                    style={{
                      flex: i === step ? 2 : 1,
                      background: i <= step ? current.color : 'rgba(255,255,255,0.1)',
                    }}
                  />
                ))}
              </div>

              {/* Icon */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
                    style={{ background: `${current.color}18`, border: `1px solid ${current.color}30` }}
                  >
                    {current.icon}
                  </div>

                  <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">
                    {current.title}
                  </h2>
                  <p className="text-sm text-[var(--text-muted)] mb-4">{current.subtitle}</p>

                  {current.body && (
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-4">
                      {current.body}
                    </p>
                  )}

                  {current.highlight && (
                    <div
                      className="rounded-xl px-4 py-3 text-sm mb-4"
                      style={{ background: `${current.color}12`, border: `1px solid ${current.color}25`, color: current.color }}
                    >
                      {current.highlight}
                    </div>
                  )}

                  {current.tips && (
                    <ul className="space-y-2 mb-4">
                      {current.tips.map((tip, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm text-[var(--text-secondary)]">
                          <Check size={13} className="mt-0.5 flex-shrink-0" style={{ color: current.color }} />
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Navigation */}
              <div className="flex items-center justify-between mt-6">
                <button
                  onClick={prev}
                  disabled={step === 0}
                  className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors disabled:opacity-30"
                >
                  <ChevronLeft size={16} />
                  Back
                </button>

                <button
                  onClick={next}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
                  style={{ background: current.color, boxShadow: `0 0 20px ${current.color}40` }}
                >
                  {step === STEPS.length - 1 ? (current.cta ?? "Let's go") : 'Continue'}
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
