/**
 * SpacetimeBootstrap
 *
 * Provides the SpacetimeContext to the component tree and manages the
 * connection lifecycle in response to auth session changes.
 *
 * ─ Architecture ───────────────────────────────────────────────────────────
 *  • Must be rendered INSIDE <AuthBootstrap> so that useAuth() is available
 *    and the session is guaranteed to be signed-in.
 *  • Watches the auth token.  When a valid token is present it drives the
 *    bootstrap sequence.  When the user signs out it tears down cleanly.
 *
 * React Native-safe — no DOM APIs, no browser globals.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'

import { useAuth } from '../../features/auth'
import { DbConnection, type SubscriptionHandle } from '../../module_bindings'
import type {
  Channel,
  DmChannel,
  DmMessage,
  DmParticipant,
  Friend,
  FriendRequest,
  Guild,
  GuildInvite,
  GuildMember,
  Message,
  User,
  UserPresence,
  VoiceState,
} from '../../module_bindings/types'
import {
  buildSpacetimeDisplayName,
  buildStableSpacetimeUsername,
  isRecoverableRegistrationError,
} from '../auth/clerkProfile'
import { resolveSpacetimeConfig } from './config'
import {
  deleteStoredValue,
  getStoredValue,
  setStoredValue,
} from './spacetimeStorage'
import {
  acceptFriendRequest as invokeAcceptFriendRequest,
  cancelFriendRequest as invokeCancelFriendRequest,
  declineFriendRequest as invokeDeclineFriendRequest,
  sendFriendRequest as invokeSendFriendRequest,
  removeFriend as invokeRemoveFriend,
  updateVoiceState as invokeUpdateVoiceState,
} from './liveActions'
import type {
  SpacetimeConnectionPhase,
  SpacetimeContextValue,
  SpacetimeDataSnapshot,
  SpacetimeState,
} from './types'

// ─── Context ──────────────────────────────────────────────────────────────────

const SpacetimeContext = createContext<SpacetimeContextValue | null>(null)

const SPACETIME_TOKEN_KEY = 'string_spacetime_token'
const CLERK_USER_ID_KEY = 'string_clerk_user_id'

const CORE_SUBSCRIPTION_QUERIES = [
  'SELECT * FROM my_visible_users',
  'SELECT * FROM my_visible_user_presence',
  'SELECT * FROM my_friend_edges',
  'SELECT * FROM my_profile',
  'SELECT * FROM my_guilds',
  'SELECT * FROM my_guild_members',
  'SELECT * FROM my_channels',
  'SELECT * FROM guild_invite',
  'SELECT * FROM my_friend_requests_incoming',
  'SELECT * FROM my_friend_requests_outgoing',
  'SELECT * FROM my_dm_channels',
  'SELECT * FROM my_dm_participants',
  'SELECT * FROM my_dm_messages',
  'SELECT * FROM my_dm_typing',
  'SELECT * FROM my_dm_call_events',
  'SELECT * FROM my_channel_typing',
  'SELECT * FROM my_rtc_signals',
  'SELECT * FROM my_voice_states',
  'SELECT * FROM dm_call_request',
] as const

const SNAPSHOT_TABLE_KEYS = [
  'my_profile',
  'my_visible_users',
  'my_visible_user_presence',
  'my_friend_edges',
  'my_friend_requests_incoming',
  'my_friend_requests_outgoing',
  'my_guilds',
  'my_guild_members',
  'my_channels',
  'guild_invite',
  'my_dm_channels',
  'my_dm_participants',
  'my_dm_messages',
  'my_voice_states',
] as const

type SnapshotTableKey = (typeof SNAPSHOT_TABLE_KEYS)[number]

type RuntimeTableLike = {
  iter?: () => IterableIterator<unknown>
  onInsert?: (handler: () => void) => void
  onDelete?: (handler: () => void) => void
  onUpdate?: (handler: () => void) => void
  removeOnInsert?: (handler: () => void) => void
  removeOnDelete?: (handler: () => void) => void
  removeOnUpdate?: (handler: () => void) => void
}

type AttachedTableHandler = {
  table: RuntimeTableLike
  handler: () => void
}

const EMPTY_DATA: SpacetimeDataSnapshot = {
  myProfile: null,
  users: [],
  userPresence: [],
  friendEdges: [],
  incomingFriendRequests: [],
  outgoingFriendRequests: [],
  guilds: [],
  guildMembers: [],
  channels: [],
  guildInvites: [],
  dmChannels: [],
  dmParticipants: [],
  dmMessages: [],
  voiceStates: [],
}

const EMPTY_GUILD_MESSAGES: Message[] = []

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

function readRows<Row>(db: Record<string, RuntimeTableLike>, key: SnapshotTableKey): Row[] {
  const table = db[key]
  if (!table?.iter) {
    return []
  }

  return Array.from(table.iter() as IterableIterator<Row>)
}

function buildSnapshot(connection: DbConnection): SpacetimeDataSnapshot {
  const db = connection.db as unknown as Record<string, RuntimeTableLike>

  return {
    myProfile: readRows<User>(db, 'my_profile')[0] ?? null,
    users: readRows<User>(db, 'my_visible_users'),
    userPresence: readRows<UserPresence>(db, 'my_visible_user_presence'),
    friendEdges: readRows<Friend>(db, 'my_friend_edges'),
    incomingFriendRequests: readRows<FriendRequest>(db, 'my_friend_requests_incoming'),
    outgoingFriendRequests: readRows<FriendRequest>(db, 'my_friend_requests_outgoing'),
    guilds: readRows<Guild>(db, 'my_guilds'),
    guildMembers: readRows<GuildMember>(db, 'my_guild_members'),
    channels: readRows<Channel>(db, 'my_channels'),
    guildInvites: readRows<GuildInvite>(db, 'guild_invite'),
    dmChannels: readRows<DmChannel>(db, 'my_dm_channels'),
    dmParticipants: readRows<DmParticipant>(db, 'my_dm_participants'),
    dmMessages: readRows<DmMessage>(db, 'my_dm_messages'),
    voiceStates: readRows<VoiceState>(db, 'my_voice_states'),
  }
}

// ─── Initial state ────────────────────────────────────────────────────────────

const INITIAL_STATE: SpacetimeState = {
  phase: 'idle',
  error: null,
  identity: null,
  subscriptionsReady: false,
  data: EMPTY_DATA,
  selectedGuildChannelId: null,
  guildMessages: EMPTY_GUILD_MESSAGES,
}

// ─── Provider ────────────────────────────────────────────────────────────────

/**
 * SpacetimeBootstrap
 *
 * Place this as a direct child of <AuthBootstrap> (i.e. inside the signed-in
 * render path).  Reads the auth token and drives connection lifecycle.
 */
