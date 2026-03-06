import type { Identity } from 'spacetimedb/sdk'

import type { DbConnection, SubscriptionHandle } from '../module_bindings'
import type {
  Channel,
  DmCallEvent,
  DmCallRequest,
  DmChannel,
  DmMessage,
  DmParticipant,
  DmReaction,
  Guild,
  GuildInvite,
  GuildMember,
  Message,
  Reaction,
  RtcSignal,
  User,
  UserPresence,
  Friend,
  VoiceState,
} from '../module_bindings/types'
import type {
  AcceptDmCallParams,
  AcceptGuildInviteParams,
  AckRtcSignalParams,
  AddReactionParams,
  CreateChannelParams,
  CreateDmChannelParams,
  CreateGuildParams,
  DeclineDmCallParams,
  DeclineGuildInviteParams,
  DeleteDmMessageParams,
  DeleteMessageParams,
  EditDmMessageParams,
  EditMessageParams,
  InitiateDmCallParams,
  JoinGuildParams,
  JoinVoiceChannelParams,
  JoinVoiceDmParams,
  LeaveDmChannelParams,
  LeaveVoiceChannelParams,
  RemoveReactionParams,
  RegisterUserParams,
  SendDmMessageParams,
  SendDmRtcSignalParams,
  SendMessageParams,
  SendRtcSignalParams,
  SetStatusParams,
  ToggleDmReactionParams,
  ToggleReactionParams,
  UpdateProfileParams,
  UpdateVoiceStateParams,
} from '../module_bindings/types/reducers'
import { clearToken, disconnectConnection, getConn, getMyIdentity, initConnection } from './connection'

type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error'

type TableLike = {
  iter?: () => IterableIterator<unknown>
  onInsert?: (cb: TableMutationHandler) => void
  onDelete?: (cb: TableMutationHandler) => void
  onUpdate?: (cb: TableMutationHandler) => void
  removeOnInsert?: (cb: TableMutationHandler) => void
  removeOnDelete?: (cb: TableMutationHandler) => void
  removeOnUpdate?: (cb: TableMutationHandler) => void
}

type TableMutationHandler = (...args: unknown[]) => void

type HotTableKey = 'message' | 'my_reactions' | 'my_dm_messages' | 'dm_reaction'

const HOT_TABLE_KEYS = new Set<HotTableKey>(['message', 'my_reactions', 'my_dm_messages', 'dm_reaction'])

type AttachedTableHandlers = {
  table: TableLike
  insertHandler?: TableMutationHandler
  deleteHandler?: TableMutationHandler
  updateHandler?: TableMutationHandler
}

type ReducerFn<TParams> = (params: TParams) => Promise<void>

type FriendRequest = Record<string, unknown>

type SendFriendRequestParams = {
  targetUsername: string
}

type FriendRequestActionParams = {
  requestId: number | bigint
}

type RemoveFriendParams = {
  friendIdentity: Identity
}

type PreferredReducerName =
  | 'createDmChannel'
  | 'leaveDmChannel'
  | 'sendDmMessage'
  | 'editDmMessage'
  | 'deleteDmMessage'
  | 'addReaction'
  | 'removeReaction'
  | 'toggleReaction'
  | 'toggleDmReaction'

const TABLE_KEYS = [
  'my_visible_users',
  'my_visible_user_presence',
  'my_friend_edges',
  'my_profile',
  'my_guilds',
  'my_guild_members',
  'my_channels',
  'message',
  'my_reactions',
  'dm_reaction',
  'guild_invite',
  'my_friend_requests_incoming',
  'my_friend_requests_outgoing',
  'my_dm_channels',
  'my_dm_participants',
  'my_dm_messages',
  'my_dm_call_events',
  'my_rtc_signals',
  'my_voice_states',
  'dm_call_request',
] as const

const PREFERRED_VOICE_TABLE_KEYS = ['my_voice_states'] as const

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
  'SELECT * FROM my_dm_call_events',
  'SELECT * FROM my_rtc_signals',
  'SELECT * FROM my_voice_states',
  'SELECT * FROM dm_call_request',
] as const

export type StringState = {
  connectionStatus: ConnectionStatus
  identity: Identity | null
  dmMessagesHydrated: boolean
  users: User[]
  myProfile: User | null
  guilds: Guild[]
  guildMembers: GuildMember[]
  channels: Channel[]
  messages: Message[]
  dmChannels: DmChannel[]
  dmParticipants: DmParticipant[]
  dmMessages: DmMessage[]
  reactions: Reaction[]
  dmReactions: DmReaction[]
  guildInvites: GuildInvite[]
  friends: User[]
  incomingFriendRequests: FriendRequest[]
  outgoingFriendRequests: FriendRequest[]
  voiceStates: VoiceState[]
  myRtcSignals: RtcSignal[]
  dmCallRequests: DmCallRequest[]
  dmCallEvents: DmCallEvent[]
  dmUnreadCountsByChannel: Map<string, number>
  dmMessageCountsByChannel: Map<string, number>
  dmLastMessageByChannel: Map<string, DmMessage>
  guildMessagesVersion: number
  guildReactionsVersion: number
  dmMessagesVersion: number
  dmReactionsVersion: number
  error: string | null
}

export type StringStoreListener = (state: StringState) => void

class StringStore {
  private state: StringState = {
    connectionStatus: 'idle',
    identity: null,
    dmMessagesHydrated: false,
    users: [],
    myProfile: null,
    guilds: [],
    guildMembers: [],
    channels: [],
    messages: [],
    dmChannels: [],
    dmParticipants: [],
    dmMessages: [],
    reactions: [],
    dmReactions: [],
    guildInvites: [],
    friends: [],
    incomingFriendRequests: [],
    outgoingFriendRequests: [],
    voiceStates: [],
    myRtcSignals: [],
    dmCallRequests: [],
    dmCallEvents: [],
    dmUnreadCountsByChannel: new Map(),
    dmMessageCountsByChannel: new Map(),
    dmLastMessageByChannel: new Map(),
    guildMessagesVersion: 0,
    guildReactionsVersion: 0,
    dmMessagesVersion: 0,
    dmReactionsVersion: 0,
    error: null,
  }

  private listeners = new Set<StringStoreListener>()
  private connectionInitialized = false
  private attachedTables: AttachedTableHandlers[] = []
  private coreSubscription: SubscriptionHandle | null = null
  private activeGuildChannelSubscription: SubscriptionHandle | null = null
  private activeDmChannelSubscription: SubscriptionHandle | null = null
  private selectedTextChannelId: string | null = null
  private selectedDmChannelId: string | null = null
  private realtimeAttached = false

  private syncScheduled = false
  private pendingMutatedTables = new Set<string>()

  private messagesById = new Map<string, Message>()
  private messageOrderByChannel = new Map<string, string[]>()
  private reactionsByMessage = new Map<string, Map<string, Reaction>>()

  private dmMessagesById = new Map<string, DmMessage>()
  private dmMessageOrderByChannel = new Map<string, string[]>()
  private dmReactionsByMessage = new Map<string, Map<string, DmReaction>>()
  private dmMessagesHydrated = false
  private dmHydrationStartedAtMs: number | null = null
  private preHydrationIncomingDmMessages = new Map<string, DmMessage>()

  private createTableMutationHandler(tableKey: string): TableMutationHandler {
    return () => {
      this.pendingMutatedTables.add(tableKey)
      if (!this.syncScheduled) {
        this.syncScheduled = true
        queueMicrotask(() => {
          this.syncScheduled = false
          this.syncFromCache()
        })
      }
    }
  }

  getState(): StringState {
    return this.state
  }

  subscribe(listener: StringStoreListener): () => void {
    this.listeners.add(listener)
    listener(this.state)
    return () => {
      this.listeners.delete(listener)
    }
  }

