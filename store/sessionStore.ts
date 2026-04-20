import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { nanoid } from 'nanoid'
import type { Message, FeatureMode } from '@/lib/types'
import { getChatHistory } from '@/lib/api'

export interface SessionSummary {
  id: string
  title: string
  timestamp: number
  feature: FeatureMode
  messageCount: number
}

interface SessionState {
  sessionId: string
  studentName: string
  messages: Message[]
  currentFeature: FeatureMode
  isStreaming: boolean
  tokenCount: number
  sessionStart: number
  sessions: SessionSummary[]

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
  switchSession: (id: string) => Promise<void>
  deleteSession: (id: string) => void
  updateSessionTitle: (title: string) => void
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
      sessions: [],

      initSession: () => {
        const { sessionId, messages, currentFeature, sessions } = get()
        // Save current session to history if it has messages
        const firstUserMsg = messages.find((m) => m.role === 'user')
        if (firstUserMsg) {
          const existing = sessions.find((s) => s.id === sessionId)
          const summary: SessionSummary = {
            id: sessionId,
            title: firstUserMsg.content.slice(0, 60) + (firstUserMsg.content.length > 60 ? '…' : ''),
            timestamp: Date.now(),
            feature: currentFeature,
            messageCount: messages.length,
          }
          const updated = existing
            ? sessions.map((s) => (s.id === sessionId ? summary : s))
            : [summary, ...sessions].slice(0, 50) // keep max 50
          set({ sessions: updated })
        }
        set({
          sessionId: nanoid(),
          messages: [],
          tokenCount: 0,
          sessionStart: Date.now(),
          currentFeature: 'standard',
        })
      },

      switchSession: async (id) => {
        const { sessionId, messages, currentFeature, sessions } = get()
        // Save current session summary first
        const firstUserMsg = messages.find((m) => m.role === 'user')
        if (firstUserMsg) {
          const existing = sessions.find((s) => s.id === sessionId)
          const summary: SessionSummary = {
            id: sessionId,
            title: firstUserMsg.content.slice(0, 60) + (firstUserMsg.content.length > 60 ? '…' : ''),
            timestamp: Date.now(),
            feature: currentFeature,
            messageCount: messages.length,
          }
          const updated = existing
            ? sessions.map((s) => (s.id === sessionId ? summary : s))
            : [summary, ...sessions].slice(0, 50)
          set({ sessions: updated })
        }
        const target = sessions.find((s) => s.id === id)
        set({
          sessionId: id,
          messages: [],
          tokenCount: 0,
          sessionStart: target?.timestamp ?? Date.now(),
          currentFeature: target?.feature ?? 'standard',
        })
        // Restore messages from backend
        try {
          const history = await getChatHistory(id, 100)
          const restored: Message[] = history.map((m) => ({
            id: m.id,
            role: m.role as 'user' | 'assistant',
            content: m.content,
            timestamp: new Date(m.timestamp).getTime(),
            feature_mode: (m.feature_mode as FeatureMode) ?? 'standard',
            isStreaming: false,
          }))
          set({ messages: restored })
        } catch {
          // Backend unavailable — leave messages empty, session ID is correct
        }
      },

      deleteSession: (id) => {
        set((state) => ({ sessions: state.sessions.filter((s) => s.id !== id) }))
      },

      updateSessionTitle: (title) => {
        const { sessionId, sessions } = get()
        set({
          sessions: sessions.map((s) =>
            s.id === sessionId ? { ...s, title } : s
          ),
        })
      },

      setStudentName: (name) => set({ studentName: name }),

      addMessage: (message) => {
        const fullMessage: Message = {
          ...message,
          id: nanoid(),
          timestamp: Date.now(),
        }
        set((state) => {
          const messages = [...state.messages, fullMessage]
          // Auto-update session title from first user message
          let sessions = state.sessions
          if (fullMessage.role === 'user' && messages.filter((m) => m.role === 'user').length === 1) {
            const title = fullMessage.content.slice(0, 60) + (fullMessage.content.length > 60 ? '…' : '')
            const existing = sessions.find((s) => s.id === state.sessionId)
            if (existing) {
              sessions = sessions.map((s) => s.id === state.sessionId ? { ...s, title } : s)
            }
          }
          return { messages, sessions }
        })
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
      addTokens: (count) => set((state) => ({ tokenCount: state.tokenCount + count })),

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
        sessions: state.sessions,
        // Keep last 150 messages — enough for full recall, within localStorage budget
        messages: state.messages.slice(-150),
      }),
    }
  )
)
