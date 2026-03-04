import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Phone, Users, Mic, MicOff, Volume2, User, MessageSquare, HeadphoneOff, Headphones } from 'lucide-react'

import {
  ChannelListPane,
  ChatViewPane,
  DmCallOverlay,
  DmListPane,
  FriendRequestPanel,
  IncomingCallModal,
  MemberListPane,
  Modal,
  ServerListPane,
  VoicePanel,
} from './components'
import { ProfileSettingsModal, type ProfileSettingsModalProps } from './components/ProfileSettingsModal'
import { UserProfilePopup, type ProfilePopupUser } from './components/UserProfilePopup'
import { ContextMenu, type ContextMenuItem } from './components/ContextMenu'
import { AppShell } from './components/AppShell'
import { useRtcOrchestrator } from './lib/webrtc'
import { toIdKey, isVoiceChannel, statusToLabel } from './lib/helpers'
import { getAvatarColor, avatarBytesToUrl } from './lib/avatarUtils'
import { getConn } from './lib/connection'
import { identityToString } from './hooks/useAppData'

import { useAppData } from './hooks/useAppData'
import { useActionFeedback } from './hooks/useActionFeedback'
import { useGuildNavigation } from './hooks/useGuildNavigation'
import { useFriends } from './hooks/useFriends'
import { useDmChat } from './hooks/useDmChat'
import { useGuildMessages } from './hooks/useGuildMessages'
import { useVoiceChat } from './hooks/useVoiceChat'
import { useRtcSignaling } from './hooks/useRtcSignaling'
import { useGuildActions } from './hooks/useGuildActions'

import type { RtcSignalTypeTag } from './lib/helpers'
import { playSound, playLoop } from './lib/sfx'
import { NotificationToast, type NotificationItem } from './components/NotificationToast'

// ── Static styles (extracted to avoid re-allocation on every render) ──────────
const S_appShell: React.CSSProperties = { display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }
const S_main: React.CSSProperties = { flex: 1, display: 'flex', minHeight: 0, height: '100%', overflow: 'hidden' }
const S_userPanel: React.CSSProperties = {
  display: 'flex', alignItems: 'center', padding: '0 8px', height: '52px',
  backgroundColor: 'var(--bg-sidebar-dark, #232428)',
  borderTop: '1px solid rgba(255,255,255,0.06)',
}
const S_userPanelInner: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }
const S_userPanelName: React.CSSProperties = { fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }
const S_userPanelStatus: React.CSSProperties = { fontSize: '12px', color: 'var(--text-muted, #949ba4)' }
const S_userPanelActions: React.CSSProperties = { display: 'flex', gap: '4px' }
const S_formCol: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '16px' }
const S_labelCol: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '8px' }
const S_labelSpan: React.CSSProperties = { fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)' }
const S_input: React.CSSProperties = { padding: '10px', borderRadius: '4px', border: 'none', backgroundColor: 'var(--bg-input, #1e1f22)', color: 'var(--text-primary)', fontSize: '14px' }
const S_inviteAvatar: React.CSSProperties = { width: 32, height: 32, borderRadius: '50%', backgroundColor: '#5865f2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '14px', fontWeight: 600 }
const S_screenShareOverlay: React.CSSProperties = {
  position: 'fixed', inset: 0, zIndex: 200,
  backgroundColor: 'rgba(0,0,0,0.9)',
  display: 'flex', flexDirection: 'column',
  alignItems: 'center', justifyContent: 'center',
}
const S_screenShareHeader: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between',
  alignItems: 'center', width: '100%', padding: '12px 20px',
  position: 'absolute', top: 0,
}

