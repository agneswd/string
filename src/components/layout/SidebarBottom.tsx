import { VoicePanel } from '../voice/VoicePanel'
import { UserPanel, type UserPanelProps } from './UserPanel'

export interface SidebarBottomProps {
  showVoicePanel?: boolean
  currentVoiceState: {
    isMuted?: boolean
    isDeafened?: boolean
    isStreaming?: boolean
  } | null
  onLeave: () => void
  remoteSharersCount: number
  onStartSharing: () => void
  onStopSharing: () => void
  user: UserPanelProps['user']
  isMuted: boolean
  isDeafened: boolean
  muteColor: string
  deafenColor: string
  onToggleMute: () => void
  onToggleDeafen: () => void
  onOpenSettings: () => void
  onOpenProfile: () => void
  layoutMode?: 'workspace' | 'classic'
}

export function SidebarBottom({
  showVoicePanel = true,
  currentVoiceState,
  onLeave,
  remoteSharersCount,
  onStartSharing,
  onStopSharing,
  user,
  isMuted,
  isDeafened,
  muteColor,
  deafenColor,
  onToggleMute,
  onToggleDeafen,
  onOpenSettings,
  onOpenProfile,
  layoutMode = 'classic',
}: SidebarBottomProps) {
  return (
    <>
      {showVoicePanel && currentVoiceState && (
        <div className="flex min-h-0 flex-col gap-3 p-2">
          <VoicePanel
            connected={true}
            streaming={currentVoiceState.isStreaming ?? false}
            onLeave={onLeave}
            remoteSharersCount={remoteSharersCount}
            onStartSharing={onStartSharing}
            onStopSharing={onStopSharing}
          />
        </div>
      )}
      <UserPanel
        user={user}
        isMuted={isMuted}
        isDeafened={isDeafened}
        muteColor={muteColor}
        deafenColor={deafenColor}
        onToggleMute={onToggleMute}
        onToggleDeafen={onToggleDeafen}
        onOpenSettings={onOpenSettings}
        onOpenProfile={onOpenProfile}
        layoutMode={layoutMode}
      />
    </>
  )
}
