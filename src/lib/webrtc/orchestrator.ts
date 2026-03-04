import { PeerManager } from './peerManager'
import type { IcePayload, SignalingPayload } from './signaling'

export type OrchestratorSignalType = SignalingPayload['type']

export interface WebRtcOrchestratorCallbacks {
  sendSignal: (
    peerId: string,
    type: OrchestratorSignalType,
    payload: SignalingPayload,
  ) => void | Promise<void>
  onRemoteStream: (peerId: string, stream: MediaStream) => void
  onPeerStateChange: (peerId: string, state: RTCPeerConnectionState) => void
}

export class WebRtcOrchestrator {
  private readonly peerManager = new PeerManager()
  private readonly peerIds = new Set<string>()
  private readonly callbacks: WebRtcOrchestratorCallbacks
  private readonly rtcConfig?: RTCConfiguration
  private localAudioTrack: MediaStreamTrack | null = null

  constructor(callbacks: WebRtcOrchestratorCallbacks, rtcConfig?: RTCConfiguration) {
    this.callbacks = callbacks
    this.rtcConfig = rtcConfig
  }

  ensurePeer(peerId: string): RTCPeerConnection {
    const existing = this.peerManager.get(peerId)
    if (existing) {
      return existing
    }

    const peer = this.peerManager.create(peerId, this.rtcConfig)
    this.peerIds.add(peerId)
    this.attachPeerListeners(peerId, peer)

    if (this.localAudioTrack) {
      this.attachAudioTrackToPeer(peer, this.localAudioTrack)
    }

    return peer
  }

  closePeer(peerId: string): void {
    this.closePeerInternal(peerId, true)
  }

  closeAll(): void {
    for (const peerId of Array.from(this.peerIds)) {
      this.closePeerInternal(peerId, true)
    }

    // Stop the local audio track to release the microphone
    if (this.localAudioTrack) {
      this.localAudioTrack.stop()
      this.localAudioTrack = null
    }

    // Defensive: ensure tracking sets are fully cleared
    this.peerIds.clear()
  }

  attachLocalAudioTrack(track: MediaStreamTrack | null): void {
    this.localAudioTrack = track

    for (const peerId of this.peerIds) {
      const peer = this.peerManager.get(peerId)
      if (!peer) {
        continue
      }

      this.attachAudioTrackToPeer(peer, track)
    }
  }

  async applyIncomingSignal(peerId: string, signal: SignalingPayload): Promise<void> {
    const peer = this.ensurePeer(peerId)

    switch (signal.type) {
      case 'offer': {
        await peer.setRemoteDescription({ type: 'offer', sdp: signal.sdp })

        const answer = await peer.createAnswer()
        await peer.setLocalDescription(answer)

        if (answer.sdp) {
          await this.emitSignal(peerId, 'answer', { type: 'answer', sdp: answer.sdp })
        }

        return
      }

      case 'answer': {
        await peer.setRemoteDescription({ type: 'answer', sdp: signal.sdp })
        return
      }

      case 'ice': {
        const candidate = new RTCIceCandidate({
          candidate: signal.candidate,
          ...(signal.sdpMid !== undefined ? { sdpMid: signal.sdpMid } : {}),
          ...(signal.sdpMLineIndex !== undefined ? { sdpMLineIndex: signal.sdpMLineIndex } : {}),
          ...(signal.usernameFragment !== undefined ? { usernameFragment: signal.usernameFragment } : {}),
        })

        await peer.addIceCandidate(candidate)
        return
      }

      case 'bye': {
        this.closePeerInternal(peerId, false)
      }
    }
  }

  private closePeerInternal(peerId: string, sendBye: boolean): void {
    const peer = this.peerManager.get(peerId)
    if (!peer) {
      return
    }

    try {
      if (sendBye) {
        this.fireAndForgetSignal(peerId, 'bye', { type: 'bye' })
      }
    } finally {
      // Null out event handlers to break closure references before closing
      peer.ontrack = null
      peer.onconnectionstatechange = null
      peer.onicecandidate = null
      peer.onnegotiationneeded = null

      this.peerManager.close(peerId)
      this.peerIds.delete(peerId)
      this.callbacks.onPeerStateChange(peerId, 'closed')
    }
  }

  private attachPeerListeners(peerId: string, peer: RTCPeerConnection): void {
    peer.ontrack = (event) => {
      const stream = event.streams[0]
      if (stream) {
        this.callbacks.onRemoteStream(peerId, stream)
      }
    }

    peer.onconnectionstatechange = () => {
      this.callbacks.onPeerStateChange(peerId, peer.connectionState)
    }

    peer.onicecandidate = (event) => {
      if (!event.candidate) {
        return
      }

      this.fireAndForgetSignal(peerId, 'ice', this.toIcePayload(event.candidate))
    }
  }

  private attachAudioTrackToPeer(peer: RTCPeerConnection, track: MediaStreamTrack | null): void {
    const audioSender = peer.getSenders().find((sender) => sender.track?.kind === 'audio')

    if (track) {
      if (audioSender) {
        void audioSender.replaceTrack(track)
      } else {
        peer.addTrack(track, new MediaStream([track]))
      }
      return
    }

    if (audioSender) {
      void audioSender.replaceTrack(null)
    }
  }

  private toIcePayload(candidate: RTCIceCandidate): IcePayload {
    return {
      type: 'ice',
      candidate: candidate.candidate,
      ...(candidate.sdpMid !== null ? { sdpMid: candidate.sdpMid } : {}),
      ...(candidate.sdpMLineIndex !== null ? { sdpMLineIndex: candidate.sdpMLineIndex } : {}),
      ...(candidate.usernameFragment !== null ? { usernameFragment: candidate.usernameFragment } : {}),
    }
  }

  private emitSignal(
    peerId: string,
    type: OrchestratorSignalType,
    payload: SignalingPayload,
  ): Promise<void> {
    return Promise.resolve(this.callbacks.sendSignal(peerId, type, payload))
  }

  private fireAndForgetSignal(
    peerId: string,
    type: OrchestratorSignalType,
    payload: SignalingPayload,
  ): void {
    void this.emitSignal(peerId, type, payload).catch(() => undefined)
  }
}