import type {
  TridentResponse,
  AssessmentGenerateResponse,
  AssessmentAutopsyResponse,
  ParliamentConveneResponse,
  ForgeStatusResponse,
  CurriculumNextResponse,
  OracleTimelineResponse,
  NemesisChallengeResponse,
  HelixDueResponse,
  TideChartResponse,
  GravityMapResponse,
  DarkKnowledgeDetectResponse,
  MirrorReportResponse,
  CivilizationDecisionResponse,
  VaultSearchResponse,
  VaultEntry,
  PsycheStateResponse,
  PsycheVisualizationResponse,
  DashboardResponse,
  PrecognitionMapResponse,
  ShadowSelfResponse,
  VoiceAnalysisResponse,
} from './types'
import { API_ENDPOINTS } from './constants'

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

type Envelope<T> = { data: T; meta: Record<string, unknown>; errors: null }

function unwrap<T>(json: unknown): T {
  if (json && typeof json === 'object' && 'data' in json && 'meta' in json) {
    return (json as Envelope<T>).data
  }
  return json as T
}

async function post<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const envelope = await res.json().catch(() => null) as { errors?: Array<{ message: string }> } | null
    const message = envelope?.errors?.[0]?.message ?? `API error (${res.status})`
    throw new Error(message)
  }
  return unwrap<T>(await res.json())
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { method: 'GET' })
  if (!res.ok) {
    const envelope = await res.json().catch(() => null) as { errors?: Array<{ message: string }> } | null
    const message = envelope?.errors?.[0]?.message ?? `API error (${res.status})`
    throw new Error(message)
  }
  return unwrap<T>(await res.json())
}

// ── Streaming Chat (upgraded) ─────────────────────────────────────────────

export interface StreamChatOptions {
  sessionId: string
  message: string
  featureMode?: string
  conversationId?: string
  model?: string
  branchIndex?: number
  regenerationAttempt?: number
  enableWebSearch?: boolean
  fileIds?: string[]
  onChunk: (chunk: string) => void
  onToolStart?: (name: string, label: string, callId: string) => void
  onToolDone?: (callId: string, result: string) => void
  onThinking?: (text: string) => void
  onModelSelected?: (model: string, provider: string, intent: string) => void
  onConversationCreated?: (conversationId: string) => void
  onUsage?: (usage: TokenUsage) => void
  onDone: (finishReason?: string) => void
  onError?: (err: Error, code?: string) => void
}

