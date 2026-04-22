'use client'

/**
 * useVoiceSession
 * ===============
 * Manages the full real-time voice pipeline:
 *   Mic → VAD → WebSocket (binary audio) → STT/LLM/TTS events
 *
 * State machine:
 *   idle → listening → processing → responding → idle
 *   any → interrupted → listening (barge-in)
 *
 * Usage:
 *   const voice = useVoiceSession(sessionId)
 *   voice.start()   — request mic + open WS
 *   voice.stop()    — end session
 *   voice.interrupt() — barge-in
 */

import { useCallback, useEffect, useRef, useState } from 'react'

const BASE_WS = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000')
  .replace(/^http/, 'ws')

export type VoiceState =
  | 'idle'
  | 'connecting'
  | 'listening'
  | 'transcribing'
  | 'processing'
  | 'responding'
  | 'interrupted'
  | 'ended'
  | 'error'

export interface VoiceMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  isStreaming?: boolean
  durationSeconds?: number
}

interface UseVoiceSessionReturn {
  state: VoiceState
  messages: VoiceMessage[]
  sessionDuration: number
  error: string | null
  audioLevel: number          // 0-1, real-time mic amplitude
  isSpeaking: boolean         // VAD: user currently speaking
  start: () => Promise<void>
  stop: () => void
  interrupt: () => void
  clearMessages: () => void
}

// Simple VAD: silence detection via AudioContext analyser
function createVAD(
  stream: MediaStream,
  onSpeechStart: () => void,
  onSpeechEnd: (audioBlob: Blob) => void,
  onLevelChange: (level: number) => void,
) {
  const ctx = new AudioContext({ sampleRate: 16000 })
  const source = ctx.createMediaStreamSource(stream)
  const analyser = ctx.createAnalyser()
  analyser.fftSize = 256
  analyser.smoothingTimeConstant = 0.4
  source.connect(analyser)

  const bufferLength = analyser.frequencyBinCount
  const dataArray = new Uint8Array(bufferLength)

  let recorder: MediaRecorder | null = null
  let chunks: BlobEvent['data'][] = []
  let isSpeaking = false
  let silenceTimer: ReturnType<typeof setTimeout> | null = null
  let rafId = 0

  const SPEECH_THRESHOLD = 15    // RMS threshold to detect speech
  const SILENCE_DELAY_MS = 800   // ms of silence before committing audio

  const startRecording = () => {
    chunks = []
    recorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' })
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data) }
    recorder.start(100) // collect chunks every 100ms
  }

  const stopRecording = (): Promise<Blob> => {
    return new Promise((resolve) => {
      if (!recorder) { resolve(new Blob()); return }
      recorder.onstop = () => resolve(new Blob(chunks, { type: 'audio/webm;codecs=opus' }))
      recorder.stop()
    })
  }

  const tick = async () => {
    analyser.getByteFrequencyData(dataArray)
    const rms = Math.sqrt(dataArray.reduce((s, v) => s + v * v, 0) / bufferLength)
    const level = Math.min(rms / 128, 1)
    onLevelChange(level)

    if (rms > SPEECH_THRESHOLD) {
      // Speech detected
      if (silenceTimer) { clearTimeout(silenceTimer); silenceTimer = null }
      if (!isSpeaking) {
        isSpeaking = true
        onSpeechStart()
        startRecording()
      }
    } else if (isSpeaking) {
      // Silence while was speaking
      if (!silenceTimer) {
        silenceTimer = setTimeout(async () => {
          isSpeaking = false
          const blob = await stopRecording()
          onSpeechEnd(blob)
        }, SILENCE_DELAY_MS)
      }
    }

    rafId = requestAnimationFrame(tick)
  }

  tick()

  return {
    destroy: () => {
      cancelAnimationFrame(rafId)
      if (silenceTimer) clearTimeout(silenceTimer)
      recorder?.stop()
      ctx.close()
    },
    getIsSpeaking: () => isSpeaking,
  }
}

let _msgId = 0
const nextId = () => String(++_msgId)

