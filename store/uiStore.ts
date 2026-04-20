import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Theme } from '@/lib/types'

interface UIState {
  theme: Theme
  sidebarCollapsed: boolean
  activePanels: string[]
  commandBarOpen: boolean
  activePanel: string | null
  settingsOpen: boolean
  mobileSidebarOpen: boolean

  setTheme: (theme: Theme) => void
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  openCommandBar: () => void
  closeCommandBar: () => void
  toggleCommandBar: () => void
  openPanel: (panelId: string) => void
  closePanel: (panelId: string) => void
  setActivePanel: (panelId: string | null) => void
  openSettings: () => void
  closeSettings: () => void
  toggleMobileSidebar: () => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      theme: 'cosmos',
      sidebarCollapsed: false,
      activePanels: [],
      commandBarOpen: false,
      activePanel: null,
      settingsOpen: false,
      mobileSidebarOpen: false,

      setTheme: (theme) => {
        set({ theme })
        // Apply to document
        if (typeof document !== 'undefined') {
          document.documentElement.className = `theme-${theme}`
        }
      },

      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

      openCommandBar: () => set({ commandBarOpen: true }),
      closeCommandBar: () => set({ commandBarOpen: false }),
      toggleCommandBar: () =>
        set((state) => ({ commandBarOpen: !state.commandBarOpen })),

      openPanel: (panelId) =>
        set((state) => ({
          activePanels: state.activePanels.includes(panelId)
            ? state.activePanels
            : [...state.activePanels, panelId],
          activePanel: panelId,
        })),

      closePanel: (panelId) =>
        set((state) => ({
          activePanels: state.activePanels.filter((p) => p !== panelId),
          activePanel: state.activePanel === panelId ? null : state.activePanel,
        })),

      setActivePanel: (panelId) => set({ activePanel: panelId }),
      openSettings: () => set({ settingsOpen: true }),
      closeSettings: () => set({ settingsOpen: false }),
      toggleMobileSidebar: () => set((state) => ({ mobileSidebarOpen: !state.mobileSidebarOpen })),
    }),
    {
      name: 'pyxis-ui',
      partialize: (state) => ({
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
)
