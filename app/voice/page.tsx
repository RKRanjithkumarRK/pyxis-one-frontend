'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────
type AppState = 'idle' | 'connecting' | 'listening' | 'transcribing' | 'processing' | 'responding' | 'ended' | 'error'

interface Msg {
  id: string
  role: 'user' | 'assistant'
  text: string
  streaming?: boolean
  durationSec?: number
}

// ─── Constants ────────────────────────────────────────────────────────────────
const API = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000')
const WS_BASE = API.replace(/^http/, 'ws')
const SILENCE_MS = 800
const SPEECH_THRESH = 12

let msgIdx = 0
const uid = () => String(++msgIdx)

function fmtTime(s: number) {
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

// ─── SVG Icons ────────────────────────────────────────────────────────────────
const IconMic = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
  </svg>
)

const IconShare = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>
  </svg>
)

const IconDots = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/>
  </svg>
)

const IconThumbUp = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
  </svg>
)

const IconThumbDown = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z"/><path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/>
  </svg>
)

const IconWave = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12h2M6 8v8M10 6v12M14 9v6M18 7v10M22 12h-2"/>
  </svg>
)

const IconPlus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)

const IconX = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)

const IconSearch = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
)

const IconPen = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
)

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar() {
  const chats = ['Voice assistant', 'PDF Creation', 'Language Demand', 'Gold Sculpture', 'Conversational Start']
  return (
    <div style={{
      width: 260, minWidth: 260, height: '100vh', background: '#171717',
      display: 'flex', flexDirection: 'column', borderRight: '1px solid rgba(255,255,255,0.06)',
      overflowY: 'auto', flexShrink: 0,
    }}>
      {/* Logo row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 12px 4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>P</span>
          </div>
          <span style={{ color: '#ececec', fontSize: 14, fontWeight: 600 }}>PYXIS</span>
        </div>
        <button style={{ background: 'none', border: 'none', color: '#8e8ea0', cursor: 'pointer', padding: 4 }}>
          <IconPen />
        </button>
      </div>

      {/* Nav items */}
      <div style={{ padding: '4px 8px' }}>
        {[{ icon: <IconPen />, label: 'New chat' }, { icon: <IconSearch />, label: 'Search chats' }].map(({ icon, label }) => (
          <button key={label} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 10px', borderRadius: 8, background: 'none', border: 'none',
            color: '#ececec', fontSize: 13, cursor: 'pointer', textAlign: 'left',
          }}
            onMouseEnter={e => (e.currentTarget.style.background = '#2a2a2a')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
          >
            <span style={{ color: '#8e8ea0' }}>{icon}</span>
            {label}
          </button>
        ))}
      </div>

      {/* Recents */}
      <div style={{ padding: '12px 12px 4px', color: '#6b7280', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Recents
      </div>
      {chats.map(c => (
        <button key={c} style={{
          display: 'block', width: '100%', padding: '7px 18px', background: 'none', border: 'none',
          color: '#acacbe', fontSize: 13, cursor: 'pointer', textAlign: 'left',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}
          onMouseEnter={e => (e.currentTarget.style.background = '#2a2a2a')}
          onMouseLeave={e => (e.currentTarget.style.background = 'none')}
        >
          {c}
        </button>
      ))}

      {/* Projects */}
      <div style={{ padding: '12px 12px 4px', color: '#6b7280', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 8 }}>
        Projects
      </div>
      {['pyxis', 'AI/ml road map', 'Gen AI career', 'portfolio'].map(p => (
        <button key={p} style={{
          display: 'block', width: '100%', padding: '7px 18px', background: 'none', border: 'none',
          color: '#acacbe', fontSize: 13, cursor: 'pointer', textAlign: 'left',
        }}
          onMouseEnter={e => (e.currentTarget.style.background = '#2a2a2a')}
          onMouseLeave={e => (e.currentTarget.style.background = 'none')}
        >
          📁 {p}
        </button>
      ))}

      {/* Bottom user */}
      <div style={{ marginTop: 'auto', padding: '12px 12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 6px', borderRadius: 8, cursor: 'pointer' }}
          onMouseEnter={e => (e.currentTarget.style.background = '#2a2a2a')}
          onMouseLeave={e => (e.currentTarget.style.background = 'none')}
        >
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700, color: '#fff',
          }}>R</div>
          <span style={{ color: '#ececec', fontSize: 13 }}>Ranjithkumar</span>
        </div>
      </div>
    </div>
  )
}

