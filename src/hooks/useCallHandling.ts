import { useCallback, useMemo } from 'react'

import type { Channel, DmCallRequest, DmChannel, DmParticipant, User, VoiceState } from '../module_bindings/types'
import type { ActionFeedback } from './useActionFeedback'
import { toIdKey } from '../lib/helpers'
import { identityToString } from './useAppData'
import { getAvatarColor } from '../lib/avatarUtils'

// ---------------------------------------------------------------------------
// Params
// ---------------------------------------------------------------------------

interface UseCallHandlingParams {
  identityString: string
  voiceStates: VoiceState[]
  dmCallRequests: DmCallRequest[]
  currentVoiceState: VoiceState | null
  runAction: ActionFeedback['runAction']
  extendedActions: {
    acceptDmCall?: (params: { callId: bigint }) => Promise<void>
    declineDmCall?: (params: { callId: bigint }) => Promise<void>
  }
  usersByIdentity: Map<string, User>
  getAvatarUrlForUser: (identityStr: string) => string | undefined
  setSelectedDmChannelId: (id: string | undefined) => void
  setSelectedGuildId: (id: string | undefined) => void
  selectedDmChannel: DmChannel | null | undefined
  selectedDmChannelId: string | undefined
  isDmMode: boolean
  remoteSpeaking: Map<string, boolean>
  remoteStreams: Map<string, MediaStream>
  ignoredCallIds: Set<string>
  setIgnoredCallIds: React.Dispatch<React.SetStateAction<Set<string>>>
  dmParticipants: DmParticipant[]
  channelsForGuild: Channel[]
  selectedGuildId: string | undefined
  selectedTextChannelId: string | undefined
}

// ---------------------------------------------------------------------------
// Return type
// ---------------------------------------------------------------------------

