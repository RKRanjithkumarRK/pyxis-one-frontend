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

// ── Streaming Chat ────────────────────────────────────────────────────────

export async function streamChat(
  sessionId: string,
  messages: Array<{ role: string; content: string }>,
  featureMode: string,
  onChunk: (chunk: string) => void,
  onDone: () => void,
  onError?: (err: Error) => void
): Promise<AbortController> {
  const controller = new AbortController()

  try {
    const res = await fetch(`${BASE}${API_ENDPOINTS.CHAT_STREAM}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        message: messages[messages.length - 1]?.content ?? '',
        feature_mode: featureMode,
      }),
      signal: controller.signal,
    })

    if (!res.ok || !res.body) {
      throw new Error(`Stream failed: ${res.status}`)
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()

    ;(async () => {
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const text = decoder.decode(value, { stream: true })
          const lines = text.split('\n')
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            try {
              const data = JSON.parse(line.slice(6)) as { type: string; content?: string; message?: string }
              if (data.type === 'text' && data.content) {
                onChunk(data.content)
              } else if (data.type === 'done') {
                onDone()
                return
              } else if (data.type === 'error') {
                const msg = data.message ?? 'Stream error'
                onError?.(new Error(msg))
                onDone()
                return
              }
            } catch {
              // skip malformed lines
            }
          }
        }
        onDone()
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          onError?.(err)
        }
      }
    })()
  } catch (err) {
    if (err instanceof Error && err.name !== 'AbortError') {
      onError?.(err instanceof Error ? err : new Error(String(err)))
    }
  }

  return controller
}

// ── Chat History ──────────────────────────────────────────────────────────

export async function getChatHistory(
  sessionId: string,
  limit = 100
): Promise<Array<{ id: string; role: string; content: string; timestamp: string; feature_mode: string | null }>> {
  const result = await get<{ session_id: string; messages: Array<{ id: string; role: string; content: string; timestamp: string; feature_mode: string | null }> }>(
    `/v1/chat/history/${sessionId}?limit=${limit}`
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
  return post('/v1/forge/status', { session_id: sessionId, concept: '' }).catch(() => ({}))
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
  return post('/v1/curriculum/next', { session_id: sessionId }).catch(() => ({ tree: [] }))
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
