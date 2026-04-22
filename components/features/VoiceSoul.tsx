'use client'

/**
 * VoiceSoul — PYXIS Voice Mode
 * ==============================
 * Reference: ChatGPT Voice integrated-in-chat mode
 *
 * Layout:
 *   ┌─────────────────────────────┐
 *   │ PYXIS Voice          Share  │  ← header
 *   ├─────────────────────────────┤
 *   │                             │
 *   │   [AI response text]        │  ← left-aligned, no bubble
 *   │                             │
 *   │              "User said"    │  ← right-aligned, quoted bubble
 *   │              🎤 00:22       │
 *   │                             │
 *   │       Transcribing...       │  ← right-aligned pill (listening state)
 *   │                             │
 *   └─────────────────────────────┘
 *   │ + │ Type...    │🎤│ ••• End │  ← bottom bar
 *   └─────────────────────────────┘
 */

import { useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, Share2, MoreHorizontal, ThumbsUp, ThumbsDown, Volume2, MicOff } from 'lucide-react'
import { useVoiceSession, type VoiceMessage, type VoiceState } from '@/hooks/useVoiceSession'
import { useSessionStore } from '@/store/sessionStore'

// ── Waveform bars — react to audioLevel ─────────────────────────────────────

function WaveformBars({ level, active }: { level: number; active: boolean }) {
  const bars = 5
  return (
    <div className="flex items-center gap-[3px] h-4">
      {Array.from({ length: bars }, (_, i) => {
        const delay = i * 0.08
        const height = active
          ? Math.max(3, Math.round(level * 16 * (0.5 + 0.5 * Math.sin(i * 1.4))))
          : 3
        return (
          <motion.div
            key={i}
            className="w-[3px] rounded-full bg-white"
            animate={{ height: active ? [3, height, 3] : 3 }}
            transition={active ? {
              duration: 0.4,
              delay,
              repeat: Infinity,
              ease: 'easeInOut',
            } : { duration: 0.2 }}
          />
        )
      })}
    </div>
  )
}

// ── Animated "••• End" button ────────────────────────────────────────────────

function EndButton({ onEnd, isActive }: { onEnd: () => void; isActive: boolean }) {
  return (
    <motion.button
      onClick={onEnd}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#2563eb] hover:bg-[#1d4ed8] transition-colors select-none"
    >
      {/* 3 animated dots */}
      <div className="flex items-center gap-[3px]">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-[5px] h-[5px] rounded-full bg-white"
            animate={isActive ? {
              y: [0, -4, 0],
              opacity: [0.6, 1, 0.6],
            } : { y: 0, opacity: 0.6 }}
            transition={{
              duration: 0.7,
              delay: i * 0.15,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
      <span className="text-white text-sm font-medium">End</span>
    </motion.button>
  )
}

// ── User message bubble (right-aligned, quoted) ───────────────────────────────

function UserBubble({ message }: { message: VoiceMessage }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 350, damping: 28 }}
      className="flex flex-col items-end gap-1 max-w-[75%] self-end"
    >
      <div className="bg-[#2f2f2f] rounded-2xl rounded-br-md px-4 py-2.5">
        <p className="text-sm text-[#ececec] italic leading-relaxed">
          &ldquo;{message.content}&rdquo;
        </p>
      </div>
      {message.durationSeconds !== undefined && (
        <div className="flex items-center gap-1 text-xs text-[#6b7280] pr-1">
          <Mic size={11} />
          <span>{formatDuration(message.durationSeconds)}</span>
        </div>
      )}
    </motion.div>
  )
}

// ── AI response (left-aligned, streaming text) ────────────────────────────────

function AssistantMessage({ message }: { message: VoiceMessage }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col gap-2 max-w-[85%] self-start"
    >
      <p className="text-sm text-[#ececec] leading-relaxed">
        {message.content}
        {message.isStreaming && (
          <motion.span
            className="inline-block w-[2px] h-[14px] bg-[#ececec] ml-[2px] align-middle"
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.5, repeat: Infinity }}
          />
        )}
      </p>
      {!message.isStreaming && message.content && (
        <div className="flex items-center gap-2">
          <button className="text-[#6b7280] hover:text-[#ececec] transition-colors">
            <ThumbsUp size={13} />
          </button>
          <button className="text-[#6b7280] hover:text-[#ececec] transition-colors">
            <ThumbsDown size={13} />
          </button>
          <button className="text-[#6b7280] hover:text-[#ececec] transition-colors">
            <Volume2 size={13} />
          </button>
        </div>
      )}
    </motion.div>
  )
}

// ── "Transcribing..." pill ────────────────────────────────────────────────────