export interface CallHandlingResult {
  incomingCall: DmCallRequest | null
  outgoingCall: DmCallRequest | null
  incomingCallId: string | null
  outgoingCallId: string | null
  isInDmVoice: boolean
  dmVoiceChannelId: string | null
  dmCallRemoteUser: { name: string; avatarUrl: string | undefined; profileColor: string | undefined } | null
  dmCallActive: boolean
  dmPartnerIdentity: string | null
  dmPartnerAvatarUrl: string | undefined
  dmPartnerProfileColor: string | undefined
  dmRemoteSpeaking: boolean
  dmRemoteScreenStream: MediaStream | null
  dmRemoteScreenShareKey: string | null
  activeCallChannelIds: Set<string>
  handleAcceptCall: () => void
  handleDeclineCall: () => void
  handleCancelOutgoingCall: () => void
  handleIgnoreCall: () => void
  callBannerProps: { calleeName: string; isDmCall: boolean; callName: string; isOnCallPage: boolean }
  handleNavigateToCall: () => void
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useCallHandling({
  identityString,
  voiceStates,
  dmCallRequests,
  currentVoiceState,
  runAction,
  extendedActions,
  usersByIdentity,
  getAvatarUrlForUser,
  setSelectedDmChannelId,
  setSelectedGuildId,
  selectedDmChannel,
  selectedDmChannelId,
  isDmMode,
  remoteSpeaking,
  remoteStreams,
  ignoredCallIds,
  setIgnoredCallIds,
  dmParticipants,
  channelsForGuild,
  selectedGuildId,
  selectedTextChannelId,
}: UseCallHandlingParams): CallHandlingResult {
  // -------------------------------------------------------------------------
  // Incoming / outgoing call requests
  // -------------------------------------------------------------------------
  const incomingCall = useMemo(() => {
    if (!identityString) return null
    return dmCallRequests.find(
      (r) => identityToString(r.calleeIdentity) === identityString
        && !ignoredCallIds.has(String(r.callId))
    ) ?? null
  }, [dmCallRequests, identityString, ignoredCallIds])

  const outgoingCall = useMemo(() => {
    if (!identityString) return null
    return dmCallRequests.find(
      (r) => identityToString(r.callerIdentity) === identityString
    ) ?? null
  }, [dmCallRequests, identityString])

  // Stable IDs for sound-loop effect dependencies
  const incomingCallId = incomingCall ? String(incomingCall.callId) : null
  const outgoingCallId = outgoingCall ? String(outgoingCall.callId) : null

  // -------------------------------------------------------------------------
  // DM voice state
  // -------------------------------------------------------------------------
  const isInDmVoice = currentVoiceState
    ? toIdKey(currentVoiceState.guildId) === '0'
    : false

  const dmVoiceChannelId = isInDmVoice
    ? toIdKey(currentVoiceState!.channelId)
    : null

  // -------------------------------------------------------------------------
  // Remote user info for DmCallOverlay
  // -------------------------------------------------------------------------
  const dmCallRemoteUser = useMemo(() => {
    if (!isInDmVoice || !dmVoiceChannelId || !identityString) return null

    const otherVoiceState = voiceStates.find(
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
      profileColor: otherUser?.profileColor ?? getAvatarColor(otherUser?.displayName ?? otherUser?.username ?? otherId),
    }
  }, [isInDmVoice, dmVoiceChannelId, identityString, voiceStates, usersByIdentity, getAvatarUrlForUser])

  // -------------------------------------------------------------------------
  // DM voice call active indicator
  // -------------------------------------------------------------------------
  const dmCallActive = useMemo(
    () => isDmMode && !!selectedDmChannel && voiceStates.some(
      vs => toIdKey(vs.guildId) === '0' && toIdKey(vs.channelId) === toIdKey(selectedDmChannel.dmChannelId)
    ),
    [isDmMode, selectedDmChannel, voiceStates]
  )

  // -------------------------------------------------------------------------
  // DM partner identity for header avatar/color
  // -------------------------------------------------------------------------
  const dmPartnerIdentity = useMemo(() => {
    if (!isDmMode || !selectedDmChannel || !identityString) return null
    const dmKey = toIdKey(selectedDmChannel.dmChannelId)
    const otherParticipant = dmParticipants.find(
      (p) => toIdKey(p.dmChannelId) === dmKey && identityToString(p.identity) !== identityString
    )
    return otherParticipant ? identityToString(otherParticipant.identity) : null
  }, [isDmMode, selectedDmChannel, identityString, dmParticipants])

  const dmPartnerAvatarUrl = useMemo(() => {
    if (!dmPartnerIdentity) return undefined
    return getAvatarUrlForUser(dmPartnerIdentity)
  }, [dmPartnerIdentity, getAvatarUrlForUser])

  const dmPartnerProfileColor = useMemo(() => {
    if (!dmPartnerIdentity) return undefined
    const user = usersByIdentity.get(dmPartnerIdentity)
    return user?.profileColor ?? getAvatarColor(user?.displayName ?? user?.username ?? dmPartnerIdentity)
  }, [dmPartnerIdentity, usersByIdentity])

  // -------------------------------------------------------------------------
  // DM call speaking states
  // -------------------------------------------------------------------------
  const dmRemoteSpeaking = useMemo(() => {
    if (!isInDmVoice || !dmVoiceChannelId || !identityString) return false
    const otherVoiceState = voiceStates.find(
      (vs) => toIdKey(vs.guildId) === '0'
        && toIdKey(vs.channelId) === dmVoiceChannelId
        && identityToString(vs.identity) !== identityString
    )
    if (!otherVoiceState) return false
    const otherId = identityToString(otherVoiceState.identity)
    return remoteSpeaking.get(`${otherId}:audio`) ?? false
  }, [isInDmVoice, dmVoiceChannelId, identityString, voiceStates, remoteSpeaking])

  // -------------------------------------------------------------------------
  // Remote screen share stream for DM calls
  // -------------------------------------------------------------------------
  const dmRemoteScreenStream = useMemo(() => {
    if (!isInDmVoice || !dmVoiceChannelId || !identityString) return null
    const otherVoiceState = voiceStates.find(
      (vs) => toIdKey(vs.guildId) === '0'
        && toIdKey(vs.channelId) === dmVoiceChannelId
        && identityToString(vs.identity) !== identityString
    )
    if (!otherVoiceState) return null
    const otherId = identityToString(otherVoiceState.identity)
    return remoteStreams.get(`${otherId}:screen`) ?? null
  }, [isInDmVoice, dmVoiceChannelId, identityString, voiceStates, remoteStreams])

  // Key for fullscreen viewing of DM remote screen share
  const dmRemoteScreenShareKey = useMemo(() => {
    if (!isInDmVoice || !dmVoiceChannelId || !identityString) return null
    const otherVoiceState = voiceStates.find(
      (vs) => toIdKey(vs.guildId) === '0'
        && toIdKey(vs.channelId) === dmVoiceChannelId
        && identityToString(vs.identity) !== identityString
    )
    if (!otherVoiceState) return null
    return `${identityToString(otherVoiceState.identity)}:screen`
  }, [isInDmVoice, dmVoiceChannelId, identityString, voiceStates])

  // -------------------------------------------------------------------------
  // Active DM call channel IDs (for showing call indicators in DM list)
  // -------------------------------------------------------------------------
  const activeCallChannelIds = useMemo(() => {
    const ids = new Set<string>()
    for (const vs of voiceStates) {
      if (toIdKey(vs.guildId) === '0') {
        ids.add(toIdKey(vs.channelId))
      }
    }
    return ids
  }, [voiceStates])

  // -------------------------------------------------------------------------
  // Call action callbacks
  // -------------------------------------------------------------------------
  const handleAcceptCall = useCallback(() => {
    if (!incomingCall) return
    const dmChannelId = String(incomingCall.dmChannelId)
    setSelectedDmChannelId(dmChannelId)
    setSelectedGuildId(undefined)
    void runAction(
      () => extendedActions.acceptDmCall?.({ callId: BigInt(incomingCall.callId) }),
      'Call accepted',
    )
  }, [incomingCall, runAction, extendedActions, setSelectedDmChannelId, setSelectedGuildId])

  const handleDeclineCall = useCallback(() => {
    if (!incomingCall) return
    void runAction(
      () => extendedActions.declineDmCall?.({ callId: BigInt(incomingCall.callId) }),
    )
  }, [incomingCall, runAction, extendedActions])

  const handleCancelOutgoingCall = useCallback(() => {
    if (!outgoingCall) return
    void runAction(
      () => extendedActions.declineDmCall?.({ callId: BigInt(outgoingCall.callId) }),
    )
  }, [outgoingCall, runAction, extendedActions])

  const handleIgnoreCall = useCallback(() => {
    if (!incomingCall) return
    setIgnoredCallIds(prev => new Set(prev).add(String(incomingCall.callId)))
  }, [incomingCall, setIgnoredCallIds])

  // ---------------------------------------------------------------------------
  // Call Banner derived props
  // ---------------------------------------------------------------------------
  const callBannerProps = useMemo(() => {
    if (!currentVoiceState && !outgoingCall) {
      return { calleeName: '', isDmCall: false, callName: '', isOnCallPage: false }
    }

    // Outgoing call (not yet connected)
    if (outgoingCall) {
      const calleeId = identityToString(outgoingCall.calleeIdentity)
      const calleeName = usersByIdentity.get(calleeId)?.username ?? 'Unknown'
      return { calleeName, isDmCall: true, callName: calleeName, isOnCallPage: false }
    }

    // Connected voice state
    const isDmCall = toIdKey(currentVoiceState!.guildId) === '0'
    const channelId = toIdKey(currentVoiceState!.channelId)

    let callName = ''
    if (isDmCall) {
      // Find the other person in this DM voice channel
      const otherVs = voiceStates.find(
        (vs) => toIdKey(vs.guildId) === '0' && toIdKey(vs.channelId) === channelId && identityToString(vs.identity) !== identityString,
      )
      callName = otherVs
        ? (usersByIdentity.get(identityToString(otherVs.identity))?.username ?? 'Unknown')
        : 'Unknown'
    } else {
      // Guild voice — find channel name
      const ch = channelsForGuild.find((c) => toIdKey(c.channelId) === channelId)
      callName = ch?.name ?? 'Voice Channel'
    }

    const isOnCallPage = isDmCall
      ? isDmMode && selectedDmChannelId === channelId
      : selectedGuildId === toIdKey(currentVoiceState!.guildId) && selectedTextChannelId === channelId

    return { calleeName: '', isDmCall, callName, isOnCallPage }
  }, [currentVoiceState, outgoingCall, voiceStates, usersByIdentity, channelsForGuild, identityString, isDmMode, selectedDmChannelId, selectedGuildId, selectedTextChannelId])

  const handleNavigateToCall = useCallback(() => {
    if (!currentVoiceState) return
    const isDmCall = toIdKey(currentVoiceState.guildId) === '0'
    if (isDmCall) {
      const channelId = toIdKey(currentVoiceState.channelId)
      setSelectedGuildId(undefined)
      setSelectedDmChannelId(channelId)
    }
  }, [currentVoiceState, setSelectedGuildId, setSelectedDmChannelId])

  return {
    incomingCall,
    outgoingCall,
    incomingCallId,
    outgoingCallId,
    isInDmVoice,
    dmVoiceChannelId,
    dmCallRemoteUser,
    dmCallActive,
    dmPartnerIdentity,
    dmPartnerAvatarUrl,
    dmPartnerProfileColor,
    dmRemoteSpeaking,
    dmRemoteScreenStream,
    dmRemoteScreenShareKey,
    activeCallChannelIds,
    handleAcceptCall,
    handleDeclineCall,
    handleCancelOutgoingCall,
    handleIgnoreCall,
    callBannerProps,
    handleNavigateToCall,
  }
}
