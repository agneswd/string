import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Identity } from 'spacetimedb/sdk'

import {
  toIdKey,
  identityToString,
  toRtcSignalType,
  errorToString,
  type RtcSignalTypeTag,
} from '../lib/helpers'
import type { AppData } from './useAppData'
import type { PeerState } from '../lib/webrtc/useRtcOrchestrator'
import { trackAudioContext, untrackAudioContext } from '../lib/connection'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RtcOrchestratorHandle {
  isVoiceConnected: boolean
  startAudio: () => Promise<void>
  setMuted: (muted: boolean) => void
  stopAudio: () => Promise<void>
  startScreenShare: () => Promise<void>
  stopScreenShare: () => Promise<void>
  remoteStreams: ReadonlyMap<string, MediaStream>
  peerStates: ReadonlyMap<string, PeerState>
  isLocalSpeaking: boolean
  remoteSpeaking: ReadonlyMap<string, boolean>
  handleIncomingSignal: (signal: unknown) => Promise<void>
  sendSignal: (signal: {
    peerId: string
    signalType: RtcSignalTypeTag
    payload: string
  }) => Promise<void> | void
  connectToPeers: (peerIds: string[], kind?: string) => void
}

export interface UseVoiceChatParams {
  appData: AppData
  selectedVoiceChannel: { channelId: unknown } | null
  setActionError: (err: string | null) => void
  runAction: (fn: () => Promise<void>, successStatus?: string) => Promise<void>
  rtcOrchestrator: RtcOrchestratorHandle
}

export interface UseVoiceChatReturn {
  // State
  viewingScreenShareKey: string | null
  setViewingScreenShareKey: (key: string | null) => void

  // Memos
  currentVoiceState: {
    channelId: unknown
    identity: unknown
    isMuted: boolean
    isDeafened: boolean
    isStreaming: boolean
  } | null
  rtcRecipients: Array<{ id: string; identity: Identity; label: string }>
  remoteSharersCount: number
  voiceChannelUsers: Map<
    number | string,
    Array<{
      identity: string
      displayName: string
      isMuted: boolean
      isDeafened: boolean
      isStreaming?: boolean
      isSpeaking?: boolean
    }>
  >

  // Pre-voice mute/deafen state
  preMuted: boolean
  preDeafened: boolean

  // Callbacks
  sendSignal: (params: { peerId: string; signalType: RtcSignalTypeTag; payload: string }) => void
  onJoinVoice: (channelOverride?: { channelId: unknown }) => void
  onLeaveVoice: () => void
  onToggleMute: () => void
  onToggleDeafen: () => void
  onStartSharing: () => void
  onStopSharing: () => void

