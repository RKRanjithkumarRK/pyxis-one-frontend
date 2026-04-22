'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface AuthUser {
  id: string
  email: string
  display_name: string
  role: 'admin' | 'user' | 'guest'
  plan: 'free' | 'pro' | 'enterprise'
}

interface AuthState {
  user: AuthUser | null
  accessToken: string | null
  refreshToken: string | null

  // Actions
  setAuth: (user: AuthUser, accessToken: string, refreshToken: string) => void
  clearAuth: () => void
  setUser: (user: AuthUser) => void
  isAdmin: () => boolean
  isAuthenticated: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,

      setAuth: (user, accessToken, refreshToken) =>
        set({ user, accessToken, refreshToken }),

      clearAuth: () => set({ user: null, accessToken: null, refreshToken: null }),

      setUser: (user) => set({ user }),

      isAdmin: () => get().user?.role === 'admin',

      isAuthenticated: () => !!get().accessToken && !!get().user,
    }),
    {
      name: 'pyxis-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    }
  )
)