export function SpacetimeBootstrap({ children }: { children: React.ReactNode }) {
  const { session } = useAuth()
  const [state, setState] = useState<SpacetimeState>(INITIAL_STATE)
  const abortRef = useRef<AbortController | null>(null)
  const provisioningKeyRef = useRef<string | null>(null)
  const connRef = useRef<DbConnection | null>(null)
  const subscriptionRef = useRef<SubscriptionHandle | null>(null)
  const guildChannelSubscriptionRef = useRef<SubscriptionHandle | null>(null)
  const attachedTableHandlersRef = useRef<AttachedTableHandler[]>([])
  const guildMessageHandlerRef = useRef<(() => void) | null>(null)
  const config = resolveSpacetimeConfig()

  const detachTableHandlers = useCallback(() => {
    for (const { table, handler } of attachedTableHandlersRef.current) {
      table.removeOnInsert?.(handler)
      table.removeOnDelete?.(handler)
      table.removeOnUpdate?.(handler)
    }

    attachedTableHandlersRef.current = []
  }, [])

  const syncSnapshot = useCallback(() => {
    const connection = connRef.current
    if (!connection) {
      return
    }

    const nextData = buildSnapshot(connection)
    setState((s) => ({ ...s, data: nextData }))
  }, [])

  const attachLiveSync = useCallback((connection: DbConnection) => {
    detachTableHandlers()
    const db = connection.db as unknown as Record<string, RuntimeTableLike>

    for (const key of SNAPSHOT_TABLE_KEYS) {
      const table = db[key]
      if (!table) {
        continue
      }

      const handler = () => {
        syncSnapshot()
      }

      table.onInsert?.(handler)
      table.onDelete?.(handler)
      table.onUpdate?.(handler)
      attachedTableHandlersRef.current.push({ table, handler })
    }
  }, [detachTableHandlers, syncSnapshot])

  const detachGuildMessageSync = useCallback(() => {
    const connection = connRef.current
    const handler = guildMessageHandlerRef.current

    guildMessageHandlerRef.current = null

    if (!connection || !handler) {
      return
    }

    const messageTable = (connection.db as unknown as Record<string, RuntimeTableLike>).message
    messageTable?.removeOnInsert?.(handler)
    messageTable?.removeOnDelete?.(handler)
    messageTable?.removeOnUpdate?.(handler)
  }, [])

  const syncGuildMessages = useCallback((channelId: string | null) => {
    const connection = connRef.current
    if (!connection || !channelId) {
      setState((s) => ({ ...s, guildMessages: EMPTY_GUILD_MESSAGES }))
      return
    }

    const messageTable = (connection.db as unknown as Record<string, RuntimeTableLike>).message
    const rows = messageTable?.iter ? Array.from(messageTable.iter() as IterableIterator<Message>) : []

    const nextMessages = rows
      .filter((message) => toIdKey(message.channelId) === channelId && !message.isDeleted)
      .sort((left, right) => timestampToMillis(left.sentAt) - timestampToMillis(right.sentAt))

    setState((s) => ({ ...s, guildMessages: nextMessages }))
  }, [])

  const attachGuildMessageSync = useCallback((channelId: string) => {
    detachGuildMessageSync()

    const connection = connRef.current
    if (!connection) {
      return
    }

    const messageTable = (connection.db as unknown as Record<string, RuntimeTableLike>).message
    if (!messageTable) {
      return
    }

    const handler = () => {
      syncGuildMessages(channelId)
    }

    messageTable.onInsert?.(handler)
    messageTable.onDelete?.(handler)
    messageTable.onUpdate?.(handler)
    guildMessageHandlerRef.current = handler
  }, [detachGuildMessageSync, syncGuildMessages])

  const disconnectCurrent = useCallback(() => {
    detachTableHandlers()
    detachGuildMessageSync()

    const activeGuildChannelSubscription = guildChannelSubscriptionRef.current
    guildChannelSubscriptionRef.current = null

    if (activeGuildChannelSubscription) {
      try {
        if (!activeGuildChannelSubscription.isEnded()) {
          activeGuildChannelSubscription.unsubscribe()
        }
      } catch {
        // ignore stale subscription cleanup errors
      }
    }

    const activeSubscription = subscriptionRef.current
    subscriptionRef.current = null

    if (activeSubscription) {
      try {
        if (!activeSubscription.isEnded()) {
          activeSubscription.unsubscribe()
        }
      } catch {
        // ignore stale subscription cleanup errors
      }
    }

    const activeConn = connRef.current
    connRef.current = null

    if (activeConn) {
      try {
        activeConn.disconnect()
      } catch {
        // ignore stale connection cleanup errors
      }
    }
  }, [detachGuildMessageSync, detachTableHandlers])

  const runBootstrap = useCallback(
    async (token: string, signal: AbortSignal) => {
      if (!token) return

      disconnectCurrent()
      setState((s) => ({ ...s, phase: 'connecting', error: null }))

      try {
        const savedSpacetimeToken = (await getStoredValue(SPACETIME_TOKEN_KEY)) ?? undefined

        if (signal.aborted) {
          return
        }

        const connection = DbConnection.builder()
          .withUri(config.host)
          .withDatabaseName(config.moduleName)
          .withCompression('none')
          .withToken(savedSpacetimeToken)
          .onConnect((connectedConn, identity, nextToken) => {
            if (signal.aborted) {
              return
            }

            void setStoredValue(SPACETIME_TOKEN_KEY, nextToken).catch(() => {
              // ignore token persistence failures for now
            })

            setState((s) => ({
              ...s,
              phase: 'connected',
              identity: identityToString(identity),
              error: null,
              subscriptionsReady: false,
              data: buildSnapshot(connectedConn),
              selectedGuildChannelId: s.selectedGuildChannelId,
              guildMessages: s.guildMessages,
            }))

            subscriptionRef.current = connectedConn
              .subscriptionBuilder()
              .onApplied(() => {
                if (signal.aborted) {
                  return
                }

                attachLiveSync(connectedConn)
                const nextData = buildSnapshot(connectedConn)

                setState((s) => ({
                  ...s,
                  phase: 'connected',
                  error: null,
                  subscriptionsReady: true,
                  data: nextData,
                }))
              })
              .onError(() => {
                if (signal.aborted) {
                  return
                }

                setState((s) => ({
                  ...s,
                  phase: 'error',
                  error: 'Subscription error',
                  subscriptionsReady: false,
                }))
              })
              .subscribe([...CORE_SUBSCRIPTION_QUERIES])
          })
          .onDisconnect(() => {
            if (signal.aborted) {
              return
            }

            setState((s) => ({
              ...s,
              phase: 'disconnected',
              error: null,
              subscriptionsReady: false,
            }))
          })
          .onConnectError((_ctx, error) => {
            if (signal.aborted) {
              return
            }

            setState((s) => ({
              ...s,
              phase: 'error',
              error: error instanceof Error ? error.message : 'Failed to connect to SpacetimeDB.',
              subscriptionsReady: false,
            }))
          })
          .build()

        connRef.current = connection
      } catch (error) {
        if (signal.aborted) {
          return
        }

        setState((s) => ({
          ...s,
          phase: 'error',
          error: error instanceof Error ? error.message : 'Failed to connect to SpacetimeDB.',
          subscriptionsReady: false,
        }))
      }
    },
    [attachLiveSync, config.host, config.moduleName, disconnectCurrent],
  )

  // ── Teardown ────────────────────────────────────────────────────────────
  const teardown = useCallback((nextPhase: SpacetimeConnectionPhase = 'disconnected') => {
    abortRef.current?.abort()
    abortRef.current = null
    disconnectCurrent()
    setState({
      phase: nextPhase,
      error: null,
      identity: null,
      subscriptionsReady: false,
      data: EMPTY_DATA,
      selectedGuildChannelId: null,
      guildMessages: EMPTY_GUILD_MESSAGES,
    })
  }, [disconnectCurrent])

  const createDmChannel = useCallback<SpacetimeContextValue['createDmChannel']>(async (params) => {
    const connection = connRef.current
    if (!connection) {
      throw new Error('SpacetimeDB is not connected yet.')
    }

    const reducer = (connection.reducers as Record<string, ((payload: unknown) => Promise<void>) | undefined>).createDmChannel
    if (!reducer) {
      throw new Error('createDmChannel reducer is not available.')
    }

    await reducer({
      participants: params.participants,
      title: params.title ?? null,
    })
  }, [])

  const createGuild = useCallback<SpacetimeContextValue['createGuild']>(async (params) => {
    const connection = connRef.current
    if (!connection) {
      throw new Error('SpacetimeDB is not connected yet.')
    }

    const reducer = (connection.reducers as Record<string, ((payload: unknown) => Promise<void>) | undefined>).createGuild
    if (!reducer) {
      throw new Error('createGuild reducer is not available.')
    }

    await reducer({ name: params.name })
  }, [])

  const createChannel = useCallback<SpacetimeContextValue['createChannel']>(async (params) => {
    const connection = connRef.current
    if (!connection) {
      throw new Error('SpacetimeDB is not connected yet.')
    }

    const reducer = (connection.reducers as Record<string, ((payload: unknown) => Promise<void>) | undefined>).createChannel
    if (!reducer) {
      throw new Error('createChannel reducer is not available.')
    }

    await reducer({
      guildId: params.guildId,
      name: params.name,
      channelType: params.channelType,
      parentCategoryId: params.parentCategoryId,
    })
  }, [])

  const initiateDmCall = useCallback<SpacetimeContextValue['initiateDmCall']>(async (dmChannelId) => {
    const connection = connRef.current
    if (!connection) {
      throw new Error('SpacetimeDB is not connected yet.')
    }

    const reducer = (connection.reducers as Record<string, ((payload: unknown) => Promise<void>) | undefined>).initiateDmCall
    if (!reducer) {
      throw new Error('initiateDmCall reducer is not available.')
    }

    await reducer({ dmChannelId })
  }, [])

  const updateGuild = useCallback<SpacetimeContextValue['updateGuild']>(async (params) => {
    const connection = connRef.current
    if (!connection) {
      throw new Error('SpacetimeDB is not connected yet.')
    }

    const reducer = (connection.reducers as Record<string, ((payload: unknown) => Promise<void>) | undefined>).updateGuild
    if (!reducer) {
      throw new Error('updateGuild reducer is not available.')
    }

    await reducer({
      guildId: params.guildId,
      name: params.name ?? null,
      bio: params.bio ?? null,
      avatarBytes: params.avatarBytes ?? null,
    })
  }, [])

  const inviteMember = useCallback<SpacetimeContextValue['inviteMember']>(async (params) => {
    const connection = connRef.current
    if (!connection) {
      throw new Error('SpacetimeDB is not connected yet.')
    }

    const reducer = (connection.reducers as Record<string, ((payload: unknown) => Promise<void>) | undefined>).inviteMember
    if (!reducer) {
      throw new Error('inviteMember reducer is not available.')
    }

    await reducer({
      guildId: params.guildId,
      targetIdentity: params.targetIdentity,
    })
  }, [])

  const leaveGuild = useCallback<SpacetimeContextValue['leaveGuild']>(async (guildId) => {
    const connection = connRef.current
    if (!connection) {
      throw new Error('SpacetimeDB is not connected yet.')
    }

    const reducer = (connection.reducers as Record<string, ((payload: unknown) => Promise<void>) | undefined>).leaveGuild
    if (!reducer) {
      throw new Error('leaveGuild reducer is not available.')
    }

    await reducer({ guildId })
  }, [])

  const deleteGuild = useCallback<SpacetimeContextValue['deleteGuild']>(async (guildId) => {
    const connection = connRef.current
    if (!connection) {
      throw new Error('SpacetimeDB is not connected yet.')
    }

    const reducer = (connection.reducers as Record<string, ((payload: unknown) => Promise<void>) | undefined>).deleteGuild
    if (!reducer) {
      throw new Error('deleteGuild reducer is not available.')
    }

    await reducer({ guildId })
  }, [])

  const sendDmMessage = useCallback<SpacetimeContextValue['sendDmMessage']>(async (params) => {
    const connection = connRef.current
    if (!connection) {
      throw new Error('SpacetimeDB is not connected yet.')
    }

    const reducer = (connection.reducers as Record<string, ((payload: unknown) => Promise<void>) | undefined>).sendDmMessage
    if (!reducer) {
      throw new Error('sendDmMessage reducer is not available.')
    }

    await reducer({
      dmChannelId: params.dmChannelId,
      content: params.content,
      replyTo: params.replyTo ?? null,
    })
  }, [])

  const markDmRead = useCallback<SpacetimeContextValue['markDmRead']>(async (params) => {
    const connection = connRef.current
    if (!connection) {
      throw new Error('SpacetimeDB is not connected yet.')
    }

    const reducer = (connection.reducers as Record<string, ((payload: unknown) => Promise<void>) | undefined>).markDmRead
    if (!reducer) {
      throw new Error('markDmRead reducer is not available.')
    }

    await reducer({
      dmChannelId: params.dmChannelId,
      messageId: params.messageId,
    })
  }, [])

  const selectGuildChannel = useCallback<SpacetimeContextValue['selectGuildChannel']>((channelId) => {
    const normalizedChannelId = channelId === null || channelId === undefined ? null : toIdKey(channelId)

    detachGuildMessageSync()

    const activeSubscription = guildChannelSubscriptionRef.current
    guildChannelSubscriptionRef.current = null
    if (activeSubscription) {
      try {
        if (!activeSubscription.isEnded()) {
          activeSubscription.unsubscribe()
        }
      } catch {
        // ignore stale subscription cleanup errors
      }
    }

    setState((s) => ({ ...s, selectedGuildChannelId: normalizedChannelId, guildMessages: EMPTY_GUILD_MESSAGES }))

    const connection = connRef.current
    if (!connection || !normalizedChannelId || !/^\d+$/.test(normalizedChannelId)) {
      return
    }

    guildChannelSubscriptionRef.current = connection
      .subscriptionBuilder()
      .onApplied(() => {
        syncGuildMessages(normalizedChannelId)
        attachGuildMessageSync(normalizedChannelId)
      })
      .onError(() => {
        setState((s) => ({ ...s, error: 'Guild channel subscription error', guildMessages: EMPTY_GUILD_MESSAGES }))
      })
      .subscribe([`SELECT * FROM message WHERE channel_id = ${normalizedChannelId}`])
  }, [attachGuildMessageSync, detachGuildMessageSync, syncGuildMessages])

  const sendGuildMessage = useCallback<SpacetimeContextValue['sendGuildMessage']>(async (params) => {
    const connection = connRef.current
    if (!connection) {
      throw new Error('SpacetimeDB is not connected yet.')
    }

    const reducer = (connection.reducers as Record<string, ((payload: unknown) => Promise<void>) | undefined>).sendMessage
    if (!reducer) {
      throw new Error('sendMessage reducer is not available.')
    }

    await reducer({
      channelId: params.channelId,
      content: params.content,
      replyTo: params.replyTo ?? null,
    })
  }, [])

  const acceptFriendRequest = useCallback<SpacetimeContextValue['acceptFriendRequest']>(async (requestId) => {
    const connection = connRef.current
    if (!connection) {
      throw new Error('SpacetimeDB is not connected yet.')
    }

    await invokeAcceptFriendRequest(connection, requestId)
  }, [])

  const declineFriendRequest = useCallback<SpacetimeContextValue['declineFriendRequest']>(async (requestId) => {
    const connection = connRef.current
    if (!connection) {
      throw new Error('SpacetimeDB is not connected yet.')
    }

    await invokeDeclineFriendRequest(connection, requestId)
  }, [])

  const cancelFriendRequest = useCallback<SpacetimeContextValue['cancelFriendRequest']>(async (requestId) => {
    const connection = connRef.current
    if (!connection) {
      throw new Error('SpacetimeDB is not connected yet.')
    }

    await invokeCancelFriendRequest(connection, requestId)
  }, [])

  const sendFriendRequest = useCallback<SpacetimeContextValue['sendFriendRequest']>(async (targetUsername) => {
    const connection = connRef.current
    if (!connection) {
      throw new Error('SpacetimeDB is not connected yet.')
    }

    await invokeSendFriendRequest(connection, targetUsername)
  }, [])

  const removeFriend = useCallback<SpacetimeContextValue['removeFriend']>(async (friendId) => {
    const connection = connRef.current
    if (!connection) {
      throw new Error('SpacetimeDB is not connected yet.')
    }

    // Resolve the raw Identity object from cached friend edges by matching the string ID.
    const selfId = state.identity ?? ''
    const edge = state.data.friendEdges.find((e) => {
      const low = identityToString(e.identityLow)
      const high = identityToString(e.identityHigh)
      return (low === selfId && high === friendId) || (high === selfId && low === friendId)
    })
    if (!edge) {
      throw new Error('Friend edge not found for the given identity.')
    }

    const rawIdentity = identityToString(edge.identityLow) === selfId ? edge.identityHigh : edge.identityLow
    await invokeRemoveFriend(connection, rawIdentity)
  }, [state.identity, state.data.friendEdges])

  const updateVoiceState = useCallback<SpacetimeContextValue['updateVoiceState']>(async (params) => {
    const connection = connRef.current
    if (!connection) {
      throw new Error('SpacetimeDB is not connected yet.')
    }

    await invokeUpdateVoiceState(connection, params)
  }, [])

  const updateProfile = useCallback<SpacetimeContextValue['updateProfile']>(async (params) => {
    const connection = connRef.current
    if (!connection) {
      throw new Error('SpacetimeDB is not connected yet.')
    }

    const reducer = (connection.reducers as Record<string, ((payload: unknown) => Promise<void>) | undefined>).updateProfile
    if (!reducer) {
      throw new Error('updateProfile reducer is not available.')
    }

    await reducer({
      username: params.username ?? null,
      displayName: params.displayName ?? null,
      bio: params.bio ?? null,
      avatarBytes: params.avatarBytes ?? null,
      profileColor: params.profileColor ?? null,
    })
  }, [])

  const setStatus = useCallback<SpacetimeContextValue['setStatus']>(async (statusTag) => {
    const connection = connRef.current
    if (!connection) {
      throw new Error('SpacetimeDB is not connected yet.')
    }

    const reducer = (connection.reducers as Record<string, ((payload: unknown) => Promise<void>) | undefined>).setStatus
    if (!reducer) {
      throw new Error('setStatus reducer is not available.')
    }

    await reducer({ status: { tag: statusTag } })
  }, [])

  // ── Reconnect action (exposed to consumers) ─────────────────────────────
  const reconnect = useCallback(() => {
    if (session.status !== 'signed-in') return
    teardown('idle')
    const controller = new AbortController()
    abortRef.current = controller
    void runBootstrap(session.token, controller.signal)
  }, [session, runBootstrap, teardown])

  // ── Auth-driven effect ──────────────────────────────────────────────────
  useEffect(() => {
    if (session.status !== 'signed-in' || !session.token) {
      provisioningKeyRef.current = null
      teardown('idle')
      void deleteStoredValue(CLERK_USER_ID_KEY).catch(() => {
        // ignore storage cleanup failures
      })
      return
    }
    const signedInSession = session

    let cancelled = false
    const controller = new AbortController()

    async function startBootstrap() {
      const previousClerkUserId = await getStoredValue(CLERK_USER_ID_KEY)

      if (previousClerkUserId && previousClerkUserId !== signedInSession.userId) {
        await deleteStoredValue(SPACETIME_TOKEN_KEY).catch(() => {
          // ignore token reset failures
        })
      }

      await setStoredValue(CLERK_USER_ID_KEY, signedInSession.userId).catch(() => {
        // ignore storage failures
      })

      if (cancelled) {
        return
      }

      abortRef.current = controller
      void runBootstrap(signedInSession.token, controller.signal)
    }

    void startBootstrap()

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [
    session.status,
    // Safe: token reference is stable per sign-in lifecycle.
    session.status === 'signed-in' ? session.token : null,
    session.status === 'signed-in' ? session.userId : null,
    runBootstrap,
    teardown,
  ])

  useEffect(() => {
    if (session.status !== 'signed-in') {
      provisioningKeyRef.current = null
      return
    }

    if (state.phase !== 'connected' || !state.subscriptionsReady) {
      return
    }

    if (state.data.myProfile) {
      provisioningKeyRef.current = null
      return
    }

    const connection = connRef.current
    if (!connection) {
      return
    }
    const activeConnection = connection

    const username = buildStableSpacetimeUsername(session)
    const displayName = buildSpacetimeDisplayName(session)
    const provisionKey = [session.userId, username, displayName, state.identity ?? ''].join(':')

    if (provisioningKeyRef.current === provisionKey) {
      return
    }

    provisioningKeyRef.current = provisionKey
    let cancelled = false

    async function provisionProfile() {
      const reducers = activeConnection.reducers as Record<string, ((payload: unknown) => Promise<void>) | undefined>
      const registerUser = reducers.registerUser

      if (!registerUser) {
        return
      }

      try {
        try {
          await registerUser({ username, displayName })
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error)

          if (isRecoverableRegistrationError(message)) {
            const loginAsUser = reducers.loginAsUser

            if (!loginAsUser) {
              throw error
            }

            await loginAsUser({ username })

            if (!cancelled) {
              reconnect()
            }
            return
          }

          if (!message.includes('already registered')) {
            throw error
          }
        }

        if (!cancelled) {
          syncSnapshot()
          provisioningKeyRef.current = null
        }
      } catch (error) {
        if (!cancelled) {
          setState((s) => ({
            ...s,
            error: error instanceof Error ? error.message : String(error),
          }))
          provisioningKeyRef.current = null
        }
      }
    }

    void provisionProfile()

    return () => {
      cancelled = true
    }
  }, [reconnect, session, state.data.myProfile, state.identity, state.phase, state.subscriptionsReady, syncSnapshot])

  const value: SpacetimeContextValue = {
    ...state,
    reconnect,
    createGuild,
    createChannel,
    initiateDmCall,
    updateGuild,
    inviteMember,
    leaveGuild,
    deleteGuild,
    createDmChannel,
    sendDmMessage,
    markDmRead,
    selectGuildChannel,
    sendGuildMessage,
    acceptFriendRequest,
    declineFriendRequest,
    cancelFriendRequest,
    sendFriendRequest,
    removeFriend,
    updateProfile,
    setStatus,
    updateVoiceState,
  }

  return (
    <SpacetimeContext.Provider value={value}>
      {children}
    </SpacetimeContext.Provider>
  )
}

// ─── Consumer hook ────────────────────────────────────────────────────────────

/**
 * Access the SpacetimeDB connection state from any signed-in screen or
 * component.  Must be rendered inside <SpacetimeBootstrap>.
 */
export function useSpacetime(): SpacetimeContextValue {
  const ctx = useContext(SpacetimeContext)
  if (!ctx) {
    throw new Error('useSpacetime must be used inside <SpacetimeBootstrap>')
  }
  return ctx
}

function toIdKey(value: unknown): string {
  if (typeof value === 'bigint') {
    return value.toString()
  }

  return String(value)
}

function timestampToMillis(value: unknown): number {
  if (typeof value === 'object' && value !== null) {
    const withToDate = value as { toDate?: () => Date }
    const maybeDate = withToDate.toDate?.()
    if (maybeDate instanceof Date) {
      return maybeDate.getTime()
    }
  }

  const parsed = new Date(String(value)).getTime()
  return Number.isFinite(parsed) ? parsed : Date.now()
}