// ─── Animated End Button ───────────────────────────────────────────────────────
function EndButton({ onEnd, active }: { onEnd: () => void; active: boolean }) {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setTick(x => x + 1), 100)
    return () => clearInterval(t)
  }, [])
  return (
    <button onClick={onEnd} style={{
      display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
      borderRadius: 999, background: '#2563eb', border: 'none',
      cursor: 'pointer', flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
        {[0, 1, 2].map(i => {
          const bounce = active ? Math.sin((tick * 0.4 + i * 1.2)) * 3.5 : 0
          return (
            <div key={i} style={{
              width: 5, height: 5, borderRadius: '50%', background: '#fff',
              transform: `translateY(${bounce}px)`,
              opacity: active ? 0.7 + Math.abs(Math.sin((tick * 0.4 + i * 1.2))) * 0.3 : 0.5,
              transition: 'transform 0.05s',
            }} />
          )
        })}
      </div>
      <span style={{ color: '#fff', fontSize: 13, fontWeight: 500 }}>End</span>
    </button>
  )
}

// ─── Voice Orb (idle state) ───────────────────────────────────────────────────
function VoiceOrb({ onClick }: { onClick: () => void }) {
  const [pulse, setPulse] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setPulse(x => x + 1), 50)
    return () => clearInterval(t)
  }, [])
  const bars = [0.4, 0.7, 1.0, 0.7, 0.4]
  return (
    <button onClick={onClick} style={{
      width: 32, height: 32, borderRadius: '50%', background: '#2f2f2f',
      border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center',
      justifyContent: 'center', gap: 2, flexShrink: 0,
    }}>
      {bars.map((h, i) => (
        <div key={i} style={{
          width: 2.5, borderRadius: 2,
          background: '#8e8ea0',
          height: 6 + h * (4 + Math.sin(pulse * 0.08 + i) * 2),
          transition: 'height 0.1s',
        }} />
      ))}
    </button>
  )
}

// ─── Listening Ring (around mic when active) ──────────────────────────────────
function MicRing({ level, speaking }: { level: number; speaking: boolean }) {
  const size = 36 + level * 16
  return (
    <div style={{ position: 'relative', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <div style={{
        position: 'absolute', borderRadius: '50%',
        width: size, height: size,
        background: speaking ? 'rgba(37,99,235,0.25)' : 'rgba(100,100,100,0.1)',
        transition: 'all 0.05s',
      }} />
      <div style={{
        width: 34, height: 34, borderRadius: '50%',
        background: speaking ? '#2563eb' : '#2f2f2f',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background 0.2s', position: 'relative', zIndex: 1,
        color: speaking ? '#fff' : '#8e8ea0',
      }}>
        <IconMic />
      </div>
    </div>
  )
}

// ─── Transcribing pill ────────────────────────────────────────────────────────
function TranscribingPill() {
  const [dot, setDot] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setDot(x => (x + 1) % 4), 350)
    return () => clearInterval(t)
  }, [])
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 0 4px' }}>
      <div style={{
        background: '#2f2f2f', borderRadius: 999, padding: '6px 14px',
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <div style={{
          width: 6, height: 6, borderRadius: '50%',
          background: dot % 2 === 0 ? '#8e8ea0' : '#ececec',
          transition: 'background 0.2s',
        }} />
        <span style={{ fontSize: 13, color: '#acacbe' }}>
          Transcribing{'...'.slice(0, (dot % 3) + 1)}
        </span>
      </div>
    </div>
  )
}

