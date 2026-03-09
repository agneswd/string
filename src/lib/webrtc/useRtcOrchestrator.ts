import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { RtcSignal } from '../../module_bindings/types';
import { registerCleanup, trackPeerConnection, trackMediaStream, trackAudioContext, untrackPeerConnection, untrackMediaStream, untrackAudioContext } from '../connection';
import { getMicrophoneStream, getScreenShareStream, stopStream } from './localMedia';
import { enhanceOpusSdp } from './sdpUtils';
import { PeerManager } from './peerManager';
import {
  type SignalKind,
  parseSignalingPayload,
  stringifyAnswerPayload,
  stringifyByePayload,
  stringifyIcePayload,
  stringifyOfferPayload,
} from './signaling';

type SignalTypeTag = 'Offer' | 'Answer' | 'IceCandidate' | 'Bye';

export type IncomingRtcSignal = Pick<RtcSignal, 'senderIdentity' | 'signalType' | 'payload'> & {
  senderId?: string;
};

export type SendRtcSignalFn = (signal: {
  peerId: string;
  signalType: SignalTypeTag;
  payload: string;
  kind: SignalKind;
}) => Promise<void> | void;

export type PeerState = {
  peerId: string;
  kind: SignalKind;
  connectionState: RTCPeerConnectionState;
  iceConnectionState: RTCIceConnectionState;
  signalingState: RTCSignalingState;
  hasRemoteStream: boolean;
};

type RtcSnapshot = {
  remoteStreams: ReadonlyMap<string, MediaStream>;
  peerStates: ReadonlyMap<string, PeerState>;
  isLocalSpeaking: boolean;
  remoteSpeaking: ReadonlyMap<string, boolean>;
};

export type RtcOrchestrator = {
  startAudio: () => Promise<void>;
  setMuted: (muted: boolean) => void;
  stopAudio: () => Promise<void>;
  startScreenShare: () => Promise<void>;
  stopScreenShare: () => Promise<void>;
  handleIncomingSignal: (signal: IncomingRtcSignal) => Promise<void>;
  connectToPeers: (peerIds: string[], kind?: SignalKind) => void;
  getSnapshot: () => RtcSnapshot;
  subscribe: (listener: (snapshot: RtcSnapshot) => void) => () => void;
  dispose: () => void;
};

export type UseRtcOrchestratorOptions = {
  localIdentity?: string;
  sendSignal?: SendRtcSignalFn;
  rtcConfiguration?: RTCConfiguration;
};

const NOOP_SEND_SIGNAL: SendRtcSignalFn = () => {};

const SIGNAL_KIND_FALLBACK: SignalKind = 'audio';
const SPEAKING_FREQUENCY_THRESHOLD = 8;
const SPEAKING_RMS_THRESHOLD = 4;

const keyFor = (peerId: string, kind: SignalKind): string => `${peerId}:${kind}`;

const getAnalyserSpeakingState = (
  analyser: AnalyserNode,
  frequencyData: Uint8Array,
  timeDomainData: Uint8Array,
): boolean => {
  analyser.getByteFrequencyData(frequencyData);
  const averageFrequency = frequencyData.reduce((sum, value) => sum + value, 0) / frequencyData.length;

  analyser.getByteTimeDomainData(timeDomainData);
  let rmsAccumulator = 0;
  for (const value of timeDomainData) {
    const centered = (value - 128) / 128;
    rmsAccumulator += centered * centered;
  }
  const rms = Math.sqrt(rmsAccumulator / timeDomainData.length) * 100;

  return averageFrequency > SPEAKING_FREQUENCY_THRESHOLD || rms > SPEAKING_RMS_THRESHOLD;
};

const toIdentityKey = (value: unknown): string => {
  if (!value) {
    return '';
  }

  if (typeof value === 'object') {
    const withToHex = value as { toHex?: () => { toString: () => string } };
    const hex = withToHex.toHex?.();
    if (hex) {
      return hex.toString();
    }
  }

  return String(value);
};