  connect(): void {
    if (this.connectionInitialized) {
      this.trySyncFromExistingConnection()
      return
    }

    this.connectionInitialized = true
    this.updateState({ connectionStatus: 'connecting', error: null })

    initConnection({
      onConnect: (identity) => {
        this.beginDmHydrationReplayWindow()
        this.updateState({ identity, connectionStatus: 'connected', dmMessagesHydrated: false, error: null })
        this.attachRealtime(getConn())
        this.syncFromCache()
      },
      onDisconnect: () => {
        this.connectionInitialized = false
        this.resetDmHydrationReplayState()
        this.unsubscribeAllSubscriptionHandles()
        this.detachRealtimeListeners()
        this.clearHotIndexes()
        this.updateState({
          connectionStatus: 'disconnected',
          identity: null,
          users: [],
          myProfile: null,
          guilds: [],
          guildMembers: [],
          channels: [],
          messages: [],
          dmChannels: [],
          dmParticipants: [],
          dmMessages: [],
          reactions: [],
          dmReactions: [],
          guildInvites: [],
          friends: [],
          incomingFriendRequests: [],
          outgoingFriendRequests: [],
          voiceStates: [],
          myRtcSignals: [],
          dmCallRequests: [],
          dmCallEvents: [],
          dmMessagesHydrated: false,
          dmUnreadCountsByChannel: new Map(),
          dmMessageCountsByChannel: new Map(),
          dmLastMessageByChannel: new Map(),
          guildMessagesVersion: this.state.guildMessagesVersion + 1,
          guildReactionsVersion: this.state.guildReactionsVersion + 1,
          dmMessagesVersion: this.state.dmMessagesVersion + 1,
          dmReactionsVersion: this.state.dmReactionsVersion + 1,
        })
      },
      onConnectError: (err) => {
        this.connectionInitialized = false
        this.resetDmHydrationReplayState()
        this.unsubscribeAllSubscriptionHandles()
        this.detachRealtimeListeners()
        this.clearHotIndexes()
        this.updateState({
          connectionStatus: 'error',
          dmMessagesHydrated: false,
          error: err.message,
        })
      },
    })

    this.trySyncFromExistingConnection()
  }

  disconnect(): void {
    this.connectionInitialized = false
    this.realtimeAttached = false
    this.syncScheduled = false
    this.pendingMutatedTables.clear()
    this.resetDmHydrationReplayState()
    this.clearHotIndexes()
    this.unsubscribeAllSubscriptionHandles()

    this.detachRealtimeListeners()

    try {
      disconnectConnection()
    } catch (e) {
      console.warn('Disconnect failed:', e)
    }

    this.updateState({ connectionStatus: 'disconnected', identity: null, dmMessagesHydrated: false })
  }

  /**
   * Hard disconnect: tears down the connection AND clears all store subscribers.
   * Use for permanent teardown (page unload, HMR dispose) — NOT for bfcache hide/show.
   */
  dispose(): void {
    this.disconnect()
    this.listeners.clear()
  }

  clearAuthAndDisconnect(): void {
    clearToken()
    this.disconnect()
  }

  registerUser(params: RegisterUserParams): Promise<void> {
    return this.callReducer('registerUser', params)
  }

  createGuild(params: CreateGuildParams): Promise<void> {
    return this.callReducer('createGuild', params)
  }

  joinGuild(params: JoinGuildParams): Promise<void> {
    return this.callReducer('joinGuild', params)
  }

  createChannel(params: CreateChannelParams): Promise<void> {
    return this.callReducer('createChannel', params)
  }

  sendMessage(params: SendMessageParams): Promise<void> {
    return this.callReducer('sendMessage', params)
  }

  deleteMessage(params: DeleteMessageParams): Promise<void> {
    return this.callReducer('deleteMessage', params)
  }

  editMessage(params: EditMessageParams): Promise<void> {
    return this.callReducer('editMessage', params)
  }

  createDmChannel(params: CreateDmChannelParams): Promise<void> {
    return this.callPreferredReducer('createDmChannel', params)
  }

  leaveDmChannel(params: LeaveDmChannelParams): Promise<void> {
    return this.callPreferredReducer('leaveDmChannel', params)
  }

  sendDmMessage(params: SendDmMessageParams): Promise<void> {
    return this.callPreferredReducer('sendDmMessage', params)
  }

  editDmMessage(params: EditDmMessageParams): Promise<void> {
    return this.callPreferredReducer('editDmMessage', params)
  }

  deleteDmMessage(params: DeleteDmMessageParams): Promise<void> {
    return this.callPreferredReducer('deleteDmMessage', params)
  }

  addReaction(params: AddReactionParams): Promise<void> {
    return this.callPreferredReducer('addReaction', params)
  }

  removeReaction(params: RemoveReactionParams): Promise<void> {
    return this.callPreferredReducer('removeReaction', params)
  }

  toggleReaction(params: ToggleReactionParams): Promise<void> {
    return this.callPreferredReducer('toggleReaction', params)
  }

  toggleDmReaction(params: ToggleDmReactionParams): Promise<void> {
    return this.callPreferredReducer('toggleDmReaction', params)
  }

  acceptGuildInvite(params: AcceptGuildInviteParams): Promise<void> {
    return this.callReducer('acceptGuildInvite', params)
  }

  declineGuildInvite(params: DeclineGuildInviteParams): Promise<void> {
    return this.callReducer('declineGuildInvite', params)
  }

  sendFriendRequest(params: SendFriendRequestParams): Promise<void> {
    return this.callReducer('sendFriendRequest', params)
  }

  acceptFriendRequest(params: FriendRequestActionParams): Promise<void> {
    return this.callReducer('acceptFriendRequest', params)
  }

  declineFriendRequest(params: FriendRequestActionParams): Promise<void> {
    return this.callReducer('declineFriendRequest', params)
  }

  cancelFriendRequest(params: FriendRequestActionParams): Promise<void> {
    return this.callReducer('cancelFriendRequest', params)
  }

  removeFriend(params: RemoveFriendParams): Promise<void> {
    return this.callReducer('removeFriend', params)
  }

  joinVoice(params: JoinVoiceChannelParams): Promise<void> {
    return this.callReducer('joinVoiceChannel', params)
  }

  joinVoiceDm(params: JoinVoiceDmParams): Promise<void> {
    return this.callReducer('joinVoiceDm', params)
  }

  leaveVoice(): Promise<void> {
    return this.callReducer('leaveVoiceChannel', {} as LeaveVoiceChannelParams)
  }

  updateVoiceState(params: UpdateVoiceStateParams): Promise<void> {
    return this.callReducer('updateVoiceState', params)
  }

  sendRtcSignal(params: SendRtcSignalParams): Promise<void> {
    return this.callReducer('sendRtcSignal', params)
  }

  sendDmRtcSignal(params: SendDmRtcSignalParams): Promise<void> {
    return this.callReducer('sendDmRtcSignal', params)
  }

  ackRtcSignal(params: AckRtcSignalParams): Promise<void> {
    return this.callReducer('ackRtcSignal', params)
  }

  updateProfile(params: UpdateProfileParams): Promise<void> {
    return this.callReducer('updateProfile', params)
  }

  setStatus(params: SetStatusParams): Promise<void> {
    return this.callReducer('setStatus', params)
  }

  initiateDmCall(params: InitiateDmCallParams): Promise<void> {
    return this.callReducer('initiateDmCall', params)
  }

  acceptDmCall(params: AcceptDmCallParams): Promise<void> {
    return this.callReducer('acceptDmCall', params)
  }

  declineDmCall(params: DeclineDmCallParams): Promise<void> {
    return this.callReducer('declineDmCall', params)
  }

