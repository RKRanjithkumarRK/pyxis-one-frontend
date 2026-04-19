'use client'

import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, Square, Volume2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useVoice } from '@/hooks/useVoice'
import { useChat } from '@/hooks/useChat'

export function VoiceSoul() {
  const { isRecording, startRecording, stopRecording } = useVoice()
  const { sendMessage } = useChat()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)

  useEffect(() => {
    if (!isRecording || !canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')!
    let frame = 0
    const draw = () => {
      frame = requestAnimationFrame(draw)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.lineWidth = 2
      ctx.strokeStyle = '#6366f1'
      ctx.beginPath()
      const segments = 64
      for (let i = 0; i <= segments; i++) {
        const x = (i / segments) * canvas.width
        const y = canvas.height / 2 + Math.sin(i * 0.3 + Date.now() * 0.005) * 20
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()
    }
    draw()
    animRef.current = frame
    return () => cancelAnimationFrame(animRef.current)
  }, [isRecording])

  const handleStop = async () => {
    await stopRecording()
    await sendMessage('[Voice message recorded — transcription not implemented in demo]')
  }

  return (
    <div className="h-full flex flex-col gap-4 p-4 overflow-y-auto">
      <div>
        <h2 className="text-display-sm text-[var(--text-primary)]">Voice Soul</h2>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">Speak your thoughts — voice becomes conversation</p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-8">
        <canvas
          ref={canvasRef}
          width={280}
          height={80}
          className="rounded-xl glass"
        />

        <AnimatePresence mode="wait">
          {isRecording ? (
            <motion.div key="recording" initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }}
              className="flex flex-col items-center gap-4"
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1], boxShadow: ['0 0 0 0 rgba(99,102,241,0.4)', '0 0 0 20px rgba(99,102,241,0)', '0 0 0 0 rgba(99,102,241,0)'] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="w-16 h-16 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center"
              >
                <Mic size={24} className="text-red-400" />
              </motion.div>
              <p className="text-xs text-red-400">Recording...</p>
              <Button variant="danger" size="sm" icon={<Square size={13} />} onClick={() => void handleStop()}>Stop</Button>
            </motion.div>
          ) : (
            <motion.div key="idle" initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="w-16 h-16 rounded-full bg-indigo-500/20 border-2 border-indigo-500/50 flex items-center justify-center">
                <Mic size={24} className="text-indigo-400" />
              </div>
              <p className="text-xs text-[var(--text-muted)]">Tap to speak</p>
              <Button variant="primary" size="sm" icon={<Mic size={13} />} onClick={() => void startRecording()}>Start Recording</Button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="glass rounded-xl p-3 w-full">
          <div className="flex items-center gap-2">
            <Volume2 size={13} className="text-[var(--text-muted)]" />
            <span className="text-xs text-[var(--text-muted)]">Voice messages are sent directly to the chat</span>
          </div>
        </div>
      </div>
    </div>
  )
}
