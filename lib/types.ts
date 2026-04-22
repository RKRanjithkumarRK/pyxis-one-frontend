// ── Core Types ──────────────────────────────────────────────────────────────

export type Theme = 'cosmos' | 'obsidian' | 'holographic'

export type Workspace = 'think' | 'create' | 'research' | 'manage'

export type FeatureMode =
  | 'standard'
  | 'psyche'
  | 'trident'
  | 'forge'
  | 'parliament'
  | 'oracle'
  | 'nemesis'
  | 'helix'
  | 'tides'
  | 'gravity'
  | 'dark-knowledge'
  | 'mirror'
  | 'civilization'
  | 'symphony'
  | 'vault'
  | 'blind-spots'
  | 'precognition'
  | 'shadow'
  | 'temporal-waves'
  | 'synaptic-sprint'
  | 'final-boss'
  | 'babel-mind'
  | 'alien-mode'
  | 'voice'
  | 'curriculum'
  | 'cosmos-classroom'
  | 'living-syllabus'
  | 'assessment'
  | 'apex'
  | 'dominion'
  | 'eternal'
  | 'transcendence'

export type MessageRole = 'user' | 'assistant' | 'system'

export interface Message {
  id: string
  role: MessageRole
  content: string
  timestamp: number
  feature_mode?: FeatureMode
  psyche_snapshot?: Record<string, number>
  isStreaming?: boolean
  isError?: boolean
  errorCode?: string
  branches?: Message[][]
  // New fields
  model?: string
  branchIndex?: number
  versionIndex?: number    // which version of this message (0=original, 1=regen1...)
  versionCount?: number    // total versions available
  usage?: TokenUsage
  toolCalls?: ToolCall[]
  toolResults?: ToolResult[]
  thinkingContent?: string
  attachments?: FileAttachment[]
}

export interface TokenUsage {
  input: number
  output: number
  cache_read?: number
  cache_created?: number
  model?: string
}

export interface ToolCall {
  id: string
  name: string
  label: string       // "Searching: query" / "Running code..."
  status: 'running' | 'done' | 'error'
  input?: Record<string, unknown>
  result?: string
}

export interface ToolResult {
  tool_name: string
  tool_call_id: string
  content: string
}

export interface FileAttachment {
  file_id: string
  filename: string
  content_type: string
  file_size: string
  extension: string
  page_count?: number
  truncated: boolean
  has_image: boolean
  preview: string
}

// ── Conversation (sidebar) ────────────────────────────────────────────────

export interface Conversation {
  id: string
  session_id: string
  title: string | null
  model: string
  feature_mode: string | null
  pinned: boolean
  created_at: string
  updated_at: string
}

export interface ConversationGroup {
  label: string   // "Today" | "Yesterday" | "Last 7 Days" | "Last 30 Days" | "Older"
  conversations: Conversation[]
}

export interface ConversationMessages {
  conversation: Conversation
  messages: Message[]
  branch_index: number
  branch_count: number
  branch_indices: number[]
}

// ── Model types ───────────────────────────────────────────────────────────

export interface AIModel {
  id: string
  name: string
  provider: 'openai' | 'groq' | 'gemini'
  context_window: number
  description: string
  tier: 'free' | 'pro' | 'enterprise'
  strengths: string[]
  available: boolean
}

export interface Session {
  id: string
  studentName?: string
  createdAt: number
  lastActive: number
}

// ── API Response Types ────────────────────────────────────────────────────

export interface PsycheStateResponse {
  session_id: string
  dimensions: Record<string, number>
  updated_at: string | null
}

export interface PsycheDimension {
  name: string
  value: number
  trend: 'thriving' | 'developing' | 'nascent'
}

export interface PsycheVisualizationResponse {
  session_id: string
  dimensions: Record<string, number>
  trends: Record<string, string>
  organism_health: number
}

export interface ForgeStatusResponse {
  session_id: string
  concept: string
  stage: string
  stage_entered_at?: string
  completed_at?: string
  prompt?: string
}

export interface TridentResponse {
  session_id: string
  architect: string
  street_fighter: string
  heretic: string
}

export interface PhilosopherResponse {
  philosopher: string
  response: string
  era: string
}

export interface ParliamentConveneResponse {
  session_id: string
  responses: PhilosopherResponse[]
}

export interface AssessmentQuestion {
  question_id: string
  question: string
  type: 'open' | 'mcq' | 'proof'
  expected_answer: string
  concept_tested: string
  difficulty: 'easy' | 'medium' | 'hard'
}

export interface AssessmentGenerateResponse {
  session_id: string
  questions: AssessmentQuestion[]
  assessment_id: string
}