  setActiveSubscriptions(selectedTextChannelId?: string, selectedDmChannelId?: string): void {
    const nextTextChannelId = this.normalizeSubscriptionId(selectedTextChannelId)
    const nextDmChannelId = this.normalizeSubscriptionId(selectedDmChannelId)

    const shouldSwapGuild =
      nextTextChannelId !== this.selectedTextChannelId
      || (!!nextTextChannelId && this.activeGuildChannelSubscription === null)

    const shouldSwapDm =
      nextDmChannelId !== this.selectedDmChannelId
      || (!!nextDmChannelId && this.activeDmChannelSubscription === null)

    this.selectedTextChannelId = nextTextChannelId
    this.selectedDmChannelId = nextDmChannelId

    if (nextDmChannelId) {
      this.clearDmUnreadForChannel(nextDmChannelId)
    }

    if (shouldSwapGuild) {
      this.swapGuildChannelSubscription(nextTextChannelId)
    }

    if (shouldSwapDm) {
      this.swapDmChannelSubscription(nextDmChannelId)
    }
  }

  private trySyncFromExistingConnection(): void {
    try {
      const conn = getConn()
      const identity = getMyIdentity()
      if (conn.isActive && identity) {
        if (!this.realtimeAttached) {
          this.beginDmHydrationReplayWindow()
        }
        this.updateState({ identity, connectionStatus: 'connected', dmMessagesHydrated: false, error: null })
        this.attachRealtime(conn)
        this.syncFromCache()
      }
    } catch {
      // No initialized connection yet.
    }
  }

  private attachRealtime(conn: DbConnection): void {
    // Always detach old handlers before reattaching to prevent duplicates on reconnect
    this.detachRealtimeListeners()

    if (!this.coreSubscription || this.coreSubscription.isEnded()) {
      this.coreSubscription = conn
        .subscriptionBuilder()
        .onApplied(() => {
          this.syncFromCache()
        })
        .onError(() => {
          this.updateState({ connectionStatus: 'error', error: 'Subscription error' })
        })
        .subscribe(CORE_SUBSCRIPTION_QUERIES as string[])
    }

    this.setActiveSubscriptions(this.selectedTextChannelId ?? undefined, this.selectedDmChannelId ?? undefined)

    const db = conn.db as unknown as Record<string, TableLike>
    const missingTableKeys: string[] = []

    for (const key of TABLE_KEYS) {
      const table = db[key]
      if (!table) {
        missingTableKeys.push(key)
        continue
      }

      if (this.isHotTableKey(key)) {
        const insertHandler = this.createHotInsertHandler(key)
        const deleteHandler = this.createHotDeleteHandler(key)
        const updateHandler = this.createHotUpdateHandler(key)
        table.onInsert?.(insertHandler)
        table.onDelete?.(deleteHandler)
        table.onUpdate?.(updateHandler)
        this.attachedTables.push({ table, insertHandler, deleteHandler, updateHandler })
        continue
      }

      const handler = this.createTableMutationHandler(key)
      table.onInsert?.(handler)
      table.onDelete?.(handler)
      table.onUpdate?.(handler)
      this.attachedTables.push({ table, insertHandler: handler, deleteHandler: handler, updateHandler: handler })
    }

    if (missingTableKeys.length > 0) {
      console.warn('[stringStore] Missing expected table accessors on conn.db:', missingTableKeys)
    }

    const preferredVoiceTable = db.my_voice_states
    if (preferredVoiceTable && !this.attachedTables.some(({ table }) => table === preferredVoiceTable)) {
      const handler = this.createTableMutationHandler('my_voice_states')
      preferredVoiceTable.onInsert?.(handler)
      preferredVoiceTable.onDelete?.(handler)
      preferredVoiceTable.onUpdate?.(handler)
      this.attachedTables.push({ table: preferredVoiceTable, insertHandler: handler, deleteHandler: handler, updateHandler: handler })
    }

    this.realtimeAttached = true;
  }

  private unsubscribeHandle(handle: SubscriptionHandle | null): null {
    if (!handle) {
      return null
    }

    try {
      if (!handle.isEnded()) {
        handle.unsubscribe()
      }
    } catch {
      // ignore — subscription may already be ended
    }

    return null
  }

  private unsubscribeAllSubscriptionHandles(): void {
    this.coreSubscription = this.unsubscribeHandle(this.coreSubscription)
    this.activeGuildChannelSubscription = this.unsubscribeHandle(this.activeGuildChannelSubscription)
    this.activeDmChannelSubscription = this.unsubscribeHandle(this.activeDmChannelSubscription)
  }

  private normalizeSubscriptionId(id?: string): string | null {
    if (!id) {
      return null
    }

    const trimmed = id.trim()
    return trimmed.length > 0 ? trimmed : null
  }

  private toU64Literal(id: string): string | null {
    return /^\d+$/.test(id) ? id : null
  }

  private clearGuildChannelState(): void {
    this.pendingMutatedTables.delete('message')
    this.pendingMutatedTables.delete('my_reactions')
    this.messagesById.clear()
    this.messageOrderByChannel.clear()
    this.reactionsByMessage.clear()
    this.updateState({
      messages: [],
      reactions: [],
      guildMessagesVersion: this.state.guildMessagesVersion + 1,
      guildReactionsVersion: this.state.guildReactionsVersion + 1,
    })
  }

  private clearDmChannelState(): void {
    this.pendingMutatedTables.delete('my_dm_messages')
    this.pendingMutatedTables.delete('dm_reaction')
    this.dmReactionsByMessage.clear()
    this.updateState({
      dmMessages: this.getSelectedDmMessages(),
      dmReactions: [],
      dmUnreadCountsByChannel: this.getPrunedDmUnreadCountsByChannel(),
      dmMessageCountsByChannel: this.getDmMessageCountsByChannel(),
      dmLastMessageByChannel: this.getDmLastMessageByChannel(),
      dmMessagesVersion: this.state.dmMessagesVersion + 1,
      dmReactionsVersion: this.state.dmReactionsVersion + 1,
    })
  }

  private swapGuildChannelSubscription(selectedTextChannelId: string | null): void {
    this.activeGuildChannelSubscription = this.unsubscribeHandle(this.activeGuildChannelSubscription)
    this.clearGuildChannelState()

    if (!selectedTextChannelId) {
      return
    }

    const channelIdLiteral = this.toU64Literal(selectedTextChannelId)
    if (!channelIdLiteral) {
      return
    }

    let conn: DbConnection
    try {
      conn = getConn()
    } catch {
      return
    }

    this.activeGuildChannelSubscription = conn
      .subscriptionBuilder()
      .onApplied(() => {
        this.syncFromCache()
      })
      .onError(() => {
        this.updateState({ connectionStatus: 'error', error: 'Guild channel subscription error' })
      })
      .subscribe([
        `SELECT * FROM message WHERE channel_id = ${channelIdLiteral}`,
        `SELECT * FROM my_reactions WHERE channel_id = ${channelIdLiteral}`,
      ])
  }

  private swapDmChannelSubscription(selectedDmChannelId: string | null): void {
    this.activeDmChannelSubscription = this.unsubscribeHandle(this.activeDmChannelSubscription)
    this.clearDmChannelState()

    if (!selectedDmChannelId) {
      return
    }

    const dmChannelIdLiteral = this.toU64Literal(selectedDmChannelId)
    if (!dmChannelIdLiteral) {
      return
    }

    let conn: DbConnection
    try {
      conn = getConn()
    } catch {
      return
    }

    this.activeDmChannelSubscription = conn
      .subscriptionBuilder()
      .onApplied(() => {
        this.syncFromCache()
      })
      .onError(() => {
        this.updateState({ connectionStatus: 'error', error: 'DM channel subscription error' })
      })
      .subscribe([
        `SELECT * FROM dm_reaction WHERE dm_channel_id = ${dmChannelIdLiteral}`,
      ])
  }

  private detachRealtimeListeners(): void {
    for (const { table, insertHandler, deleteHandler, updateHandler } of this.attachedTables) {
      if (insertHandler) table.removeOnInsert?.(insertHandler)
      if (deleteHandler) table.removeOnDelete?.(deleteHandler)
      if (updateHandler) table.removeOnUpdate?.(updateHandler)
    }
    this.attachedTables = []
    this.realtimeAttached = false
  }

