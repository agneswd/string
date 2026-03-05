/**
 * String — SpacetimeDB connection singleton.
 *
 * Call `initConnection()` once at app startup.
 * All other modules read `getConn()` after that.
 * Call `disconnectConnection()` to fully tear down.
 */

import { DbConnection } from '../module_bindings';
import type { Identity } from 'spacetimedb/sdk';

// Dynamically determine SpacetimeDB URL based on environment
const getSpacetimeDbUrl = (): string => {
  // Use environment variable if available (for custom deployments)
  if (import.meta.env.VITE_SPACETIMEDB_URL) {
    return import.meta.env.VITE_SPACETIMEDB_URL;
  }

  // Connect to maincloud instance
  // The SpacetimeDB SDK expects the realm path: https://spacetimedb.subdomain.realm/
  return 'https://maincloud.spacetimedb.com';
};

const SPACETIMEDB_URL = getSpacetimeDbUrl();
const DB_NAME = 'string';
const TOKEN_KEY = 'string_auth_token';

let _conn: DbConnection | null = null;
let _myIdentity: Identity | null = null;
let _connecting = false;

// Store callback references so we can remove them on disconnect to break closure chains
let _onConnectCb: ((...args: unknown[]) => void) | null = null;
let _onDisconnectCb: ((...args: unknown[]) => void) | null = null;
let _onConnectErrorCb: ((...args: unknown[]) => void) | null = null;

export function getConn(): DbConnection {
  if (!_conn) throw new Error('SpacetimeDB connection not initialised');
  return _conn;
}

export function getMyIdentity(): Identity | null {
  return _myIdentity;
}

export type ConnectionCallbacks = {
  onConnect: (identity: Identity) => void;
  onDisconnect: () => void;
  onConnectError: (err: Error) => void;
};

/**
 * Fully tear down the current connection, if any.
 * Safe to call multiple times or when no connection exists.
 */
export function disconnectConnection(): void {
  const conn = _conn;
  _conn = null;
  _myIdentity = null;
  _connecting = false;

  if (conn) {
    // Remove all registered event callbacks to break closure chains
    // These hold references to the connection via closures, preventing GC
    try {
      if (_onConnectCb) conn.removeOnConnect(_onConnectCb as Parameters<typeof conn.removeOnConnect>[0]);
      if (_onDisconnectCb) conn.removeOnDisconnect(_onDisconnectCb as Parameters<typeof conn.removeOnDisconnect>[0]);
      if (_onConnectErrorCb) conn.removeOnConnectError(_onConnectErrorCb as Parameters<typeof conn.removeOnConnectError>[0]);
    } catch { /* ignore — connection may not support these */ }

    _onConnectCb = null;
    _onDisconnectCb = null;
    _onConnectErrorCb = null;

    try {
      conn.disconnect();
    } catch {
      // Connection may already be closed — ignore
    }
  } else {
    _onConnectCb = null;
    _onDisconnectCb = null;
    _onConnectErrorCb = null;
  }
}

