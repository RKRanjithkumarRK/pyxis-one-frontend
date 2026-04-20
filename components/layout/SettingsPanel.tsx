'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Palette, Download, Trash2, Info } from 'lucide-react'
import { useUIStore } from '@/store/uiStore'
import { useSessionStore } from '@/store/sessionStore'

const THEMES = [
  { id: 'cosmos', label: 'Cosmos', color: '#6366f1', desc: 'Deep space indigo' },
  { id: 'obsidian', label: 'Obsidian', color: '#334155', desc: 'Pure dark slate' },
  { id: 'holographic', label: 'Holographic', color: '#06ffa5', desc: 'Neon holographic' },
] as const

export function SettingsPanel() {
  const { settingsOpen, closeSettings, theme, setTheme } = useUIStore()
  const { messages, sessionId, studentName, setStudentName, clearMessages, sessions } = useSessionStore()
  const [name, setName] = useState(studentName)
  const [tab, setTab] = useState<'general' | 'appearance' | 'data'>('general')

  const handleExport = () => {
    const lines = messages.map((m) =>
      `## ${m.role === 'user' ? 'You' : 'PYXIS'} — ${new Date(m.timestamp).toLocaleTimeString()}\n\n${m.content}\n`
    )
    const content = `# PYXIS Conversation Export\n\nSession: ${sessionId}\nDate: ${new Date().toLocaleDateString()}\n\n---\n\n${lines.join('\n---\n\n')}`
    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pyxis-conversation-${new Date().toISOString().slice(0, 10)}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <AnimatePresence>
      {settingsOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={closeSettings}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, x: 40, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed right-4 top-4 bottom-4 w-80 glass rounded-2xl border border-[var(--border-subtle)] z-50 flex flex-col overflow-hidden shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-subtle)]">
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">Settings</h2>
              <button onClick={closeSettings} className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/10 transition-all">
                <X size={16} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 px-4 pt-3">
              {(['general', 'appearance', 'data'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${tab === t ? 'bg-indigo-500/20 text-indigo-300' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

              {tab === 'general' && (
                <>
                  {/* Name */}
                  <div>
                    <label className="text-xs font-medium text-[var(--text-secondary)] block mb-2">Your Name</label>
                    <div className="flex gap-2">
                      <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter your name..."
                        className="flex-1 glass-elevated rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none border border-transparent focus:border-indigo-500/40"
                      />
                      <button
                        onClick={() => setStudentName(name)}
                        className="px-3 py-2 bg-indigo-500/20 text-indigo-300 rounded-xl text-xs font-medium hover:bg-indigo-500/30 transition-all"
                      >
                        Save
                      </button>
                    </div>
                  </div>

                  {/* AI info */}
                  <div className="glass-elevated rounded-xl p-4 space-y-2">
                    <div className="flex items-center gap-2 text-[var(--text-secondary)] text-xs font-medium">
                      <Info size={13} />
                      <span>AI Engine</span>
                    </div>
                    <div className="space-y-1.5 text-xs text-[var(--text-muted)]">
                      <div className="flex justify-between"><span>Primary</span><span className="text-green-400">Groq · Llama 3.3 70B</span></div>
                      <div className="flex justify-between"><span>Fallback</span><span className="text-yellow-400">Llama 3.1 8B</span></div>
                      <div className="flex justify-between"><span>Reserve</span><span className="text-blue-400">Anthropic Claude</span></div>
                      <div className="flex justify-between"><span>Session</span><span className="font-mono text-[9px]">{sessionId.slice(0, 12)}…</span></div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="glass-elevated rounded-xl p-4">
                    <p className="text-xs font-medium text-[var(--text-secondary)] mb-3">Session Stats</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="glass rounded-lg p-2 text-center">
                        <div className="text-lg font-bold text-[var(--text-primary)]">{messages.length}</div>
                        <div className="text-[var(--text-muted)]">Messages</div>
                      </div>
                      <div className="glass rounded-lg p-2 text-center">
                        <div className="text-lg font-bold text-[var(--text-primary)]">{sessions.length}</div>
                        <div className="text-[var(--text-muted)]">Past Chats</div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {tab === 'appearance' && (
                <div>
                  <label className="text-xs font-medium text-[var(--text-secondary)] block mb-3 flex items-center gap-1.5">
                    <Palette size={12} /> Theme
                  </label>
                  <div className="space-y-2">
                    {THEMES.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setTheme(t.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all border ${theme === t.id ? 'border-indigo-500/40 bg-indigo-500/10' : 'border-transparent glass-elevated hover:border-[var(--border-subtle)]'}`}
                      >
                        <div className="w-6 h-6 rounded-lg flex-shrink-0" style={{ background: t.color }} />
                        <div className="text-left">
                          <div className={`text-xs font-medium ${theme === t.id ? 'text-indigo-300' : 'text-[var(--text-primary)]'}`}>{t.label}</div>
                          <div className="text-[10px] text-[var(--text-muted)]">{t.desc}</div>
                        </div>
                        {theme === t.id && <div className="ml-auto w-2 h-2 rounded-full bg-indigo-400" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {tab === 'data' && (
                <div className="space-y-3">
                  <button
                    onClick={handleExport}
                    disabled={messages.length === 0}
                    className="w-full flex items-center gap-3 p-3 glass-elevated rounded-xl text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Download size={16} className="text-green-400" />
                    <div className="text-left">
                      <div className="text-xs font-medium">Export Conversation</div>
                      <div className="text-[10px] text-[var(--text-muted)]">Download as Markdown file</div>
                    </div>
                  </button>

                  <button
                    onClick={clearMessages}
                    disabled={messages.length === 0}
                    className="w-full flex items-center gap-3 p-3 glass-elevated rounded-xl text-sm text-[var(--text-secondary)] hover:text-red-400 hover:bg-red-500/5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Trash2 size={16} className="text-red-400" />
                    <div className="text-left">
                      <div className="text-xs font-medium">Clear Current Chat</div>
                      <div className="text-[10px] text-[var(--text-muted)]">Remove all messages in this session</div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-[var(--border-subtle)]">
              <p className="text-[10px] text-[var(--text-muted)] text-center">PYXIS Sovereign Edition · v2.2</p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
