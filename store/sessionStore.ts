import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { nanoid } from 'nanoid'
import type { Message, FeatureMode } from '@/lib/types'

interface SessionState {
  sessionId: string
  studentName: string
  messages: Message[]
  currentFeature: FeatureMode
  isStreaming: boolean
  tokenCount: number
  sessionStart: number

  // Actions
  initSession: () => void
  setStudentName: (name: string) => void
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => Message
  updateLastAssistantMessage: (chunk: string) => void
  finalizeLastMessage: () => void
  setFeature: (feature: FeatureMode) => void
  setStreaming: (streaming: boolean) => void
  clearMessages: () => void
  addTokens: (count: number) => void
  branchFrom: (messageId: string) => void
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      sessionId: nanoid(),
      studentName: '',
      messages: [],
      currentFeature: 'standard',
      isStreaming: false,
      tokenCount: 0,
      sessionStart: Date.now(),

      initSession: () =>
        set({
          sessionId: nanoid(),
          messages: [],
          tokenCount: 0,
          sessionStart: Date.now(),
        }),

      setStudentName: (name) => set({ studentName: name }),

      addMessage: (message) => {
        const fullMessage: Message = {
          ...message,
          id: nanoid(),
          timestamp: Date.now(),
        }
        set((state) => ({ messages: [...state.messages, fullMessage] }))
        return fullMessage
      },

      updateLastAssistantMessage: (chunk) => {
        set((state) => {
          const messages = [...state.messages]
          const lastIdx = messages.length - 1
          if (lastIdx >= 0 && messages[lastIdx].role === 'assistant') {
            messages[lastIdx] = {
              ...messages[lastIdx],
              content: messages[lastIdx].content + chunk,
              isStreaming: true,
            }
          }
          return { messages }
        })
      },

      finalizeLastMessage: () => {
        set((state) => {
          const messages = [...state.messages]
          const lastIdx = messages.length - 1
          if (lastIdx >= 0 && messages[lastIdx].role === 'assistant') {
            messages[lastIdx] = { ...messages[lastIdx], isStreaming: false }
          }
          return { messages, isStreaming: false }
        })
      },

      setFeature: (feature) => set({ currentFeature: feature }),

      setStreaming: (streaming) => set({ isStreaming: streaming }),

      clearMessages: () => set({ messages: [], tokenCount: 0 }),

      addTokens: (count) =>
        set((state) => ({ tokenCount: state.tokenCount + count })),

      branchFrom: (messageId) => {
        const { messages } = get()
        const idx = messages.findIndex((m) => m.id === messageId)
        if (idx < 0) return
        set({ messages: messages.slice(0, idx + 1) })
      },
    }),
    {
      name: 'pyxis-session',
      partialize: (state) => ({
        sessionId: state.sessionId,
        studentName: state.studentName,
        currentFeature: state.currentFeature,
        sessionStart: state.sessionStart,
        // Don't persist messages to keep storage small
      }),
    }
  )
)
