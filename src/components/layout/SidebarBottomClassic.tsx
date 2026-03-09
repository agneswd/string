import { VoicePanel } from '../voice/VoicePanel'
import { UserPanelClassic } from './UserPanelClassic'
import type { SidebarBottomVariantProps } from './SidebarBottom'

export function SidebarBottomClassic({
  showVoicePanel = true,
  currentVoiceState,
  outgoingCall = false,
  outgoingCallLabel,
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
}: SidebarBottomVariantProps) {
  return (
    <>
      {showVoicePanel && (currentVoiceState || outgoingCall) && (
        <div className="flex min-h-0 flex-col gap-3 p-2">
          <VoicePanel
            connected={true}
            streaming={currentVoiceState?.isStreaming ?? false}
            statusLabel={outgoingCall && !currentVoiceState ? `Calling ${outgoingCallLabel ?? 'user'}…` : undefined}
            onLeave={onLeave}
            remoteSharersCount={remoteSharersCount}
            onStartSharing={currentVoiceState ? onStartSharing : undefined}
            onStopSharing={currentVoiceState ? onStopSharing : undefined}
          />
        </div>
      )}
      <UserPanelClassic
        user={user}
        isMuted={isMuted}
        isDeafened={isDeafened}
        muteColor={muteColor}
        deafenColor={deafenColor}
        onToggleMute={onToggleMute}
        onToggleDeafen={onToggleDeafen}
        onOpenSettings={onOpenSettings}
        onOpenProfile={onOpenProfile}
      />
    </>
  )
}