  private syncFromCache(): void {
    let conn: DbConnection
    try {
      conn = getConn()
    } catch {
      return
    }

    const db = conn.db as unknown as Record<string, TableLike>

    const mutated = this.pendingMutatedTables
    this.pendingMutatedTables = new Set()

    // When called directly (initial load, onApplied, reconnect) there are no pending
    // mutations — sync every table.
    const syncAll = mutated.size === 0

    const identity = getMyIdentity()
    const prev = this.state
    const next: Partial<StringState> = { identity }

    const presenceMutated = mutated.has('my_visible_user_presence')
    const userMutated = mutated.has('my_visible_users') || mutated.has('my_profile') || mutated.has('my_friend_edges')
    const usersChanged = syncAll || presenceMutated || userMutated || mutated.has('my_guild_members')
    const profileChanged = syncAll || presenceMutated || mutated.has('my_profile')
    const friendsChanged = syncAll || presenceMutated || userMutated

    let updatedUsers = prev.users
    let myFriends: User[] = []

    if (usersChanged) {
      const presenceMap = new Map<string, UserPresence>()
      const presences = syncAll || presenceMutated ? this.readRows<UserPresence>(db, 'my_visible_user_presence') : []
      for (const p of presences) {
        presenceMap.set(String(p.identity), p)
      }

      // Compute visible identities
      const visibleIdentities = new Set<string>()

      const profileRows = this.readRows<User>(db, 'my_profile')
      if (profileRows.length > 0) {
        visibleIdentities.add(String(profileRows[0].identity))
      }

      const edges = this.readRows<Friend>(db, 'my_friend_edges')
      const friendIdentities = new Set<string>()
      for (const edge of edges) {
        const low = String(edge.identityLow)
        const high = String(edge.identityHigh)
        friendIdentities.add(low)
        friendIdentities.add(high)
        visibleIdentities.add(low)
        visibleIdentities.add(high)
      }
      if (identity) {
        friendIdentities.delete(String(identity))
        visibleIdentities.add(String(identity))
      }

      const guildMembers = this.readRows<GuildMember>(db, 'my_guild_members')
      for (const gm of guildMembers) {
        visibleIdentities.add(String(gm.identity))
      }

      const rawUsers = this.readRows<User>(db, 'my_visible_users')

      updatedUsers = rawUsers
        .filter(u => visibleIdentities.has(String(u.identity)))
        .map(u => {
          const presence = presenceMap.get(String(u.identity))
          return presence ? { ...u, status: presence.status } : u
        })

      next.users = updatedUsers
      myFriends = updatedUsers.filter(u => friendIdentities.has(String(u.identity)))
    }

    if (profileChanged || usersChanged) {
      const profileRows = this.readRows<User>(db, 'my_profile')
      const identityKey = identity ? String(identity) : ''
      next.myProfile = profileRows[0] ?? (identityKey ? updatedUsers.find((user) => String(user.identity) === identityKey) ?? null : null)
    }

    if (syncAll || mutated.has('my_guilds')) next.guilds = this.readRows<Guild>(db, 'my_guilds')
    if (syncAll || mutated.has('my_guild_members')) next.guildMembers = this.readRows<GuildMember>(db, 'my_guild_members')
    if (syncAll || mutated.has('my_channels')) next.channels = this.readRows<Channel>(db, 'my_channels')

    const shouldSyncGuildMessages = syncAll || mutated.has('message')
    const shouldSyncGuildReactions = syncAll || mutated.has('my_reactions')
    if (shouldSyncGuildMessages || shouldSyncGuildReactions) {
      const messages = this.readRows<Message>(db, 'message')
      const reactions = this.readRows<Reaction>(db, 'my_reactions')
      this.rebuildGuildHotIndexes(messages, reactions)
      next.messages = this.getSelectedGuildMessages()
      next.reactions = this.getSelectedGuildReactions(next.messages)
      if (shouldSyncGuildMessages) next.guildMessagesVersion = prev.guildMessagesVersion + 1
      if (shouldSyncGuildReactions) next.guildReactionsVersion = prev.guildReactionsVersion + 1
    }

    if (syncAll || mutated.has('my_dm_channels')) next.dmChannels = this.readRows<DmChannel>(db, 'my_dm_channels')
    const shouldSyncDmParticipants = syncAll || mutated.has('my_dm_participants')
    if (shouldSyncDmParticipants) next.dmParticipants = this.readRows<DmParticipant>(db, 'my_dm_participants')

    const shouldSyncDmMessages = syncAll || mutated.has('my_dm_messages')
    const shouldSyncDmReactions = syncAll || mutated.has('dm_reaction')
    if (shouldSyncDmMessages || shouldSyncDmReactions) {
      const dmMessages = this.readRows<DmMessage>(db, 'my_dm_messages')
      const dmReactions = this.readRows<DmReaction>(db, 'dm_reaction')
      this.rebuildDmHotIndexes(dmMessages, dmReactions)
      next.dmMessages = this.getSelectedDmMessages()
      next.dmReactions = this.getSelectedDmReactions(next.dmMessages)
      const dmParticipantsForUnread = next.dmParticipants ?? prev.dmParticipants
      const nextUnreadCounts = this.getPrunedDmUnreadCountsByChannel(dmParticipantsForUnread)
      if (shouldSyncDmMessages && !this.dmMessagesHydrated) {
        next.dmUnreadCountsByChannel = this.reconcilePreHydrationDmUnread(nextUnreadCounts, dmParticipantsForUnread)
        this.dmMessagesHydrated = true
        this.dmHydrationStartedAtMs = null
        this.preHydrationIncomingDmMessages.clear()
        next.dmMessagesHydrated = true
      } else {
        next.dmUnreadCountsByChannel = nextUnreadCounts
      }
      next.dmMessageCountsByChannel = this.getDmMessageCountsByChannel()
      next.dmLastMessageByChannel = this.getDmLastMessageByChannel()
      if (shouldSyncDmMessages) next.dmMessagesVersion = prev.dmMessagesVersion + 1
      if (shouldSyncDmReactions) next.dmReactionsVersion = prev.dmReactionsVersion + 1
    } else if (shouldSyncDmParticipants) {
      next.dmUnreadCountsByChannel = this.getPrunedDmUnreadCountsByChannel(next.dmParticipants ?? prev.dmParticipants)
    }

    if (syncAll || mutated.has('guild_invite')) next.guildInvites = this.readRows<GuildInvite>(db, 'guild_invite')
    if (friendsChanged) next.friends = myFriends
    if (syncAll || mutated.has('my_friend_requests_incoming')) next.incomingFriendRequests = this.readRows<FriendRequest>(db, 'my_friend_requests_incoming')
    if (syncAll || mutated.has('my_friend_requests_outgoing')) next.outgoingFriendRequests = this.readRows<FriendRequest>(db, 'my_friend_requests_outgoing')
    if (syncAll || mutated.has('my_voice_states')) next.voiceStates = this.readRows<VoiceState>(db, PREFERRED_VOICE_TABLE_KEYS[0])
    if (syncAll || mutated.has('my_rtc_signals')) next.myRtcSignals = this.readRows<RtcSignal>(db, 'my_rtc_signals')
    if (syncAll || mutated.has('dm_call_request')) next.dmCallRequests = this.readRows<DmCallRequest>(db, 'dm_call_request')
    if (syncAll || mutated.has('my_dm_call_events')) next.dmCallEvents = this.readRows<DmCallEvent>(db, 'my_dm_call_events')

    this.updateState(next)
  }

  private readRows<T>(db: Record<string, TableLike>, tableKey: string): T[] {
    const table = db[tableKey]
    if (!table?.iter) {
      return []
    }

    return Array.from(table.iter() as IterableIterator<T>)
  }