const tagFromSignalType = (value: unknown): SignalTypeTag | null => {
  if (value === 'Offer' || value === 'Answer' || value === 'IceCandidate' || value === 'Bye') {
    return value;
  }

  if (typeof value !== 'object' || value === null) {
    return null;
  }

  const enumLike = value as Record<string, unknown>;
  if (enumLike.tag === 'Offer' || enumLike.tag === 'Answer' || enumLike.tag === 'IceCandidate' || enumLike.tag === 'Bye') {
    return enumLike.tag;
  }

  if ('Offer' in enumLike) return 'Offer';
  if ('Answer' in enumLike) return 'Answer';
  if ('IceCandidate' in enumLike) return 'IceCandidate';
  if ('Bye' in enumLike) return 'Bye';
  return null;
};

function parseKey(key: string): { peerId: string; kind: SignalKind } {
  const separator = key.lastIndexOf(':');
  if (separator < 0) {
    return { peerId: key, kind: SIGNAL_KIND_FALLBACK };
  }

  const peerId = key.slice(0, separator);
  const rawKind = key.slice(separator + 1);
  const kind: SignalKind = rawKind === 'screen' ? 'screen' : SIGNAL_KIND_FALLBACK;
  return { peerId, kind };
}

function cloneSnapshot(
  remoteStreams: Map<string, MediaStream>,
  peerStates: Map<string, PeerState>,
  isLocalSpeaking: boolean,
  remoteSpeaking: Map<string, boolean>,
): RtcSnapshot {
  return {
    remoteStreams: new Map(remoteStreams),
    peerStates: new Map(peerStates),
    isLocalSpeaking,
    remoteSpeaking: new Map(remoteSpeaking),
  };
}

function createPeerState(
  key: string,
  connection: RTCPeerConnection,
  hasRemoteStream: boolean,
): PeerState {
  const { peerId, kind } = parseKey(key);
  return {
    peerId,
    kind,
    connectionState: connection.connectionState,
    iceConnectionState: connection.iceConnectionState,
    signalingState: connection.signalingState,
    hasRemoteStream,
  };
}

