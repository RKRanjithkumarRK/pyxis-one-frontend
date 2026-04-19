import { create } from 'zustand'
import type { PsycheVisualizationResponse } from '@/lib/types'

interface PsycheState {
  dimensions: Record<string, number>
  trends: Record<string, string>
  organismHealth: number
  lastUpdated: number | null
  isLoading: boolean

  setVisualization: (data: PsycheVisualizationResponse) => void
  setDimension: (dimension: string, value: number) => void
  setDimensions: (dims: Record<string, number>) => void
  setLoading: (loading: boolean) => void
  reset: () => void
}

export const usePsycheStore = create<PsycheState>((set) => ({
  dimensions: {},
  trends: {},
  organismHealth: 0.5,
  lastUpdated: null,
  isLoading: false,

  setVisualization: (data) =>
    set({
      dimensions: data.dimensions,
      trends: data.trends,
      organismHealth: data.organism_health,
      lastUpdated: Date.now(),
    }),

  setDimension: (dimension, value) =>
    set((state) => ({
      dimensions: { ...state.dimensions, [dimension]: value },
    })),

  setDimensions: (dims) =>
    set((state) => ({
      dimensions: { ...state.dimensions, ...dims },
    })),

  setLoading: (loading) => set({ isLoading: loading }),

  reset: () =>
    set({
      dimensions: {},
      trends: {},
      organismHealth: 0.5,
      lastUpdated: null,
    }),
}))
