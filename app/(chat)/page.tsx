'use client'

import { useSessionStore } from '@/store/sessionStore'
import { ChatInterface } from '@/components/chat/ChatInterface'
import { PanelSystem } from '@/components/layout/PanelSystem'

// Feature panels
import { PsycheEngine } from '@/components/features/PsycheEngine'
import { TridentIntelligence } from '@/components/features/TridentIntelligence'
import { CognitiveForge } from '@/components/features/CognitiveForge'
import { PersonaParliament } from '@/components/features/PersonaParliament'
import { SentientCurriculum } from '@/components/features/SentientCurriculum'
import { DarkKnowledge } from '@/components/features/DarkKnowledge'
import { ShadowSelf } from '@/components/features/ShadowSelf'
import { TemporalWaves } from '@/components/features/TemporalWaves'
import { SynapticSprint } from '@/components/features/SynapticSprint'
import { PrecognitiveGraph } from '@/components/features/PrecognitiveGraph'
import { FinalBoss } from '@/components/features/FinalBoss'
import { CivilizationBuilder } from '@/components/features/CivilizationBuilder'
import { VoiceSoul } from '@/components/features/VoiceSoul'
import { MirrorProtocol } from '@/components/features/MirrorProtocol'
import { AlienMode } from '@/components/features/AlienMode'
import { OracleMode } from '@/components/features/OracleMode'
import { LivingSyllabus } from '@/components/features/LivingSyllabus'
import { Symphony } from '@/components/features/Symphony'
import { GravityField } from '@/components/features/GravityField'
import { TheHelix } from '@/components/features/TheHelix'
import { BlindSpotArchaeology } from '@/components/features/BlindSpotArchaeology'
import { SemanticTides } from '@/components/features/SemanticTides'
import { NemesisSystem } from '@/components/features/NemesisSystem'
import { BabelMind } from '@/components/features/BabelMind'
import { TheVault } from '@/components/features/TheVault'
import { CosmosClassroomPanel } from '@/components/features/CosmosClassroomPanel'
import { Assessment } from '@/components/features/Assessment'
import { ApexMode } from '@/components/features/ApexMode'
import { DominionScan } from '@/components/features/DominionScan'
import { EternalArchive } from '@/components/features/EternalArchive'
import { TranscendenceProtocol } from '@/components/features/TranscendenceProtocol'
import type { FeatureMode } from '@/lib/types'

const FEATURE_PANELS: Partial<Record<FeatureMode, React.ComponentType>> = {
  psyche: PsycheEngine,
  trident: TridentIntelligence,
  forge: CognitiveForge,
  parliament: PersonaParliament,
  curriculum: SentientCurriculum,
  'dark-knowledge': DarkKnowledge,
  shadow: ShadowSelf,
  'temporal-waves': TemporalWaves,
  'synaptic-sprint': SynapticSprint,
  precognition: PrecognitiveGraph,
  'final-boss': FinalBoss,
  civilization: CivilizationBuilder,
  voice: VoiceSoul,
  mirror: MirrorProtocol,
  'alien-mode': AlienMode,
  oracle: OracleMode,
  'living-syllabus': LivingSyllabus,
  symphony: Symphony,
  gravity: GravityField,
  helix: TheHelix,
  'blind-spots': BlindSpotArchaeology,
  tides: SemanticTides,
  nemesis: NemesisSystem,
  'babel-mind': BabelMind,
  vault: TheVault,
  'cosmos-classroom': CosmosClassroomPanel,
  assessment: Assessment,
  apex: ApexMode,
  dominion: DominionScan,
  eternal: EternalArchive,
  transcendence: TranscendenceProtocol,
}

export default function ChatPage() {
  const { currentFeature: activeFeature } = useSessionStore()
  const FeaturePanel = activeFeature ? FEATURE_PANELS[activeFeature] : null

  if (FeaturePanel) {
    return (
      <PanelSystem
        left={<ChatInterface />}
        right={<FeaturePanel />}
      />
    )
  }

  return <ChatInterface />
}
