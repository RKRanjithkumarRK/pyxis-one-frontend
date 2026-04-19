export interface SSEStreamOptions {
  url: string
  body: Record<string, unknown>
  onChunk: (chunk: string) => void
  onDone: () => void
  onError?: (err: Error) => void
}

export function createSSEStream(options: SSEStreamOptions): AbortController {
  const { url, body, onChunk, onDone, onError } = options
  const controller = new AbortController()
  const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

  ;(async () => {
    try {
      const res = await fetch(`${BASE}${url}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      })

      if (!res.ok || !res.body) {
        throw new Error(`SSE stream failed: ${res.status} ${res.statusText}`)
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const raw = line.slice(6).trim()
          if (!raw) continue
          try {
            const data = JSON.parse(raw) as { type: string; content?: string }
            if (data.type === 'text' && data.content) {
              onChunk(data.content)
            } else if (data.type === 'done') {
              onDone()
              return
            } else if (data.type === 'error') {
              throw new Error(data.content ?? 'Stream error')
            }
          } catch (parseErr) {
            // non-JSON SSE line — skip
          }
        }
      }

      onDone()
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      onError?.(err instanceof Error ? err : new Error(String(err)))
    }
  })()

  return controller
}

export async function readStreamToString(
  url: string,
  body: Record<string, unknown>
): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: string[] = []
    const ctrl = createSSEStream({
      url,
      body,
      onChunk: (c) => chunks.push(c),
      onDone: () => resolve(chunks.join('')),
      onError: reject,
    })
    // Auto-timeout after 60 seconds
    setTimeout(() => {
      ctrl.abort()
      resolve(chunks.join(''))
    }, 60000)
  })
}
