import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { PermissionsAndroid, Platform } from 'react-native'
import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  mediaDevices,
  type MediaStream,
  type RTCPeerConnection as RTCPeerConnectionType,
} from 'react-native-webrtc'

import { parseRtcPayload, rtcSignalTag, stringifyAnswerPayload, stringifyByePayload, stringifyIcePayload, stringifyOfferPayload } from './signaling'
import type { UseDmRtcMediaParams, UseDmRtcMediaResult } from './useDmRtcMedia.types'

const RTC_CONFIGURATION = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
} satisfies RTCConfiguration

type NativeIceCandidateInit = {
  candidate: string
  sdpMid?: string | null
  sdpMLineIndex?: number | null
  usernameFragment?: string | null
}

export function useDmRtcMedia({
  identity,
  activeDmChannelId,
  currentCallPeer,
  outgoingCallActive,
  incomingCallActive,
  voiceStates,
  rtcSignals,
  isMuted,
  sendDmRtcSignal,
  ackRtcSignal,
  onError,
}: UseDmRtcMediaParams): UseDmRtcMediaResult {
  const [rtcError, setRtcError] = useState<string | null>(null)
  const [rtcReady, setRtcReady] = useState(false)

  const roleHintRef = useRef<'caller' | 'callee' | null>(null)
  const peerConnectionRef = useRef<RTCPeerConnectionType | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const pendingIceRef = useRef<RTCIceCandidateInit[]>([])
  const handledSignalIdsRef = useRef<Set<string>>(new Set())
  const offeredSessionKeyRef = useRef<string | null>(null)

  const activeDmChannelKey = useMemo(
    () => activeDmChannelId == null ? null : toIdKey(activeDmChannelId),
    [activeDmChannelId],
  )
  const peerId = currentCallPeer?.peerIdentity ?? null
  const sessionKey = activeDmChannelKey && peerId ? `${activeDmChannelKey}:${peerId}` : null
  const peerJoined = Boolean(activeDmChannelKey && peerId && voiceStates.some((voiceState) => (
    identityToString(voiceState.identity) === peerId
    && toIdKey(voiceState.guildId) === '0'
    && toIdKey(voiceState.channelId) === activeDmChannelKey
  )))

  useEffect(() => {
    if (outgoingCallActive) {
      roleHintRef.current = 'caller'
    } else if (incomingCallActive) {
      roleHintRef.current = 'callee'
    }
  }, [incomingCallActive, outgoingCallActive])

  useEffect(() => {
    onError?.(rtcError)
  }, [onError, rtcError])

  const reportError = useCallback((message: string | null) => {
    setRtcError(message)
  }, [])

  const cleanupConnection = useCallback(async (reason: 'bye' | 'leave') => {
    const connection = peerConnectionRef.current
    peerConnectionRef.current = null
    offeredSessionKeyRef.current = null
    pendingIceRef.current = []
    handledSignalIdsRef.current.clear()
    setRtcReady(false)

    if (connection) {
      const writableConnection = connection as any
      writableConnection.onicecandidate = null
      writableConnection.ontrack = null
      writableConnection.onconnectionstatechange = null
      try {
        connection.close()
      } catch {
        // ignore close failures
      }
    }

    const stream = localStreamRef.current
    localStreamRef.current = null
    if (stream) {
      for (const track of stream.getTracks()) {
        track.stop()
      }
    }

    if (reason === 'leave' && activeDmChannelId != null && currentCallPeer?.peerIdentity) {
      try {
        await sendDmRtcSignal({
          dmChannelId: activeDmChannelId,
          recipientIdentity: currentCallPeer.peerIdentity as unknown,
          signalType: { tag: 'Bye' },
          payload: stringifyByePayload(),
        })
      } catch {
        // ignore best-effort bye failures
      }
    }
  }, [activeDmChannelId, currentCallPeer?.peerIdentity, sendDmRtcSignal])

  const ensureMicPermission = useCallback(async () => {
    if (Platform.OS !== 'android') {
      return true
    }

    const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO)
    return granted === PermissionsAndroid.RESULTS.GRANTED
  }, [])

  const ensureLocalStream = useCallback(async () => {
    if (localStreamRef.current) {
      syncMuteState(localStreamRef.current, isMuted)
      return localStreamRef.current
    }

    const hasPermission = await ensureMicPermission()
    if (!hasPermission) {
      throw new Error('Microphone permission is required for voice calls.')
    }

    const stream = await mediaDevices.getUserMedia({ audio: true, video: false })
    syncMuteState(stream, isMuted)
    localStreamRef.current = stream
    return stream
  }, [ensureMicPermission, isMuted])

  const ensurePeerConnection = useCallback(async () => {
    if (peerConnectionRef.current) {
      return peerConnectionRef.current
    }

    if (!peerId || activeDmChannelId == null || !currentCallPeer?.peerIdentity) {
      throw new Error('RTC peer is not ready yet.')
    }

    const connection = new RTCPeerConnection(RTC_CONFIGURATION)
    const writableConnection = connection as any
    writableConnection.onicecandidate = (event: any) => {
      if (!event.candidate) {
        return
      }

      void sendDmRtcSignal({
        dmChannelId: activeDmChannelId,
        recipientIdentity: currentCallPeer.peerIdentity as unknown,
        signalType: { tag: 'IceCandidate' },
        payload: stringifyIcePayload({
          candidate: event.candidate.candidate,
          sdpMid: event.candidate.sdpMid,
          sdpMLineIndex: event.candidate.sdpMLineIndex,
          usernameFragment: event.candidate.usernameFragment,
          kind: 'audio',
        }),
      }).catch(() => undefined)
    }
    writableConnection.ontrack = () => {
      setRtcReady(true)
    }
    writableConnection.onconnectionstatechange = () => {
      if (connection.connectionState === 'connected') {
        setRtcReady(true)
        reportError(null)
      }

      if (connection.connectionState === 'failed' || connection.connectionState === 'disconnected' || connection.connectionState === 'closed') {
        setRtcReady(false)
      }
    }

    const localStream = await ensureLocalStream()
    localStream.getTracks().forEach((track) => {
      connection.addTrack(track, localStream)
    })

    peerConnectionRef.current = connection
    return connection
  }, [activeDmChannelId, currentCallPeer?.peerIdentity, ensureLocalStream, peerId, reportError, sendDmRtcSignal])

  const flushPendingIce = useCallback(async () => {
    const connection = peerConnectionRef.current
    if (!connection?.remoteDescription || pendingIceRef.current.length === 0) {
      return
    }

    const queuedCandidates = [...pendingIceRef.current]
    pendingIceRef.current = []
    for (const candidate of queuedCandidates) {
      await connection.addIceCandidate(new RTCIceCandidate(candidate))
    }
  }, [])

  const createAndSendOffer = useCallback(async () => {
    if (!peerId || activeDmChannelId == null || !currentCallPeer?.peerIdentity || !sessionKey) {
      return
    }

    const connection = await ensurePeerConnection()
    if (connection.signalingState !== 'stable') {
      return
    }

    const offer = await connection.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: false })
    await connection.setLocalDescription(offer)

    if (!offer.sdp) {
      return
    }

    await sendDmRtcSignal({
      dmChannelId: activeDmChannelId,
      recipientIdentity: currentCallPeer.peerIdentity as unknown,
      signalType: { tag: 'Offer' },
      payload: stringifyOfferPayload(offer.sdp),
    })
    offeredSessionKeyRef.current = sessionKey
  }, [activeDmChannelId, currentCallPeer?.peerIdentity, ensurePeerConnection, peerId, sendDmRtcSignal, sessionKey])

  useEffect(() => {
    if (!sessionKey || roleHintRef.current !== 'caller' || !peerJoined || offeredSessionKeyRef.current === sessionKey) {
      return
    }

    void createAndSendOffer().catch((error) => {
      reportError(error instanceof Error ? error.message : 'Could not start the call media connection.')
    })
  }, [createAndSendOffer, peerJoined, reportError, sessionKey])

  useEffect(() => {
    if (!sessionKey || !peerId) {
      void cleanupConnection('leave')
      reportError(null)
      return
    }

    return () => {
      void cleanupConnection('leave')
    }
  }, [cleanupConnection, peerId, reportError, sessionKey])

  useEffect(() => {
    const stream = localStreamRef.current
    if (!stream) {
      return
    }

    syncMuteState(stream, isMuted)
  }, [isMuted])

  useEffect(() => {
    if (!peerId) {
      return
    }

    const relevantSignals = rtcSignals
      .filter((signal) => identityToString(signal.senderIdentity) === peerId)
      .sort((left, right) => Number(toBigInt(left.signalId) - toBigInt(right.signalId)))

    let cancelled = false

    const processSignals = async () => {
      for (const signal of relevantSignals) {
        const signalId = toIdKey(signal.signalId)
        if (handledSignalIdsRef.current.has(signalId) || cancelled) {
          continue
        }

        try {
          const tag = rtcSignalTag(signal.signalType)
          const payload = parseRtcPayload(signal.payload)
          if (!tag || !payload) {
            handledSignalIdsRef.current.add(signalId)
            await ackRtcSignal(signal.signalId)
            continue
          }

          switch (payload.type) {
            case 'offer': {
              const connection = await ensurePeerConnection()
              await connection.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: payload.sdp }))
              const answer = await connection.createAnswer()
              await connection.setLocalDescription(answer)
              if (answer.sdp && activeDmChannelId != null && currentCallPeer?.peerIdentity) {
                await sendDmRtcSignal({
                  dmChannelId: activeDmChannelId,
                  recipientIdentity: currentCallPeer.peerIdentity as unknown,
                  signalType: { tag: 'Answer' },
                  payload: stringifyAnswerPayload(answer.sdp),
                })
              }
              await flushPendingIce()
              break
            }
            case 'answer': {
              const connection = await ensurePeerConnection()
              await connection.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: payload.sdp }))
              await flushPendingIce()
              break
            }
            case 'ice': {
              const connection = await ensurePeerConnection()
              const candidateInit: NativeIceCandidateInit = {
                candidate: payload.candidate,
                sdpMid: payload.sdpMid,
                sdpMLineIndex: payload.sdpMLineIndex,
                usernameFragment: payload.usernameFragment,
              }

              if (!connection.remoteDescription) {
                pendingIceRef.current.push(candidateInit)
              } else {
                await connection.addIceCandidate(new RTCIceCandidate(candidateInit))
              }
              break
            }
            case 'bye':
              await cleanupConnection('bye')
              break
          }

          handledSignalIdsRef.current.add(signalId)
          await ackRtcSignal(signal.signalId)
          reportError(null)
        } catch (error) {
          reportError(error instanceof Error ? error.message : 'RTC signaling failed.')
        }
      }
    }

    void processSignals()

    return () => {
      cancelled = true
    }
  }, [ackRtcSignal, activeDmChannelId, cleanupConnection, currentCallPeer?.peerIdentity, ensurePeerConnection, flushPendingIce, peerId, reportError, rtcSignals, sendDmRtcSignal])

  return { rtcReady, rtcError }
}

function syncMuteState(stream: MediaStream, isMuted: boolean) {
  for (const track of stream.getAudioTracks()) {
    track.enabled = !isMuted
  }
}

function toBigInt(value: unknown): bigint {
  if (typeof value === 'bigint') {
    return value
  }

  if (typeof value === 'number') {
    return BigInt(value)
  }

  return BigInt(String(value))
}

function toIdKey(value: unknown): string {
  return typeof value === 'bigint' ? value.toString() : String(value)
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