export function useVoiceSession(sessionId: string): UseVoiceSessionReturn {
  const [state, setState] = useState<VoiceState>('idle')
  const [messages, setMessages] = useState<VoiceMessage[]>([])
  const [sessionDuration, setSessionDuration] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [audioLevel, setAudioLevel] = useState(0)
  const [isSpeaking, setIsSpeaking] = useState(false)

  const wsRef = useRef<WebSocket | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const vadRef = useRef<ReturnType<typeof createVAD> | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const audioQueueRef = useRef<Uint8Array[]>([])
  const isPlayingRef = useRef(false)
  const currentAssistantIdRef = useRef<string | null>(null)
  const startTimeRef = useRef<number>(0)
  const durationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Audio playback (MP3 chunks via Web Audio API) ────────────────────────
  const playAudioChunk = useCallback(async (mp3Bytes: Uint8Array) => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext()
    }
    const ctx = audioCtxRef.current
    try {
      const buffer = await ctx.decodeAudioData(mp3Bytes.buffer.slice(
        mp3Bytes.byteOffset,
        mp3Bytes.byteOffset + mp3Bytes.byteLength
      ))
      const src = ctx.createBufferSource()
      src.buffer = buffer
      src.connect(ctx.destination)
      await new Promise<void>((res) => { src.onended = () => res(); src.start() })
    } catch {
      // Partial chunk — queue for next decode attempt
    }
  }, [])

  const stopAudio = useCallback(() => {
    if (audioCtxRef.current) {
      audioCtxRef.current.close()
      audioCtxRef.current = null
    }
    audioQueueRef.current = []
    isPlayingRef.current = false
  }, [])

  // ── WebSocket message handler ─────────────────────────────────────────────
  const handleWsMessage = useCallback((raw: string) => {
    let event: Record<string, unknown>
    try { event = JSON.parse(raw) } catch { return }

    switch (event.type) {
      case 'connected':
        setState('listening')
        break

      case 'stt': {
        // User's transcription arrived — create user message bubble
        const userMsg: VoiceMessage = {
          id: nextId(),
          role: 'user',
          content: event.text as string,
          durationSeconds: Math.round((Date.now() - startTimeRef.current) / 1000),
        }
        setMessages(prev => [...prev, userMsg])
        setState('processing')
        // Reset for assistant message
        currentAssistantIdRef.current = null
        break
      }

      case 'llm_chunk': {
        // Stream AI response text
        const chunk = event.text as string
        setMessages(prev => {
          if (!currentAssistantIdRef.current) {
            // First chunk — create placeholder
            const id = nextId()
            currentAssistantIdRef.current = id
            return [...prev, { id, role: 'assistant', content: chunk, isStreaming: true }]
          }
          return prev.map(m =>
            m.id === currentAssistantIdRef.current
              ? { ...m, content: m.content + chunk }
              : m
          )
        })
        setState('responding')
        break
      }

      case 'llm_done': {
        // Finalize assistant message
        setMessages(prev =>
          prev.map(m =>
            m.id === currentAssistantIdRef.current
              ? { ...m, content: event.full_text as string, isStreaming: false }
              : m
          )
        )
        break
      }

      case 'tts_chunk': {
        // Play audio chunk
        const b64 = event.audio_b64 as string
        const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0))
        void playAudioChunk(bytes)
        break
      }

      case 'tts_done':
        setState('listening')
        break

      case 'interrupted':
        stopAudio()
        setState('listening')
        break

      case 'session_ended':
        setSessionDuration(event.duration_seconds as number)
        setState('ended')
        break

      case 'error':
        setError(event.message as string)
        setState('error')
        break
    }
  }, [playAudioChunk, stopAudio])

  // ── Start session ────────────────────────────────────────────────────────
  const start = useCallback(async () => {
    try {
      setState('connecting')
      setError(null)
      setMessages([])
      startTimeRef.current = Date.now()

      // Request microphone
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
        }
      })
      streamRef.current = stream

      // Open WebSocket
      const ws = new WebSocket(`${BASE_WS}/api/voice/ws/${sessionId}`)
      wsRef.current = ws

      ws.onmessage = (e) => handleWsMessage(e.data as string)
      ws.onerror = () => {
        setError('Connection error — check backend is running')
        setState('error')
      }
      ws.onclose = () => {
        if (state !== 'ended') setState('idle')
      }

      await new Promise<void>((res, rej) => {
        ws.onopen = () => res()
        setTimeout(() => rej(new Error('WS connection timeout')), 10000)
      })

      // Send config
      ws.send(JSON.stringify({ type: 'config', voice_locale: 'en-US', language: 'en' }))

      // Start VAD
      vadRef.current = createVAD(
        stream,
        // onSpeechStart
        () => {
          setIsSpeaking(true)
          // Stop current TTS if responding (barge-in)
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'interrupt' }))
          }
          stopAudio()
          setState('listening')
        },
        // onSpeechEnd
        async (blob: Blob) => {
          setIsSpeaking(false)
          if (blob.size < 1000) return // too short, ignore
          startTimeRef.current = Date.now()
          setState('transcribing')
          // Send audio to backend
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            const buffer = await blob.arrayBuffer()
            wsRef.current.send(buffer)
          }
        },
        // onLevelChange
        (level: number) => setAudioLevel(level),
      )

      // Duration timer
      durationTimerRef.current = setInterval(() => {
        setSessionDuration(Math.round((Date.now() - startTimeRef.current) / 1000))
      }, 1000)

    } catch (e) {
      setError(e instanceof Error ? e.message : 'Microphone access denied')
      setState('error')
    }
  }, [sessionId, handleWsMessage, stopAudio, state])

  // ── Stop session ─────────────────────────────────────────────────────────
  const stop = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'end' }))
    }
    vadRef.current?.destroy()
    streamRef.current?.getTracks().forEach(t => t.stop())
    stopAudio()
    if (durationTimerRef.current) clearInterval(durationTimerRef.current)
    wsRef.current?.close()
    vadRef.current = null
    streamRef.current = null
    wsRef.current = null
    setState('ended')
  }, [stopAudio])

  // ── Barge-in ──────────────────────────────────────────────────────────────
  const interrupt = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'interrupt' }))
    }
    stopAudio()
    setState('interrupted')
    setTimeout(() => setState('listening'), 100)
  }, [stopAudio])

  const clearMessages = useCallback(() => setMessages([]), [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      vadRef.current?.destroy()
      streamRef.current?.getTracks().forEach(t => t.stop())
      wsRef.current?.close()
      if (durationTimerRef.current) clearInterval(durationTimerRef.current)
      stopAudio()
    }
  }, [stopAudio])

  return {
    state, messages, sessionDuration, error,
    audioLevel, isSpeaking,
    start, stop, interrupt, clearMessages,
  }
}