  // Sound helpers (exposed for potential external use)
  playJoinSound: () => void
  playLeaveSound: () => void
  playMuteSound: () => void
  playUnmuteSound: () => void
  playDeafenSound: () => void
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useVoiceChat({
  appData,
  selectedVoiceChannel,
  setActionError,
  runAction,
  rtcOrchestrator,
}: UseVoiceChatParams): UseVoiceChatReturn {
  const { state, actions, identityString, usersByIdentity } = appData
  const {
    isVoiceConnected,
    startAudio,
    setMuted,
    stopAudio,
    startScreenShare,
    stopScreenShare,
    remoteStreams,
    peerStates,
    isLocalSpeaking,
    remoteSpeaking,
    connectToPeers,
  } = rtcOrchestrator

  // -------------------------------------------------------------------------
  // State
  // -------------------------------------------------------------------------
  const [viewingScreenShareKey, setViewingScreenShareKey] = useState<string | null>(null)
  const [preMuted, setPreMuted] = useState(false)
  const [preDeafened, setPreDeafened] = useState(false)

  // -------------------------------------------------------------------------
  // Refs
  // -------------------------------------------------------------------------
  const audioContextRef = useRef<AudioContext | null>(null)
  const prevVoiceCountRef = useRef(0)

  // -------------------------------------------------------------------------
  // Sound helpers (Web Audio API)
  // -------------------------------------------------------------------------
  const playSound = useCallback(
    (frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.08) => {
      try {
        if (!audioContextRef.current) {
          audioContextRef.current = new AudioContext()
          trackAudioContext(audioContextRef.current)
        }
        const ctx = audioContextRef.current
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = type
        osc.frequency.value = frequency
        gain.gain.setValueAtTime(volume, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start()
        osc.stop(ctx.currentTime + duration)
      } catch {
        /* ignore audio errors */
      }
    },
    [],
  )

  // All sounds use sine wave (softer), lower volume, gentle frequencies
  const playJoinSound = useCallback(() => playSound(800, 0.12, 'sine', 0.06), [playSound])
  const playLeaveSound = useCallback(() => playSound(500, 0.15, 'sine', 0.06), [playSound])
  const playMuteSound = useCallback(() => playSound(440, 0.08, 'sine', 0.05), [playSound])
  const playUnmuteSound = useCallback(() => playSound(660, 0.08, 'sine', 0.05), [playSound])
  const playDeafenSound = useCallback(() => playSound(380, 0.1, 'sine', 0.05), [playSound])

  // -------------------------------------------------------------------------
  // Memos
  // -------------------------------------------------------------------------

  const currentVoiceState = useMemo(
    () => state.voiceStates.find((voiceState) => identityToString(voiceState.identity) === identityString) ?? null,
    [identityString, state.voiceStates],
  )

  const rtcRecipients = useMemo(() => {
    if (!currentVoiceState) {
      return [] as Array<{ id: string; identity: Identity; label: string }>
    }

    const activeChannelId = toIdKey(currentVoiceState.channelId)
    const activeGuildId = toIdKey(currentVoiceState.guildId)

    return state.voiceStates
      .filter((voiceState) => toIdKey(voiceState.channelId) === activeChannelId && toIdKey(voiceState.guildId) === activeGuildId)
      .filter((voiceState) => identityToString(voiceState.identity) !== identityString)
      .map((voiceState) => {
        const recipientId = identityToString(voiceState.identity)
        const recipientUser = usersByIdentity.get(recipientId)
        return {
          id: recipientId,
          identity: voiceState.identity,
          label:
            recipientUser?.displayName ?? recipientUser?.username ?? recipientId.slice(0, 12),
        }
      })
      .sort((left, right) => left.label.localeCompare(right.label))
  }, [currentVoiceState, identityString, state.voiceStates, usersByIdentity])

  const remoteSharersCount = useMemo(
    () => Array.from(peerStates.values()).filter((peer) => peer.kind === 'screen' && peer.hasRemoteStream).length,
    [peerStates],
  )

  // Base voice channel user data — recomputed only on voice state / user changes,
  // NOT on every isLocalSpeaking toggle (which fires rapidly during VAD).
  const voiceChannelUsersBase = useMemo(() => {
    const map = new Map<
      number | string,
      Array<{
        identity: string
        displayName: string
        isMuted: boolean
        isDeafened: boolean
        isStreaming?: boolean
      }>
    >()
    if (!state.voiceStates) return map
    const seen = new Set<string>()
    for (const vs of state.voiceStates) {
      const vsIdentity = identityToString(vs.identity)
      if (seen.has(vsIdentity)) continue
      seen.add(vsIdentity)
      const channelId = toIdKey(vs.channelId)
      if (!map.has(channelId)) map.set(channelId, [])
      const user = usersByIdentity.get(vsIdentity)
      map.get(channelId)!.push({
        identity: vsIdentity,
        displayName: user?.displayName ?? user?.username ?? 'Unknown',
        isMuted: vs.isMuted,
        isDeafened: vs.isDeafened,
        isStreaming: vs.isStreaming,
      })
    }
    return map
  }, [state.voiceStates, usersByIdentity])

  // Inject speaking state — cheap derivation that runs on isLocalSpeaking changes
  const voiceChannelUsers = useMemo(() => {
    const map = new Map<
      number | string,
      Array<{
        identity: string
        displayName: string
        isMuted: boolean
        isDeafened: boolean
        isStreaming?: boolean
        isSpeaking?: boolean
      }>
    >()
    for (const [channelId, users] of voiceChannelUsersBase) {
      map.set(
        channelId,
        users.map((u) => ({
          ...u,
          isSpeaking: u.isMuted ? false : (u.identity === identityString ? isLocalSpeaking : (remoteSpeaking.get(`${u.identity}:audio`) ?? false)),
        })),
      )
    }
    return map
  }, [voiceChannelUsersBase, isLocalSpeaking, remoteSpeaking, identityString])

  // -------------------------------------------------------------------------
  // Send RTC signal callback
  // -------------------------------------------------------------------------

  const sendSignal = useCallback(
    ({ peerId, signalType, payload }: { peerId: string; signalType: RtcSignalTypeTag; payload: string }) => {
      if (!currentVoiceState) {
        return
      }

      const recipientIdentity = usersByIdentity.get(peerId)?.identity
      if (!recipientIdentity) {
        return
      }

      // DM voice: guildId === 0
      const isDmVoice = toIdKey(currentVoiceState.guildId) === '0'
      if (isDmVoice) {
        return actions.sendDmRtcSignal({
          dmChannelId: currentVoiceState.channelId as bigint,
          recipientIdentity,
          signalType: toRtcSignalType(signalType),
          payload,
        })
      }

      return actions.sendRtcSignal({
        channelId: currentVoiceState.channelId,
        recipientIdentity,
        signalType: toRtcSignalType(signalType),
        payload,
      })
    },
    [currentVoiceState, usersByIdentity, actions],
  )

  // -------------------------------------------------------------------------
  // Effects
  // -------------------------------------------------------------------------

  // Auto-close screen share viewer when the stream disappears
  useEffect(() => {
    if (viewingScreenShareKey) {
      const key = viewingScreenShareKey.includes(':')
        ? viewingScreenShareKey
        : `${viewingScreenShareKey}:screen`
      if (!remoteStreams.has(key)) {
        setViewingScreenShareKey(null)
      }
    }
  }, [viewingScreenShareKey, remoteStreams])

  // Start/stop audio when voice connectivity changes
  useEffect(() => {
    let cancelled = false

    const syncAudio = async (): Promise<void> => {
      try {
        if (isVoiceConnected) {
          await startAudio()
        } else {
          await stopScreenShare()
          await stopAudio()
        }
      } catch (error) {
        if (!cancelled) {
          setActionError(errorToString(error))
        }
      }
    }

    void syncAudio()

    return () => {
      cancelled = true
    }
  }, [isVoiceConnected, startAudio, stopAudio, stopScreenShare, setActionError])

  // Sync mute state with actual audio track
  useEffect(() => {
    if (!isVoiceConnected) return
    const muted = currentVoiceState?.isMuted ?? false
    setMuted(muted)
  }, [isVoiceConnected, currentVoiceState?.isMuted, setMuted])

  // Proactively create peer connections to all voice channel recipients
  useEffect(() => {
    if (!isVoiceConnected || rtcRecipients.length === 0) return
    connectToPeers(rtcRecipients.map((r) => r.id))
  }, [isVoiceConnected, rtcRecipients, connectToPeers])

  // Create screen peer connections for any remote user that is streaming
  useEffect(() => {
    if (!isVoiceConnected) return
    const streamingPeers = rtcRecipients
      .filter((r) => {
        // Check if this peer is streaming based on voice state
        const voiceState = state.voiceStates.find(
          (vs) => identityToString(vs.identity) === r.id
        )
        return voiceState?.isStreaming
      })
      .map((r) => r.id)
    if (streamingPeers.length > 0) {
      connectToPeers(streamingPeers, 'screen')
    }
  }, [isVoiceConnected, rtcRecipients, state.voiceStates, connectToPeers])

  // Cleanup audio + AudioContext on unmount (single effect to avoid ordering issues)
  useEffect(() => {
    return () => {
      // Stop media first (sync calls)
      stopScreenShare().catch(() => {});
      stopAudio().catch(() => {});
      // Close AudioContext immediately (no setTimeout — avoids leak on HMR)
      try {
        if (audioContextRef.current) {
          audioContextRef.current.close();
          untrackAudioContext(audioContextRef.current);
        }
      } catch { /* already closed */ }
      audioContextRef.current = null;
    };
  }, [stopAudio, stopScreenShare])

  // Sync screen sharing with voice state isStreaming flag
  useEffect(() => {
    if (!currentVoiceState) {
      return
    }

    let cancelled = false

    const syncStreaming = async (): Promise<void> => {
      try {
        if (currentVoiceState.isStreaming) {
          await startScreenShare()
        } else {
          await stopScreenShare()
        }
      } catch (error) {
        if (!cancelled) {
          setActionError(errorToString(error))
        }
      }
    }

    void syncStreaming()

    return () => {
      cancelled = true
    }
  }, [currentVoiceState?.isStreaming, startScreenShare, stopScreenShare, setActionError])

  // Play join/leave sounds when other users enter/leave our voice channel
  useEffect(() => {
    if (!currentVoiceState) {
      prevVoiceCountRef.current = 0
      return
    }
    const currentChannelId = currentVoiceState.channelId
    const usersInChannel = (state.voiceStates || []).filter(
      (vs) => vs.channelId === currentChannelId,
    ).length
    if (prevVoiceCountRef.current > 0 && usersInChannel > prevVoiceCountRef.current) {
      playJoinSound()
    } else if (prevVoiceCountRef.current > 0 && usersInChannel < prevVoiceCountRef.current) {
      playLeaveSound()
    }
    prevVoiceCountRef.current = usersInChannel
  }, [state.voiceStates, currentVoiceState, playJoinSound, playLeaveSound])

  // -------------------------------------------------------------------------
  // Voice action callbacks
  // -------------------------------------------------------------------------

  const onJoinVoice = useCallback((channelOverride?: { channelId: unknown }): void => {
    const channel = channelOverride ?? selectedVoiceChannel
    if (!channel) {
      setActionError('Select a voice channel first')
      return
    }

    const applyPreMuted = preMuted
    const applyPreDeafened = preDeafened

    playJoinSound()
    void runAction(async () => {
      await actions.joinVoice({ channelId: channel.channelId })
      await startAudio()
      // Apply pre-mute/pre-deafen state after joining
      if (applyPreMuted || applyPreDeafened) {
        await actions.updateVoiceState({
          isMuted: applyPreMuted,
          isDeafened: applyPreDeafened,
          isStreaming: false,
        })
      }
    }, 'Joined voice')
    setPreMuted(false)
    setPreDeafened(false)
  }, [selectedVoiceChannel, setActionError, preMuted, preDeafened, playJoinSound, runAction, actions, startAudio])

  const onLeaveVoice = useCallback((): void => {
    playLeaveSound()
    void runAction(async () => {
      await stopScreenShare()
      await stopAudio()
      await actions.leaveVoice()
    }, 'Left voice')
  }, [playLeaveSound, runAction, stopScreenShare, stopAudio, actions])

  const onToggleMute = useCallback((): void => {
    if (!currentVoiceState) {
      // Pre-mute toggle when not in voice
      setPreMuted(prev => !prev)
      if (preMuted) {
        playUnmuteSound()
      } else {
        playMuteSound()
      }
      return
    }
    if (currentVoiceState.isMuted) {
      playUnmuteSound()
    } else {
      playMuteSound()
    }
    void runAction(() =>
      actions.updateVoiceState({
        isMuted: !currentVoiceState.isMuted,
        isDeafened: currentVoiceState.isDeafened,
        isStreaming: currentVoiceState.isStreaming,
      }),
    )
  }, [currentVoiceState, preMuted, playUnmuteSound, playMuteSound, runAction, actions])

  const onToggleDeafen = useCallback((): void => {
    if (!currentVoiceState) {
      // Pre-deafen toggle when not in voice
      setPreDeafened(prev => !prev)
      playDeafenSound()
      return
    }
    playDeafenSound()
    void runAction(() =>
      actions.updateVoiceState({
        isMuted: currentVoiceState.isMuted,
        isDeafened: !currentVoiceState.isDeafened,
        isStreaming: currentVoiceState.isStreaming,
      }),
    )
  }, [currentVoiceState, playDeafenSound, runAction, actions])

  const onStartSharing = useCallback((): void => {
    if (!currentVoiceState) {
      return
    }

    void runAction(async () => {
      // Create screen peer connections first so startScreenShare() has connections to attach to
      const peerIds = rtcRecipients.map((r) => r.id)
      connectToPeers(peerIds, 'screen')
      await startScreenShare()
      await actions.updateVoiceState({
        isMuted: currentVoiceState.isMuted,
        isDeafened: currentVoiceState.isDeafened,
        isStreaming: true,
      })
    })
  }, [currentVoiceState, runAction, rtcRecipients, connectToPeers, startScreenShare, actions])

  const onStopSharing = useCallback((): void => {
    if (!currentVoiceState) {
      return
    }

    void runAction(async () => {
      await stopScreenShare()
      await actions.updateVoiceState({
        isMuted: currentVoiceState.isMuted,
        isDeafened: currentVoiceState.isDeafened,
        isStreaming: false,
      })
    })
  }, [currentVoiceState, runAction, stopScreenShare, actions])

  // -------------------------------------------------------------------------
  // Return
  // -------------------------------------------------------------------------

  return {
    // State
    viewingScreenShareKey,
    setViewingScreenShareKey,

    // Memos
    currentVoiceState,
    rtcRecipients,
    remoteSharersCount,
    voiceChannelUsers,

    // Pre-voice mute/deafen
    preMuted,
    preDeafened,

    // Callbacks
    sendSignal,
    onJoinVoice,
    onLeaveVoice,
    onToggleMute,
    onToggleDeafen,
    onStartSharing,
    onStopSharing,

    // Sound helpers
    playJoinSound,
    playLeaveSound,
    playMuteSound,
    playUnmuteSound,
    playDeafenSound,
  }
}
