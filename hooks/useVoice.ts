'use client'

import { useState, useRef, useCallback } from 'react'
import { AudioRecorder } from '@/lib/audio'

interface UseVoiceReturn {
  isRecording: boolean
  duration: number
  audioBlob: Blob | null
  startRecording: () => Promise<void>
  stopRecording: () => Promise<Blob | null>
  error: string | null
}

export function useVoice(): UseVoiceReturn {
  const [isRecording, setIsRecording] = useState(false)
  const [duration, setDuration] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [error, setError] = useState<string | null>(null)
  const recorderRef = useRef<AudioRecorder | null>(null)

  const startRecording = useCallback(async () => {
    setError(null)
    setAudioBlob(null)
    setDuration(0)

    try {
      recorderRef.current = new AudioRecorder()
      await recorderRef.current.start((secs) => setDuration(secs))
      setIsRecording(true)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Microphone access denied'
      setError(msg)
    }
  }, [])

  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    if (!recorderRef.current?.isRecording) return null

    try {
      const blob = await recorderRef.current.stop()
      setAudioBlob(blob)
      setIsRecording(false)
      return blob
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Recording failed'
      setError(msg)
      setIsRecording(false)
      return null
    }
  }, [])

  return { isRecording, duration, audioBlob, startRecording, stopRecording, error }
}