function TranscribingPill() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="self-end"
    >
      <div className="bg-[#2f2f2f] rounded-full px-3 py-1.5 flex items-center gap-1.5">
        <motion.div
          className="w-1.5 h-1.5 rounded-full bg-[#6b7280]"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        />
        <span className="text-xs text-[#9ca3af]">Transcribing...</span>
      </div>
    </motion.div>
  )
}

// ── "Voice chat ended" bottom pill ────────────────────────────────────────────

function SessionEndedPill({ duration, onDismiss }: { duration: number; onDismiss: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="flex items-center justify-center"
    >
      <div className="flex items-center gap-2 bg-[#1f1f1f] border border-[#3f3f3f] rounded-xl px-3 py-2">
        <Volume2 size={13} className="text-[#6b7280]" />
        <span className="text-xs text-[#9ca3af]">
          Voice chat ended &nbsp;
          <span className="text-[#6b7280]">{formatDuration(duration)}</span>
        </span>
        <div className="flex items-center gap-1 ml-1">
          <button className="text-[#6b7280] hover:text-[#ececec] transition-colors">
            <ThumbsUp size={12} />
          </button>
          <button className="text-[#6b7280] hover:text-[#ececec] transition-colors">
            <ThumbsDown size={12} />
          </button>
        </div>
        <button
          onClick={onDismiss}
          className="text-[#6b7280] hover:text-[#ececec] transition-colors ml-1 text-xs leading-none"
        >
          ✕
        </button>
      </div>
    </motion.div>
  )
}

// ── Idle state — large mic button to start ────────────────────────────────────

function IdlePrompt({ onStart, error }: { onStart: () => void; error: string | null }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6">
      <div className="text-center">
        <h3 className="text-lg font-medium text-[#ececec] mb-1">PYXIS Voice</h3>
        <p className="text-sm text-[#6b7280]">
          Tap the mic to start a voice conversation
        </p>
      </div>

      <motion.button
        onClick={onStart}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="relative w-20 h-20 rounded-full bg-[#2563eb] flex items-center justify-center shadow-lg shadow-blue-500/25"
      >
        <motion.div
          className="absolute inset-0 rounded-full bg-[#2563eb]"
          animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        />
        <Mic size={28} className="text-white relative z-10" />
      </motion.button>

      {error && (
        <p className="text-xs text-red-400 text-center max-w-xs">{error}</p>
      )}
    </div>
  )
}

// ── Connecting state ──────────────────────────────────────────────────────────

function ConnectingState() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <motion.div
          className="w-8 h-8 rounded-full border-2 border-[#2563eb] border-t-transparent"
          animate={{ rotate: 360 }}
          transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
        />
        <span className="text-sm text-[#6b7280]">Connecting...</span>
      </div>
    </div>
  )
}

// ── Listening indicator (audio level ring around mic) ─────────────────────────

