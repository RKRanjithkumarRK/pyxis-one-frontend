'use client'

import { useEffect } from 'react'

type KeyCombo = string // e.g. "cmd+k", "ctrl+k", "escape"

interface KeyBinding {
  combo: KeyCombo
  handler: (e: KeyboardEvent) => void
  description?: string
}

function matchesCombo(e: KeyboardEvent, combo: string): boolean {
  const parts = combo.toLowerCase().split('+')
  const key = parts[parts.length - 1]
  const needsCmd = parts.includes('cmd') || parts.includes('meta')
  const needsCtrl = parts.includes('ctrl')
  const needsShift = parts.includes('shift')
  const needsAlt = parts.includes('alt')

  const keyMatch =
    e.key.toLowerCase() === key ||
    (key === 'escape' && e.key === 'Escape') ||
    (key === 'enter' && e.key === 'Enter') ||
    (key === 'backspace' && e.key === 'Backspace')

  return (
    keyMatch &&
    (!needsCmd || e.metaKey) &&
    (!needsCtrl || e.ctrlKey) &&
    (!needsShift || e.shiftKey) &&
    (!needsAlt || e.altKey)
  )
}

export function useKeyboard(bindings: KeyBinding[]): void {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      for (const binding of bindings) {
        if (matchesCombo(e, binding.combo)) {
          binding.handler(e)
          break
        }
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [bindings])
}

export function useGlobalShortcuts(): void {
  const { openCommandBar, toggleSidebar } =
    // Avoid circular import — import inline
    require('@/store/uiStore').useUIStore.getState() as {
      openCommandBar: () => void
      toggleSidebar: () => void
    }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Cmd/Ctrl+K → Command bar
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        require('@/store/uiStore').useUIStore.getState().toggleCommandBar()
      }
      // Cmd/Ctrl+\ → Toggle sidebar
      if ((e.metaKey || e.ctrlKey) && e.key === '\\') {
        e.preventDefault()
        require('@/store/uiStore').useUIStore.getState().toggleSidebar()
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])
}