// ─── Voice integrated notification ───────────────────────────────────────────
function VoiceNotification({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div style={{
      margin: '0 0 8px', background: '#2f2f2f',
      borderRadius: 12, padding: '12px 14px',
      border: '1px solid rgba(255,255,255,0.08)',
      display: 'flex', alignItems: 'flex-start', gap: 10,
    }}>
      <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#1a3a6b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
        <IconWave />
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ margin: 0, color: '#ececec', fontSize: 13, fontWeight: 500, marginBottom: 3 }}>
          Voice is now integrated in chat
        </p>
        <p style={{ margin: 0, color: '#8e8ea0', fontSize: 12, lineHeight: 1.5 }}>
          Follow the conversation in real time with transcripts. Switch back anytime by selecting &ldquo;Separate mode&rdquo; in Settings.
        </p>
      </div>
      <button onClick={onDismiss} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: 2, flexShrink: 0 }}>
        <IconX />
      </button>
    </div>
  )
}

// ─── Voice Chat Ended pill ────────────────────────────────────────────────────
function EndedPill({ duration, onDismiss }: { duration: number; onDismiss: () => void }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: '#1e1e1e', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 12, padding: '8px 14px',
      }}>
        <span style={{ color: '#6b7280' }}><IconWave /></span>
        <span style={{ fontSize: 13, color: '#8e8ea0' }}>Voice chat ended</span>
        <span style={{ fontSize: 13, color: '#6b7280' }}>{fmtTime(duration)}</span>
        <button style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: '0 2px' }}><IconThumbUp /></button>
        <button style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: '0 2px' }}><IconThumbDown /></button>
        <button onClick={onDismiss} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: '0 2px' }}><IconX /></button>
      </div>
    </div>
  )
}