export function createRtcOrchestrator(options: UseRtcOrchestratorOptions = {}): RtcOrchestrator {
  const localIdentity = options.localIdentity ?? '';
  const localIdentityKey = toIdentityKey(localIdentity);
  const sendSignal = options.sendSignal ?? NOOP_SEND_SIGNAL;
  const peerManager = new PeerManager();
  const listeners = new Set<(snapshot: RtcSnapshot) => void>();
  const remoteStreams = new Map<string, MediaStream>();
  const peerStates = new Map<string, PeerState>();
  const knownKeys = new Set<string>();
  const pendingIceCandidates = new Map<string, RTCIceCandidateInit[]>();
  const makingOfferByKey = new Map<string, boolean>();
  const ignoreOfferByKey = new Map<string, boolean>();
  const isSettingRemoteAnswerPendingByKey = new Map<string, boolean>();

  let localAudioStream: MediaStream | null = null;
  let localScreenStream: MediaStream | null = null;
  let startingAudio = false;
  let speakingCheckInterval: number | undefined;
  let audioAnalyserCtx: AudioContext | null = null;
  let audioSourceNode: MediaStreamAudioSourceNode | null = null;
  let localSpeaking = false;
  const remoteSpeaking = new Map<string, boolean>();
  const remoteAnalysers = new Map<string, { ctx: AudioContext; source: MediaStreamAudioSourceNode; analyser: AnalyserNode; interval: number }>();

  const publish = (): void => {
    const snapshot = cloneSnapshot(remoteStreams, peerStates, localSpeaking, remoteSpeaking);
    for (const listener of listeners) {
      listener(snapshot);
    }
  };

  const cleanupSpeakingDetection = (): void => {
    if (speakingCheckInterval !== undefined) {
      clearInterval(speakingCheckInterval);
      speakingCheckInterval = undefined;
    }
    if (audioSourceNode) {
      audioSourceNode.disconnect();
      audioSourceNode = null;
    }
    if (audioAnalyserCtx) {
      audioAnalyserCtx.close();
      untrackAudioContext(audioAnalyserCtx);
      audioAnalyserCtx = null;
    }
    if (localSpeaking) {
      localSpeaking = false;
      publish();
    }
  };

  const cleanupRemoteAnalyser = (key: string): void => {
    const entry = remoteAnalysers.get(key);
    if (!entry) return;
    clearInterval(entry.interval);
    entry.source.disconnect();
    entry.ctx.close();
    untrackAudioContext(entry.ctx);
    remoteAnalysers.delete(key);
    remoteSpeaking.delete(key);
  };

  const setPeerState = (key: string, connection: RTCPeerConnection): void => {
    peerStates.set(key, createPeerState(key, connection, remoteStreams.has(key)));
    publish();
  };

  const emitSignal = async (
    peerId: string,
    signalType: SignalTypeTag,
    payload: string,
    kind: SignalKind,
  ): Promise<void> => {
    await sendSignal({ peerId, signalType, payload, kind });
  };

  const isExpectedRemoteDescriptionRaceError = (error: unknown): boolean => {
    if (error instanceof DOMException && error.name === 'InvalidStateError') {
      return true;
    }

    const message = error instanceof Error ? error.message.toLowerCase() : '';
    return message.includes('invalid state') || message.includes('wrong state');
  };

  const isExpectedIceRaceError = (error: unknown): boolean => {
    if (error instanceof DOMException && (error.name === 'InvalidStateError' || error.name === 'OperationError')) {
      return true;
    }

    const message = error instanceof Error ? error.message.toLowerCase() : '';
    return (
      message.includes('remote description')
      || message.includes('m-line')
      || message.includes('ufrag')
      || message.includes('invalid state')
      || message.includes('wrong state')
    );
  };

  const setRemoteDescriptionSafe = async (
    connection: RTCPeerConnection,
    description: RTCSessionDescriptionInit,
  ): Promise<boolean> => {
    try {
      await connection.setRemoteDescription(description);
      return true;
    } catch (error) {
      if (isExpectedRemoteDescriptionRaceError(error)) {
        return false;
      }
      throw error;
    }
  };

  const addIceCandidateSafe = async (
    key: string,
    connection: RTCPeerConnection,
    candidate: RTCIceCandidateInit,
  ): Promise<void> => {
    try {
      await connection.addIceCandidate(candidate);
    } catch (error) {
      if (ignoreOfferByKey.get(key) || isExpectedIceRaceError(error)) {
        return;
      }
      throw error;
    }
  };

  const flushPendingIce = async (key: string, connection: RTCPeerConnection): Promise<void> => {
    if (!connection.remoteDescription) {
      return;
    }

    const pending = pendingIceCandidates.get(key);
    if (!pending || pending.length === 0) {
      return;
    }

    pendingIceCandidates.delete(key);
    for (const candidate of pending) {
      await addIceCandidateSafe(key, connection, candidate);
    }
  };

  const attachLocalTracks = (connection: RTCPeerConnection, kind: SignalKind): void => {
    const stream = kind === 'screen' ? localScreenStream : localAudioStream;
    if (!stream) {
      return;
    }

    for (const track of stream.getTracks()) {
      const alreadySending = connection
        .getSenders()
        .some((sender) => sender.track?.id === track.id);

      if (!alreadySending) {
        connection.addTrack(track, stream);
      }
    }
  };

  const closePeer = async (
    key: string,
    options: {
      sendBye: boolean;
    },
  ): Promise<void> => {
    const existing = peerManager.get(key);
    if (!existing) {
      remoteStreams.delete(key);
      peerStates.delete(key);
      knownKeys.delete(key);
      pendingIceCandidates.delete(key);
      makingOfferByKey.delete(key);
      ignoreOfferByKey.delete(key);
      isSettingRemoteAnswerPendingByKey.delete(key);
      publish();
      return;
    }

    const { peerId, kind } = parseKey(key);
    try {
      if (options.sendBye) {
        await emitSignal(peerId, 'Bye', stringifyByePayload(kind), kind);
      }
    } finally {
      // Untrack before closing so the global set doesn't grow unboundedly
      if (existing) untrackPeerConnection(existing);
      // peerManager.close() nulls handlers before closing, preventing
      // re-entrant onconnectionstatechange → closePeer recursion.
      peerManager.close(key);
      const stream = remoteStreams.get(key);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      cleanupRemoteAnalyser(key);
      remoteStreams.delete(key);
      peerStates.delete(key);
      knownKeys.delete(key);
      pendingIceCandidates.delete(key);
      makingOfferByKey.delete(key);
      ignoreOfferByKey.delete(key);
      isSettingRemoteAnswerPendingByKey.delete(key);
      publish();
    }
  };

  const ensureConnection = (peerId: string, kind: SignalKind): RTCPeerConnection => {
    const key = keyFor(peerId, kind);
    const existing = peerManager.get(key);
    if (existing) {
      return existing;
    }

    const connection = peerManager.create(key, options.rtcConfiguration);
    trackPeerConnection(connection);
    knownKeys.add(key);

    connection.onicecandidate = (event) => {
      if (!event.candidate) {
        return;
      }

      void emitSignal(
        peerId,
        'IceCandidate',
        stringifyIcePayload({
          candidate: event.candidate.candidate,
          sdpMid: event.candidate.sdpMid,
          sdpMLineIndex: event.candidate.sdpMLineIndex,
          usernameFragment: event.candidate.usernameFragment,
          kind,
        }),
        kind,
      );
    };

    connection.ontrack = (event) => {
      const stream = event.streams[0] ?? new MediaStream([event.track]);
      remoteStreams.set(key, stream);
      setPeerState(key, connection);

      // Set up remote speaking detection
      cleanupRemoteAnalyser(key);
      try {
        const ctx = new AudioContext();
        trackAudioContext(ctx);
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        analyser.smoothingTimeConstant = 0.4;
        source.connect(analyser);
        const frequencyData = new Uint8Array(analyser.frequencyBinCount);
        const timeDomainData = new Uint8Array(analyser.fftSize);
        const interval = window.setInterval(() => {
          const speaking = getAnalyserSpeakingState(analyser, frequencyData, timeDomainData);
          if (remoteSpeaking.get(key) !== speaking) {
            remoteSpeaking.set(key, speaking);
            publish();
          }
        }, 100);
        remoteAnalysers.set(key, { ctx, source, analyser, interval });
      } catch {
        // AudioContext may fail in some environments
      }
    };

    connection.onconnectionstatechange = () => {
      const state = connection.connectionState;
      if (state === 'closed' || state === 'failed') {
        void closePeer(key, { sendBye: false });
        return;
      }

      setPeerState(key, connection);
    };

    connection.onsignalingstatechange = () => {
      setPeerState(key, connection);
    };

    connection.oniceconnectionstatechange = () => {
      setPeerState(key, connection);
    };

    connection.onnegotiationneeded = async () => {
      if (connection.signalingState !== 'stable' || makingOfferByKey.get(key)) {
        return;
      }

      makingOfferByKey.set(key, true);
      try {
        if (connection.signalingState !== 'stable') {
          return;
        }

        const offer = await connection.createOffer();
        if (connection.signalingState !== 'stable') {
          return;
        }

        if (offer.sdp) {
          offer.sdp = enhanceOpusSdp(offer.sdp);
        }
        await connection.setLocalDescription(offer);
        const localSdp = connection.localDescription?.sdp;
        if (localSdp) {
          await emitSignal(peerId, 'Offer', stringifyOfferPayload(localSdp, kind), kind);
        }
      } catch (err) {
        console.error('Failed to create offer:', err);
      } finally {
        makingOfferByKey.set(key, false);
      }
    };

    attachLocalTracks(connection, kind);
    setPeerState(key, connection);
    return connection;
  };

  const stopKind = async (kind: SignalKind): Promise<void> => {
    const keysToClose = [...knownKeys].filter((key) => parseKey(key).kind === kind);
    await Promise.all(keysToClose.map((key) => closePeer(key, { sendBye: true })));
  };

  const startAudio = async (): Promise<void> => {
    if (localAudioStream || startingAudio) {
      return;
    }

    startingAudio = true;
    try {
    localAudioStream = await getMicrophoneStream();
    trackMediaStream(localAudioStream);

    // Set up speaking detection
    cleanupSpeakingDetection();
    audioAnalyserCtx = new AudioContext();
    trackAudioContext(audioAnalyserCtx);
    audioSourceNode = audioAnalyserCtx.createMediaStreamSource(localAudioStream);
    const analyser = audioAnalyserCtx.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.4;
    audioSourceNode.connect(analyser);
    const frequencyData = new Uint8Array(analyser.frequencyBinCount);
    const timeDomainData = new Uint8Array(analyser.fftSize);
    if (speakingCheckInterval !== undefined) { clearInterval(speakingCheckInterval); speakingCheckInterval = undefined; }
    speakingCheckInterval = window.setInterval(() => {
      const isSpeaking = getAnalyserSpeakingState(analyser, frequencyData, timeDomainData);
      if (isSpeaking !== localSpeaking) {
        localSpeaking = isSpeaking;
        publish();
      }
    }, 100);

    for (const key of knownKeys) {
      const { kind } = parseKey(key);
      if (kind !== 'audio') {
        continue;
      }
      const connection = peerManager.get(key);
      if (!connection) {
        continue;
      }
      attachLocalTracks(connection, kind);
      setPeerState(key, connection);
    }
    } finally {
      startingAudio = false;
    }
  };

  const setMuted = (muted: boolean): void => {
    if (!localAudioStream) return;
    for (const track of localAudioStream.getAudioTracks()) {
      track.enabled = !muted;
    }
  };

  const stopAudio = async (): Promise<void> => {
    try {
      if (localAudioStream) untrackMediaStream(localAudioStream);
      stopStream(localAudioStream);
      localAudioStream = null;
      await stopKind('audio');
    } finally {
      cleanupSpeakingDetection();
    }
  };

  const startScreenShare = async (): Promise<void> => {
    if (localScreenStream) {
      return;
    }

    localScreenStream = await getScreenShareStream();
    trackMediaStream(localScreenStream);
    // Auto-cancel screen share when user stops via browser UI or permission is revoked
    localScreenStream.getVideoTracks().forEach((track) => {
      track.onended = () => {
        track.onended = null;
        void stopScreenShare().catch(() => {});
      };
    });

    for (const key of knownKeys) {
      const { kind } = parseKey(key);
      if (kind !== 'screen') {
        continue;
      }
      const connection = peerManager.get(key);
      if (!connection) {
        continue;
      }
      attachLocalTracks(connection, kind);
      setPeerState(key, connection);
    }
  };

  const stopScreenShare = async (): Promise<void> => {
    if (localScreenStream) {
      for (const track of localScreenStream.getVideoTracks()) {
        track.onended = null;
      }
    }
    if (localScreenStream) untrackMediaStream(localScreenStream);
    stopStream(localScreenStream);
    localScreenStream = null;
    await stopKind('screen');
  };

  const handleIncomingSignal = async (signal: IncomingRtcSignal): Promise<void> => {
    const peerId = signal.senderId ?? toIdentityKey(signal.senderIdentity);
    if (!peerId) {
      return;
    }

    const parsedPayload = parseSignalingPayload(signal.payload);
    const fallbackType = tagFromSignalType(signal.signalType);

    if (!parsedPayload && fallbackType !== 'Bye') {
      return;
    }

    const kind = parsedPayload?.kind ?? SIGNAL_KIND_FALLBACK;
    const key = keyFor(peerId, kind);

    if (parsedPayload?.type === 'bye' || fallbackType === 'Bye') {
      await closePeer(key, { sendBye: false });
      return;
    }

    const connection = ensureConnection(peerId, kind);

    if (parsedPayload?.type === 'offer') {
      const isPolite = localIdentityKey < peerId;
      const makingOffer = makingOfferByKey.get(key) === true;
      const isSettingRemoteAnswerPending = isSettingRemoteAnswerPendingByKey.get(key) === true;
      const readyForOffer = !makingOffer && (connection.signalingState === 'stable' || isSettingRemoteAnswerPending);
      const offerCollision = !readyForOffer;
      const shouldIgnoreOffer = !isPolite && offerCollision;

      ignoreOfferByKey.set(key, shouldIgnoreOffer);

      if (shouldIgnoreOffer) {
        // Impolite peer ignores incoming offer during collision
        return;
      }

      if (offerCollision && isPolite) {
        // Polite peer rolls back and accepts incoming offer
        if (connection.signalingState !== 'stable') {
          try {
            await connection.setLocalDescription({ type: 'rollback' });
          } catch {
            // Non-fatal: proceed and let remote-description race handling decide
          }
        }
      }

      const applied = await setRemoteDescriptionSafe(connection, { type: 'offer', sdp: parsedPayload.sdp });
      if (!applied) {
        setPeerState(key, connection);
        return;
      }

      attachLocalTracks(connection, kind);
      await flushPendingIce(key, connection);

      const answer = await connection.createAnswer();
      if (answer.sdp) {
        answer.sdp = enhanceOpusSdp(answer.sdp);
      }
      await connection.setLocalDescription(answer);

      const localSdp = connection.localDescription?.sdp;
      if (localSdp) {
        await emitSignal(peerId, 'Answer', stringifyAnswerPayload(localSdp, kind), kind);
      }

      setPeerState(key, connection);
      return;
    }

    if (parsedPayload?.type === 'answer') {
      isSettingRemoteAnswerPendingByKey.set(key, true);
      let applied = false;
      try {
        applied = await setRemoteDescriptionSafe(connection, { type: 'answer', sdp: parsedPayload.sdp });
      } finally {
        isSettingRemoteAnswerPendingByKey.set(key, false);
      }
      if (!applied) {
        setPeerState(key, connection);
        return;
      }

      ignoreOfferByKey.set(key, false);
      await flushPendingIce(key, connection);
      setPeerState(key, connection);
      return;
    }

    if (parsedPayload?.type === 'ice') {
      if (ignoreOfferByKey.get(key)) {
        return;
      }

      const candidate: RTCIceCandidateInit = {
        candidate: parsedPayload.candidate,
        sdpMid: parsedPayload.sdpMid,
        sdpMLineIndex: parsedPayload.sdpMLineIndex,
        usernameFragment: parsedPayload.usernameFragment,
      };

      if (connection.remoteDescription) {
        await addIceCandidateSafe(key, connection, candidate);
      } else {
        const pending = pendingIceCandidates.get(key) ?? [];
        pending.push(candidate);
        pendingIceCandidates.set(key, pending);
      }

      setPeerState(key, connection);
    }
  };

  const getSnapshot = (): RtcSnapshot => cloneSnapshot(remoteStreams, peerStates, localSpeaking, remoteSpeaking);

  const subscribe = (listener: (snapshot: RtcSnapshot) => void): (() => void) => {
    listeners.add(listener);
    listener(getSnapshot());
    return () => {
      listeners.delete(listener);
    };
  };

  const dispose = (): void => {
    cleanupSpeakingDetection();
    if (localScreenStream) {
      for (const track of localScreenStream.getVideoTracks()) {
        track.onended = null;
      }
    }
    if (localAudioStream) untrackMediaStream(localAudioStream);
    if (localScreenStream) untrackMediaStream(localScreenStream);
    stopStream(localAudioStream);
    stopStream(localScreenStream);
    localAudioStream = null;
    localScreenStream = null;
    for (const key of remoteAnalysers.keys()) {
      cleanupRemoteAnalyser(key);
    }
    // Untrack all peer connections before closing
    for (const key of knownKeys) {
      const pc = peerManager.get(key);
      if (pc) untrackPeerConnection(pc);
    }
    peerManager.closeAll();
    listeners.clear();
    for (const stream of remoteStreams.values()) {
      stream.getTracks().forEach(track => track.stop());
    }
    remoteStreams.clear();
    peerStates.clear();
    knownKeys.clear();
    pendingIceCandidates.clear();
    makingOfferByKey.clear();
    ignoreOfferByKey.clear();
    isSettingRemoteAnswerPendingByKey.clear();
  };

  const connectToPeers = (peerIds: string[], kind: SignalKind = 'audio'): void => {
    for (const peerId of peerIds) {
      if (peerId === localIdentity) continue;
      const key = keyFor(peerId, kind);
      if (peerManager.get(key)) continue; // already connected
      ensureConnection(peerId, kind);
      // ensureConnection attaches local tracks + sets onnegotiationneeded
      // onnegotiationneeded fires when tracks are added → creates offer → sends via sendSignal
    }
  };

  return {
    startAudio,
    setMuted,
    stopAudio,
    startScreenShare,
    stopScreenShare,
    handleIncomingSignal,
    connectToPeers,
    getSnapshot,
    subscribe,
    dispose,
  };
}

