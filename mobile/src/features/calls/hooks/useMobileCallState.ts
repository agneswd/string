import { useMemo } from 'react'

import type { SpacetimeDataSnapshot } from '../../../core/spacetime'
import { avatarBytesToUri } from '../../../shared/lib/avatarUtils'
import type { DmCallRequest, VoiceState } from '../../../module_bindings/types'

interface UseMobileCallStateParams {
  data: SpacetimeDataSnapshot
  identity: string | null
  activeDmChannelId: unknown | null
}

export interface MobileCallPeer {
  dmChannelId: string
  conversationId: string
  peerIdentity: string
  peerName: string
  avatarUri?: string
  profileColor?: string | null
}

export interface MobileCallState {
  incomingCall: DmCallRequest | null
  outgoingCall: DmCallRequest | null
  incomingCallPeer: MobileCallPeer | null
  outgoingCallPeer: MobileCallPeer | null
  activeDmPeer: MobileCallPeer | null
  currentVoiceState: VoiceState | null
  currentDmVoiceChannelId: string | null
  currentCallPeer: MobileCallPeer | null
  activeDmHasLiveCall: boolean
  isCurrentCallForActiveDm: boolean
  isOutgoingCallForActiveDm: boolean
}

export function useMobileCallState({
  data,
  identity,
  activeDmChannelId,
}: UseMobileCallStateParams): MobileCallState {
  const peersByDmChannelId = useMemo(() => {
    const usersByIdentity = new Map(data.users.map((user) => [identityToString(user.identity), user]))
    const map = new Map<string, MobileCallPeer>()

    if (!identity) {
      return map
    }

    for (const channel of data.dmChannels) {
      const dmChannelKey = toIdKey(channel.dmChannelId)
      const participants = data.dmParticipants.filter(
        (participant) => toIdKey(participant.dmChannelId) === dmChannelKey,
      )
      const peerParticipant = participants.find(
        (participant) => identityToString(participant.identity) !== identity,
      )

      if (!peerParticipant) {
        continue
      }

      const peerIdentity = identityToString(peerParticipant.identity)
      const peerUser = usersByIdentity.get(peerIdentity)

      map.set(dmChannelKey, {
        dmChannelId: dmChannelKey,
        conversationId: `dm:${peerIdentity}`,
        peerIdentity,
        peerName: peerUser?.displayName ?? peerUser?.username ?? peerIdentity.slice(0, 12),
        avatarUri: avatarBytesToUri(peerUser?.avatarBytes),
        profileColor: peerUser?.profileColor ?? null,
      })
    }

    return map
  }, [data.dmChannels, data.dmParticipants, data.users, identity])

  const currentVoiceState = useMemo(() => {
    if (!identity) {
      return null
    }

    return data.voiceStates.find((voiceState) => identityToString(voiceState.identity) === identity) ?? null
  }, [data.voiceStates, identity])

  const currentDmVoiceChannelId = useMemo(() => {
    if (!currentVoiceState || toIdKey(currentVoiceState.guildId) !== '0') {
      return null
    }

    return toIdKey(currentVoiceState.channelId)
  }, [currentVoiceState])

  const incomingCall = useMemo(() => {
    if (!identity) {
      return null
    }

    return data.dmCallRequests.find((request) => identityToString(request.calleeIdentity) === identity) ?? null
  }, [data.dmCallRequests, identity])

  const outgoingCall = useMemo(() => {
    if (!identity) {
      return null
    }

    return data.dmCallRequests.find((request) => identityToString(request.callerIdentity) === identity) ?? null
  }, [data.dmCallRequests, identity])

  const incomingCallPeer = useMemo(
    () => incomingCall ? peersByDmChannelId.get(toIdKey(incomingCall.dmChannelId)) ?? null : null,
    [incomingCall, peersByDmChannelId],
  )

  const outgoingCallPeer = useMemo(
    () => outgoingCall ? peersByDmChannelId.get(toIdKey(outgoingCall.dmChannelId)) ?? null : null,
    [outgoingCall, peersByDmChannelId],
  )

  const activeDmPeer = useMemo(
    () => activeDmChannelId == null ? null : peersByDmChannelId.get(toIdKey(activeDmChannelId)) ?? null,
    [activeDmChannelId, peersByDmChannelId],
  )

  const currentCallPeer = useMemo(
    () => currentDmVoiceChannelId ? peersByDmChannelId.get(currentDmVoiceChannelId) ?? null : null,
    [currentDmVoiceChannelId, peersByDmChannelId],
  )

  const activeDmChannelKey = activeDmChannelId == null ? null : toIdKey(activeDmChannelId)

  const activeDmHasLiveCall = useMemo(() => {
    if (!activeDmChannelKey) {
      return false
    }

    return data.voiceStates.some((voiceState) => (
      toIdKey(voiceState.guildId) === '0' && toIdKey(voiceState.channelId) === activeDmChannelKey
    ))
  }, [activeDmChannelKey, data.voiceStates])

  const isCurrentCallForActiveDm = Boolean(activeDmChannelKey && currentDmVoiceChannelId === activeDmChannelKey)
  const isOutgoingCallForActiveDm = Boolean(
    activeDmChannelKey && outgoingCall && toIdKey(outgoingCall.dmChannelId) === activeDmChannelKey,
  )

  return {
    incomingCall,
    outgoingCall,
    incomingCallPeer,
    outgoingCallPeer,
    activeDmPeer,
    currentVoiceState,
    currentDmVoiceChannelId,
    currentCallPeer,
    activeDmHasLiveCall,
    isCurrentCallForActiveDm,
    isOutgoingCallForActiveDm,
  }
}

function toIdKey(value: unknown): string {
  if (typeof value === 'bigint') {
    return value.toString()
  }

  return String(value)
}

function identityToString(value: unknown): string {
  if (!value) {
    return ''
  }

  if (typeof value === 'object') {
    const withToHex = value as { toHex?: () => { toString: () => string } }
    const hex = withToHex.toHex?.()
    if (hex) {
      return hex.toString()
    }
  }

  return String(value)
}