export interface AssessmentAutopsyResponse {
  session_id: string
  forensic_report: Record<string, unknown>
  wrong_answer_origins: Array<Record<string, unknown>>
  score: number
}

export interface CurriculumMove {
  move: string
  reasoning: string
  priority: number
  estimated_minutes: number
}

export interface CurriculumNextResponse {
  session_id: string
  moves: CurriculumMove[]
  sequence: string[]
}

export interface OracleWall {
  concept: string
  predicted_wall_date: string
  reason: string
  severity: 'low' | 'medium' | 'high'
}

export interface OracleTimelineItem {
  id: string
  concept: string
  predicted_wall_date: string | null
  scaffolding_injected: boolean
  wall_avoided: boolean
}

export interface OracleTimelineResponse {
  session_id: string
  timeline: OracleTimelineItem[]
  wall_concepts: OracleWall[]
}

export interface NemesisChallengeResponse {
  session_id: string
  challenge: string
  weakness: string
  challenge_id: string
}

export interface HelixRevolutionItem {
  concept: string
  revolution: string
  overdue_hours: number
}

export interface HelixDueResponse {
  session_id: string
  due_concepts: HelixRevolutionItem[]
}

export interface TideReading {
  date: string
  vocabulary_precision: number
  confidence_score: number
  composite: number
}

export interface TideChartResponse {
  session_id: string
  concept: string
  readings: TideReading[]
  trend: string
  alert: string | null
}

export interface GravitySatellite {
  concept: string
  mass: number
  distance: number
  revolution: string
  affinity: number
}

export interface GravityMapResponse {
  session_id: string
  universe_map: {
    galaxies?: Array<{
      concept: string
      mass: number
      stage: string
      critical: boolean
      last_seen: string | null
    }>
    total_mass?: number
    universe_age_concepts?: number
    critical_mass_concepts?: number
    orbital_system?: {
      center: string
      center_mass: number
      critical_mass_reached: boolean
      satellites: GravitySatellite[]
    }
  }
}

export interface BlindSpotItem {
  assumption: string
  why_its_wrong: string
  affected_concepts: string[]
  severity: 'low' | 'medium' | 'high'
}

export interface DarkKnowledgeDetectResponse {
  session_id: string
  contradictions: Array<Record<string, unknown>>
  blind_spots: BlindSpotItem[]
}

export interface MirrorReportResponse {
  session_id: string
  report: string
  key_insights: string[]
  generated_at: string
}

export interface CivilizationDecisionResponse {
  session_id: string
  consequences: string
  new_state: Record<string, unknown>
  turn_number: number
  correct?: boolean
  lesson?: string
}

export interface SymphonyMotif {
  concept: string
  domain: string
  tone_js: Record<string, unknown>
  generated_at: string
}

export interface VoiceAnalysisResponse {
  session_id: string
  soul_report: string
  tempo: number
  avg_volume: number
  pause_count: number
  speech_rate_wpm: number
  confidence_indicators: Record<string, unknown>
}

export interface VaultEntry {
  id: string
  preview: string
  concept_tags: string[]
  emotion_tags: string[]
  timestamp: string
}

export interface VaultSearchResponse {
  session_id: string
  results: Array<{
    id: string
    content: string
    concept_tags: string[]
    emotion_tags: string[]
    timestamp: string
  }>
}

export interface DashboardResponse {
  session_id: string
  message_count: number
  concepts_mastered: number
  active_concepts: number
  psyche_summary: Record<string, number>
  forge_stages: Record<string, number>
  top_concepts: Array<{
    concept: string
    mastery: number
    stage: string | null
  }>
}

export interface PrecognitionMapResponse {
  session_id: string
  trajectory: Array<Record<string, unknown>>
  struggles: Array<Record<string, unknown>>
  constellation_map: Record<string, unknown>
}

export interface ShadowSelfResponse {
  session_id: string
  system_prompt: string
  profile: Record<string, unknown>
}

// ── UI Types ──────────────────────────────────────────────────────────────

export interface NavItem {
  id: FeatureMode
  label: string
  icon: string
  shortcut?: string
  description: string
  color: string
}

export interface CommandItem {
  id: string
  label: string
  description?: string
  shortcut?: string
  group: 'navigate' | 'features' | 'personas' | 'actions'
  action: () => void
}

export interface Panel {
  id: string
  title: string
  component: FeatureMode
  pinned: boolean
}

export type ConfidenceTag = 'VERIFIED' | 'CONSENSUS' | 'DEBATED' | 'SPECULATIVE'

export interface ParsedMessage {
  content: string
  confidenceTags: ConfidenceTag[]
  hasMath: boolean
  hasCode: boolean
}