export type UseRtcOrchestratorResult = {
  startAudio: () => Promise<void>;
  setMuted: (muted: boolean) => void;
  stopAudio: () => Promise<void>;
  startScreenShare: () => Promise<void>;
  stopScreenShare: () => Promise<void>;
  handleIncomingSignal: (signal: IncomingRtcSignal) => Promise<void>;
  connectToPeers: (peerIds: string[], kind?: SignalKind) => void;
  remoteStreams: ReadonlyMap<string, MediaStream>;
  peerStates: ReadonlyMap<string, PeerState>;
  isLocalSpeaking: boolean;
  remoteSpeaking: ReadonlyMap<string, boolean>;
};

export function useRtcOrchestrator(
  options: UseRtcOrchestratorOptions = {},
): UseRtcOrchestratorResult {
  const sendSignalRef = useRef(options.sendSignal);
  sendSignalRef.current = options.sendSignal;

  const stableSendSignal = useCallback<SendRtcSignalFn>(
    (args) => sendSignalRef.current?.(args) ?? undefined,
    [],
  );

  const orchestrator = useMemo(
    () =>
      createRtcOrchestrator({
        localIdentity: options.localIdentity,
        sendSignal: stableSendSignal,
        rtcConfiguration: options.rtcConfiguration,
      }),
    [options.localIdentity, options.rtcConfiguration, stableSendSignal],
  );

  const [remoteStreams, setRemoteStreams] = useState<ReadonlyMap<string, MediaStream>>(
    () => orchestrator.getSnapshot().remoteStreams,
  );

  const [peerStates, setPeerStates] = useState<ReadonlyMap<string, PeerState>>(
    () => orchestrator.getSnapshot().peerStates,
  );

  const [isLocalSpeaking, setIsLocalSpeaking] = useState(false);

  const [remoteSpeaking, setRemoteSpeaking] = useState<ReadonlyMap<string, boolean>>(
    () => orchestrator.getSnapshot().remoteSpeaking,
  );

  useEffect(() => {
    return orchestrator.subscribe((snapshot) => {
      setRemoteStreams(snapshot.remoteStreams);
      setPeerStates(snapshot.peerStates);
      setIsLocalSpeaking(snapshot.isLocalSpeaking);
      setRemoteSpeaking(snapshot.remoteSpeaking);
    });
  }, [orchestrator]);

  useEffect(() => {
    const unregisterCleanup = registerCleanup(() => orchestrator.dispose());
    return () => {
      unregisterCleanup();
      orchestrator.dispose();
    };
  }, [orchestrator]);

  const startAudio = useCallback(() => orchestrator.startAudio(), [orchestrator]);
  const setMuted = useCallback((muted: boolean) => orchestrator.setMuted(muted), [orchestrator]);
  const stopAudio = useCallback(() => orchestrator.stopAudio(), [orchestrator]);
  const startScreenShare = useCallback(() => orchestrator.startScreenShare(), [orchestrator]);
  const stopScreenShare = useCallback(() => orchestrator.stopScreenShare(), [orchestrator]);
  const handleIncomingSignal = useCallback(
    (signal: IncomingRtcSignal) => orchestrator.handleIncomingSignal(signal),
    [orchestrator],
  );
  const connectToPeers = useCallback(
    (peerIds: string[], kind?: SignalKind) => orchestrator.connectToPeers(peerIds, kind),
    [orchestrator],
  );

  return {
    startAudio,
    setMuted,
    stopAudio,
    startScreenShare,
    stopScreenShare,
    handleIncomingSignal,
    connectToPeers,
    remoteStreams,
    peerStates,
    isLocalSpeaking,
    remoteSpeaking,
  };
}
