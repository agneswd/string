/**
 * AppCallOverlays
 *
 * Renders all fullscreen / floating overlays that are not modals:
 * call banner, audio streams, incoming-call dialog, screen-share viewer,
 * register screen, and notification toasts.
 */
import { CallBanner, IncomingCallModal, RegisterOverlay } from '../index'
import { AudioStreams } from '../voice/AudioStreams'
import { ScreenShareViewer } from '../voice/ScreenShareViewer'
import { NotificationToast, type NotificationItem } from '../ui/NotificationToast'
import { identityToString } from '../../hooks/useAppData'
import type { User as UserRow } from '../../module_bindings/types'

interface AudioStreamEntry {
  key: string
  stream: MediaStream
  userId: string
}

export interface AppCallOverlaysProps {
  // Call Banner
  showCallBanner: boolean
  currentVoiceState: boolean
  outgoingCall: boolean
  callBannerProps: { calleeName: string; isDmCall: boolean; callName: string; isOnCallPage: boolean }
  onCancelCall: () => void
  onNavigateToCall: () => void
  // Audio streams
  audioStreams: AudioStreamEntry[]
  isDeafened: boolean
  locallyMutedUsers: Set<string>
  // Incoming call modal
  incomingCall: { callId: unknown; callerIdentity: unknown } | null
  ignoredCallIds: Set<string>
  usersByIdentity: Map<string, UserRow>
  getAvatarUrlForUser: (id: string) => string | undefined
  onAcceptCall: () => void
  onDeclineCall: () => void
  onIgnoreCall: () => void
  // Screen share viewer
  viewingScreenStream: MediaStream | null
  onCloseScreenShare: () => void
  // Register overlay
  me: unknown
  initialLoadComplete: boolean
  connectionStatus: string | undefined
  onRegister: (username: string, displayName: string) => void
  onLoginAsUser: (token: string) => void
  // Notifications
  notifications: NotificationItem[]
  onDismissNotification: (id: string) => void
}

export function AppCallOverlays({
  showCallBanner, currentVoiceState, outgoingCall, callBannerProps,
  onCancelCall, onNavigateToCall,
  audioStreams, isDeafened, locallyMutedUsers,
  incomingCall, ignoredCallIds, usersByIdentity, getAvatarUrlForUser,
  onAcceptCall, onDeclineCall, onIgnoreCall,
  viewingScreenStream, onCloseScreenShare,
  me, initialLoadComplete, connectionStatus,
  onRegister, onLoginAsUser,
  notifications, onDismissNotification,
}: AppCallOverlaysProps) {
  return (
    <>
      {showCallBanner && (
        <CallBanner
          currentVoiceState={currentVoiceState}
          outgoingCall={outgoingCall}
          calleeName={callBannerProps.calleeName}
          onCancelCall={onCancelCall}
          isDmCall={callBannerProps.isDmCall}
          callName={callBannerProps.callName}
          isOnCallPage={callBannerProps.isOnCallPage}
          onNavigateToCall={onNavigateToCall}
        />
      )}

      <AudioStreams
        audioStreams={audioStreams}
        isDeafened={isDeafened}
        locallyMutedUsers={locallyMutedUsers}
      />

      {incomingCall && !ignoredCallIds.has(String(incomingCall.callId)) && (() => {
        const callerId = identityToString(incomingCall.callerIdentity)
        const callerUser = usersByIdentity.get(callerId)
        return (
          <IncomingCallModal
            callerName={callerUser?.displayName ?? callerUser?.username ?? callerId.slice(0, 12)}
            callerAvatarUrl={getAvatarUrlForUser(callerId)}
            onAccept={onAcceptCall}
            onDecline={onDeclineCall}
            onIgnore={onIgnoreCall}
          />
        )
      })()}

      {viewingScreenStream && (
        <ScreenShareViewer
          stream={viewingScreenStream}
          sharerName="Screen Share"
          onClose={onCloseScreenShare}
        />
      )}

      {!me && initialLoadComplete && connectionStatus === 'connected' && (
        <RegisterOverlay onRegister={onRegister} onLoginAsUser={onLoginAsUser} />
      )}

      <NotificationToast notifications={notifications} onDismiss={onDismissNotification} />
    </>
  )
}