function App() {
  // ---------------------------------------------------------------------------
  // Local state (registration form, shared composer, friends modal)
  // ---------------------------------------------------------------------------
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [composerValue, setComposerValue] = useState('')

  // Login-as-user state
  const [loginUsername, setLoginUsername] = useState('')
  const [showLoginForm, setShowLoginForm] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)

  // Per-user local muting (client-side only)
  const [locallyMutedUsers, setLocallyMutedUsers] = useState<Set<string>>(new Set())

  // Member list visibility toggle
  const [showMemberList, setShowMemberList] = useState(true)

  // Profile settings modal
  const [showProfileModal, setShowProfileModal] = useState(false)

  // Profile popup (view profile on right-click)
  const [profilePopup, setProfilePopup] = useState<{ user: ProfilePopupUser } | null>(null)

  // Context menu (right-click on user)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; userId: string; user: ProfilePopupUser } | null>(null)

  // Grace period to avoid registration overlay flash on refresh
  const [initialLoadComplete, setInitialLoadComplete] = useState(false)

  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [ignoredCallIds, setIgnoredCallIds] = useState<Set<string>>(new Set())

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

  // ---------------------------------------------------------------------------
  // Core data & feedback
  // ---------------------------------------------------------------------------
  const appData = useAppData()
  const { state, actions, extendedState, extendedActions, identityString, usersByIdentity, me } = appData

  // Helper to get a data URL for any user's avatar by identity string
  const getAvatarUrlForUser = useCallback((identityStr: string): string | undefined => {
    const user = usersByIdentity.get(identityStr)
    return avatarBytesToUrl(user?.avatarBytes as Uint8Array | null | undefined)
  }, [usersByIdentity])

  const feedback = useActionFeedback()
  const { actionError, actionStatus, setActionError, setActionStatus, runAction, callActionOrReducer } = feedback

  // ---------------------------------------------------------------------------
  // Friends
  // ---------------------------------------------------------------------------
  const friendsData = useFriends(appData, runAction, callActionOrReducer)
  const {
    friendRequestUsername, setFriendRequestUsername,
    friends, incomingFriendRequests, outgoingFriendRequests,
    friendIdentityById,
    onSendFriendRequest, onAcceptFriendRequest, onDeclineFriendRequest,
    onCancelOutgoingFriendRequest, onRemoveFriend,
  } = friendsData

  // ---------------------------------------------------------------------------
  // DM Chat
  // ---------------------------------------------------------------------------
  const dm = useDmChat({
    appData,
    friendIdentityById,
    runAction,
    callActionOrReducer,
    setActionError,
    setActionStatus,
  })
  const {
    selectedDmChannelId, setSelectedDmChannelId,
    dmListItems, selectedDmChannel, selectedDmName,
    dmMessagesForSelectedChannel,
    onStartDmFromFriend, onLeaveDmChannel,
    onToggleDmReaction, getDmReactionsForMessage,
  } = dm

  // ---------------------------------------------------------------------------
  // sendSignal callback (needed before useRtcOrchestrator)
  // ---------------------------------------------------------------------------
  const currentVoiceState = useMemo(
    () => state.voiceStates.find((vs) => identityToString(vs.identity) === identityString) ?? null,
    [identityString, state.voiceStates],
  )

  const sendSignal = useCallback(
    ({ peerId, signalType, payload }: { peerId: string; signalType: RtcSignalTypeTag; payload: string }) => {
      if (!currentVoiceState) return
      const recipientIdentity = usersByIdentity.get(peerId)?.identity
      if (!recipientIdentity) return

      // DM voice: guildId === 0n
      const isDmVoice = toIdKey(currentVoiceState.guildId) === '0'
      if (isDmVoice) {
        return extendedActions.sendDmRtcSignal?.({
          dmChannelId: currentVoiceState.channelId as bigint,
          recipientIdentity,
          signalType: { tag: signalType },
          payload,
        })
      }

      return actions.sendRtcSignal({
        channelId: currentVoiceState.channelId,
        recipientIdentity,
        signalType: { tag: signalType },
        payload,
      })
    },
    [currentVoiceState, usersByIdentity, actions, extendedActions],
  )

  // ---------------------------------------------------------------------------
  // RTC Orchestrator
  // ---------------------------------------------------------------------------
  const { startAudio, setMuted, stopAudio, startScreenShare, stopScreenShare, handleIncomingSignal, remoteStreams, peerStates, isLocalSpeaking, remoteSpeaking, connectToPeers } =
    useRtcOrchestrator({ localIdentity: identityString || '', sendSignal })

  // ---------------------------------------------------------------------------
  // Guild Navigation
  // ---------------------------------------------------------------------------
  const nav = useGuildNavigation({
    appData,
    currentVoiceState,
    selectedDmChannelId,
  })
  const {
    selectedGuildId, setSelectedGuildId,
    selectedTextChannelId, setSelectedTextChannelId,
    setSelectedVoiceChannelId,
    homeViewActiveRef,
    memberGuilds, ownedGuildIds,
    selectedGuild, channelsForGuild,
    textChannels, voiceChannels,
    channelIdsForSelectedGuild,
    selectedTextChannel, selectedVoiceChannel,
  } = nav

  // ---------------------------------------------------------------------------
  // Voice Chat
  // ---------------------------------------------------------------------------
  const voice = useVoiceChat({
    appData,
    selectedVoiceChannel,
    setActionError,
    runAction,
    rtcOrchestrator: {
      isVoiceConnected: Boolean(currentVoiceState),
      startAudio,
      setMuted,
      stopAudio,
      startScreenShare,
      stopScreenShare,
      remoteStreams,
      peerStates,
      isLocalSpeaking,
      remoteSpeaking,
      handleIncomingSignal,
      sendSignal,
      connectToPeers,
    },
  })
  const {
    viewingScreenShareKey, setViewingScreenShareKey,
    voiceChannelUsers,
    rtcRecipients,
    remoteSharersCount,
    onJoinVoice, onLeaveVoice,
    onToggleMute, onToggleDeafen,
    onStartSharing, onStopSharing,
    preMuted, preDeafened,
  } = voice

  // ---------------------------------------------------------------------------
  // RTC Signaling (debug panel)
  // ---------------------------------------------------------------------------
  useRtcSignaling({
    appData,
    currentVoiceState,
    rtcRecipients,
    sendSignal: voice.sendSignal,
    handleIncomingSignal,
    actions,
    setActionError,
    runAction,
  })

  // ---------------------------------------------------------------------------
  // Guild Messages & Members
  // ---------------------------------------------------------------------------
  const guildMessages = useGuildMessages(
    {
      messages: state.messages,
      reactions: appData.reactions,
      identityString,
      usersByIdentity,
      guildMembers: state.guildMembers,
      extendedActions,
    },
    selectedGuild,
    selectedTextChannel,
    channelIdsForSelectedGuild,
    runAction,
    callActionOrReducer,
  )
  const {
    messagesForSelectedTextChannel,
    memberListItems,
    onToggleReaction,
    getReactionsForMessage,
  } = guildMessages

  // ---------------------------------------------------------------------------
  // Guild Actions (create guild/channel, invite, leave, delete)
  // ---------------------------------------------------------------------------
  // ---------------------------------------------------------------------------
  // Guild Invites
  // ---------------------------------------------------------------------------
  const myGuildInvites = useMemo(() => {
    if (!state.identity) return []
    const myId = identityString
    return appData.guildInvites
      .filter((inv) => identityToString(inv.inviteeIdentity) === myId)
      .map((inv) => ({
        id: String(inv.inviteId),
        guildId: String(inv.guildId),
        inviterName: usersByIdentity.get(identityToString(inv.inviterIdentity))?.username ?? 'Unknown',
      }))
  }, [appData.guildInvites, state.identity, identityString, usersByIdentity])

  const onAcceptGuildInvite = useCallback((inviteId: string) => {
    void runAction(async () => {
      await extendedActions.acceptGuildInvite?.({ inviteId: BigInt(inviteId) })
    }, 'Invite accepted')
  }, [runAction, extendedActions])

  const onDeclineGuildInvite = useCallback((inviteId: string) => {
    void runAction(async () => {
      await extendedActions.declineGuildInvite?.({ inviteId: BigInt(inviteId) })
    }, 'Invite declined')
  }, [runAction, extendedActions])

  const guildActions = useGuildActions({
    actions,
    selectedGuild,
    runAction,
    callActionOrReducer,
    setActionError,
    setActionStatus,
    setSelectedGuildId,
  })
  const {
    newGuildName, setNewGuildName,
    newChannelName, setNewChannelName,
    newChannelType, setNewChannelType,
    showCreateGuildModal, setShowCreateGuildModal,
    showCreateChannelModal, setShowCreateChannelModal,
    showInviteModal, setShowInviteModal,
    inviteSearchQuery, setInviteSearchQuery,
    onCreateGuild, onCreateChannel,
    onInviteFriend, onLeaveGuild, onDeleteGuild,
  } = guildActions

  // ---------------------------------------------------------------------------
  // Derived values
  // ---------------------------------------------------------------------------
  const isHomeView = !selectedGuildId && !selectedDmChannel
  const isDmMode = selectedDmChannel !== null

  // Incoming call notification (I'm being called)
  const incomingCall = useMemo(() => {
    if (!identityString) return null
    return state.dmCallRequests.find(
      (r) => identityToString(r.calleeIdentity) === identityString
    ) ?? null
  }, [state.dmCallRequests, identityString])

  // Outgoing call (I'm calling someone)
  const outgoingCall = useMemo(() => {
    if (!identityString) return null
    return state.dmCallRequests.find(
      (r) => identityToString(r.callerIdentity) === identityString
    ) ?? null
  }, [state.dmCallRequests, identityString])

  // Stable IDs for sound-loop effect dependencies (avoid re-triggering on object identity changes)
  const incomingCallId = incomingCall ? String(incomingCall.callId) : null
  const outgoingCallId = outgoingCall ? String(outgoingCall.callId) : null

  // Am I currently in a DM voice call?
  const isInDmVoice = currentVoiceState
    ? toIdKey(currentVoiceState.guildId) === '0'
    : false

  const dmVoiceChannelId = isInDmVoice
    ? toIdKey(currentVoiceState!.channelId)
    : null

  // Remote user info for DmCallOverlay
  const dmCallRemoteUser = useMemo(() => {
    if (!isInDmVoice || !dmVoiceChannelId || !identityString) return null

    // Find the other person in voice for this DM channel
    const otherVoiceState = state.voiceStates.find(
      (vs) => toIdKey(vs.guildId) === '0'
        && toIdKey(vs.channelId) === dmVoiceChannelId
        && identityToString(vs.identity) !== identityString
    )

    if (!otherVoiceState) return null

    const otherId = identityToString(otherVoiceState.identity)
    const otherUser = usersByIdentity.get(otherId)

    return {
      name: otherUser?.displayName ?? otherUser?.username ?? otherId.slice(0, 12),
      avatarUrl: getAvatarUrlForUser(otherId),
    }
  }, [isInDmVoice, dmVoiceChannelId, identityString, state.voiceStates, usersByIdentity, getAvatarUrlForUser])

  // DM voice call active indicator
  const dmCallActive = isDmMode && selectedDmChannel && state.voiceStates.some(
    vs => toIdKey(vs.guildId) === '0' && toIdKey(vs.channelId) === toIdKey(selectedDmChannel.dmChannelId)
  )
  const activeChannelName = isDmMode
    ? selectedDmName ?? `dm-${toIdKey(selectedDmChannel?.dmChannelId ?? '')}`
    : selectedTextChannel?.name
  const activeMessages = isDmMode ? dmMessagesForSelectedChannel : messagesForSelectedTextChannel

  // DM partner identity for header avatar/color
  const dmPartnerIdentity = useMemo(() => {
    if (!isDmMode || !selectedDmChannel || !identityString) return null
    const dmKey = toIdKey(selectedDmChannel.dmChannelId)
    const otherParticipant = appData.dmParticipants.find(
      (p) => toIdKey(p.dmChannelId) === dmKey && identityToString(p.identity) !== identityString
    )
    return otherParticipant ? identityToString(otherParticipant.identity) : null
  }, [isDmMode, selectedDmChannel, identityString, appData.dmParticipants])

  const dmPartnerAvatarUrl = useMemo(() => {
    if (!dmPartnerIdentity) return undefined
    return getAvatarUrlForUser(dmPartnerIdentity)
  }, [dmPartnerIdentity, getAvatarUrlForUser])

  const dmPartnerProfileColor = useMemo(() => {
    if (!dmPartnerIdentity) return undefined
    const user = usersByIdentity.get(dmPartnerIdentity)
    return getAvatarColor(user?.username ?? user?.displayName ?? dmPartnerIdentity)
  }, [dmPartnerIdentity, usersByIdentity])
  const statusError = state.error ?? actionError
  const viewingScreenStream = useMemo(() => {
    if (!viewingScreenShareKey) return null;
    const key = viewingScreenShareKey.includes(':') ? viewingScreenShareKey : `${viewingScreenShareKey}:screen`;
    return remoteStreams.get(key) ?? null;
  }, [viewingScreenShareKey, remoteStreams])
  const isMuted = currentVoiceState?.isMuted ?? voice.preMuted
  const isDeafened = currentVoiceState?.isDeafened ?? voice.preDeafened
  const muteColor = isMuted ? '#ed4245' : '#b5bac1'
  const deafenColor = isDeafened ? '#ed4245' : '#b5bac1'

  // DM call speaking states
  const dmRemoteSpeaking = useMemo(() => {
    if (!isInDmVoice || !dmVoiceChannelId || !identityString) return false
    const otherVoiceState = state.voiceStates.find(
      (vs) => toIdKey(vs.guildId) === '0'
        && toIdKey(vs.channelId) === dmVoiceChannelId
        && identityToString(vs.identity) !== identityString
    )
    if (!otherVoiceState) return false
    const otherId = identityToString(otherVoiceState.identity)
    return remoteSpeaking.get(`${otherId}:audio`) ?? false
  }, [isInDmVoice, dmVoiceChannelId, identityString, state.voiceStates, remoteSpeaking])

  // Remote screen share stream for DM calls
  const dmRemoteScreenStream = useMemo(() => {
    if (!isInDmVoice || !dmVoiceChannelId || !identityString) return null
    const otherVoiceState = state.voiceStates.find(
      (vs) => toIdKey(vs.guildId) === '0'
        && toIdKey(vs.channelId) === dmVoiceChannelId
        && identityToString(vs.identity) !== identityString
    )
    if (!otherVoiceState) return null
    const otherId = identityToString(otherVoiceState.identity)
    return remoteStreams.get(`${otherId}:screen`) ?? null
  }, [isInDmVoice, dmVoiceChannelId, identityString, state.voiceStates, remoteStreams])

  // Key for fullscreen viewing of DM remote screen share
  const dmRemoteScreenShareKey = useMemo(() => {
    if (!isInDmVoice || !dmVoiceChannelId || !identityString) return null
    const otherVoiceState = state.voiceStates.find(
      (vs) => toIdKey(vs.guildId) === '0'
        && toIdKey(vs.channelId) === dmVoiceChannelId
        && identityToString(vs.identity) !== identityString
    )
    if (!otherVoiceState) return null
    return `${identityToString(otherVoiceState.identity)}:screen`
  }, [isInDmVoice, dmVoiceChannelId, identityString, state.voiceStates])

  // Active DM call channel IDs (for showing call indicators in DM list)
  const activeCallChannelIds = useMemo(() => {
    const ids = new Set<string>()
    for (const vs of state.voiceStates) {
      if (toIdKey(vs.guildId) === '0') {
        ids.add(toIdKey(vs.channelId))
      }
    }
    return ids
  }, [state.voiceStates])

  // ---------------------------------------------------------------------------
  // Call action callbacks
  // ---------------------------------------------------------------------------
  const handleAcceptCall = useCallback(() => {
    if (!incomingCall) return
    // Auto-navigate to the DM channel for this call
    const dmChannelId = String(incomingCall.dmChannelId)
    setSelectedDmChannelId(dmChannelId)
    setSelectedGuildId(undefined)
    void runAction(
      () => extendedActions.acceptDmCall({ callId: BigInt(incomingCall.callId) }),
      'Call accepted',
    )
  }, [incomingCall, runAction, extendedActions, setSelectedDmChannelId, setSelectedGuildId])

  const handleDeclineCall = useCallback(() => {
    if (!incomingCall) return
    void runAction(
      () => extendedActions.declineDmCall({ callId: BigInt(incomingCall.callId) }),
    )
  }, [incomingCall, runAction, extendedActions])

  const handleCancelOutgoingCall = useCallback(() => {
    if (!outgoingCall) return
    void runAction(
      () => extendedActions.declineDmCall({ callId: BigInt(outgoingCall.callId) }),
    )
  }, [outgoingCall, runAction, extendedActions])

  // Outgoing call tone — play start-call once, then loop call-ring
  useEffect(() => {
    if (!outgoingCallId) return
    playSound('start-call')
    // After start-call finishes (~2-3s), loop call-ring
    const stopRef = { current: null as (() => void) | null }
    const timerId = window.setTimeout(() => {
      stopRef.current = playLoop('call-ring', 3000)
    }, 3000)
    return () => {
      clearTimeout(timerId)
      stopRef.current?.()
    }
  }, [outgoingCallId])

  // SFX: Call declined — outgoing call ended without connecting
  const prevOutgoingCall = useRef<typeof outgoingCall>(null)
  useEffect(() => {
    if (prevOutgoingCall.current && !outgoingCall && !isInDmVoice) {
      playSound('call-declined')
    }
    prevOutgoingCall.current = outgoingCall
  }, [outgoingCall, isInDmVoice])

  // SFX: Incoming call ringtone
  useEffect(() => {
    if (!incomingCallId) return
    const stop = playLoop('call-sound', 3000)
    return () => stop()
  }, [incomingCallId])

  // SFX: Call connected
  const prevInDmVoice = useRef(false)
  useEffect(() => {
    if (isInDmVoice && !prevInDmVoice.current) {
      playSound('continue-call')
    }
    prevInDmVoice.current = isInDmVoice
  }, [isInDmVoice])

  // SFX + notification: Other user left DM call
  const prevDmCallPeerCount = useRef<number>(0)
  useEffect(() => {
    if (!isInDmVoice || !dmVoiceChannelId) {
      prevDmCallPeerCount.current = 0
      return
    }
    const peerCount = state.voiceStates.filter(
      vs => toIdKey(vs.guildId) === '0'
        && toIdKey(vs.channelId) === dmVoiceChannelId
        && identityToString(vs.identity) !== identityString
    ).length
    if (prevDmCallPeerCount.current > 0 && peerCount === 0) {
      playSound('contact-left')
      addNotification({ message: 'The other person left the call', type: 'info' })
    }
    prevDmCallPeerCount.current = peerCount
  }, [isInDmVoice, dmVoiceChannelId, state.voiceStates, identityString, addNotification])

  // SFX: Hangup when leaving call
  const handleHangUpWithSfx = useCallback(() => {
    playSound('hangup')
    onLeaveVoice()
  }, [onLeaveVoice])

  // Delete / Edit message handlers
  const handleDeleteMessage = useCallback((messageId: string | number) => {
    void runAction(async () => {
      if (isDmMode) {
        await callActionOrReducer(extendedActions.deleteDmMessage, 'deleteDmMessage', {
          dmMessageId: BigInt(messageId),
        })
      } else {
        await actions.deleteMessage({ messageId: BigInt(messageId) })
      }
    })
  }, [isDmMode, runAction, callActionOrReducer, extendedActions, actions])

  const handleEditMessage = useCallback((messageId: string | number, newContent: string) => {
    void runAction(async () => {
      if (isDmMode) {
        await callActionOrReducer(extendedActions.editDmMessage, 'editDmMessage', {
          dmMessageId: BigInt(messageId),
          newContent,
        })
      } else {
        await actions.editMessage({ messageId: BigInt(messageId), newContent })
      }
    })
  }, [isDmMode, runAction, callActionOrReducer, extendedActions, actions])

  // SFX: Message sent
  const onSendMessage = useCallback((content: string): void => {
    if (selectedDmChannel) {
      void runAction(async () => {
        await callActionOrReducer(extendedActions.sendDmMessage, 'sendDmMessage', {
          dmChannelId: selectedDmChannel.dmChannelId,
          content,
          replyTo: undefined,
        })
        setComposerValue('')
      })
      return
    }

    if (!selectedTextChannel) {
      setActionError('Select a text channel first')
      return
    }

    void runAction(async () => {
      await actions.sendMessage({
        channelId: selectedTextChannel.channelId,
        content,
        replyTo: undefined,
      })
      setComposerValue('')
    })
  }, [selectedDmChannel, selectedTextChannel, runAction, callActionOrReducer, extendedActions, actions, setActionError])

  // SFX: Message sent (with sound)
  const handleSendMessageWithSfx = useCallback((content: string) => {
    onSendMessage(content)
    playSound('message-sent')
  }, [onSendMessage])

  // Handle ignoring an incoming call
  const handleIgnoreCall = useCallback(() => {
    if (!incomingCall) return
    setIgnoredCallIds(prev => new Set(prev).add(String(incomingCall.callId)))
  }, [incomingCall])

  // Convert action feedback to notifications
  useEffect(() => {
    if (actionStatus) {
      addNotification({
        message: actionStatus,
        type: actionStatus.toLowerCase().includes('error') || actionStatus.toLowerCase().includes('fail') ? 'error' : 'success',
      })
    }
  }, [actionStatus, addNotification])

  useEffect(() => {
    if (actionError) {
      addNotification({ message: actionError, type: 'error' })
    }
  }, [actionError, addNotification])

  // Online/offline friend notifications
  const prevFriendStatuses = useRef<Map<string, string>>(new Map())
  useEffect(() => {
    const prev = prevFriendStatuses.current
    for (const friend of friends) {
      const prevStatus = prev.get(friend.id)
      if (prevStatus !== undefined) {
        const wasOnline = ['online', 'idle', 'dnd'].includes(prevStatus.toLowerCase())
        const isOnline = ['online', 'idle', 'dnd'].includes(friend.status.toLowerCase())
        if (!wasOnline && isOnline) {
          playSound('contact-online')
          addNotification({ message: `${friend.displayName || friend.username} is now online`, type: 'info' })
        } else if (wasOnline && !isOnline) {
          playSound('contact-offline')
          addNotification({ message: `${friend.displayName || friend.username} went offline`, type: 'info' })
        }
      }
      prev.set(friend.id, friend.status)
    }
  }, [friends, addNotification])

  // DM message received sound for current channel
  const prevSelectedDmMsgCount = useRef(0)
  useEffect(() => {
    const msgs = dmMessagesForSelectedChannel
    const count = msgs?.length ?? 0
    if (count > prevSelectedDmMsgCount.current && prevSelectedDmMsgCount.current > 0) {
      const lastMsg = msgs?.[count - 1]
      if (lastMsg && lastMsg.authorId !== identityString) {
        playSound('message-received')
      }
    }
    prevSelectedDmMsgCount.current = count
  }, [dmMessagesForSelectedChannel, identityString])

  // DM notifications for messages in non-selected channels
  const prevDmMsgCounts = useRef<Map<string, number>>(new Map())
  useEffect(() => {
    const allDmMessages = appData.dmMessages ?? []
    // Group messages by channel
    const msgsByChannel = new Map<string, typeof allDmMessages>()
    for (const msg of allDmMessages) {
      const chId = toIdKey(msg.dmChannelId)
      if (!msgsByChannel.has(chId)) msgsByChannel.set(chId, [])
      msgsByChannel.get(chId)!.push(msg)
    }

    const prev = prevDmMsgCounts.current
    for (const [chId, msgs] of msgsByChannel) {
      const prevCount = prev.get(chId) ?? 0
      if (msgs.length > prevCount && prevCount > 0) {
        // New message(s) in this channel
        const lastMsg = msgs[msgs.length - 1]
        const senderId = identityToString(lastMsg.authorIdentity)
        if (senderId !== identityString && chId !== selectedDmChannelId) {
          // Not from us, and not in the currently open channel
          const senderUser = usersByIdentity.get(senderId)
          const senderName = senderUser?.displayName ?? senderUser?.username ?? 'Someone'
          playSound('message-received')
          addNotification({
            message: `New message from ${senderName}`,
            subtitle: String(lastMsg.content ?? '').slice(0, 100),
            type: 'message' as const,
            onClick: () => {
              setSelectedDmChannelId(chId)
              setSelectedGuildId(undefined)
            },
          })
        }
      }
      prev.set(chId, msgs.length)
    }
  }, [appData.dmMessages, identityString, selectedDmChannelId, addNotification, usersByIdentity, setSelectedDmChannelId, setSelectedGuildId])

  const handleToggleScreenShare = useCallback(() => {
    if (currentVoiceState?.isStreaming) {
      onStopSharing()
    } else {
      onStartSharing()
    }
  }, [currentVoiceState?.isStreaming, onStartSharing, onStopSharing])

  // ---------------------------------------------------------------------------
  // Grace-period effect: wait for subscriptions to sync before showing register UI
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (state.connectionStatus !== 'connected') {
      setInitialLoadComplete(false)
      return
    }
    const timer = setTimeout(() => setInitialLoadComplete(true), 1500)
    return () => clearTimeout(timer)
  }, [state.connectionStatus])

  // ---------------------------------------------------------------------------
  // Login-as-user handler
  // ---------------------------------------------------------------------------
  const onLoginAsUser = useCallback(async () => {
    if (!loginUsername.trim()) return
    setLoginError(null)
    try {
      const conn = getConn()
      await conn.reducers.loginAsUser({ username: loginUsername.trim() })
      window.location.reload()
    } catch (err) {
      setLoginError(String(err))
    }
  }, [loginUsername])

  // ---------------------------------------------------------------------------
  // Handlers that straddle hooks (stay in App)
  // ---------------------------------------------------------------------------
  const onRegister = useCallback(async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    await runAction(async () => {
      await actions.registerUser({ username, displayName })
      setUsername('')
      setDisplayName('')
    }, 'Registered')
  }, [runAction, actions, username, displayName])

  // ---------------------------------------------------------------------------
  // Memoized derived values for rendering
  // ---------------------------------------------------------------------------
  const audioStreams = useMemo(
    () => Array.from(remoteStreams.entries()).filter(([key]) => key.endsWith(':audio')),
    [remoteStreams],
  )

  // ---------------------------------------------------------------------------
  // Guild ordering (client-side preference, persisted via localStorage)
  // ---------------------------------------------------------------------------
  const [guildOrder, setGuildOrder] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('guildOrder') || '[]') } catch { return [] }
  })

  const orderedGuilds = useMemo(() => {
    if (guildOrder.length === 0) return memberGuilds
    const orderMap = new Map(guildOrder.map((id, idx) => [id, idx]))
    return [...memberGuilds].sort((a, b) => {
      const aIdx = orderMap.get(toIdKey(a.guildId)) ?? Infinity
      const bIdx = orderMap.get(toIdKey(b.guildId)) ?? Infinity
      return aIdx - bIdx
    })
  }, [memberGuilds, guildOrder])

  const handleReorderGuilds = useCallback((newOrder: string[]) => {
    setGuildOrder(newOrder)
    localStorage.setItem('guildOrder', JSON.stringify(newOrder))
  }, [])

  const handleSelectGuild = useCallback((guildId: string | number) => {
    homeViewActiveRef.current = false
    setSelectedGuildId(String(guildId))
    setSelectedDmChannelId(undefined)
  }, [homeViewActiveRef, setSelectedGuildId, setSelectedDmChannelId])

  const handleHomeClick = useCallback(() => {
    homeViewActiveRef.current = true
    setSelectedGuildId(undefined)
  }, [homeViewActiveRef, setSelectedGuildId])

  const handleSelectDmChannel = useCallback((channelId: string | number) => {
    setSelectedDmChannelId(String(channelId))
  }, [setSelectedDmChannelId])

  const handleInitiateDmCall = useCallback((dmChannelId: string | number) => {
    void runAction(() => extendedActions.initiateDmCall?.({ dmChannelId: BigInt(String(dmChannelId)) }) ?? Promise.resolve())
  }, [runAction, extendedActions])

  // View profile handler (right-click on user avatar/name → opens context menu)
  const handleViewProfile = useCallback((user: { displayName: string; username: string; bio?: string; status?: string; avatarUrl?: string }, x: number, y: number) => {
    // Enrich with data from usersByIdentity if available
    const found = Array.from(usersByIdentity.values()).find(u => u.username === user.username || u.displayName === user.displayName)
    const enriched: ProfilePopupUser = {
      displayName: found?.displayName ?? user.displayName,
      username: found?.username ?? user.username,
      bio: found?.bio ?? user.bio,
      status: found ? statusToLabel(found.status) : user.status,
      avatarUrl: user.avatarUrl ?? (found ? getAvatarUrlForUser(identityToString(found.identity)) : undefined),
      profileColor: (found as any)?.profileColor ?? undefined,
    }
    const userId = found ? identityToString(found.identity) : ''
    setContextMenu({ x, y, userId, user: enriched })
  }, [usersByIdentity, getAvatarUrlForUser])

  const handleSelectTextOrVoiceChannel = useCallback((channelId: string | number) => {
    const channel = channelsForGuild.find((c) => toIdKey(c.channelId) === String(channelId))
    if (channel && isVoiceChannel(channel)) {
      setSelectedVoiceChannelId(String(channelId))
      onJoinVoice(channel)
    } else {
      setSelectedTextChannelId(String(channelId))
      setSelectedDmChannelId(undefined)
    }
  }, [channelsForGuild, setSelectedVoiceChannelId, onJoinVoice, setSelectedTextChannelId, setSelectedDmChannelId])

  const handleInviteToGuild = useCallback((guildId: string) => {
    setSelectedGuildId(String(guildId));
    setShowInviteModal(true);
  }, [setSelectedGuildId, setShowInviteModal])

  // ---------------------------------------------------------------------------
  // JSX
  // ---------------------------------------------------------------------------
  return (
    <div className="app-shell" style={S_appShell}>
      {/* Global call banner */}
      {(currentVoiceState || outgoingCall) && (() => {
        if (!currentVoiceState && outgoingCall) {
          const calleeId = identityToString(outgoingCall.calleeIdentity)
          const calleeUser = usersByIdentity.get(calleeId)
          const calleeName = calleeUser?.displayName ?? calleeUser?.username ?? calleeId.slice(0, 12)
          return (
            <div style={{
              width: '100%',
              background: '#248046',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 16px',
              fontSize: 13,
              fontWeight: 500,
              flexShrink: 0,
              zIndex: 50,
            }}>
              <Phone style={{ width: 16, height: 16, animation: 'pulse 1.5s ease-in-out infinite' }} />
              <span>Calling {calleeName}...</span>
              <button
                onClick={handleCancelOutgoingCall}
                style={{
                  marginLeft: 'auto',
                  background: '#ed4245',
                  border: 'none',
                  color: '#fff',
                  padding: '4px 12px',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                Cancel
              </button>
            </div>
          )
        }
          const isDmCall = toIdKey(currentVoiceState.guildId) === '0'
          const channelId = toIdKey(currentVoiceState.channelId)
          const callName = isDmCall
            ? (() => {
                // Find the other person in the DM call
                const otherVs = state.voiceStates.find(
                  vs => toIdKey(vs.guildId) === '0'
                    && toIdKey(vs.channelId) === channelId
                    && identityToString(vs.identity) !== identityString
                )
                if (otherVs) {
                  const otherUser = usersByIdentity.get(identityToString(otherVs.identity))
                  return otherUser?.displayName ?? otherUser?.username ?? 'DM Call'
                }
                return 'DM Call'
              })()
            : channelsForGuild.find(c => toIdKey(c.channelId) === channelId)?.name ?? 'Voice Channel'
          const isOnCallPage = isDmCall
            ? (isDmMode && selectedDmChannelId === channelId)
            : (selectedGuildId && selectedTextChannelId === channelId)
          return (
            <div style={{
              width: '100%',
              background: '#248046',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '4px 16px',
              fontSize: 13,
              fontWeight: 500,
              flexShrink: 0,
              zIndex: 50,
              cursor: 'pointer',
            }}
            onClick={() => {
              if (isDmCall) {
                setSelectedDmChannelId(channelId)
                setSelectedGuildId(undefined)
              }
            }}
            >
              <Phone style={{ width: 16, height: 16 }} />
              <span>{isDmCall ? `In call with ${callName}` : `Voice Connected — ${callName}`}</span>
              {!isOnCallPage && isDmCall && (
                <span style={{ marginLeft: 'auto', textDecoration: 'underline', fontSize: 12 }}>Return to call</span>
              )}
            </div>
          )
        })()}
      <main style={S_main}>
        <AppShell
          serverColumn={
            <ServerListPane
              guilds={orderedGuilds.map((guild) => ({ id: toIdKey(guild.guildId), name: guild.name }))}
              selectedGuildId={selectedGuildId}
              onSelectGuild={handleSelectGuild}
              onHomeClick={handleHomeClick}
              isHomeSelected={isDmMode || !selectedGuildId}
              onAddServer={() => {
                const userName = (me as any)?.displayName ?? (me as any)?.username ?? 'My'
                setNewGuildName(`${userName}'s server`)
                setShowCreateGuildModal(true)
              }}
              onLeaveGuild={onLeaveGuild}
              onDeleteGuild={onDeleteGuild}
              onInviteToGuild={handleInviteToGuild}
              ownedGuildIds={ownedGuildIds}
              onReorder={handleReorderGuilds}
            />
          }
          channelColumn={
            isDmMode || !selectedGuildId ? (
              <div className="flex h-full min-h-0 flex-col gap-3 overflow-y-auto p-2">
                <DmListPane
                  channels={dmListItems}
                  selectedChannelId={selectedDmChannelId}
                  onSelectChannel={handleSelectDmChannel}
                  onLeaveChannel={(channelId) => onLeaveDmChannel(channelId)}
                  onStartVoiceCall={undefined}
                  onCreateChannel={undefined}
                  createButtonLabel="New DM"
                  onShowFriends={() => setSelectedDmChannelId(undefined)}
                  activeCallChannelIds={activeCallChannelIds}
                />
              </div>
            ) : (
              <ChannelListPane
                guildName={selectedGuild?.name}
                channels={channelsForGuild.map((channel) => ({
                  id: toIdKey(channel.channelId),
                  name: channel.name,
                  kind: isVoiceChannel(channel) ? 'voice' as const : 'text' as const,
                }))}
                selectedChannelId={selectedTextChannelId}
                onSelectChannel={handleSelectTextOrVoiceChannel}
                onCreateChannel={() => setShowCreateChannelModal(true)}
                onViewScreenShare={setViewingScreenShareKey}
                voiceChannelUsers={voiceChannelUsers}
                currentVoiceChannelId={currentVoiceState ? toIdKey(currentVoiceState.channelId) : undefined}
                locallyMutedUsers={locallyMutedUsers}
                onToggleLocalMuteUser={toggleLocalMuteUser}
                localIdentity={identityString}
                getAvatarUrl={getAvatarUrlForUser}
              />
            )
          }
          showMemberList={showMemberList}
          topNav={
            <div className="flex w-full items-center justify-between gap-3 px-2">
              <strong>{isDmMode ? (selectedDmName ?? 'Direct Messages') : selectedGuild?.name ?? 'Select a guild'}</strong>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 'auto' }}>
                {isDmMode && selectedDmChannel && !currentVoiceState && !outgoingCall && (
                  <button
                    onClick={() => handleInitiateDmCall(selectedDmChannelId!)}
                    title={dmCallActive ? 'Rejoin Call' : 'Start Voice Call'}
                    style={{
                      background: dmCallActive ? 'rgba(59,165,93,0.15)' : 'transparent',
                      border: 'none',
                      borderRadius: 4,
                      padding: '4px 6px',
                      cursor: 'pointer',
                      color: dmCallActive ? '#3ba55d' : '#b5bac1',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Phone style={{ width: 20, height: 20 }} />
                    {dmCallActive && <span style={{ fontSize: 12, fontWeight: 600 }}>Rejoin</span>}
                  </button>
                )}
              <button
                onClick={() => setShowMemberList(prev => !prev)}
                title={showMemberList ? 'Hide Member List' : 'Show Member List'}
                style={{
                  background: showMemberList ? 'rgba(88, 101, 242, 0.15)' : 'transparent',
                  border: 'none',
                  borderRadius: 4,
                  padding: '4px 6px',
                  cursor: 'pointer',
                  color: showMemberList ? '#dbdee1' : '#949ba4',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Users style={{ width: 20, height: 20 }} />
              </button>
              </div>
            </div>
          }
          messageArea={
            isInDmVoice && isDmMode && selectedDmChannelId === dmVoiceChannelId ? (
              <DmCallOverlay
                localUser={{
                  name: me?.displayName ?? me?.username ?? '?',
                  avatarUrl: getAvatarUrlForUser(identityString ?? ''),
                  isMuted: currentVoiceState?.isMuted ?? false,
                  isDeafened: currentVoiceState?.isDeafened ?? false,
                }}
                remoteUser={dmCallRemoteUser ?? { name: 'Connecting...' }}
                onMute={onToggleMute}
                onDeafen={onToggleDeafen}
                onScreenShare={handleToggleScreenShare}
                onHangUp={handleHangUpWithSfx}
                isMuted={currentVoiceState?.isMuted ?? false}
                isDeafened={currentVoiceState?.isDeafened ?? false}
                isScreenSharing={currentVoiceState?.isStreaming ?? false}
                isLocalSpeaking={isLocalSpeaking}
                isRemoteSpeaking={dmRemoteSpeaking}
                remoteScreenStream={dmRemoteScreenStream}
                callState="connected"
                onViewScreenShareFullscreen={dmRemoteScreenStream ? () => setViewingScreenShareKey(dmRemoteScreenShareKey) : undefined}
                chatPanel={
                  <ChatViewPane
                    channelName={activeChannelName}
                    messages={dmMessagesForSelectedChannel}
                    composerValue={composerValue}
                    onComposerChange={setComposerValue}
                    onSend={handleSendMessageWithSfx}
                    getReactionsForMessage={getDmReactionsForMessage}
                    onToggleReaction={onToggleDmReaction}
                    currentUserId={identityString || undefined}
                    composerPlaceholder={`Message ${activeChannelName ?? 'direct message'}`}
                    onViewProfile={handleViewProfile}
                    getAvatarUrl={getAvatarUrlForUser}
                    onDeleteMessage={handleDeleteMessage}
                    onEditMessage={handleEditMessage}
                    isDm={true}
                    avatarUrl={dmPartnerAvatarUrl}
                    profileColor={dmPartnerProfileColor}
                  />
                }
              />
            ) : isHomeView ? (
              <FriendRequestPanel
                requestUsername={friendRequestUsername}
                onRequestUsernameChange={setFriendRequestUsername}
                onSendRequest={onSendFriendRequest}
                incomingRequests={incomingFriendRequests.map((request) => ({
                  id: request.id,
                  username: request.username,
                }))}
                onAcceptRequest={onAcceptFriendRequest}
                onDeclineRequest={onDeclineFriendRequest}
                outgoingRequests={outgoingFriendRequests.map((request) => ({
                  id: request.id,
                  username: request.username,
                }))}
                onCancelOutgoingRequest={onCancelOutgoingFriendRequest}
                friends={friends.map((friend) => ({
                  id: friend.id,
                  username: friend.username,
                  displayName: friend.displayName,
                  status: friend.status,
                }))}
                onStartDm={onStartDmFromFriend}
                onRemoveFriend={onRemoveFriend}
                guildInvites={myGuildInvites}
                onAcceptGuildInvite={onAcceptGuildInvite}
                onDeclineGuildInvite={onDeclineGuildInvite}
                className="h-full"
              />
            ) : (
              <ChatViewPane
                channelName={activeChannelName}
                messages={activeMessages}
                composerValue={composerValue}
                onComposerChange={setComposerValue}
                onSend={handleSendMessageWithSfx}
                getReactionsForMessage={isDmMode ? getDmReactionsForMessage : getReactionsForMessage}
                onToggleReaction={isDmMode ? onToggleDmReaction : onToggleReaction}
                currentUserId={identityString || undefined}
                composerPlaceholder={
                  isDmMode
                    ? `Message ${activeChannelName ?? 'direct message'}`
                    : selectedTextChannel
                      ? `Message #${selectedTextChannel.name}`
                      : 'Select a text channel or direct message'
                }
                className="h-full"
                callActive={!!dmCallActive}
                onViewProfile={handleViewProfile}
                getAvatarUrl={getAvatarUrlForUser}
                onDeleteMessage={handleDeleteMessage}
                onEditMessage={handleEditMessage}
                isDm={isDmMode}
                avatarUrl={isDmMode ? dmPartnerAvatarUrl : undefined}
                profileColor={isDmMode ? dmPartnerProfileColor : undefined}
              />
            )
          }
          inputArea={null}
          sidebarBottom={
            <>
              {currentVoiceState && (
                <div className="flex min-h-0 flex-col gap-3 p-2">
                  <VoicePanel
                    connected={true}
                    muted={currentVoiceState.isMuted ?? false}
                    deafened={currentVoiceState.isDeafened ?? false}
                    streaming={currentVoiceState.isStreaming ?? false}
                    onLeave={handleHangUpWithSfx}
                    remoteSharersCount={remoteSharersCount}
                    onStartSharing={onStartSharing}
                    onStopSharing={onStopSharing}
                  />
                </div>
              )}
              {me && (
                <div style={S_userPanel}>
                  <div
                    style={{ ...S_userPanelInner, cursor: 'pointer' }}
                    onClick={() => setShowProfileModal(true)}
                    title={`@${(me as Record<string, unknown>).username as string ?? 'unknown'}`}
                  >
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      {(() => {
                        const myAvatarUrl = avatarBytesToUrl((me as Record<string, unknown>).avatarBytes as Uint8Array | null | undefined)
                        const myName = (me as Record<string, unknown>).displayName as string ?? (me as Record<string, unknown>).username as string ?? '?'
                        return myAvatarUrl ? (
                          <img src={myAvatarUrl} alt="" style={{
                            width: 32, height: 32, borderRadius: '50%', objectFit: 'cover',
                          }} />
                        ) : (
                          <div style={{
                            width: 32, height: 32, borderRadius: '50%',
                            backgroundColor: getAvatarColor(myName),
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#fff', fontSize: '14px', fontWeight: 600,
                          }}>
                            {myName[0].toUpperCase()}
                          </div>
                        )
                      })()}
                      <div style={{
                        position: 'absolute', bottom: -1, right: -1,
                        width: 10, height: 10, borderRadius: '50%',
                        backgroundColor: (() => {
                          const tag = statusToLabel((me as Record<string, unknown>).status)
                          if (tag === 'DoNotDisturb') return '#ed4245'
                          if (tag === 'Offline') return '#747f8d'
                          return '#43b581'
                        })(),
                        border: '2px solid var(--bg-sidebar-dark, #232428)',
                      }} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={S_userPanelName}>
                        {(me as Record<string, unknown>).displayName as string ?? (me as Record<string, unknown>).username as string}
                      </div>
                      <div style={S_userPanelStatus}>
                        {statusToLabel((me as Record<string, unknown>).status) || 'Online'}
                      </div>
                    </div>
                  </div>
                  <div style={S_userPanelActions}>
                    <button onClick={onToggleMute} title={isMuted ? 'Unmute' : 'Mute'} style={{
                      width: 32, height: 32, borderRadius: '4px', border: 'none', padding: 0,
                      backgroundColor: isMuted ? 'rgba(237,66,69,0.2)' : 'transparent',
                      color: muteColor,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {isMuted ? (
                        <MicOff style={{ width: 20, height: 20, color: muteColor }} />
                      ) : (
                        <Mic style={{ width: 20, height: 20, color: muteColor }} />
                      )}
                    </button>
                    <button onClick={onToggleDeafen} title={isDeafened ? 'Undeafen' : 'Deafen'} style={{
                      width: 32, height: 32, borderRadius: '4px', border: 'none', padding: 0,
                      backgroundColor: isDeafened ? 'rgba(237,66,69,0.2)' : 'transparent',
                      color: deafenColor,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {isDeafened ? (
                        <HeadphoneOff style={{ width: 20, height: 20, color: deafenColor }} />
                      ) : (
                        <Headphones style={{ width: 20, height: 20, color: deafenColor }} />
                      )}
                    </button>
                  </div>
                </div>
              )}
            </>
          }
          memberColumn={
            <MemberListPane
              title={isDmMode ? 'Friends' : selectedGuild ? `${selectedGuild.name} members` : 'Members'}
              members={
                isDmMode
                  ? friends.map((friend) => ({
                      id: friend.id,
                      username: friend.username,
                      displayName: friend.displayName,
                      status: friend.status,
                      avatarUrl: getAvatarUrlForUser(friend.id),
                      profileColor: (usersByIdentity.get(friend.id) as any)?.profileColor ?? undefined,
                    }))
                  : memberListItems
              }
              onViewProfile={handleViewProfile}
              localUserId={identityString || undefined}
            />
          }
        />

        {/* Create Guild Modal */}
        <Modal isOpen={showCreateGuildModal} onClose={() => setShowCreateGuildModal(false)} title="Create a Server">
          <form onSubmit={(e) => { e.preventDefault(); onCreateGuild(); setShowCreateGuildModal(false); }} style={S_formCol}>
            <label style={S_labelCol}>
              <span style={S_labelSpan}>SERVER NAME</span>
              <input value={newGuildName} onChange={e => setNewGuildName(e.target.value)} placeholder="Enter server name" style={S_input} />
            </label>
            <button type="submit" disabled={!newGuildName.trim()} style={{ padding: '10px 16px', borderRadius: '4px', border: 'none', backgroundColor: 'var(--accent-primary, #5865f2)', color: '#fff', fontWeight: 600, cursor: newGuildName.trim() ? 'pointer' : 'not-allowed', opacity: newGuildName.trim() ? 1 : 0.5 }}>
              Create Server
            </button>
          </form>
        </Modal>

        {/* Create Channel Modal */}
        <Modal isOpen={showCreateChannelModal} onClose={() => setShowCreateChannelModal(false)} title="Create Channel">
          <form onSubmit={(e) => { e.preventDefault(); onCreateChannel(); setShowCreateChannelModal(false); }} style={S_formCol}>
            <label style={S_labelCol}>
              <span style={S_labelSpan}>CHANNEL TYPE</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" onClick={() => setNewChannelType('Text')} style={{ flex: 1, padding: '10px', borderRadius: '4px', border: newChannelType === 'Text' ? '2px solid var(--accent-primary, #5865f2)' : '2px solid transparent', backgroundColor: 'var(--bg-input, #1e1f22)', color: 'var(--text-primary)', cursor: 'pointer' }}>
                  # Text
                </button>
                <button type="button" onClick={() => setNewChannelType('Voice')} style={{ flex: 1, padding: '10px', borderRadius: '4px', border: newChannelType === 'Voice' ? '2px solid var(--accent-primary, #5865f2)' : '2px solid transparent', backgroundColor: 'var(--bg-input, #1e1f22)', color: 'var(--text-primary)', cursor: 'pointer' }}>
                  <Volume2 style={{ width: 16, height: 16, display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} />
                  Voice
                </button>
              </div>
            </label>
            <label style={S_labelCol}>
              <span style={S_labelSpan}>CHANNEL NAME</span>
              <input value={newChannelName} onChange={e => setNewChannelName(e.target.value)} placeholder="new-channel" style={S_input} />
            </label>
            <button type="submit" disabled={!newChannelName.trim()} style={{ padding: '10px 16px', borderRadius: '4px', border: 'none', backgroundColor: 'var(--accent-primary, #5865f2)', color: '#fff', fontWeight: 600, cursor: newChannelName.trim() ? 'pointer' : 'not-allowed', opacity: newChannelName.trim() ? 1 : 0.5 }}>
              Create Channel
            </button>
          </form>
        </Modal>

        {/* Invite Friends Modal */}
        <Modal isOpen={showInviteModal} onClose={() => { setShowInviteModal(false); setInviteSearchQuery(''); }} title="Invite Friends">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input
              value={inviteSearchQuery}
              onChange={e => setInviteSearchQuery(e.target.value)}
              placeholder="Search friends..."
              style={S_input}
            />
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {friends.filter(f => !inviteSearchQuery || f.displayName.toLowerCase().includes(inviteSearchQuery.toLowerCase()) || f.username.toLowerCase().includes(inviteSearchQuery.toLowerCase())).map(friend => (
                <div key={String(friend.id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={S_inviteAvatar}>
                      {(friend.displayName || friend.username || '?')[0].toUpperCase()}
                    </div>
                    <span style={{ color: 'var(--text-primary)' }}>{friend.displayName || friend.username}</span>
                  </div>
                  <button
                    onClick={() => { if (friend.identity) { onInviteFriend(friend.identity); } }}
                    style={{ padding: '6px 16px', borderRadius: '4px', border: 'none', backgroundColor: 'var(--accent-primary, #5865f2)', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}
                  >
                    Invite
                  </button>
                </div>
              ))}
            </div>
          </div>
        </Modal>

        {/* Profile Settings Modal */}
        <ProfileSettingsModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          currentUser={me as ProfileSettingsModalProps['currentUser']}
          onUpdateProfile={async (params) => {
            await actions.updateProfile({
              displayName: params.displayName ?? undefined,
              bio: params.bio ?? undefined,
              avatarBytes: params.avatarBytes ?? undefined,
              profileColor: params.profileColor ?? undefined,
            })
          }}
          onSetStatus={(statusTag) => {
            void actions.setStatus({ status: { tag: statusTag } as never })
          }}
        />

        {/* Context Menu (right-click on user) */}
        {contextMenu && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            items={[
              {
                label: 'View Profile',
                icon: <User style={{ width: 16, height: 16 }} />,
                onClick: () => {
                  setProfilePopup({ user: contextMenu.user })
                },
              },
              ...(() => {
                // Show "Send Message" if the user is a friend
                const targetId = contextMenu.userId
                if (targetId && targetId !== identityString) {
                  const isFriend = friends.some(f => f.id === targetId)
                  if (isFriend) {
                    return [{
                      label: 'Send Message',
                      icon: <MessageSquare style={{ width: 16, height: 16 }} />,
                      onClick: () => { onStartDmFromFriend(targetId) },
                    }] as ContextMenuItem[]
                  }
                }
                return []
              })(),
            ]}
            onClose={() => setContextMenu(null)}
          />
        )}

        {/* User Profile Popup (centered modal) */}
        {profilePopup && (
          <UserProfilePopup
            user={profilePopup.user}
            onClose={() => setProfilePopup(null)}
          />
        )}

        {/* Hidden audio elements for remote voice playback */}
        {audioStreams.map(([key, stream]) => {
          const peerId = key.endsWith(':audio') ? key.slice(0, -6) : key;
          return (
            <audio
              key={key}
              autoPlay
              muted={(currentVoiceState?.isDeafened ?? false) || locallyMutedUsers.has(peerId)}
              ref={(el) => {
                if (el && el.srcObject !== stream) {
                  el.srcObject = stream;
                }
              }}
            />
          );
        })}

        {/* Incoming call modal */}
        {incomingCall && !ignoredCallIds.has(String(incomingCall.callId)) && (() => {
          const callerId = identityToString(incomingCall.callerIdentity)
          const callerUser = usersByIdentity.get(callerId)
          return (
            <IncomingCallModal
              callerName={callerUser?.displayName ?? callerUser?.username ?? callerId.slice(0, 12)}
              callerAvatarUrl={getAvatarUrlForUser(callerId)}
              onAccept={handleAcceptCall}
              onDecline={handleDeclineCall}
              onIgnore={handleIgnoreCall}
            />
          )
        })()}

        {/* Screen share viewer overlay */}
        {viewingScreenStream && (
          <div style={S_screenShareOverlay}>
            <div style={S_screenShareHeader}>
              <span style={{ color: '#fff', fontSize: '16px', fontWeight: 600 }}>Screen Share</span>
              <button onClick={() => setViewingScreenShareKey(null)} style={{
                background: '#ed4245', border: 'none', color: '#fff',
                padding: '8px 16px', borderRadius: '4px', cursor: 'pointer',
                fontWeight: 600,
              }}>Close</button>
            </div>
            <video
              autoPlay
              style={{ maxWidth: '95vw', maxHeight: '90vh', borderRadius: '8px' }}
              ref={(el) => {
                if (el && el.srcObject !== viewingScreenStream) {
                  el.srcObject = viewingScreenStream;
                }
              }}
            />
          </div>
        )}
      </main>

      {/* Register overlay */}
      {!me && initialLoadComplete && state.connectionStatus === 'connected' && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <div style={{ backgroundColor: 'var(--bg-primary, #313338)', padding: '32px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '16px', minWidth: '400px', maxWidth: '440px' }}>
            <form onSubmit={onRegister} style={S_formCol}>
              <h2 style={{ color: 'var(--text-primary)', fontSize: '24px', fontWeight: 700, textAlign: 'center' }}>Welcome!</h2>
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>Create your account to get started</p>
              <label style={S_labelCol}>
                <span style={S_labelSpan}>USERNAME</span>
                <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" required style={S_input} />
              </label>
              <label style={S_labelCol}>
                <span style={S_labelSpan}>DISPLAY NAME</span>
                <input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Display Name" required style={S_input} />
              </label>
              <button type="submit" style={{ padding: '10px 16px', borderRadius: '4px', border: 'none', backgroundColor: 'var(--accent-primary, #5865f2)', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '16px' }}>
                Register
              </button>
            </form>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255,255,255,0.08)' }} />
              <span style={{ fontSize: '12px', color: 'var(--text-muted, #949ba4)', textTransform: 'uppercase', fontWeight: 600 }}>or</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255,255,255,0.08)' }} />
            </div>

            {/* Login as existing user */}
            <div>
              <button
                type="button"
                onClick={() => { setShowLoginForm(!showLoginForm); setLoginError(null); }}
                style={{
                  background: 'none', border: 'none', color: 'var(--accent-primary, #5865f2)',
                  cursor: 'pointer', fontSize: '13px', padding: 0, textAlign: 'center', width: '100%',
                }}
              >
                {showLoginForm ? 'Back to Register' : 'Login as existing user'}
              </button>
              {showLoginForm && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
                  <label style={S_labelCol}>
                    <span style={S_labelSpan}>USERNAME</span>
                    <input
                      value={loginUsername}
                      onChange={e => setLoginUsername(e.target.value)}
                      placeholder="Enter your username"
                      style={S_input}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onLoginAsUser(); } }}
                    />
                  </label>
                  {loginError && (
                    <div style={{ color: '#ed4245', fontSize: '13px' }}>{loginError}</div>
                  )}
                  <button
                    type="button"
                    onClick={onLoginAsUser}
                    disabled={!loginUsername.trim()}
                    style={{
                      padding: '10px 16px', borderRadius: '4px', border: 'none',
                      backgroundColor: loginUsername.trim() ? '#3ba55d' : 'rgba(59,165,93,0.4)',
                      color: '#fff', fontWeight: 600, cursor: loginUsername.trim() ? 'pointer' : 'not-allowed', fontSize: '14px',
                    }}
                  >
                    Login
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Notification toasts */}
      <NotificationToast notifications={notifications} onDismiss={dismissNotification} />
    </div>
  )
}

export default App
