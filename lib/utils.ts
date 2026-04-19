import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { ConfidenceTag } from './types'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

export function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (diff < 60000) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str
  return str.slice(0, maxLen - 3) + '...'
}

export function extractConfidenceTags(content: string): ConfidenceTag[] {
  const tags: ConfidenceTag[] = []
  if (content.includes('[VERIFIED]')) tags.push('VERIFIED')
  if (content.includes('[CONSENSUS]')) tags.push('CONSENSUS')
  if (content.includes('[DEBATED]')) tags.push('DEBATED')
  if (content.includes('[SPECULATIVE]')) tags.push('SPECULATIVE')
  return tags
}

export function stripConfidenceTags(content: string): string {
  return content
    .replace(/\[VERIFIED\]/g, '')
    .replace(/\[CONSENSUS\]/g, '')
    .replace(/\[DEBATED\]/g, '')
    .replace(/\[SPECULATIVE\]/g, '')
}

export function estimateTokens(text: string): number {
  // Rough estimate: ~4 chars per token
  return Math.ceil(text.length / 4)
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

export function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard) {
    return navigator.clipboard.writeText(text)
  }
  const el = document.createElement('textarea')
  el.value = text
  el.style.position = 'fixed'
  el.style.opacity = '0'
  document.body.appendChild(el)
  el.select()
  document.execCommand('copy')
  document.body.removeChild(el)
  return Promise.resolve()
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function getFeatureColor(feature: string): string {
  const map: Record<string, string> = {
    standard: '#6366f1',
    trident: '#f59e0b',
    forge: '#ef4444',
    parliament: '#8b5cf6',
    oracle: '#06b6d4',
    nemesis: '#dc2626',
    helix: '#10b981',
    tides: '#3b82f6',
    gravity: '#7c3aed',
    'dark-knowledge': '#475569',
    mirror: '#ec4899',
    civilization: '#d97706',
    symphony: '#a855f7',
    vault: '#f59e0b',
    'blind-spots': '#64748b',
    precognition: '#0ea5e9',
    shadow: '#6d28d9',
    'temporal-waves': '#8b5cf6',
    'synaptic-sprint': '#22c55e',
    'final-boss': '#dc2626',
    'babel-mind': '#f97316',
    'alien-mode': '#06ffa5',
    voice: '#ec4899',
    curriculum: '#84cc16',
    'cosmos-classroom': '#818cf8',
    assessment: '#6366f1',
    'living-syllabus': '#22c55e',
  }
  return map[feature] ?? '#6366f1'
}

export function parseSections(content: string): Record<string, string> {
  const sections: Record<string, string> = {}
  const sectionHeaders = [
    'ORIENTATION',
    'SURFACE',
    'STRUCTURAL',
    'EXPERT',
    'EXAMPLES',
    'VISUAL',
    'EDGE CASES',
    'CROSS DOMAIN',
    'FRONTIER',
    'TEST YOURSELF',
    'NEXT MOVE',
  ]

  let current = 'intro'
  const lines = content.split('\n')
  const buffer: string[] = []

  for (const line of lines) {
    const header = sectionHeaders.find(h =>
      line.trim().startsWith(h + ':') || line.trim() === h
    )
    if (header) {
      if (buffer.length > 0) sections[current] = buffer.join('\n').trim()
      current = header
      buffer.length = 0
      const rest = line.slice(line.indexOf(':') + 1).trim()
      if (rest) buffer.push(rest)
    } else {
      buffer.push(line)
    }
  }
  if (buffer.length > 0) sections[current] = buffer.join('\n').trim()

  return sections
}