  private isHotTableKey(key: string): key is HotTableKey {
    return HOT_TABLE_KEYS.has(key as HotTableKey)
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null
  }

  private isMessageRow(value: unknown): value is Message {
    if (!this.isRecord(value)) return false
    return 'messageId' in value && 'channelId' in value
  }

  private isReactionRow(value: unknown): value is Reaction {
    if (!this.isRecord(value)) return false
    return 'reactionId' in value && 'messageId' in value && 'channelId' in value
  }

  private isDmMessageRow(value: unknown): value is DmMessage {
    if (!this.isRecord(value)) return false
    return 'dmMessageId' in value && 'dmChannelId' in value
  }

  private isDmReactionRow(value: unknown): value is DmReaction {
    if (!this.isRecord(value)) return false
    return 'dmReactionId' in value && 'dmMessageId' in value && 'dmChannelId' in value
  }

  private findLastMatchingArg<T>(args: unknown[], guard: (value: unknown) => value is T): T | null {
    for (let index = args.length - 1; index >= 0; index -= 1) {
      if (guard(args[index])) {
        return args[index]
      }
    }
    return null
  }

  private getUpdateRows<T>(args: unknown[], guard: (value: unknown) => value is T): { oldRow: T | null; newRow: T | null } {
    const matchingRows = args.filter(guard)
    if (matchingRows.length === 0) {
      return { oldRow: null, newRow: null }
    }
    if (matchingRows.length === 1) {
      return { oldRow: null, newRow: matchingRows[0] }
    }
    return {
      oldRow: matchingRows[matchingRows.length - 2],
      newRow: matchingRows[matchingRows.length - 1],
    }
  }

  private createHotInsertHandler(tableKey: HotTableKey): TableMutationHandler {
    return (...args: unknown[]) => {
      switch (tableKey) {
        case 'message': {
          const row = this.findLastMatchingArg(args, this.isMessageRow.bind(this))
          if (!row) {
            this.syncFromCache()
            return
          }
          this.applyGuildMessageInsert(row)
          return
        }
        case 'my_reactions': {
          const row = this.findLastMatchingArg(args, this.isReactionRow.bind(this))
          if (!row) {
            this.syncFromCache()
            return
          }
          this.applyGuildReactionInsert(row)
          return
        }
        case 'my_dm_messages': {
          const row = this.findLastMatchingArg(args, this.isDmMessageRow.bind(this))
          if (!row) {
            this.syncFromCache()
            return
          }
          this.applyDmMessageInsert(row)
          return
        }
        case 'dm_reaction': {
          const row = this.findLastMatchingArg(args, this.isDmReactionRow.bind(this))
          if (!row) {
            this.syncFromCache()
            return
          }
          this.applyDmReactionInsert(row)
          return
        }
      }
    }
  }

  private createHotDeleteHandler(tableKey: HotTableKey): TableMutationHandler {
    return (...args: unknown[]) => {
      switch (tableKey) {
        case 'message': {
          const row = this.findLastMatchingArg(args, this.isMessageRow.bind(this))
          if (!row) {
            this.syncFromCache()
            return
          }
          this.applyGuildMessageDelete(row)
          return
        }
        case 'my_reactions': {
          const row = this.findLastMatchingArg(args, this.isReactionRow.bind(this))
          if (!row) {
            this.syncFromCache()
            return
          }
          this.applyGuildReactionDelete(row)
          return
        }
        case 'my_dm_messages': {
          const row = this.findLastMatchingArg(args, this.isDmMessageRow.bind(this))
          if (!row) {
            this.syncFromCache()
            return
          }
          this.applyDmMessageDelete(row)
          return
        }
        case 'dm_reaction': {
          const row = this.findLastMatchingArg(args, this.isDmReactionRow.bind(this))
          if (!row) {
            this.syncFromCache()
            return
          }
          this.applyDmReactionDelete(row)
          return
        }
      }
    }
  }

  private createHotUpdateHandler(tableKey: HotTableKey): TableMutationHandler {
    return (...args: unknown[]) => {
      switch (tableKey) {
        case 'message': {
          const { oldRow, newRow } = this.getUpdateRows(args, this.isMessageRow.bind(this))
          if (!newRow) {
            this.syncFromCache()
            return
          }
          this.applyGuildMessageUpdate(oldRow, newRow)
          return
        }
        case 'my_reactions': {
          const { oldRow, newRow } = this.getUpdateRows(args, this.isReactionRow.bind(this))
          if (!newRow) {
            this.syncFromCache()
            return
          }
          this.applyGuildReactionUpdate(oldRow, newRow)
          return
        }
        case 'my_dm_messages': {
          const { oldRow, newRow } = this.getUpdateRows(args, this.isDmMessageRow.bind(this))
          if (!newRow) {
            this.syncFromCache()
            return
          }
          this.applyDmMessageUpdate(oldRow, newRow)
          return
        }
        case 'dm_reaction': {
          const { oldRow, newRow } = this.getUpdateRows(args, this.isDmReactionRow.bind(this))
          if (!newRow) {
            this.syncFromCache()
            return
          }
          this.applyDmReactionUpdate(oldRow, newRow)
          return
        }
      }
    }
  }

  private clearHotIndexes(): void {
    this.messagesById.clear()
    this.messageOrderByChannel.clear()
    this.reactionsByMessage.clear()
    this.dmMessagesById.clear()
    this.dmMessageOrderByChannel.clear()
    this.dmReactionsByMessage.clear()
  }

  private beginDmHydrationReplayWindow(): void {
    this.dmMessagesHydrated = false
    this.dmHydrationStartedAtMs = Date.now()
    this.preHydrationIncomingDmMessages.clear()
  }

  private resetDmHydrationReplayState(): void {
    this.dmMessagesHydrated = false
    this.dmHydrationStartedAtMs = null
    this.preHydrationIncomingDmMessages.clear()
  }

  private resolveCurrentIdentityKey(): string | null {
    if (this.state.identity) {
      return String(this.state.identity)
    }

    try {
      const identity = getMyIdentity()
      return identity ? String(identity) : null
    } catch {
      return null
    }
  }

  private getMyDmLastReadByChannel(dmParticipants: DmParticipant[] = this.state.dmParticipants): Map<string, bigint | null> {
    const identity = this.resolveCurrentIdentityKey()
    if (!identity) {
      return new Map()
    }

    const lastReadByChannel = new Map<string, bigint | null>()
    for (const participant of dmParticipants) {
      if (String(participant.identity) !== identity) {
        continue
      }

      const channelKey = String(participant.dmChannelId)
      lastReadByChannel.set(channelKey, this.toSortableBigInt(participant.lastReadMessageId))
    }

    return lastReadByChannel
  }

  private reconcilePreHydrationDmUnread(
    baseUnreadCounts: Map<string, number>,
    dmParticipants: DmParticipant[] = this.state.dmParticipants,
  ): Map<string, number> {
    if (this.preHydrationIncomingDmMessages.size === 0) {
      return baseUnreadCounts
    }

    const nextUnreadCounts = new Map(baseUnreadCounts)
    const hydrationStartedAtMs = this.dmHydrationStartedAtMs
    const lastReadByChannel = this.getMyDmLastReadByChannel(dmParticipants)

    for (const row of this.preHydrationIncomingDmMessages.values()) {
      const messageId = String(row.dmMessageId)
      if (this.dmMessagesById.has(messageId)) {
        continue
      }

      const channelKey = String(row.dmChannelId)
      if (this.selectedDmChannelId && channelKey === this.selectedDmChannelId) {
        continue
      }
      if (!this.dmMessageOrderByChannel.has(channelKey)) {
        continue
      }

      if (hydrationStartedAtMs !== null) {
        const sentAtMs = this.toTimestampMillis(row.sentAt)
        if (sentAtMs === null || sentAtMs < hydrationStartedAtMs) {
          continue
        }
      }

      const lastRead = lastReadByChannel.get(channelKey)
      if (lastRead !== undefined && lastRead !== null) {
        const rowMessageId = this.toSortableBigInt(row.dmMessageId)
        if (rowMessageId !== null && rowMessageId <= lastRead) {
          continue
        }
      }

      nextUnreadCounts.set(channelKey, (nextUnreadCounts.get(channelKey) ?? 0) + 1)
    }

    return nextUnreadCounts
  }

