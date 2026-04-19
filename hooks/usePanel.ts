'use client'

import { useCallback } from 'react'
import { useUIStore } from '@/store/uiStore'
import type { FeatureMode } from '@/lib/types'

export function usePanel() {
  const { activePanels, openPanel, closePanel, setActivePanel, activePanel } =
    useUIStore()

  const toggle = useCallback(
    (panelId: FeatureMode) => {
      if (activePanels.includes(panelId)) {
        closePanel(panelId)
      } else {
        openPanel(panelId)
      }
    },
    [activePanels, openPanel, closePanel]
  )

  const isOpen = useCallback(
    (panelId: string) => activePanels.includes(panelId),
    [activePanels]
  )

  return { toggle, isOpen, openPanel, closePanel, setActivePanel, activePanel, activePanels }
}