// ─── Message Bubble ───────────────────────────────────────────────────────────
function Message({ msg }: { msg: Msg }) {
  if (msg.role === 'user') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, alignSelf: 'flex-end', maxWidth: '75%' }}>
        <div style={{
          background: '#2f2f2f', borderRadius: '18px 18px 4px 18px',
          padding: '10px 16px',
        }}>
          <p style={{ margin: 0, fontSize: 14, color: '#ececec', fontStyle: 'italic', lineHeight: 1.5 }}>
            &ldquo;{msg.text}&rdquo;
          </p>
        </div>
        {msg.durationSec !== undefined && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, paddingRight: 4 }}>
            <span style={{ color: '#6b7280', fontSize: 11 }}><IconMic /></span>
            <span style={{ fontSize: 12, color: '#6b7280' }}>{fmtTime(msg.durationSec)}</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignSelf: 'flex-start', maxWidth: '85%' }}>
      <p style={{ margin: 0, fontSize: 14, color: '#ececec', lineHeight: 1.65 }}>
        {msg.text}
        {msg.streaming && (
          <span style={{
            display: 'inline-block', width: 2, height: 16,
            background: '#ececec', marginLeft: 2, verticalAlign: 'middle',
            animation: 'blink 0.8s step-end infinite',
          }} />
        )}
      </p>
      {!msg.streaming && msg.text && (
        <div style={{ display: 'flex', gap: 6 }}>
          {[<IconThumbUp key="up" />, <IconThumbDown key="down" />].map((icon, i) => (
            <button key={i} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: 2 }}
              onMouseEnter={e => (e.currentTarget.style.color = '#ececec')}
              onMouseLeave={e => (e.currentTarget.style.color = '#6b7280')}>
              {icon}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function VoicePage() {
  const [appState, setAppState] = useState<AppState>('idle')
  const [messages, setMessages] = useState<Msg[]>([])
  const [showNotif, setShowNotif] = useState(false)
  const [showEnded, setShowEnded] = useState(false)
  const [sessionDur, setSessionDur] = useState(0)
  const [audioLevel, setAudioLevel] = useState(0)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [error, setError] = useState('')

  const wsRef = useRef<WebSocket | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const silTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const speakingRef = useRef(false)
  const rafRef = useRef(0)
  const durTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startRef = useRef(0)
  const turnStartRef = useRef(0)
  const bottomRef = useRef<HTMLDivElement>(null)
  const assistantIdRef = useRef<string | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const dataRef = useRef<Uint8Array | null>(null)

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, appState])

  // ── WebSocket handler ──────────────────────────────────────────────────────
  const onWsMsg = useCallback((raw: string) => {
    let ev: Record<string, unknown>
    try { ev = JSON.parse(raw) } catch { return }

    switch (ev.type) {
      case 'connected':
        setAppState('listening')
        setShowNotif(true)
        startRef.current = Date.now()
        durTimerRef.current = setInterval(() => {
          setSessionDur(Math.round((Date.now() - startRef.current) / 1000))
        }, 1000)
        break

      case 'stt': {
        const dur = Math.round((Date.now() - turnStartRef.current) / 1000)
        setMessages(prev => [...prev, { id: uid(), role: 'user', text: ev.text as string, durationSec: dur }])
        assistantIdRef.current = null
        setAppState('processing')
        break
      }

      case 'llm_chunk': {
        const chunk = ev.text as string
        setMessages(prev => {
          if (!assistantIdRef.current) {
            const id = uid()
            assistantIdRef.current = id
            return [...prev, { id, role: 'assistant', text: chunk, streaming: true }]
          }
          return prev.map(m => m.id === assistantIdRef.current ? { ...m, text: m.text + chunk } : m)
        })
        setAppState('responding')
        break
      }

      case 'llm_done':
        setMessages(prev => prev.map(m => m.id === assistantIdRef.current ? { ...m, text: ev.full_text as string, streaming: false } : m))
        break

      case 'tts_chunk': {
        const bytes = Uint8Array.from(atob(ev.audio_b64 as string), c => c.charCodeAt(0))
        void playMp3(bytes)
        break
      }

      case 'tts_done':
        setAppState('listening')
        break

      case 'interrupted':
        stopAudio()
        setAppState('listening')
        break

      case 'session_ended':
        setSessionDur(ev.duration_seconds as number)
        cleanup()
        setAppState('ended')
        setShowEnded(true)
        break

      case 'error':
        setError(ev.message as string)
        setAppState('error')
        break
    }
  }, [])

  // ── Audio playback ─────────────────────────────────────────────────────────
  const playMp3 = async (bytes: Uint8Array) => {
    try {
      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        audioCtxRef.current = new AudioContext()
      }
      const ctx = audioCtxRef.current
      const buf = await ctx.decodeAudioData(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength))
      const src = ctx.createBufferSource()
      src.buffer = buf
      src.connect(ctx.destination)
      src.start()
    } catch { /* partial chunk */ }
  }

  const stopAudio = () => {
    try { audioCtxRef.current?.close() } catch { /* */ }
    audioCtxRef.current = null
  }

  // ── VAD loop ───────────────────────────────────────────────────────────────
  const vadLoop = useCallback(() => {
    const analyser = analyserRef.current
    const data = dataRef.current
    if (!analyser || !data) return

    analyser.getByteFrequencyData(data)
    const rms = Math.sqrt(data.reduce((s, v) => s + v * v, 0) / data.length)
    const level = Math.min(rms / 128, 1)
    setAudioLevel(level)

    if (rms > SPEECH_THRESH) {
      if (silTimerRef.current) { clearTimeout(silTimerRef.current); silTimerRef.current = null }
      if (!speakingRef.current) {
        speakingRef.current = true
        setIsSpeaking(true)
        // Start recording
        if (streamRef.current) {
          chunksRef.current = []
          try {
            recorderRef.current = new MediaRecorder(streamRef.current, { mimeType: 'audio/webm;codecs=opus' })
            recorderRef.current.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
            recorderRef.current.start(100)
          } catch {
            recorderRef.current = new MediaRecorder(streamRef.current)
            recorderRef.current.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
            recorderRef.current.start(100)
          }
        }
        // Barge-in
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'interrupt' }))
          stopAudio()
        }
        turnStartRef.current = Date.now()
      }
    } else if (speakingRef.current) {
      if (!silTimerRef.current) {
        silTimerRef.current = setTimeout(() => {
          speakingRef.current = false
          setIsSpeaking(false)
          silTimerRef.current = null
          // Stop recorder and send audio
          if (recorderRef.current && recorderRef.current.state !== 'inactive') {
            recorderRef.current.onstop = async () => {
              const blob = new Blob(chunksRef.current, { type: 'audio/webm;codecs=opus' })
              if (blob.size < 1000) { setAppState('listening'); return }
              setAppState('transcribing')
              if (wsRef.current?.readyState === WebSocket.OPEN) {
                const buf = await blob.arrayBuffer()
                wsRef.current.send(buf)
              }
            }
            recorderRef.current.stop()
          }
        }, SILENCE_MS)
      }
    }

    rafRef.current = requestAnimationFrame(vadLoop)
  }, [])

  // ── Start session ──────────────────────────────────────────────────────────
  const startSession = async () => {
    try {
      setAppState('connecting')
      setError('')
      setMessages([])
      setShowEnded(false)

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      })
      streamRef.current = stream

      const ctx = new AudioContext()
      const source = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      analyser.smoothingTimeConstant = 0.5
      source.connect(analyser)
      analyserRef.current = analyser
      dataRef.current = new Uint8Array(analyser.frequencyBinCount)

      // Note: keep separate AudioContext for playback (audioCtxRef)

      const sid = `voice-${Date.now()}`
      const ws = new WebSocket(`${WS_BASE}/api/voice/ws/${sid}`)
      wsRef.current = ws
      ws.onmessage = e => onWsMsg(e.data as string)
      ws.onerror = () => { setError('Connection failed — is backend running on port 8002?'); setAppState('error') }

      await new Promise<void>((res, rej) => {
        ws.onopen = () => res()
        setTimeout(() => rej(new Error('timeout')), 8000)
      })

      ws.send(JSON.stringify({ type: 'config', voice_locale: 'en-US', language: 'en' }))
      rafRef.current = requestAnimationFrame(vadLoop)

    } catch (e) {
      setError(e instanceof Error ? e.message : 'Microphone access denied')
      setAppState('error')
    }
  }

  // ── Cleanup ────────────────────────────────────────────────────────────────
  const cleanup = () => {
    cancelAnimationFrame(rafRef.current)
    if (silTimerRef.current) clearTimeout(silTimerRef.current)
    if (durTimerRef.current) clearInterval(durTimerRef.current)
    streamRef.current?.getTracks().forEach(t => t.stop())
    stopAudio()
    streamRef.current = null
    analyserRef.current = null
    dataRef.current = null
    speakingRef.current = false
  }

  const endSession = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'end' }))
    } else {
      cleanup()
      setAppState('ended')
      setShowEnded(true)
    }
    wsRef.current?.close()
    wsRef.current = null
  }

  useEffect(() => () => { cleanup(); wsRef.current?.close() }, [])

  const isActive = ['connecting', 'listening', 'transcribing', 'processing', 'responding'].includes(appState)
  const stateLabel = isSpeaking ? 'Listening...'
    : appState === 'connecting' ? 'Connecting...'
    : appState === 'transcribing' ? 'Transcribing...'
    : appState === 'processing' ? 'Thinking...'
    : appState === 'responding' ? 'Speaking...'
    : appState === 'listening' ? 'Speak or type anything'
    : ''

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; }
        @keyframes blink { 0%,100% { opacity:1 } 50% { opacity:0 } }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #3f3f3f; border-radius: 3px; }
      `}</style>

      <div style={{ display: 'flex', height: '100vh', background: '#212121', color: '#ececec' }}>

        {/* ── Sidebar ── */}
        <Sidebar />

        {/* ── Main ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: '#ececec' }}>
                {isActive ? 'PYXIS Voice' : 'PYXIS'}
              </span>
              {isActive && (
                <span style={{
                  width: 7, height: 7, borderRadius: '50%', background: '#22c55e',
                  display: 'inline-block', animation: 'blink 2s infinite',
                }} />
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {isActive && (
                <span style={{ fontSize: 12, color: '#6b7280' }}>{fmtTime(sessionDur)}</span>
              )}
              <button style={{ background: 'none', border: 'none', color: '#8e8ea0', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 13 }}>
                <IconShare /> <span>Share</span>
              </button>
              <button style={{ background: 'none', border: 'none', color: '#8e8ea0', cursor: 'pointer' }}>
                <IconDots />
              </button>
            </div>
          </div>

          {/* Chat area */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 48px', display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Idle state */}
            {appState === 'idle' && messages.length === 0 && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
                <div style={{ textAlign: 'center' }}>
                  <h2 style={{ margin: 0, fontSize: 26, fontWeight: 300, color: '#ececec' }}>Where should we begin?</h2>
                </div>
                <button onClick={() => void startSession()} style={{
                  width: 72, height: 72, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                  border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 0 0 0 rgba(37,99,235,0.4)',
                  animation: 'pulseBtn 2.5s ease-in-out infinite',
                }}>
                  <style>{`@keyframes pulseBtn { 0%,100%{box-shadow:0 0 0 0 rgba(37,99,235,0.4)} 50%{box-shadow:0 0 0 18px rgba(37,99,235,0)} }`}</style>
                  <span style={{ color: '#fff', fontSize: 28 }}><IconMic /></span>
                </button>
                <p style={{ margin: 0, color: '#6b7280', fontSize: 13 }}>Tap to start voice conversation</p>
                {error && <p style={{ color: '#ef4444', fontSize: 13 }}>{error}</p>}
              </div>
            )}

            {/* Connecting */}
            {appState === 'connecting' && (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    border: '2px solid #2563eb', borderTopColor: 'transparent',
                    animation: 'spin 0.7s linear infinite', margin: '0 auto 12px',
                  }} />
                  <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
                  <p style={{ color: '#6b7280', margin: 0, fontSize: 13 }}>Connecting...</p>
                </div>
              </div>
            )}

            {/* Error */}
            {appState === 'error' && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
                <p style={{ color: '#ef4444', fontSize: 14, textAlign: 'center', maxWidth: 360 }}>{error}</p>
                <button onClick={() => void startSession()} style={{
                  padding: '8px 20px', background: '#2563eb', border: 'none',
                  borderRadius: 8, color: '#fff', fontSize: 14, cursor: 'pointer',
                }}>Try again</button>
              </div>
            )}

            {/* Voice notification */}
            {showNotif && isActive && (
              <VoiceNotification onDismiss={() => setShowNotif(false)} />
            )}

            {/* Messages */}
            {messages.map(m => <Message key={m.id} msg={m} />)}

            {/* Transcribing pill */}
            {appState === 'transcribing' && <TranscribingPill />}

            {/* Ended pill */}
            {showEnded && (
              <EndedPill duration={sessionDur} onDismiss={() => { setShowEnded(false); setMessages([]) }} />
            )}

            <div ref={bottomRef} />
          </div>

          {/* ── Bottom bar ── */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '10px 20px', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* + button */}
              <button style={{
                width: 32, height: 32, borderRadius: '50%',
                border: '1px solid rgba(255,255,255,0.15)', background: 'none',
                color: '#8e8ea0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <IconPlus />
              </button>

              {/* Text input */}
              <div style={{
                flex: 1, display: 'flex', alignItems: 'center',
                background: '#2f2f2f', borderRadius: 24, padding: '8px 16px',
                border: '1px solid rgba(255,255,255,0.08)',
              }}>
                <input type="text"
                  placeholder={isActive ? 'Type' : 'Ask anything'}
                  style={{
                    flex: 1, background: 'none', border: 'none', outline: 'none',
                    color: '#ececec', fontSize: 14,
                  }}
                />
              </div>

              {/* Mic / listening ring */}
              {isActive
                ? <MicRing level={audioLevel} speaking={isSpeaking} />
                : <button onClick={() => void startSession()} style={{ background: 'none', border: 'none', color: '#8e8ea0', cursor: 'pointer', padding: 6 }}><IconMic /></button>
              }

              {/* End button / voice orb */}
              {isActive
                ? <EndButton onEnd={endSession} active={appState === 'listening' || isSpeaking} />
                : <VoiceOrb onClick={() => void startSession()} />
              }
            </div>

            {/* Status label */}
            {isActive && (
              <p style={{ textAlign: 'center', margin: '6px 0 0', fontSize: 12, color: '#6b7280' }}>
                {stateLabel}
              </p>
            )}

            <p style={{ textAlign: 'center', margin: '4px 0 0', fontSize: 11, color: '#3f3f3f' }}>
              PYXIS can make mistakes. Verify important information.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