  private rebuildGuildHotIndexes(messages: Message[], reactions: Reaction[]): void {
    this.messagesById.clear()
    this.messageOrderByChannel.clear()
    this.reactionsByMessage.clear()

    for (const message of messages) {
      const messageId = String(message.messageId)
      const channelKey = String(message.channelId)
      this.messagesById.set(messageId, message)
      const order = this.messageOrderByChannel.get(channelKey)
      if (order) {
        order.push(messageId)
      } else {
        this.messageOrderByChannel.set(channelKey, [messageId])
      }
    }

    for (const reaction of reactions) {
      const messageKey = String(reaction.messageId)
      const reactionId = String(reaction.reactionId)
      const bucket = this.reactionsByMessage.get(messageKey)
      if (bucket) {
        bucket.set(reactionId, reaction)
      } else {
        this.reactionsByMessage.set(messageKey, new Map([[reactionId, reaction]]))
      }
    }
  }

  private rebuildDmHotIndexes(dmMessages: DmMessage[], dmReactions: DmReaction[]): void {
    this.dmMessagesById.clear()
    this.dmMessageOrderByChannel.clear()
    this.dmReactionsByMessage.clear()

    for (const message of dmMessages) {
      const dmMessageId = String(message.dmMessageId)
      const channelKey = String(message.dmChannelId)
      this.dmMessagesById.set(dmMessageId, message)
      const order = this.dmMessageOrderByChannel.get(channelKey)
      if (order) {
        order.push(dmMessageId)
      } else {
        this.dmMessageOrderByChannel.set(channelKey, [dmMessageId])
      }
    }

    for (const reaction of dmReactions) {
      const messageKey = String(reaction.dmMessageId)
      const reactionId = String(reaction.dmReactionId)
      const bucket = this.dmReactionsByMessage.get(messageKey)
      if (bucket) {
        bucket.set(reactionId, reaction)
      } else {
        this.dmReactionsByMessage.set(messageKey, new Map([[reactionId, reaction]]))
      }
    }
  }

  private getSelectedGuildMessages(): Message[] {
    if (!this.selectedTextChannelId) {
      return []
    }
    const order = this.messageOrderByChannel.get(this.selectedTextChannelId) ?? []
    const rows: Message[] = []
    for (const messageId of order) {
      const message = this.messagesById.get(messageId)
      if (message) {
        rows.push(message)
      }
    }
    return rows
  }

  private getSelectedGuildReactions(selectedMessages: Message[]): Reaction[] {
    if (!this.selectedTextChannelId) {
      return []
    }

    const selectedMessageIds = new Set(selectedMessages.map((message) => String(message.messageId)))
    const selectedReactions: Reaction[] = []
    const seenReactionIds = new Set<string>()

    for (const messageId of selectedMessageIds) {
      const reactions = this.reactionsByMessage.get(messageId)
      if (!reactions) {
        continue
      }
      for (const reaction of reactions.values()) {
        const reactionId = String(reaction.reactionId)
        if (seenReactionIds.has(reactionId)) {
          continue
        }
        seenReactionIds.add(reactionId)
        selectedReactions.push(reaction)
      }
    }

    for (const reactions of this.reactionsByMessage.values()) {
      for (const reaction of reactions.values()) {
        if (String(reaction.channelId) !== this.selectedTextChannelId) {
          continue
        }
        const reactionId = String(reaction.reactionId)
        if (seenReactionIds.has(reactionId)) {
          continue
        }
        seenReactionIds.add(reactionId)
        selectedReactions.push(reaction)
      }
    }

    return selectedReactions
  }

  private getSelectedDmMessages(): DmMessage[] {
    if (!this.selectedDmChannelId) {
      return []
    }
    const order = this.dmMessageOrderByChannel.get(this.selectedDmChannelId) ?? []
    const rows: DmMessage[] = []
    for (const messageId of order) {
      const message = this.dmMessagesById.get(messageId)
      if (message) {
        rows.push(message)
      }
    }
    return rows
  }

  private getDmMessageCountsByChannel(): Map<string, number> {
    const counts = new Map<string, number>()
    for (const [channelId, order] of this.dmMessageOrderByChannel.entries()) {
      counts.set(channelId, order.length)
    }
    return counts
  }

  private getPrunedDmUnreadCountsByChannel(dmParticipants: DmParticipant[] = this.state.dmParticipants): Map<string, number> {
    const nextUnreadCounts = new Map<string, number>()
    const myIdentity = this.resolveCurrentIdentityKey()
    if (!myIdentity) {
      return nextUnreadCounts
    }

    const lastReadByChannel = this.getMyDmLastReadByChannel(dmParticipants)

    for (const [channelId, order] of this.dmMessageOrderByChannel.entries()) {
      if (this.selectedDmChannelId && channelId === this.selectedDmChannelId) {
        continue
      }

      const lastRead = lastReadByChannel.get(channelId)
      let unreadCount = 0

      for (const messageId of order) {
        const message = this.dmMessagesById.get(messageId)
        if (!message || String(message.authorIdentity) === myIdentity) {
          continue
        }

        if (lastRead !== undefined && lastRead !== null) {
          const dmMessageId = this.toSortableBigInt(message.dmMessageId)
          if (dmMessageId !== null && dmMessageId <= lastRead) {
            continue
          }
        }

        unreadCount += 1
      }

      if (unreadCount > 0) {
        nextUnreadCounts.set(channelId, unreadCount)
      }
    }

    return nextUnreadCounts
  }

  private clearDmUnreadForChannel(channelId: string): void {
    if (!this.state.dmUnreadCountsByChannel.has(channelId)) {
      return
    }

    const nextUnreadCounts = this.dmMessagesHydrated
      ? this.getPrunedDmUnreadCountsByChannel()
      : this.state.dmUnreadCountsByChannel
    nextUnreadCounts.delete(channelId)
    this.updateState({ dmUnreadCountsByChannel: nextUnreadCounts })
  }

  private toSortableBigInt(value: unknown): bigint | null {
    try {
      return BigInt(String(value))
    } catch {
      return null
    }
  }

  private toTimestampMillis(value: unknown): number | null {
    if (this.isRecord(value)) {
      const withToDate = value as { toDate?: () => Date }
      const maybeDate = withToDate.toDate?.()
      if (maybeDate instanceof Date) {
        const maybeMillis = maybeDate.getTime()
        if (Number.isFinite(maybeMillis)) {
          return maybeMillis
        }
      }
    }

    const maybeMillis = new Date(String(value)).getTime()
    return Number.isFinite(maybeMillis) ? maybeMillis : null
  }

  private getDmLastMessageByChannel(): Map<string, DmMessage> {
    const latestByChannel = new Map<string, DmMessage>()

    for (const message of this.dmMessagesById.values()) {
      const channelId = String(message.dmChannelId)
      const current = latestByChannel.get(channelId)
      if (!current) {
        latestByChannel.set(channelId, message)
        continue
      }

      const messageId = this.toSortableBigInt(message.dmMessageId)
      const currentId = this.toSortableBigInt(current.dmMessageId)
      if (messageId !== null && currentId !== null) {
        if (messageId > currentId) {
          latestByChannel.set(channelId, message)
        }
        continue
      }

      const messageSentAt = this.toTimestampMillis(message.sentAt)
      const currentSentAt = this.toTimestampMillis(current.sentAt)
      if (messageSentAt !== null && currentSentAt !== null) {
        if (messageSentAt > currentSentAt) {
          latestByChannel.set(channelId, message)
        }
        continue
      }

      if (String(message.dmMessageId) > String(current.dmMessageId)) {
        latestByChannel.set(channelId, message)
      }
    }

    return latestByChannel
  }

