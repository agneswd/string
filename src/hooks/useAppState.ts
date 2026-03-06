import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ProfilePopupUser } from '../components/social/UserProfilePopup'
import type { NotificationItem } from '../components/ui/NotificationToast'
import { getConn } from '../lib/connection'

export type ProfilePopupState = { userId: string } | null
export type GuildPopupState = { guildId: string } | null
import { stringStore } from '../lib/stringStore'

export interface AppStateParams {
  /** From voice hook: key identifying the screen share being viewed */
  viewingScreenShareKey: string | null
  /** From RTC orchestrator: map of remote media streams */
  remoteStreams: ReadonlyMap<string, MediaStream>
  /** From voice state: whether the user is currently streaming */
  isStreaming: boolean | undefined
  /** Start screen sharing callback */
  onStartSharing: () => void
  /** Stop screen sharing callback */
  onStopSharing: () => void
  /** Current connection status string */
  connectionStatus: string | undefined
  /** Run an async action with optional success label */
  runAction: (fn: () => Promise<void>, successStatus?: string) => Promise<void>
  /** Actions object – only registerUser is needed here */
  actions: { registerUser: (args: { username: string; displayName: string }) => Promise<void> }
  /** From currentVoiceState?.isMuted */
  currentVoiceIsMuted: boolean | undefined
  /** From currentVoiceState?.isDeafened */
  currentVoiceIsDeafened: boolean | undefined
  /** Pre-join muted state from voice hook */
  preMuted: boolean
  /** Pre-join deafened state from voice hook */
  preDeafened: boolean
}

export function useAppState(params: AppStateParams) {
  const { viewingScreenShareKey, remoteStreams, isStreaming, onStartSharing, onStopSharing, connectionStatus, runAction, actions, currentVoiceIsMuted, currentVoiceIsDeafened, preMuted, preDeafened } = params

  // Derived mute/deafen values
  const isMuted = currentVoiceIsMuted ?? preMuted
  const isDeafened = currentVoiceIsDeafened ?? preDeafened
  const muteColor = isMuted ? '#ed4245' : '#b5bac1'
  const deafenColor = isDeafened ? '#ed4245' : '#b5bac1'

  // ---------------------------------------------------------------------------
  // Local state
  // ---------------------------------------------------------------------------
  const [composerValue, setComposerValue] = useState('')
  const [locallyMutedUsers, setLocallyMutedUsers] = useState<Set<string>>(new Set())
  const [showMemberList, setShowMemberList] = useState(true)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showGuildSettingsModal, setShowGuildSettingsModal] = useState(false)
  const [profilePopup, setProfilePopup] = useState<ProfilePopupState>(null)
  const [guildPopup, setGuildPopup] = useState<GuildPopupState>(null)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; userId: string; user: ProfilePopupUser } | null>(null)
  const [initialLoadComplete, setInitialLoadComplete] = useState(false)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [ignoredCallIds, setIgnoredCallIds] = useState<Set<string>>(new Set())

  // ---------------------------------------------------------------------------
  // Callbacks
  // ---------------------------------------------------------------------------
  const addNotification = useCallback((notif: Omit<NotificationItem, 'id'>) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    setNotifications(prev => [...prev.slice(-4), { ...notif, id }])
  }, [])

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  const toggleLocalMuteUser = useCallback((identity: string) => {
    setLocallyMutedUsers(prev => {
      const next = new Set(prev)
      if (next.has(identity)) {
        next.delete(identity)
      } else {
        next.add(identity)
      }
      return next
    })
  }, [])

  const handleToggleScreenShare = useCallback(() => {
    if (isStreaming) {
      onStopSharing()
    } else {
      onStartSharing()
    }
  }, [isStreaming, onStartSharing, onStopSharing])

  const viewingScreenStream = useMemo(() => {
    if (!viewingScreenShareKey) return null
    const key = viewingScreenShareKey.includes(':') ? viewingScreenShareKey : `${viewingScreenShareKey}:screen`
    return remoteStreams.get(key) ?? null
  }, [viewingScreenShareKey, remoteStreams])

  // Grace-period effect: wait for subscriptions to sync before showing register UI
  useEffect(() => {
    if (connectionStatus !== 'connected') {
      setInitialLoadComplete(false)
      return
    }
    const timer = setTimeout(() => setInitialLoadComplete(true), 1500)
    return () => clearTimeout(timer)
  }, [connectionStatus])

  // Auth callbacks
  const onRegister = useCallback(async (username: string, displayName: string): Promise<void> => {
    await runAction(async () => {
      await actions.registerUser({ username, displayName })
    }, 'Registered')
  }, [runAction, actions])

  const onLoginAsUser = useCallback(async (loginUsername: string): Promise<void> => {
    const conn = getConn()
    await conn.reducers.loginAsUser({ username: loginUsername })
    // Disconnect and reconnect so the store syncs fresh data without a page reload
    stringStore.disconnect()
    stringStore.connect()
  }, [])

  // Audio streams derived from remoteStreams
  const audioStreams = useMemo(
    () => Array.from(remoteStreams.entries()).filter(([key]) => key.endsWith(':audio')),
    [remoteStreams],
  )

  return {
    composerValue, setComposerValue,
    locallyMutedUsers, setLocallyMutedUsers,
    showMemberList, setShowMemberList,
    showProfileModal, setShowProfileModal,
    showGuildSettingsModal, setShowGuildSettingsModal,
    profilePopup, setProfilePopup,
    guildPopup, setGuildPopup,
    contextMenu, setContextMenu,
    initialLoadComplete, setInitialLoadComplete,
    notifications, setNotifications,
    ignoredCallIds, setIgnoredCallIds,
    addNotification,
    dismissNotification,
    toggleLocalMuteUser,
    handleToggleScreenShare,
    viewingScreenStream,
    onRegister,
    onLoginAsUser,
    audioStreams,
    isMuted,
    isDeafened,
    muteColor,
    deafenColor,
  }
}
