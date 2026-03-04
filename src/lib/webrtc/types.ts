export type PeerId = string;

export type SignalKind = 'Offer' | 'Answer' | 'IceCandidate' | 'Bye';

export interface ParsedRtcSignal {
  signalId: bigint;
  guildId: bigint;
  channelId: bigint;
  senderPeerId: PeerId;
  recipientPeerId: PeerId;
  kind: SignalKind;
  payload: string;
  sentAt: Date;
}

export interface RtcPeerState {
  peerId: PeerId;
  connectionState: RTCPeerConnectionState;
  iceConnectionState: RTCIceConnectionState;
  signalingState: RTCSignalingState;
  isMakingOffer: boolean;
  isPolite: boolean;
}

export interface RtcOrchestratorConfig {
  selfPeerId: PeerId;
  rtcConfiguration?: RTCConfiguration;
  iceCandidateBatchIntervalMs?: number;
  maxSignalPayloadBytes?: number;
}
