import { create } from 'zustand'

interface ForgeState {
  concept: string
  stage: string
  stagePrompt: string
}

interface NemesisState {
  currentChallenge: string
  challengeId: string
  weakness: string
}

interface CivilizationState {
  subject: string
  era: string
  turn: number
  resources: Record<string, number>
  currentCrisis: Record<string, unknown> | null
}

interface FeatureState {
  // Forge
  forge: ForgeState
  setForge: (data: Partial<ForgeState>) => void

  // Nemesis
  nemesis: NemesisState
  setNemesis: (data: Partial<NemesisState>) => void

  // Civilization
  civilization: CivilizationState
  setCivilization: (data: Partial<CivilizationState>) => void

  // Trident last results
  tridentArchitect: string
  tridentStreetFighter: string
  tridentHeretic: string
  setTrident: (architect: string, streetFighter: string, heretic: string) => void

  // Oracle walls
  oracleWalls: Array<{ concept: string; date: string; severity: string }>
  setOracleWalls: (walls: Array<{ concept: string; date: string; severity: string }>) => void

  // Mirror
  mirrorReport: string
  mirrorInsights: string[]
  setMirrorReport: (report: string, insights: string[]) => void

  // Vault query
  vaultQuery: string
  setVaultQuery: (query: string) => void

  // Active concept for helix/tides/gravity
  activeConcept: string
  setActiveConcept: (concept: string) => void

  // Shadow self profile
  shadowProfile: Record<string, unknown>
  setShadowProfile: (profile: Record<string, unknown>) => void

  // Vault entries
  vault: unknown[]
  setVault: (entries: unknown[] | ((prev: unknown[]) => unknown[])) => void

  // Oracle timeline
  oracle: Record<string, unknown> | null
  setOracle: (oracle: Record<string, unknown>) => void
}

export const useFeatureStore = create<FeatureState>((set) => ({
  forge: { concept: '', stage: 'RAW_ORE', stagePrompt: '' },
  setForge: (data) =>
    set((state) => ({ forge: { ...state.forge, ...data } })),

  nemesis: { currentChallenge: '', challengeId: '', weakness: '' },
  setNemesis: (data) =>
    set((state) => ({ nemesis: { ...state.nemesis, ...data } })),

  civilization: {
    subject: '',
    era: 'Stone Age',
    turn: 0,
    resources: {},
    currentCrisis: null,
  },
  setCivilization: (data) =>
    set((state) => ({ civilization: { ...state.civilization, ...data } })),

  tridentArchitect: '',
  tridentStreetFighter: '',
  tridentHeretic: '',
  setTrident: (architect, streetFighter, heretic) =>
    set({
      tridentArchitect: architect,
      tridentStreetFighter: streetFighter,
      tridentHeretic: heretic,
    }),

  oracleWalls: [],
  setOracleWalls: (walls) => set({ oracleWalls: walls }),

  mirrorReport: '',
  mirrorInsights: [],
  setMirrorReport: (report, insights) =>
    set({ mirrorReport: report, mirrorInsights: insights }),

  vaultQuery: '',
  setVaultQuery: (query) => set({ vaultQuery: query }),

  activeConcept: '',
  setActiveConcept: (concept) => set({ activeConcept: concept }),

  shadowProfile: {},
  setShadowProfile: (profile) => set({ shadowProfile: profile }),

  vault: [],
  setVault: (entries) =>
    set((state) => ({
      vault: typeof entries === 'function' ? entries(state.vault) : entries,
    })),

  oracle: null,
  setOracle: (oracle) => set({ oracle }),
}))