  private getSelectedDmReactions(selectedMessages: DmMessage[]): DmReaction[] {
    if (!this.selectedDmChannelId) {
      return []
    }

    const selectedMessageIds = new Set(selectedMessages.map((message) => String(message.dmMessageId)))
    const selectedReactions: DmReaction[] = []
    const seenReactionIds = new Set<string>()

    for (const messageId of selectedMessageIds) {
      const reactions = this.dmReactionsByMessage.get(messageId)
      if (!reactions) {
        continue
      }
      for (const reaction of reactions.values()) {
        const reactionId = String(reaction.dmReactionId)
        if (seenReactionIds.has(reactionId)) {
          continue
        }
        seenReactionIds.add(reactionId)
        selectedReactions.push(reaction)
      }
    }

    for (const reactions of this.dmReactionsByMessage.values()) {
      for (const reaction of reactions.values()) {
        if (String(reaction.dmChannelId) !== this.selectedDmChannelId) {
          continue
        }
        const reactionId = String(reaction.dmReactionId)
        if (seenReactionIds.has(reactionId)) {
          continue
        }
        seenReactionIds.add(reactionId)
        selectedReactions.push(reaction)
      }
    }

    return selectedReactions
  }

  private removeMessageFromChannelOrder(channelKey: string, messageId: string): void {
    const order = this.messageOrderByChannel.get(channelKey)
    if (!order) {
      return
    }

    const nextOrder = order.filter((id) => id !== messageId)
    if (nextOrder.length > 0) {
      this.messageOrderByChannel.set(channelKey, nextOrder)
    } else {
      this.messageOrderByChannel.delete(channelKey)
    }
  }

  private removeDmMessageFromChannelOrder(channelKey: string, messageId: string): void {
    const order = this.dmMessageOrderByChannel.get(channelKey)
    if (!order) {
      return
    }

    const nextOrder = order.filter((id) => id !== messageId)
    if (nextOrder.length > 0) {
      this.dmMessageOrderByChannel.set(channelKey, nextOrder)
    } else {
      this.dmMessageOrderByChannel.delete(channelKey)
    }
  }

  private applyGuildMessageInsert(row: Message): void {
    const messageId = String(row.messageId)
    const channelKey = String(row.channelId)

    this.messagesById.set(messageId, row)
    const order = this.messageOrderByChannel.get(channelKey)
    if (order) {
      if (!order.includes(messageId)) {
        order.push(messageId)
      }
    } else {
      this.messageOrderByChannel.set(channelKey, [messageId])
    }

    this.updateState({
      messages: this.getSelectedGuildMessages(),
      reactions: this.getSelectedGuildReactions(this.getSelectedGuildMessages()),
      guildMessagesVersion: this.state.guildMessagesVersion + 1,
    })
  }

  private applyGuildMessageUpdate(oldRow: Message | null, newRow: Message): void {
    const newMessageId = String(newRow.messageId)
    const existing = this.messagesById.get(newMessageId)
    const previous = existing ?? oldRow

    if (previous) {
      const previousChannelKey = String(previous.channelId)
      const newChannelKey = String(newRow.channelId)
      if (previousChannelKey !== newChannelKey) {
        this.removeMessageFromChannelOrder(previousChannelKey, newMessageId)
      }
    }

    this.messagesById.set(newMessageId, newRow)
    const channelKey = String(newRow.channelId)
    const order = this.messageOrderByChannel.get(channelKey)
    if (order) {
      if (!order.includes(newMessageId)) {
        order.push(newMessageId)
      }
    } else {
      this.messageOrderByChannel.set(channelKey, [newMessageId])
    }

    this.updateState({
      messages: this.getSelectedGuildMessages(),
      reactions: this.getSelectedGuildReactions(this.getSelectedGuildMessages()),
      guildMessagesVersion: this.state.guildMessagesVersion + 1,
    })
  }

  private applyGuildMessageDelete(row: Message): void {
    const messageId = String(row.messageId)
    const existing = this.messagesById.get(messageId) ?? row
    const channelKey = String(existing.channelId)

    this.messagesById.delete(messageId)
    this.removeMessageFromChannelOrder(channelKey, messageId)

    const removedReactions = this.reactionsByMessage.delete(messageId)
    const selectedMessages = this.getSelectedGuildMessages()
    const nextState: Partial<StringState> = {
      messages: selectedMessages,
      reactions: this.getSelectedGuildReactions(selectedMessages),
      guildMessagesVersion: this.state.guildMessagesVersion + 1,
    }
    if (removedReactions) {
      nextState.guildReactionsVersion = this.state.guildReactionsVersion + 1
    }
    this.updateState(nextState)
  }

  private findGuildReactionLocation(reactionId: string): { messageId: string; bucket: Map<string, Reaction> } | null {
    for (const [messageId, bucket] of this.reactionsByMessage.entries()) {
      if (bucket.has(reactionId)) {
        return { messageId, bucket }
      }
    }
    return null
  }

  private applyGuildReactionInsert(row: Reaction): void {
    const messageId = String(row.messageId)
    const reactionId = String(row.reactionId)
    const bucket = this.reactionsByMessage.get(messageId)
    if (bucket) {
      bucket.set(reactionId, row)
    } else {
      this.reactionsByMessage.set(messageId, new Map([[reactionId, row]]))
    }

    const selectedMessages = this.getSelectedGuildMessages()
    this.updateState({
      reactions: this.getSelectedGuildReactions(selectedMessages),
      guildReactionsVersion: this.state.guildReactionsVersion + 1,
    })
  }

  private applyGuildReactionUpdate(oldRow: Reaction | null, newRow: Reaction): void {
    const reactionId = String(newRow.reactionId)
    const current = this.findGuildReactionLocation(reactionId)
    const previousMessageId = oldRow ? String(oldRow.messageId) : current?.messageId
    const nextMessageId = String(newRow.messageId)

    if (previousMessageId && previousMessageId !== nextMessageId) {
      const previousBucket = this.reactionsByMessage.get(previousMessageId)
      previousBucket?.delete(reactionId)
      if (previousBucket && previousBucket.size === 0) {
        this.reactionsByMessage.delete(previousMessageId)
      }
    }

    const nextBucket = this.reactionsByMessage.get(nextMessageId)
    if (nextBucket) {
      nextBucket.set(reactionId, newRow)
    } else {
      this.reactionsByMessage.set(nextMessageId, new Map([[reactionId, newRow]]))
    }

    const selectedMessages = this.getSelectedGuildMessages()
    this.updateState({
      reactions: this.getSelectedGuildReactions(selectedMessages),
      guildReactionsVersion: this.state.guildReactionsVersion + 1,
    })
  }

  private applyGuildReactionDelete(row: Reaction): void {
    const reactionId = String(row.reactionId)
    const messageId = String(row.messageId)

    let bucket = this.reactionsByMessage.get(messageId)
    if (!bucket || !bucket.has(reactionId)) {
      const location = this.findGuildReactionLocation(reactionId)
      if (location) {
        bucket = location.bucket
      }
    }

    if (bucket) {
      bucket.delete(reactionId)
      if (bucket.size === 0) {
        const emptyKey = [...this.reactionsByMessage.entries()].find(([, maybeBucket]) => maybeBucket === bucket)?.[0]
        if (emptyKey) {
          this.reactionsByMessage.delete(emptyKey)
        }
      }
    }

    const selectedMessages = this.getSelectedGuildMessages()
    this.updateState({
      reactions: this.getSelectedGuildReactions(selectedMessages),
      guildReactionsVersion: this.state.guildReactionsVersion + 1,
    })
  }

