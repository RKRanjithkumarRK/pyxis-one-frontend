'use client'

export interface RecordingState {
  isRecording: boolean
  duration: number
  blob: Blob | null
}

export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null
  private chunks: Blob[] = []
  private stream: MediaStream | null = null
  private startTime = 0
  private intervalId: ReturnType<typeof setInterval> | null = null

  async start(onTick?: (seconds: number) => void): Promise<void> {
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    this.chunks = []
    this.mediaRecorder = new MediaRecorder(this.stream, {
      mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm',
    })

    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.chunks.push(e.data)
    }

    this.startTime = Date.now()
    this.mediaRecorder.start(100)

    if (onTick) {
      this.intervalId = setInterval(() => {
        onTick(Math.floor((Date.now() - this.startTime) / 1000))
      }, 1000)
    }
  }

  stop(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('MediaRecorder not initialized'))
        return
      }

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.chunks, { type: this.mediaRecorder?.mimeType ?? 'audio/webm' })
        this.cleanup()
        resolve(blob)
      }

      this.mediaRecorder.stop()
    })
  }

  private cleanup(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop())
      this.stream = null
    }
  }

  get isRecording(): boolean {
    return this.mediaRecorder?.state === 'recording'
  }
}

export function getAudioVisualizerData(
  analyser: AnalyserNode,
  bufferLength: number
): Uint8Array {
  const dataArray = new Uint8Array(bufferLength)
  analyser.getByteFrequencyData(dataArray)
  return dataArray
}

export function createAnalyser(stream: MediaStream): {
  analyser: AnalyserNode
  bufferLength: number
  ctx: AudioContext
} {
  const ctx = new AudioContext()
  const source = ctx.createMediaStreamSource(stream)
  const analyser = ctx.createAnalyser()
  analyser.fftSize = 256
  source.connect(analyser)
  return { analyser, bufferLength: analyser.frequencyBinCount, ctx }
}
