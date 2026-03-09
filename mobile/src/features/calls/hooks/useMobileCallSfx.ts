import { useCallback, useEffect, useRef } from 'react'

import type { DmCallRequest, VoiceState } from '../../../module_bindings/types'
import { playLoop, playSound } from '../../../shared/sfx'

interface UseMobileCallSfxParams {
  outgoingCall: DmCallRequest | null
  incomingCall: DmCallRequest | null
  currentDmVoiceChannelId: string | null
  voiceStates: VoiceState[]
  identity: string
}

export function useMobileCallSfx({
  outgoingCall,
  incomingCall,
  currentDmVoiceChannelId,
  voiceStates,
  identity,
}: UseMobileCallSfxParams) {
  const localOutgoingCancelRef = useRef(false)

  const playHangupSound = useCallback(() => {
    playSound('hangup')
  }, [])

  const playCallDeclinedSound = useCallback(() => {
    playSound('call-declined')
  }, [])

  const markOutgoingCallCanceledLocally = useCallback(() => {
    localOutgoingCancelRef.current = true
    setTimeout(() => {
      localOutgoingCancelRef.current = false
    }, 5000)
  }, [])

  useEffect(() => {
    if (!outgoingCall) {
      return
    }

    playSound('start-call')
    let stopLoop: (() => void) | null = null
    const timerId = setTimeout(() => {
      if (localOutgoingCancelRef.current) {
        return
      }

      stopLoop = playLoop('call-ring')
    }, 3000)

    return () => {
      clearTimeout(timerId)
      stopLoop?.()
    }
  }, [outgoingCall])

  const previousOutgoingCallId = useRef<string | null>(null)
  useEffect(() => {
    const nextOutgoingCallId = outgoingCall ? toIdKey(outgoingCall.callId) : null
    if (previousOutgoingCallId.current && !nextOutgoingCallId && !currentDmVoiceChannelId) {
      if (localOutgoingCancelRef.current) {
        localOutgoingCancelRef.current = false
      } else {
        playCallDeclinedSound()
      }
    }

    previousOutgoingCallId.current = nextOutgoingCallId
  }, [currentDmVoiceChannelId, outgoingCall, playCallDeclinedSound])

  useEffect(() => {
    if (!incomingCall) {
      return
    }

    return playLoop('call-sound')
  }, [incomingCall])

  const previousInDmVoiceRef = useRef(false)
  useEffect(() => {
    const isInDmVoice = Boolean(currentDmVoiceChannelId)
    if (isInDmVoice && !previousInDmVoiceRef.current) {
      playSound('continue-call')
    }

    previousInDmVoiceRef.current = isInDmVoice
  }, [currentDmVoiceChannelId])

  const previousPeerCountRef = useRef(0)
  useEffect(() => {
    if (!currentDmVoiceChannelId) {
      previousPeerCountRef.current = 0
      return
    }

    const peerCount = voiceStates.filter((voiceState) => (
      toIdKey(voiceState.guildId) === '0'
      && toIdKey(voiceState.channelId) === currentDmVoiceChannelId
      && identityToString(voiceState.identity) !== identity
    )).length

    if (previousPeerCountRef.current === 0 && peerCount > 0) {
      playSound('continue-call')
    } else if (previousPeerCountRef.current > 0 && peerCount === 0) {
      playSound('contact-left')
    }

    previousPeerCountRef.current = peerCount
  }, [currentDmVoiceChannelId, identity, voiceStates])

  return {
    playHangupSound,
    playCallDeclinedSound,
    markOutgoingCallCanceledLocally,
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