  private applyDmMessageInsert(row: DmMessage): void {
    const messageId = String(row.dmMessageId)
    const channelKey = String(row.dmChannelId)

    this.dmMessagesById.set(messageId, row)
    const order = this.dmMessageOrderByChannel.get(channelKey)
    if (order) {
      if (!order.includes(messageId)) {
        order.push(messageId)
      }
    } else {
      this.dmMessageOrderByChannel.set(channelKey, [messageId])
    }

    const nextUnreadCounts = new Map(this.state.dmUnreadCountsByChannel)
    const myIdentity = this.resolveCurrentIdentityKey()
    const authorIdentity = String(row.authorIdentity)
    const isIncoming = myIdentity !== null && authorIdentity !== myIdentity
    const isSelectedChannel = this.selectedDmChannelId !== null && channelKey === this.selectedDmChannelId

    if (isIncoming && !isSelectedChannel && !this.dmMessagesHydrated) {
      this.preHydrationIncomingDmMessages.set(messageId, row)
    }

    this.updateState({
      dmMessages: this.getSelectedDmMessages(),
      dmReactions: this.getSelectedDmReactions(this.getSelectedDmMessages()),
      dmUnreadCountsByChannel: nextUnreadCounts,
      dmMessageCountsByChannel: this.getDmMessageCountsByChannel(),
      dmLastMessageByChannel: this.getDmLastMessageByChannel(),
      dmMessagesVersion: this.state.dmMessagesVersion + 1,
    })
  }

  private applyDmMessageUpdate(oldRow: DmMessage | null, newRow: DmMessage): void {
    const newMessageId = String(newRow.dmMessageId)
    const existing = this.dmMessagesById.get(newMessageId)
    const previous = existing ?? oldRow

    if (previous) {
      const previousChannelKey = String(previous.dmChannelId)
      const newChannelKey = String(newRow.dmChannelId)
      if (previousChannelKey !== newChannelKey) {
        this.removeDmMessageFromChannelOrder(previousChannelKey, newMessageId)
      }
    }

    this.dmMessagesById.set(newMessageId, newRow)
    const channelKey = String(newRow.dmChannelId)
    const order = this.dmMessageOrderByChannel.get(channelKey)
    if (order) {
      if (!order.includes(newMessageId)) {
        order.push(newMessageId)
      }
    } else {
      this.dmMessageOrderByChannel.set(channelKey, [newMessageId])
    }

    this.updateState({
      dmMessages: this.getSelectedDmMessages(),
      dmReactions: this.getSelectedDmReactions(this.getSelectedDmMessages()),
      dmUnreadCountsByChannel: this.getPrunedDmUnreadCountsByChannel(),
      dmMessageCountsByChannel: this.getDmMessageCountsByChannel(),
      dmLastMessageByChannel: this.getDmLastMessageByChannel(),
      dmMessagesVersion: this.state.dmMessagesVersion + 1,
    })
  }

  private applyDmMessageDelete(row: DmMessage): void {
    const messageId = String(row.dmMessageId)
    const existing = this.dmMessagesById.get(messageId) ?? row
    const channelKey = String(existing.dmChannelId)

    this.dmMessagesById.delete(messageId)
    this.removeDmMessageFromChannelOrder(channelKey, messageId)

    const removedReactions = this.dmReactionsByMessage.delete(messageId)
    const selectedMessages = this.getSelectedDmMessages()
    const nextState: Partial<StringState> = {
      dmMessages: selectedMessages,
      dmReactions: this.getSelectedDmReactions(selectedMessages),
      dmUnreadCountsByChannel: this.getPrunedDmUnreadCountsByChannel(),
      dmMessageCountsByChannel: this.getDmMessageCountsByChannel(),
      dmLastMessageByChannel: this.getDmLastMessageByChannel(),
      dmMessagesVersion: this.state.dmMessagesVersion + 1,
    }
    if (removedReactions) {
      nextState.dmReactionsVersion = this.state.dmReactionsVersion + 1
    }
    this.updateState(nextState)
  }

  private findDmReactionLocation(reactionId: string): { messageId: string; bucket: Map<string, DmReaction> } | null {
    for (const [messageId, bucket] of this.dmReactionsByMessage.entries()) {
      if (bucket.has(reactionId)) {
        return { messageId, bucket }
      }
    }
    return null
  }

  private applyDmReactionInsert(row: DmReaction): void {
    const messageId = String(row.dmMessageId)
    const reactionId = String(row.dmReactionId)
    const bucket = this.dmReactionsByMessage.get(messageId)
    if (bucket) {
      bucket.set(reactionId, row)
    } else {
      this.dmReactionsByMessage.set(messageId, new Map([[reactionId, row]]))
    }

    const selectedMessages = this.getSelectedDmMessages()
    this.updateState({
      dmReactions: this.getSelectedDmReactions(selectedMessages),
      dmReactionsVersion: this.state.dmReactionsVersion + 1,
    })
  }

  private applyDmReactionUpdate(oldRow: DmReaction | null, newRow: DmReaction): void {
    const reactionId = String(newRow.dmReactionId)
    const current = this.findDmReactionLocation(reactionId)
    const previousMessageId = oldRow ? String(oldRow.dmMessageId) : current?.messageId
    const nextMessageId = String(newRow.dmMessageId)

    if (previousMessageId && previousMessageId !== nextMessageId) {
      const previousBucket = this.dmReactionsByMessage.get(previousMessageId)
      previousBucket?.delete(reactionId)
      if (previousBucket && previousBucket.size === 0) {
        this.dmReactionsByMessage.delete(previousMessageId)
      }
    }

    const nextBucket = this.dmReactionsByMessage.get(nextMessageId)
    if (nextBucket) {
      nextBucket.set(reactionId, newRow)
    } else {
      this.dmReactionsByMessage.set(nextMessageId, new Map([[reactionId, newRow]]))
    }

    const selectedMessages = this.getSelectedDmMessages()
    this.updateState({
      dmReactions: this.getSelectedDmReactions(selectedMessages),
      dmReactionsVersion: this.state.dmReactionsVersion + 1,
    })
  }

  private applyDmReactionDelete(row: DmReaction): void {
    const reactionId = String(row.dmReactionId)
    const messageId = String(row.dmMessageId)

    let bucket = this.dmReactionsByMessage.get(messageId)
    if (!bucket || !bucket.has(reactionId)) {
      const location = this.findDmReactionLocation(reactionId)
      if (location) {
        bucket = location.bucket
      }
    }

    if (bucket) {
      bucket.delete(reactionId)
      if (bucket.size === 0) {
        const emptyKey = [...this.dmReactionsByMessage.entries()].find(([, maybeBucket]) => maybeBucket === bucket)?.[0]
        if (emptyKey) {
          this.dmReactionsByMessage.delete(emptyKey)
        }
      }
    }

    const selectedMessages = this.getSelectedDmMessages()
    this.updateState({
      dmReactions: this.getSelectedDmReactions(selectedMessages),
      dmReactionsVersion: this.state.dmReactionsVersion + 1,
    })
  }

  private async callReducer<TParams>(name: string, params: TParams): Promise<void> {
    const conn = getConn()
    const reducer = (conn.reducers as Record<string, ReducerFn<TParams>>)[name]

    if (!reducer) {
      throw new Error(`Reducer not available: ${name}`)
    }

    await reducer(params)
  }

  private async callPreferredReducer<TParams>(name: PreferredReducerName, params: TParams): Promise<void> {
    const reducers = getConn().reducers as
      & Partial<Record<PreferredReducerName, ReducerFn<TParams>>>
      & Record<string, ReducerFn<TParams> | undefined>

    const reducer = reducers[name]
    if (reducer) {
      await reducer(params)
      return
    }

    await this.callReducer(name, params)
  }

  private updateState(next: Partial<StringState>): void {
    this.state = { ...this.state, ...next }
    for (const listener of this.listeners) {
      listener(this.state)
    }
  }
}

export const stringStore = new StringStore()
