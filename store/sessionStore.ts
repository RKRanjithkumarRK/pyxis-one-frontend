import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { nanoid } from 'nanoid'
import type { Message, FeatureMode, Workspace, ToolCall, FileAttachment, TokenUsage } from '@/lib/types'
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
  currentWorkspace: Workspace
  isStreaming: boolean
  tokenCount: number
  sessionStart: number
  sessions: SessionSummary[]

  // New: conversation + model
  conversationId: string | null
  selectedModel: string
  enableWebSearch: boolean
  pendingFiles: FileAttachment[]

  // Actions — existing
  initSession: () => void
  setStudentName: (name: string) => void
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => Message
  updateLastAssistantMessage: (chunk: string) => void
  finalizeLastMessage: (opts?: { model?: string; usage?: TokenUsage }) => void
  setFeature: (feature: FeatureMode) => void
  setWorkspace: (workspace: Workspace) => void
  setStreaming: (streaming: boolean) => void
  clearMessages: () => void
  addTokens: (count: number) => void
  branchFrom: (messageId: string) => void
  switchSession: (id: string) => Promise<void>
  deleteSession: (id: string) => void
  updateSessionTitle: (title: string) => void

  // Actions — new
  setConversationId: (id: string | null) => void
  setSelectedModel: (model: string) => void
  setWebSearch: (enabled: boolean) => void
  addPendingFile: (file: FileAttachment) => void
  removePendingFile: (fileId: string) => void
  clearPendingFiles: () => void

  // Tool event handlers (called from useChat)
  addToolCall: (msgId: string, tool: ToolCall) => void
  updateToolCall: (msgId: string, callId: string, updates: Partial<ToolCall>) => void
  setThinking: (content: string) => void
  setLastMessageError: (error: string, code?: string) => void
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      sessionId: nanoid(),
      studentName: '',
      messages: [],
      currentFeature: 'standard',
      currentWorkspace: 'think',
      isStreaming: false,
      tokenCount: 0,
      sessionStart: Date.now(),
      sessions: [],
      conversationId: null,
      selectedModel: 'claude-sonnet-4-6',
      enableWebSearch: false,
      pendingFiles: [],

      // ── Existing actions ────────────────────────────────────────────────

      initSession: () => {
        const { sessionId, messages, currentFeature, sessions } = get()
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
        set({
          sessionId: nanoid(),
          messages: [],
          tokenCount: 0,
          sessionStart: Date.now(),
          currentFeature: 'standard',
          conversationId: null,
        })
      },

      switchSession: async (id) => {
        const { sessionId, messages, currentFeature, sessions } = get()
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
          conversationId: null,
        })
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
        } catch { /* silent */ }
      },

      deleteSession: (id) => {
        set((state) => ({ sessions: state.sessions.filter((s) => s.id !== id) }))
      },

      updateSessionTitle: (title) => {
        const { sessionId, sessions } = get()
        set({ sessions: sessions.map((s) => s.id === sessionId ? { ...s, title } : s) })
      },

      setStudentName: (name) => set({ studentName: name }),

      addMessage: (message) => {
        const fullMessage: Message = { ...message, id: nanoid(), timestamp: Date.now() }
        set((state) => {
          const messages = [...state.messages, fullMessage]
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

      finalizeLastMessage: (opts) => {
        set((state) => {
          const messages = [...state.messages]
          const lastIdx = messages.length - 1
          if (lastIdx >= 0 && messages[lastIdx].role === 'assistant') {
            messages[lastIdx] = {
              ...messages[lastIdx],
              isStreaming: false,
              ...(opts?.model   ? { model: opts.model }   : {}),
              ...(opts?.usage   ? { usage: opts.usage }   : {}),
            }
          }
          return { messages, isStreaming: false }
        })
      },

      setFeature: (feature) => set({ currentFeature: feature }),
      setWorkspace: (workspace) => set({ currentWorkspace: workspace, currentFeature: 'standard' }),
      setStreaming: (streaming) => set({ isStreaming: streaming }),
      clearMessages: () => set({ messages: [], tokenCount: 0 }),
      addTokens: (count) => set((state) => ({ tokenCount: state.tokenCount + count })),

      branchFrom: (messageId) => {
        const { messages } = get()
        const idx = messages.findIndex((m) => m.id === messageId)
        if (idx < 0) return
        set({ messages: messages.slice(0, idx + 1) })
      },

      // ── New actions ─────────────────────────────────────────────────────

      setConversationId: (id) => set({ conversationId: id }),
      setSelectedModel: (model) => set({ selectedModel: model }),
      setWebSearch: (enabled) => set({ enableWebSearch: enabled }),

      addPendingFile: (file) =>
        set((state) => ({ pendingFiles: [...state.pendingFiles, file] })),

      removePendingFile: (fileId) =>
        set((state) => ({ pendingFiles: state.pendingFiles.filter((f) => f.file_id !== fileId) })),

      clearPendingFiles: () => set({ pendingFiles: [] }),

      addToolCall: (msgId, tool) => {
        set((state) => {
          const messages = [...state.messages]
          const lastIdx = messages.length - 1
          if (lastIdx >= 0 && messages[lastIdx].role === 'assistant') {
            const existing = messages[lastIdx].toolCalls ?? []
            messages[lastIdx] = {
              ...messages[lastIdx],
              toolCalls: [...existing, tool],
            }
          }
          return { messages }
        })
      },

      updateToolCall: (msgId, callId, updates) => {
        set((state) => {
          const messages = state.messages.map((m) => {
            if (m.role !== 'assistant' || !m.toolCalls) return m
            return {
              ...m,
              toolCalls: m.toolCalls.map((tc) =>
                tc.id === callId ? { ...tc, ...updates } : tc
              ),
            }
          })
          return { messages }
        })
      },

      setThinking: (content) => {
        set((state) => {
          const messages = [...state.messages]
          const lastIdx = messages.length - 1
          if (lastIdx >= 0 && messages[lastIdx].role === 'assistant') {
            messages[lastIdx] = { ...messages[lastIdx], thinkingContent: content }
          }
          return { messages }
        })
      },

      setLastMessageError: (error, code) => {
        set((state) => {
          const messages = [...state.messages]
          const lastIdx = messages.length - 1
          if (lastIdx >= 0 && messages[lastIdx].role === 'assistant') {
            messages[lastIdx] = {
              ...messages[lastIdx],
              isStreaming: false,
              isError: true,
              errorCode: code,
              content: messages[lastIdx].content || error,
            }
          }
          return { messages, isStreaming: false }
        })
      },
    }),
    {
      name: 'pyxis-session',
      partialize: (state) => ({
        sessionId: state.sessionId,
        studentName: state.studentName,
        currentFeature: state.currentFeature,
        currentWorkspace: state.currentWorkspace,
        sessionStart: state.sessionStart,
        sessions: state.sessions,
        selectedModel: state.selectedModel,
        messages: state.messages.slice(-150),
      }),
    }
  )
)
