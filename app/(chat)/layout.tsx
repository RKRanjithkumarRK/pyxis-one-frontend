'use client'

import { Sidebar } from '@/components/layout/Sidebar'
import { StatusBar } from '@/components/layout/StatusBar'
import { CommandBar } from '@/components/layout/CommandBar'
import { KeyboardShortcuts } from '@/components/layout/KeyboardShortcuts'
import { SetupBanner } from '@/components/layout/SetupBanner'
import { OnboardingModal } from '@/components/layout/OnboardingModal'
import { SettingsPanel } from '@/components/layout/SettingsPanel'
import { MobileHeader } from '@/components/layout/MobileHeader'
import { MobileSidebarOverlay } from '@/components/layout/MobileSidebarOverlay'

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--bg-base)]">
      <OnboardingModal />
      <KeyboardShortcuts />
      <CommandBar />
      <SettingsPanel />
      <MobileSidebarOverlay />

      {/* Desktop sidebar — hidden on mobile */}
      <div className="hidden md:flex flex-shrink-0">
        <Sidebar />
      </div>

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Mobile top bar with hamburger */}
        <MobileHeader />
        <SetupBanner />
        <div className="flex-1 min-h-0 overflow-hidden">
          {children}
        </div>
        <StatusBar />
      </div>
    </div>
  )
}
