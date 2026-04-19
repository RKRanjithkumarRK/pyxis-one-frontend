'use client'

import { useEffect } from 'react'
import { useUIStore } from '@/store/uiStore'
import { useSessionStore } from '@/store/sessionStore'
import type { FeatureMode } from '@/lib/types'

const FEATURE_SHORTCUTS: Array<[string, FeatureMode]> = [
  ['1', 'standard'],
  ['2', 'cosmos-classroom'],
  ['3', 'trident'],
  ['4', 'forge'],
  ['5', 'parliament'],
  ['6', 'curriculum'],
  ['7', 'oracle'],
  ['8', 'nemesis'],
  ['9', 'helix'],
]

export function KeyboardShortcuts() {
  const { toggleCommandBar, toggleSidebar } = useUIStore()
  const { setFeature } = useSessionStore()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const inInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable

      // Cmd/Ctrl+K — command bar
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        toggleCommandBar()
        return
      }

      // Cmd/Ctrl+\ — sidebar
      if ((e.metaKey || e.ctrlKey) && e.key === '\\') {
        e.preventDefault()
        toggleSidebar()
        return
      }

      // Cmd/Ctrl+1..9 — feature shortcuts
      if ((e.metaKey || e.ctrlKey) && !inInput) {
        const pair = FEATURE_SHORTCUTS.find(([k]) => k === e.key)
        if (pair) {
          e.preventDefault()
          setFeature(pair[1])
        }
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [toggleCommandBar, toggleSidebar, setFeature])

  return null
}
