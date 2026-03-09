import type {
  Channel,
  DmCallEvent,
  DmCallRequest,
  DmChannel,
  DmMessage,
  DmParticipant,
  Friend,
  FriendRequest,
  Guild,
  GuildInvite,
  GuildMember,
  Message,
  RtcSignal,
  User,
  UserPresence,
  VoiceState,
} from '../../module_bindings/types'
import type { ReducerIdLike } from './liveActions'

/**
 * SpacetimeDB bootstrap types.
 *
 * React Native-safe — no DOM APIs, no browser globals.
 */

/** All phases of a SpacetimeDB connection lifecycle. */
export type SpacetimeConnectionPhase =
  /** Initial state — no connection has been attempted yet. */
  | 'idle'
  /** Token has been obtained and a connection attempt is in progress. */
  | 'connecting'
  /** WebSocket connection is established and the handshake is complete. */
  | 'connected'
  /** Connection failed; inspect `error` for details. */
  | 'error'
  /** Previously connected, now cleanly disconnected (e.g. sign-out). */
  | 'disconnected'

/** Runtime state exposed by the SpacetimeDB bootstrap layer. */
export interface SpacetimeState {
  /** Current connection lifecycle phase. */
  phase: SpacetimeConnectionPhase
  /** Human-readable error message when `phase === 'error'`, otherwise null. */
  error: string | null
  /**
   * SpacetimeDB-assigned identity string for the current session.
   * Null until the SDK handshake completes (currently always null in staged mode).
   */
  identity: string | null
  /**
   * True once the initial subscription batch has been applied and local
   * table mirrors are ready to serve data.
   */
  subscriptionsReady: boolean
  /** Raw subscribed table snapshot for mobile feature mapping. */
  data: SpacetimeDataSnapshot
  selectedGuildChannelId: string | null
  guildMessages: Message[]
}

export interface SpacetimeDataSnapshot {
  myProfile: User | null
  users: User[]
  userPresence: UserPresence[]
  friendEdges: Friend[]
  incomingFriendRequests: FriendRequest[]
  outgoingFriendRequests: FriendRequest[]
  guilds: Guild[]
  guildMembers: GuildMember[]
  channels: Channel[]
  guildInvites: GuildInvite[]
  dmChannels: DmChannel[]
  dmParticipants: DmParticipant[]
  dmMessages: DmMessage[]
  dmCallEvents: DmCallEvent[]
  dmCallRequests: DmCallRequest[]
  rtcSignals: RtcSignal[]
  /** Voice states for all visible users (includes self when in a voice channel). */
  voiceStates: VoiceState[]
}

/** Actions exposed by the SpacetimeDB bootstrap layer. */
export interface SpacetimeActions {
  /**
   * Trigger a fresh connection attempt.  Safe to call when `phase` is
   * 'idle', 'error', or 'disconnected'.
   */
  reconnect: () => void
  createGuild: (params: { name: string }) => Promise<void>
  createChannel: (params: { guildId: unknown; name: string; channelType: unknown; parentCategoryId: unknown | null }) => Promise<void>
  joinVoiceChannel: (channelId: unknown) => Promise<void>
  joinVoiceDm: (dmChannelId: unknown) => Promise<void>
  leaveVoiceChannel: () => Promise<void>
  initiateDmCall: (dmChannelId: unknown) => Promise<void>
  acceptDmCall: (callId: unknown) => Promise<void>
  declineDmCall: (callId: unknown) => Promise<void>
  sendDmRtcSignal: (params: { dmChannelId: unknown; recipientIdentity: unknown; signalType: unknown; payload: string }) => Promise<void>
  ackRtcSignal: (signalId: unknown) => Promise<void>
  updateGuild: (params: { guildId: unknown; name?: string | null; bio?: string | null; avatarBytes?: Uint8Array | null }) => Promise<void>
  inviteMember: (params: { guildId: unknown; targetIdentity: unknown }) => Promise<void>
  leaveGuild: (guildId: unknown) => Promise<void>
  deleteGuild: (guildId: unknown) => Promise<void>
  createDmChannel: (params: { participants: unknown[]; title?: string | null }) => Promise<void>
  sendDmMessage: (params: { dmChannelId: unknown; content: string; replyTo?: unknown | null }) => Promise<void>
  markDmRead: (params: { dmChannelId: unknown; messageId: unknown }) => Promise<void>
  selectGuildChannel: (channelId: unknown | null) => void
  sendGuildMessage: (params: { channelId: unknown; content: string; replyTo?: unknown | null }) => Promise<void>
  acceptFriendRequest: (requestId: ReducerIdLike) => Promise<void>
  declineFriendRequest: (requestId: ReducerIdLike) => Promise<void>
  cancelFriendRequest: (requestId: ReducerIdLike) => Promise<void>
  /** Update the signed-in user's profile fields. */
  updateProfile: (params: { username?: string | null; displayName?: string | null; bio?: string | null; avatarBytes?: Uint8Array | null; profileColor?: string | null }) => Promise<void>
  /** Set the signed-in user's presence status tag (e.g. 'Online', 'Away'). */
  setStatus: (statusTag: 'Online' | 'Away' | 'DoNotDisturb' | 'Offline') => Promise<void>
  /** Send a friend request to a user by their username. */
  sendFriendRequest: (targetUsername: string) => Promise<void>
  /** Remove an existing friend by their string identity. The bootstrap layer resolves the raw Identity internally. */
  removeFriend: (friendId: string) => Promise<void>
  /** Toggle mute/deafen state in the current voice channel. */
  updateVoiceState: (params: { isMuted: boolean; isDeafened: boolean; isStreaming: boolean }) => Promise<void>
}

/** Full value exported from SpacetimeContext. */
export type SpacetimeContextValue = SpacetimeState & SpacetimeActions