export function initConnection(callbacks: ConnectionCallbacks): void {
  // If there's an existing connection, tear it down first to prevent leaks
  if (_conn) {
    disconnectConnection();
  }
  // Guard against duplicate in-flight connections
  if (_connecting) return;
  _connecting = true;

  const savedToken = localStorage.getItem(TOKEN_KEY) ?? undefined;

  const invalidateConnection = (): boolean => {
    const hadConnection = _conn !== null || _myIdentity !== null;
    _conn = null;
    _myIdentity = null;
    _connecting = false;
    return hadConnection;
  };

  // Store callback references so we can remove them on disconnect
  _onConnectCb = ((_conn: DbConnection, identity: Identity, token: string) => {
    _connecting = false;
    _myIdentity = identity;
    localStorage.setItem(TOKEN_KEY, token);
    callbacks.onConnect(identity);
  }) as (...args: unknown[]) => void;

  _onConnectErrorCb = ((_ctx: unknown, err: Error) => {
    invalidateConnection();
    callbacks.onConnectError(err);
    callbacks.onDisconnect();
  }) as (...args: unknown[]) => void;

  _onDisconnectCb = (() => {
    if (invalidateConnection()) {
      callbacks.onDisconnect();
    }
  }) as (...args: unknown[]) => void;

  _conn = DbConnection.builder()
    .withUri(SPACETIMEDB_URL)
    .withDatabaseName(DB_NAME)
    .withToken(savedToken)
    .onConnect(_onConnectCb as Parameters<ReturnType<typeof DbConnection.builder>['onConnect']>[0])
    .onConnectError(_onConnectErrorCb as Parameters<ReturnType<typeof DbConnection.builder>['onConnectError']>[0])
    .onDisconnect(_onDisconnectCb as Parameters<ReturnType<typeof DbConnection.builder>['onDisconnect']>[0])
    .build();

  // _connecting was set before build(); if build() is synchronous and
  // already assigned _conn above, clear the flag.
  if (_conn) {
    _connecting = false;
  }
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

// ---------------------------------------------------------------------------
// Global cleanup registry — lets React components register teardown functions
// that fire on page unload (where component unmount won't run).
// ---------------------------------------------------------------------------
const _cleanupFns: (() => void)[] = [];

/** Register a cleanup function that will run on page unload. Returns an unregister function. */
export function registerCleanup(fn: () => void): () => void {
  _cleanupFns.push(fn);
  return () => {
    const idx = _cleanupFns.indexOf(fn);
    if (idx !== -1) _cleanupFns.splice(idx, 1);
  };
}

/** Run and clear all registered cleanup functions. */
export function runAllCleanups(): void {
  while (_cleanupFns.length > 0) {
    try { _cleanupFns.pop()!(); } catch { /* ignore */ }
  }
}

// ---------------------------------------------------------------------------
// Global resource tracking for cleanup on page unload
// ---------------------------------------------------------------------------
const _audioContexts = new Set<AudioContext>();
const _audioCtxListeners = new Map<AudioContext, () => void>();
const _mediaStreams = new Set<MediaStream>();
const _mediaStreamListeners = new Map<MediaStream, { track: MediaStreamTrack, listener: () => void }[]>();
const _peerConnections = new Set<RTCPeerConnection>();

export function trackAudioContext(ctx: AudioContext): void {
  // Idempotent: skip if already tracked to avoid leaking the previous listener
  if (_audioContexts.has(ctx)) return;
  _audioContexts.add(ctx);
  // Auto-remove when closed; store the listener so we can remove it later
  const listener = () => {
    if (ctx.state === 'closed') {
      _audioContexts.delete(ctx);
      ctx.removeEventListener('statechange', listener);
      _audioCtxListeners.delete(ctx);
    }
  };
  _audioCtxListeners.set(ctx, listener);
  ctx.addEventListener('statechange', listener);
}

export function trackMediaStream(stream: MediaStream): void {
  if (_mediaStreams.has(stream)) return;
  _mediaStreams.add(stream);

  const checkAllEnded = () => {
    if (stream.getTracks().every(t => t.readyState === 'ended')) {
      untrackMediaStream(stream);
    }
  };

  const listeners: { track: MediaStreamTrack, listener: () => void }[] = [];
  stream.getTracks().forEach(track => {
    const listener = () => checkAllEnded();
    track.addEventListener('ended', listener);
    listeners.push({ track, listener });
  });
  
  _mediaStreamListeners.set(stream, listeners);
}

export function trackPeerConnection(pc: RTCPeerConnection): void {
  _peerConnections.add(pc);
}

export function untrackAudioContext(ctx: AudioContext): void {
  const listener = _audioCtxListeners.get(ctx);
  if (listener) {
    ctx.removeEventListener('statechange', listener);
    _audioCtxListeners.delete(ctx);
  }
  _audioContexts.delete(ctx);
}

export function untrackMediaStream(stream: MediaStream): void {
  const listeners = _mediaStreamListeners.get(stream);
  if (listeners) {
    listeners.forEach(({ track, listener }) => {
      track.removeEventListener('ended', listener);
    });
    _mediaStreamListeners.delete(stream);
  }
  _mediaStreams.delete(stream);
}

export function untrackPeerConnection(pc: RTCPeerConnection): void {
  _peerConnections.delete(pc);
}

export function closeAllTrackedResources(): void {
  // Close all AudioContexts and remove their statechange listeners
  for (const ctx of _audioContexts) {
    try {
      const listener = _audioCtxListeners.get(ctx);
      if (listener) ctx.removeEventListener('statechange', listener);
      ctx.close();
    } catch { /* ignore */ }
  }
  _audioContexts.clear();
  _audioCtxListeners.clear();

  // Stop all MediaStream tracks and clear listeners
  for (const stream of Array.from(_mediaStreams)) {
    try {
      stream.getTracks().forEach(t => t.stop());
      untrackMediaStream(stream);
    } catch { /* ignore */ }
  }

  // Close all PeerConnections
  for (const pc of _peerConnections) {
    try {
      pc.onicecandidate = null;
      pc.ontrack = null;
      pc.onconnectionstatechange = null;
      pc.onsignalingstatechange = null;
      pc.oniceconnectionstatechange = null;
      pc.onnegotiationneeded = null;
      pc.ondatachannel = null;
      pc.close();
    } catch { /* ignore */ }
  }
  _peerConnections.clear();
}