export function streamChat(opts: StreamChatOptions): AbortController {
  const controller = new AbortController()

  const body = {
    session_id: opts.sessionId,
    message: opts.message,
    feature_mode: opts.featureMode ?? 'standard',
    conversation_id: opts.conversationId ?? null,
    model: opts.model ?? null,
    branch_index: opts.branchIndex ?? 0,
    regeneration_attempt: opts.regenerationAttempt ?? 0,
    enable_web_search: opts.enableWebSearch ?? false,
    file_ids: opts.fileIds ?? null,
  }

  ;(async () => {
    try {
      const res = await fetch(`${BASE}${API_ENDPOINTS.CHAT_STREAM}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      })

      if (!res.ok || !res.body) {
        const errData = await res.json().catch(() => null) as Record<string, unknown> | null
        const msg = (errData?.detail as string) ?? `Stream failed: ${res.status}`
        opts.onError?.(new Error(msg), String(res.status))
        opts.onDone()
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''  // keep incomplete last line

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const data = JSON.parse(line.slice(6)) as Record<string, unknown>
            const type = data.type as string

            if (type === 'text' && data.content) {
              opts.onChunk(data.content as string)

            } else if (type === 'thinking' && data.content) {
              opts.onThinking?.(data.content as string)

            } else if (type === 'tool_start') {
              const toolName = data.tool_name as string
              const callId = (data.tool_call_id as string) ?? ''
              const labels: Record<string, string> = {
                web_search: `Searching: ${(data.content as string) ?? '...'}`,
                code_interpreter: 'Running code...',
                read_file: 'Reading file...',
              }
              opts.onToolStart?.(toolName, labels[toolName] ?? toolName, callId)

            } else if (type === 'tool_result') {
              opts.onToolDone?.(
                (data.tool_call_id as string) ?? '',
                (data.content as string) ?? ''
              )

            } else if (type === 'model_selected') {
              try {
                const info = JSON.parse(data.content as string) as Record<string, string>
                opts.onModelSelected?.(info.model, info.provider, info.intent)
              } catch { /* ignore */ }

            } else if (type === 'done') {
              const usage = data.usage as TokenUsage | undefined
              if (usage) opts.onUsage?.(usage)
              opts.onDone('stop')
              return

            } else if (type === 'error') {
              const msg = (data.content as string) ?? 'Stream error'
              opts.onError?.(new Error(msg), data.error_code as string | undefined)
              opts.onDone('error')
              return
            }
          } catch { /* skip malformed lines */ }
        }
      }
      opts.onDone()
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        opts.onError?.(err)
        opts.onDone('error')
      }
    }
  })()

  return controller
}

// ── Legacy streamChat overload (existing components unchanged) ────────────
export function streamChatLegacy(
  sessionId: string,
  messages: Array<{ role: string; content: string }>,
  featureMode: string,
  onChunk: (chunk: string) => void,
  onDone: () => void,
  onError?: (err: Error) => void
): AbortController {
  return streamChat({
    sessionId,
    message: messages[messages.length - 1]?.content ?? '',
    featureMode,
    onChunk,
    onDone,
    onError,
  })
}

// ── Conversations API ──────────────────────────────────────────────────────

import type { Conversation, ConversationMessages, AIModel, TokenUsage } from './types'

export async function createConversation(
  sessionId: string,
  model?: string,
  featureMode?: string
): Promise<Conversation> {
  return post<Conversation>('/api/conversations', {
    session_id: sessionId,
    model: model ?? 'claude-sonnet-4-6',
    feature_mode: featureMode ?? 'standard',
  })
}

export async function listConversations(
  sessionId: string,
  limit = 50,
  offset = 0
): Promise<{ conversations: Conversation[]; offset: number; limit: number }> {
  return get(`/api/conversations/list/${sessionId}?limit=${limit}&offset=${offset}`)
}

export async function getConversationMessages(
  conversationId: string,
  branchIndex = 0
): Promise<ConversationMessages> {
  return get(`/api/conversations/${conversationId}/messages?branch_index=${branchIndex}`)
}

export async function updateConversation(
  conversationId: string,
  updates: { title?: string; pinned?: boolean; model?: string }
): Promise<Conversation> {
  const res = await fetch(`${BASE}/api/conversations/${conversationId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  })
  if (!res.ok) throw new Error(`Update failed: ${res.status}`)
  return res.json()
}

export async function deleteConversation(conversationId: string): Promise<void> {
  const res = await fetch(`${BASE}/api/conversations/${conversationId}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error(`Delete failed: ${res.status}`)
}

export async function searchConversations(
  sessionId: string,
  query: string
): Promise<{ query: string; results: Conversation[] }> {
  return get(`/api/conversations/search/${sessionId}?q=${encodeURIComponent(query)}`)
}

export async function branchConversation(
  conversationId: string,
  parentMessageId: string
): Promise<{ conversation_id: string; new_branch_index: number }> {
  return post(`/api/conversations/${conversationId}/branch`, {
    parent_message_id: parentMessageId,
  })
}

// ── File Upload API ────────────────────────────────────────────────────────

import type { FileAttachment } from './types'

export async function uploadFile(
  file: File,
  sessionId: string,
  conversationId?: string
): Promise<FileAttachment> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('session_id', sessionId)
  if (conversationId) formData.append('conversation_id', conversationId)

  const res = await fetch(`${BASE}/api/files/upload`, {
    method: 'POST',
    body: formData,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => null) as Record<string, unknown> | null
    throw new Error((err?.detail as string) ?? `Upload failed: ${res.status}`)
  }
  return res.json()
}

export async function deleteFile(fileId: string): Promise<void> {
  const res = await fetch(`${BASE}/api/files/${fileId}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`Delete failed: ${res.status}`)
}

// ── Models API ─────────────────────────────────────────────────────────────

export async function listModels(): Promise<{ models: AIModel[] }> {
  return get('/api/models')
}

// ── Feedback ──────────────────────────────────────────────────────────────

export async function submitFeedback(
  messageId: string,
  sessionId: string,
  rating: 'up' | 'down',
  comment?: string
): Promise<void> {
  await post('/api/chat/feedback', { message_id: messageId, session_id: sessionId, rating, comment })
}

export async function exportConversation(
  sessionId: string,
  fmt: 'json' | 'txt' = 'json'
): Promise<void> {
  const res = await fetch(`${BASE}/api/chat/export/${sessionId}?fmt=${fmt}`)
  if (!res.ok) throw new Error('Export failed')
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `pyxis_${sessionId.slice(0, 8)}.${fmt}`
  a.click()
  URL.revokeObjectURL(url)
}

// ── Chat Search ───────────────────────────────────────────────────────────

export async function searchMessages(
  sessionId: string,
  query: string,
  limit = 20
): Promise<Array<{ id: string; role: string; content: string; timestamp: string; feature_mode: string | null; snippet: string }>> {
  if (!query.trim()) return []
  const result = await get<{
    session_id: string
    query: string
    results: Array<{ id: string; role: string; content: string; timestamp: string; feature_mode: string | null; snippet: string }>
  }>(`/api/chat/search/${sessionId}?q=${encodeURIComponent(query.trim())}&limit=${limit}`)
  return result.results
}

// ── Chat History ──────────────────────────────────────────────────────────

export async function getChatHistory(
  sessionId: string,
  limit = 100
): Promise<Array<{ id: string; role: string; content: string; timestamp: string; feature_mode: string | null }>> {
  const result = await get<{ session_id: string; messages: Array<{ id: string; role: string; content: string; timestamp: string; feature_mode: string | null }> }>(
    `/api/chat/history/${sessionId}?limit=${limit}`
  )
  return result.messages
}

// ── Trident ───────────────────────────────────────────────────────────────

export async function streamTrident(
  sessionId: string,
  question: string
): Promise<TridentResponse> {
  return post<TridentResponse>(API_ENDPOINTS.TRIDENT_STREAM, {
    session_id: sessionId,
    question,
  })
}

// ── Assessment ────────────────────────────────────────────────────────────

export async function generateAssessment(
  sessionId: string,
  topic?: string
): Promise<AssessmentGenerateResponse> {
  return post<AssessmentGenerateResponse>(API_ENDPOINTS.ASSESSMENT_GENERATE, {
    session_id: sessionId,
    topic,
  })
}

export async function submitAssessment(
  sessionId: string,
  assessmentId: string,
  answers: Array<Record<string, unknown>>
): Promise<AssessmentAutopsyResponse> {
  return post<AssessmentAutopsyResponse>(API_ENDPOINTS.ASSESSMENT_AUTOPSY, {
    session_id: sessionId,
    assessment_id: assessmentId,
    answers,
  })
}

// ── Parliament ────────────────────────────────────────────────────────────

export async function conveneParliament(
  sessionId: string,
  question: string
): Promise<ParliamentConveneResponse> {
  return post<ParliamentConveneResponse>(API_ENDPOINTS.PARLIAMENT_CONVENE, {
    session_id: sessionId,
    question,
  })
}

// ── Forge ─────────────────────────────────────────────────────────────────

export async function getForgeStatus(
  sessionId: string,
  concept: string
): Promise<ForgeStatusResponse> {
  return post<ForgeStatusResponse>(API_ENDPOINTS.FORGE_STATUS, {
    session_id: sessionId,
    concept,
  })
}

// ── Curriculum ────────────────────────────────────────────────────────────

export async function getCurriculumMoves(
  sessionId: string,
  topic?: string
): Promise<CurriculumNextResponse> {
  return post<CurriculumNextResponse>(API_ENDPOINTS.CURRICULUM_NEXT, {
    session_id: sessionId,
    topic,
  })
}

// ── Oracle ────────────────────────────────────────────────────────────────

export async function getOracleTimeline(
  sessionId: string
): Promise<OracleTimelineResponse> {
  return post<OracleTimelineResponse>(API_ENDPOINTS.ORACLE_TIMELINE, {
    session_id: sessionId,
  })
}

// ── Nemesis ───────────────────────────────────────────────────────────────

export async function generateNemesisChallenge(
  sessionId: string,
  weakness?: string
): Promise<NemesisChallengeResponse> {
  return post<NemesisChallengeResponse>(API_ENDPOINTS.NEMESIS_CHALLENGE, {
    session_id: sessionId,
    weakness,
  })
}

export async function recordNemesisOutcome(
  sessionId: string,
  challengeId: string,
  passed: boolean
): Promise<void> {
  await post(API_ENDPOINTS.NEMESIS_OUTCOME, {
    session_id: sessionId,
    challenge_id: challengeId,
    passed,
  })
}

// ── Helix ─────────────────────────────────────────────────────────────────

export async function getHelixDue(sessionId: string): Promise<HelixDueResponse> {
  return post<HelixDueResponse>(API_ENDPOINTS.HELIX_DUE, { session_id: sessionId })
}

export async function advanceHelix(
  sessionId: string,
  concept: string
): Promise<{ revolution: string; prompt: string }> {
  return post(API_ENDPOINTS.HELIX_NEXT, { session_id: sessionId, concept })
}

// ── Tides ─────────────────────────────────────────────────────────────────

export async function getTideChart(
  sessionId: string,
  concept: string
): Promise<TideChartResponse> {
  return post<TideChartResponse>(API_ENDPOINTS.TIDES_CHART, {
    session_id: sessionId,
    concept,
  })
}

// ── Gravity ───────────────────────────────────────────────────────────────

export async function getGravityMap(
  sessionId: string,
  concept?: string
): Promise<GravityMapResponse> {
  return post<GravityMapResponse>(API_ENDPOINTS.GRAVITY_MAP, {
    session_id: sessionId,
    concept,
  })
}

// ── Dark Knowledge ────────────────────────────────────────────────────────

export async function detectDarkKnowledge(
  sessionId: string,
  message: string
): Promise<DarkKnowledgeDetectResponse> {
  return post<DarkKnowledgeDetectResponse>(API_ENDPOINTS.DARK_KNOWLEDGE_DETECT, {
    session_id: sessionId,
    message,
  })
}

// ── Mirror ────────────────────────────────────────────────────────────────

export async function getMirrorReport(
  sessionId: string
): Promise<MirrorReportResponse> {
  return post<MirrorReportResponse>(API_ENDPOINTS.MIRROR_REPORT, {
    session_id: sessionId,
  })
}

// ── Civilization ──────────────────────────────────────────────────────────

export async function initCivilization(
  sessionId: string,
  subject: string
): Promise<Record<string, unknown>> {
  return post(API_ENDPOINTS.CIVILIZATION_INIT, {
    session_id: sessionId,
    subject,
  })
}

export async function makeCivilizationDecision(
  sessionId: string,
  decision: string
): Promise<CivilizationDecisionResponse> {
  return post<CivilizationDecisionResponse>(API_ENDPOINTS.CIVILIZATION_DECISION, {
    session_id: sessionId,
    decision,
  })
}

// ── Symphony ──────────────────────────────────────────────────────────────

export async function getSymphonyMotif(
  sessionId: string,
  concept: string
): Promise<{ motif: Record<string, unknown>; symphony: unknown[] }> {
  return post(API_ENDPOINTS.SYMPHONY_MOTIF, { session_id: sessionId, concept })
}

// ── Voice ─────────────────────────────────────────────────────────────────

export async function analyzeVoice(
  sessionId: string,
  audioBlob: Blob,
  transcript?: string
): Promise<VoiceAnalysisResponse> {
  const form = new FormData()
  form.append('session_id', sessionId)
  form.append('audio', audioBlob, 'recording.webm')
  if (transcript) form.append('transcript', transcript)

  const res = await fetch(`${BASE}${API_ENDPOINTS.VOICE_ANALYZE}`, {
    method: 'POST',
    body: form,
  })
  if (!res.ok) throw new Error(`Voice analyze failed: ${res.status}`)
  return unwrap<VoiceAnalysisResponse>(await res.json())
}

// ── Vault ─────────────────────────────────────────────────────────────────

export async function storeInVault(
  sessionId: string,
  content: string,
  conceptTags: string[],
  emotionTags: string[]
): Promise<{ entry_id: string }> {
  return post(API_ENDPOINTS.VAULT_STORE, {
    session_id: sessionId,
    content,
    concept_tags: conceptTags,
    emotion_tags: emotionTags,
  })
}

export async function searchVault(
  sessionId: string,
  query: string
): Promise<VaultSearchResponse> {
  return post<VaultSearchResponse>(API_ENDPOINTS.VAULT_SEARCH, {
    session_id: sessionId,
    query,
  })
}

export async function getVaultTimeline(sessionId: string): Promise<{ entries: VaultEntry[] }> {
  return get<{ entries: VaultEntry[] }>(`${API_ENDPOINTS.VAULT_TIMELINE}/${sessionId}`)
}

// ── Psyche ────────────────────────────────────────────────────────────────

export async function getPsycheState(sessionId: string): Promise<PsycheStateResponse> {
  return get<PsycheStateResponse>(`${API_ENDPOINTS.PSYCHE_STATE}/${sessionId}`)
}

export async function getPsycheVisualization(
  sessionId: string
): Promise<PsycheVisualizationResponse> {
  return get<PsycheVisualizationResponse>(`${API_ENDPOINTS.PSYCHE_VISUALIZATION}/${sessionId}`)
}

// ── Analytics ─────────────────────────────────────────────────────────────

export async function getDashboard(sessionId: string): Promise<DashboardResponse> {
  return get<DashboardResponse>(`${API_ENDPOINTS.DASHBOARD}/${sessionId}`)
}

// ── Feature Extras ────────────────────────────────────────────────────────

export async function getBlindSpotsAnalysis(
  sessionId: string,
  message: string
): Promise<DarkKnowledgeDetectResponse> {
  return post<DarkKnowledgeDetectResponse>(API_ENDPOINTS.BLIND_SPOTS_ANALYZE, {
    session_id: sessionId,
    message,
  })
}

export async function getPrecognitionMap(
  sessionId: string
): Promise<PrecognitionMapResponse> {
  return post<PrecognitionMapResponse>(API_ENDPOINTS.PRECOGNITION_MAP, {
    session_id: sessionId,
  })
}

export async function getShadowSelfPrompt(
  sessionId: string
): Promise<ShadowSelfResponse> {
  return post<ShadowSelfResponse>(API_ENDPOINTS.SHADOW_PROMPT, {
    session_id: sessionId,
  })
}

export async function getTemporalWaves(
  sessionId: string,
  concept: string
): Promise<{ response: string }> {
  return post(API_ENDPOINTS.TEMPORAL_WAVES, { session_id: sessionId, concept })
}

export async function getSynapticSprint(
  sessionId: string,
  topic: string,
  durationMinutes: number
): Promise<{ sprint: string }> {
  return post(API_ENDPOINTS.SYNAPTIC_SPRINT, {
    session_id: sessionId,
    topic,
    duration_minutes: durationMinutes,
  })
}

export async function getFinalBoss(
  sessionId: string,
  concept: string
): Promise<{ final_boss: string }> {
  return post(API_ENDPOINTS.FINAL_BOSS, { session_id: sessionId, concept })
}

export async function getBabelMind(
  sessionId: string,
  concept: string,
  targetFramework?: string
): Promise<{ reframed: string }> {
  return post(API_ENDPOINTS.BABEL_MIND, {
    session_id: sessionId,
    concept,
    target_framework: targetFramework,
  })
}

export async function getAlienMode(
  sessionId: string,
  concept: string
): Promise<{ alien_translation: string }> {
  return post(API_ENDPOINTS.ALIEN_MODE, { session_id: sessionId, concept })
}

// ── Streaming helpers (SSE) ───────────────────────────────────────────────

function streamPost(path: string, body: Record<string, unknown>, onChunk: (chunk: string) => void): AbortController {
  const controller = new AbortController()
  ;(async () => {
    try {
      const res = await fetch(`${BASE}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      })
      if (!res.ok || !res.body) return
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const text = decoder.decode(value, { stream: true })
        for (const line of text.split('\n')) {
          if (!line.startsWith('data: ')) continue
          try {
            const data = JSON.parse(line.slice(6)) as { type?: string; content?: string }
            if (data.content) onChunk(data.content)
          } catch {}
        }
      }
    } catch (e) {
      if (e instanceof Error && e.name !== 'AbortError') console.error(path, e)
    }
  })()
  return controller
}

// ── Feature-component aliases ─────────────────────────────────────────────

export async function tridentAnalysis(sessionId: string, query: string): Promise<Record<string, string>> {
  const r = await conveneParliament(sessionId, query)
  return (r as unknown as Record<string, string>)
}

export async function parliamentDebate(sessionId: string, query: string): Promise<Record<string, string>> {
  const r = await conveneParliament(sessionId, query)
  return (r as unknown as { responses: Record<string, string> }).responses ?? {}
}

export async function getForgeProgress(sessionId: string): Promise<unknown> {
  return post('/api/forge/status', { session_id: sessionId, concept: '' }).catch(() => ({}))
}

export async function getCurriculum(sessionId: string): Promise<unknown> {
  return post(API_ENDPOINTS.CURRICULUM_NEXT, { session_id: sessionId }).catch(() => null)
}

export function getDarkKnowledge(sessionId: string, topic: string, onChunk: (c: string) => void): AbortController {
  return streamPost(API_ENDPOINTS.DARK_KNOWLEDGE_DETECT, { session_id: sessionId, message: topic }, onChunk)
}

export async function getShadowSelf(sessionId: string): Promise<unknown> {
  return post(API_ENDPOINTS.SHADOW_PROMPT, { session_id: sessionId }).catch(() => null)
}

export async function temporalWaves(sessionId: string, topic: string): Promise<Record<string, string>> {
  const r = await post<{ response: string }>(API_ENDPOINTS.TEMPORAL_WAVES, { session_id: sessionId, concept: topic })
  return { modern: r.response } as Record<string, string>
}

export async function synapticSprint(sessionId: string): Promise<{ questions: Array<{ question: string; options: string[]; correct: number; explanation: string }> }> {
  const r = await post<{ sprint: string }>(API_ENDPOINTS.SYNAPTIC_SPRINT, { session_id: sessionId, topic: '', duration_minutes: 5 })
  try { return JSON.parse(r.sprint) as { questions: Array<{ question: string; options: string[]; correct: number; explanation: string }> } } catch { return { questions: [] } }
}

export async function getPrecognition(sessionId: string): Promise<unknown> {
  return post(API_ENDPOINTS.PRECOGNITION_MAP, { session_id: sessionId })
}

export function finalBoss(sessionId: string, answer: string, onChunk?: (c: string) => void): AbortController | Promise<Record<string, unknown>> {
  if (onChunk) return streamPost(API_ENDPOINTS.FINAL_BOSS, { session_id: sessionId, concept: answer }, onChunk)
  return post(API_ENDPOINTS.FINAL_BOSS, { session_id: sessionId, concept: answer })
}

export async function getCivilization(sessionId: string): Promise<unknown> {
  return post(API_ENDPOINTS.CIVILIZATION_INIT, { session_id: sessionId, subject: '' }).catch(() => ({}))
}

export async function civilizationDecision(sessionId: string, decision: string): Promise<unknown> {
  return post(API_ENDPOINTS.CIVILIZATION_DECISION, { session_id: sessionId, decision })
}

export function alienMode(sessionId: string, concept: string, onChunk: (c: string) => void): AbortController {
  return streamPost(API_ENDPOINTS.ALIEN_MODE, { session_id: sessionId, concept }, onChunk)
}

export async function getLivingSyllabus(sessionId: string): Promise<unknown> {
  return post('/api/curriculum/next', { session_id: sessionId }).catch(() => ({ tree: [] }))
}

export async function getSymphonySequence(sessionId: string): Promise<unknown> {
  return post(API_ENDPOINTS.SYMPHONY_MOTIF, { session_id: sessionId, concept: '' })
}

export async function getGravityField(sessionId: string): Promise<unknown> {
  return post(API_ENDPOINTS.GRAVITY_MAP, { session_id: sessionId }).catch(() => ({ nodes: [] }))
}

export async function getHelixRevolutions(sessionId: string): Promise<unknown> {
  return post(API_ENDPOINTS.HELIX_DUE, { session_id: sessionId }).catch(() => ({ cards: [] }))
}

export async function reviewHelixCard(sessionId: string, cardIdx: number, quality: number): Promise<void> {
  await post(API_ENDPOINTS.HELIX_NEXT, { session_id: sessionId, concept: String(cardIdx), quality })
}

export async function getBlindSpots(sessionId: string): Promise<unknown> {
  return post(API_ENDPOINTS.BLIND_SPOTS_ANALYZE, { session_id: sessionId, message: '' }).catch(() => ({ blind_spots: [] }))
}

export async function getSemanticTides(sessionId: string): Promise<unknown> {
  return post(API_ENDPOINTS.TIDES_CHART, { session_id: sessionId, concept: '' }).catch(() => null)
}

export async function getNemesis(sessionId: string): Promise<unknown> {
  return post(API_ENDPOINTS.NEMESIS_CHALLENGE, { session_id: sessionId }).catch(() => ({}))
}

export function nemesisChallenge(sessionId: string, answer: string, onChunk: (c: string) => void): AbortController {
  return streamPost(API_ENDPOINTS.NEMESIS_OUTCOME, { session_id: sessionId, answer }, onChunk)
}

export function babelMind(sessionId: string, concept: string, lens: string, onChunk: (c: string) => void): AbortController {
  return streamPost(API_ENDPOINTS.BABEL_MIND, { session_id: sessionId, concept, target_framework: lens }, onChunk)
}

export async function getVaultEntries(sessionId: string): Promise<unknown> {
  return get<{ entries: VaultEntry[] }>(`${API_ENDPOINTS.VAULT_TIMELINE}/${sessionId}`).catch(() => ({ entries: [] }))
}

export async function deleteVaultEntry(_sessionId: string, _id: string): Promise<void> {
  // Not implemented in backend spec — no-op
}

export async function advanceForge(
  sessionId: string,
  concept: string,
  onChunk: (chunk: string) => void
): Promise<AbortController>
export async function advanceForge(
  sessionId: string,
  concept: string
): Promise<{ new_stage: string; stage_prompt: string }>
export async function advanceForge(
  sessionId: string,
  concept: string,
  onChunk?: (chunk: string) => void
): Promise<AbortController | { new_stage: string; stage_prompt: string }> {
  if (onChunk) return streamPost(API_ENDPOINTS.FORGE_ADVANCE, { session_id: sessionId, concept }, onChunk)
  return post(API_ENDPOINTS.FORGE_ADVANCE, { session_id: sessionId, concept })
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export interface AuthResponse {
  access_token: string
  refresh_token: string
  token_type: string
  user: { id: string; email: string; display_name: string; role: string; plan: string }
}

function _authHeaders(): Record<string, string> {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('pyxis-auth') : null
    if (!raw) return {}
    const state = JSON.parse(raw)?.state
    const token = state?.accessToken
    return token ? { Authorization: `Bearer ${token}` } : {}
  } catch { return {} }
}

async function authPost<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ..._authHeaders() },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const json = await res.json().catch(() => ({}))
    throw new Error(json?.detail ?? `API error (${res.status})`)
  }
  return res.json()
}

async function authGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { ..._authHeaders() },
  })
  if (!res.ok) {
    const json = await res.json().catch(() => ({}))
    throw new Error(json?.detail ?? `API error (${res.status})`)
  }
  return res.json()
}

async function authPatch<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ..._authHeaders() },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const json = await res.json().catch(() => ({}))
    throw new Error(json?.detail ?? `API error (${res.status})`)
  }
  return res.status === 204 ? (undefined as T) : res.json()
}

async function authDelete<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'DELETE',
    headers: { ..._authHeaders() },
  })
  if (!res.ok) {
    const json = await res.json().catch(() => ({}))
    throw new Error(json?.detail ?? `API error (${res.status})`)
  }
  return res.status === 204 ? (undefined as T) : res.json()
}

export const authApi = {
  register: (email: string, password: string, displayName?: string) =>
    authPost<AuthResponse>('/api/auth/register', { email, password, display_name: displayName ?? '' }),

  login: (email: string, password: string) =>
    authPost<AuthResponse>('/api/auth/login', { email, password }),

  refresh: (refreshToken: string) =>
    authPost<AuthResponse>('/api/auth/refresh', { refresh_token: refreshToken }),

  me: () => authGet<AuthResponse['user']>('/api/auth/me'),

  changePassword: (currentPassword: string, newPassword: string) =>
    authPost<void>('/api/auth/change-password', { current_password: currentPassword, new_password: newPassword }),
}

// ── Admin API ─────────────────────────────────────────────────────────────────

export const adminApi = {
  listUsers: (limit = 50, offset = 0, search?: string) => {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) })
    if (search) params.set('search', search)
    return authGet<{ total: number; users: unknown[] }>(`/api/admin/users?${params}`)
  },

  getUser: (id: string) => authGet<Record<string, unknown>>(`/api/admin/users/${id}`),

  createUser: (body: { email: string; password: string; display_name?: string; role?: string; plan?: string }) =>
    authPost<Record<string, unknown>>('/api/admin/users', body),

  updateRole: (id: string, role: string) =>
    authPatch<void>(`/api/admin/users/${id}/role`, { role }),

  updatePlan: (id: string, plan: string) =>
    authPatch<void>(`/api/admin/users/${id}/plan`, { plan }),

  toggleUser: (id: string, disabled: boolean) =>
    authPatch<void>(`/api/admin/users/${id}/toggle`, { disabled }),

  deleteUser: (id: string) => authDelete<void>(`/api/admin/users/${id}`),

  stats: () => authGet<Record<string, unknown>>('/api/admin/stats'),

  health: () => authGet<Record<string, unknown>>('/api/admin/health'),
}