function ListeningRing({ level, isSpeaking }: { level: number; isSpeaking: boolean }) {
  const scale = 1 + level * 0.4
  return (
    <div className="relative flex items-center justify-center">
      {/* Outer glow ring */}
      <motion.div
        className="absolute rounded-full bg-[#2563eb]/20"
        animate={{
          width: isSpeaking ? 56 + level * 24 : 48,
          height: isSpeaking ? 56 + level * 24 : 48,
          opacity: isSpeaking ? 0.6 : 0.2,
        }}
        transition={{ duration: 0.05 }}
      />
      {/* Mic button */}
      <div className={`
        w-10 h-10 rounded-full flex items-center justify-center transition-colors
        ${isSpeaking ? 'bg-[#2563eb]' : 'bg-[#2f2f2f]'}
      `}>
        <Mic size={18} className={isSpeaking ? 'text-white' : 'text-[#6b7280]'} />
      </div>
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function stateToLabel(state: VoiceState, isSpeaking: boolean): string {
  if (isSpeaking) return 'Listening...'
  switch (state) {
    case 'connecting': return 'Connecting...'
    case 'listening': return 'Tap to speak or just speak'
    case 'transcribing': return 'Transcribing...'
    case 'processing': return 'Thinking...'
    case 'responding': return 'Speaking...'
    case 'interrupted': return 'Interrupted'
    case 'ended': return 'Voice chat ended'
    case 'error': return 'Error'
    default: return ''
  }
}

// ── Main component ────────────────────────────────────────────────────────────

export function VoiceSoul() {
  const { sessionId } = useSessionStore()
  const {
    state, messages, sessionDuration, error,
    audioLevel, isSpeaking,
    start, stop, interrupt, clearMessages,
  } = useVoiceSession(sessionId)

  const chatBottomRef = useRef<HTMLDivElement>(null)
  const showEndPill = state === 'ended' && messages.length > 0
  const isActive = !['idle', 'error', 'ended'].includes(state)

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleEnd = useCallback(() => {
    stop()
  }, [stop])

  const handleDismissEndPill = useCallback(() => {
    clearMessages()
  }, [clearMessages])

  return (
    <div className="h-full flex flex-col bg-[#0d0d0d]">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2f2f2f]">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-[#ececec]">
            {isActive ? 'PYXIS Voice' : 'Voice Soul'}
          </h2>
          {isActive && (
            <motion.div
              className="w-2 h-2 rounded-full bg-green-500"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          )}
        </div>
        <div className="flex items-center gap-2">
          {isActive && (
            <span className="text-xs text-[#6b7280]">
              {formatDuration(sessionDuration)}
            </span>
          )}
          <button className="text-[#6b7280] hover:text-[#ececec] transition-colors p-1">
            <Share2 size={14} />
          </button>
          <button className="text-[#6b7280] hover:text-[#ececec] transition-colors p-1">
            <MoreHorizontal size={14} />
          </button>
        </div>
      </div>

      {/* ── Chat area ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <AnimatePresence mode="popLayout">
          {/* Idle state — show start prompt */}
          {state === 'idle' && messages.length === 0 && (
            <IdlePrompt key="idle" onStart={() => void start()} error={error} />
          )}

          {/* Connecting */}
          {state === 'connecting' && (
            <ConnectingState key="connecting" />
          )}

          {/* Messages */}
          {messages.length > 0 && (
            <div key="messages" className="flex flex-col gap-5">
              {messages.map((msg) =>
                msg.role === 'user' ? (
                  <UserBubble key={msg.id} message={msg} />
                ) : (
                  <AssistantMessage key={msg.id} message={msg} />
                )
              )}

              {/* Transcribing pill */}
              <AnimatePresence>
                {state === 'transcribing' && (
                  <TranscribingPill key="transcribing" />
                )}
              </AnimatePresence>

              {/* Session ended pill */}
              <AnimatePresence>
                {showEndPill && (
                  <SessionEndedPill
                    key="ended"
                    duration={sessionDuration}
                    onDismiss={handleDismissEndPill}
                  />
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Error state recovery */}
          {state === 'error' && messages.length === 0 && (
            <IdlePrompt key="error" onStart={() => void start()} error={error} />
          )}
        </AnimatePresence>

        <div ref={chatBottomRef} />
      </div>

      {/* ── Bottom bar (voice active) ── */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            key="bottom-bar"
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            className="border-t border-[#2f2f2f] px-3 py-2"
          >
            <div className="flex items-center gap-2">
              {/* + button */}
              <button className="w-8 h-8 rounded-full border border-[#3f3f3f] flex items-center justify-center text-[#6b7280] hover:text-[#ececec] hover:border-[#6b7280] transition-colors flex-shrink-0">
                <span className="text-lg leading-none">+</span>
              </button>

              {/* Text input */}
              <div className="flex-1 flex items-center gap-2 bg-transparent border border-[#2f2f2f] rounded-full px-3 py-1.5">
                <input
                  type="text"
                  placeholder="Type"
                  className="flex-1 bg-transparent text-sm text-[#ececec] placeholder-[#6b7280] outline-none min-w-0"
                />
              </div>

              {/* Listening ring with mic */}
              <ListeningRing level={audioLevel} isSpeaking={isSpeaking} />

              {/* ••• End button */}
              <EndButton onEnd={handleEnd} isActive={isSpeaking || state === 'listening'} />
            </div>

            {/* Status label */}
            <AnimatePresence mode="wait">
              <motion.p
                key={stateToLabel(state, isSpeaking)}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="text-center text-xs text-[#6b7280] mt-1.5"
              >
                {stateToLabel(state, isSpeaking)}
              </motion.p>
            </AnimatePresence>
          </motion.div>
        )}

        {/* Bottom bar (idle / ended) */}
        {!isActive && (
          <motion.div
            key="bottom-idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="border-t border-[#2f2f2f] px-3 py-2"
          >
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2 border border-[#2f2f2f] rounded-full px-3 py-1.5">
                <input
                  type="text"
                  placeholder="Ask anything"
                  className="flex-1 bg-transparent text-sm text-[#ececec] placeholder-[#6b7280] outline-none"
                />
              </div>
              <button className="text-[#6b7280] hover:text-[#ececec] transition-colors p-1.5">
                <Mic size={18} />
              </button>
              {/* Voice mode activate button */}
              <motion.button
                onClick={() => void start()}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-9 h-9 rounded-full bg-[#2f2f2f] hover:bg-[#3f3f3f] flex items-center justify-center transition-colors"
                title="Start voice conversation"
              >
                <WaveformBars level={0} active={false} />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
