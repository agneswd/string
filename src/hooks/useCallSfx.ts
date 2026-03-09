import { useCallback, useEffect, useRef } from 'react'

import type { DmCallRequest, VoiceState } from '../module_bindings/types'
import { toIdKey } from '../lib/helpers'
import { identityToString } from './useAppData'
import { playSound, playLoop } from '../lib/sfx'

// ---------------------------------------------------------------------------
// Params
// ---------------------------------------------------------------------------

interface UseCallSfxParams {
  outgoingCallId: string | null
  outgoingCall: DmCallRequest | null
  incomingCallId: string | null
  isInDmVoice: boolean
  dmVoiceChannelId: string | null
  voiceStates: VoiceState[]
  identityString: string
  onLeaveVoice: () => void
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useCallSfx({
  outgoingCallId,
  outgoingCall,
  incomingCallId,
  isInDmVoice,
  dmVoiceChannelId,
  voiceStates,
  identityString,
  onLeaveVoice,
}: UseCallSfxParams) {
  const localOutgoingCancelRef = useRef(false)

  const playContinueCallSound = useCallback(() => {
    playSound('continue-call')
  }, [])

  const playHangupSound = useCallback(() => {
    playSound('hangup')
  }, [])

  const playCallDeclinedSound = useCallback(() => {
    playSound('call-declined')
  }, [])

  const markOutgoingCallCanceledLocally = useCallback(() => {
    localOutgoingCancelRef.current = true
    window.setTimeout(() => {
      localOutgoingCancelRef.current = false
    }, 5000)
  }, [])

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
      if (localOutgoingCancelRef.current) {
        localOutgoingCancelRef.current = false
      } else {
        playSound('call-declined')
      }
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
      playContinueCallSound()
    }
    prevInDmVoice.current = isInDmVoice
  }, [isInDmVoice, playContinueCallSound])

  // SFX: DM call participant changes after the local user is already in voice
  const prevDmCallPeerCount = useRef<number>(0)
  useEffect(() => {
    if (!isInDmVoice || !dmVoiceChannelId) {
      prevDmCallPeerCount.current = 0
      return
    }
    const peerCount = voiceStates.filter(
      vs => toIdKey(vs.guildId) === '0'
        && toIdKey(vs.channelId) === dmVoiceChannelId
        && identityToString(vs.identity) !== identityString
    ).length
    if (prevDmCallPeerCount.current === 0 && peerCount > 0) {
      playContinueCallSound()
    } else if (prevDmCallPeerCount.current > 0 && peerCount === 0) {
      playSound('contact-left')
    }
    prevDmCallPeerCount.current = peerCount
  }, [isInDmVoice, dmVoiceChannelId, voiceStates, identityString, playContinueCallSound])

  // SFX: Hangup when leaving call
  const handleHangUpWithSfx = useCallback(() => {
    playHangupSound()
    onLeaveVoice()
  }, [onLeaveVoice, playHangupSound])

  return { handleHangUpWithSfx, playHangupSound, playCallDeclinedSound, markOutgoingCallCanceledLocally }
}
