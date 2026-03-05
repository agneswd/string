import type { Identity } from 'spacetimedb/sdk'

import type { DbConnection } from '../module_bindings'
import type {
  Channel,
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
  onInsert?: (cb: (...args: unknown[]) => void) => void
  onDelete?: (cb: (...args: unknown[]) => void) => void
  onUpdate?: (cb: (...args: unknown[]) => void) => void
  removeOnInsert?: (cb: (...args: unknown[]) => void) => void
  removeOnDelete?: (cb: (...args: unknown[]) => void) => void
  removeOnUpdate?: (cb: (...args: unknown[]) => void) => void
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
  'presence_change_event',
  'my_visible_users',
  'my_profile',
  'my_guilds',
  'my_guild_members',
  'my_channels',
  'my_messages',
  'my_reactions',
  'dm_reaction',
  'guild_invite',
  'my_friends',
  'my_friend_requests_incoming',
  'my_friend_requests_outgoing',
  'my_dm_channels',
  'my_dm_participants',
  'my_dm_messages',
  'my_rtc_signals',
  'my_voice_states',
  'dm_call_request',
] as const

const PREFERRED_VOICE_TABLE_KEYS = ['my_voice_states'] as const

export type StringState = {
  connectionStatus: ConnectionStatus
  identity: Identity | null
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
  error: string | null
}

export type StringStoreListener = (state: StringState) => void

class StringStore {
  private state: StringState = {
    connectionStatus: 'idle',
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
    error: null,
  }

  private listeners = new Set<StringStoreListener>()
  private connectionInitialized = false
  private subscriptionStarted = false
  private attachedTables: { table: TableLike; handler: () => void }[] = []
  private currentSubscription: unknown = null
  private realtimeAttached = false

  private syncScheduled = false
  private pendingMutatedTables = new Set<string>()

  private createTableMutationHandler(tableKey: string): () => void {
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
        this.updateState({ identity, connectionStatus: 'connected', error: null })
        this.attachRealtime(getConn())
        this.syncFromCache()
      },
      onDisconnect: () => {
        this.connectionInitialized = false
        this.subscriptionStarted = false
        this.currentSubscription = null
        this.detachRealtimeListeners()
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
        })
      },
      onConnectError: (err) => {
        this.connectionInitialized = false
        this.subscriptionStarted = false
        this.currentSubscription = null
        this.detachRealtimeListeners()
        this.updateState({
          connectionStatus: 'error',
          error: err.message,
        })
      },
    })

    this.trySyncFromExistingConnection()
  }

  disconnect(): void {
    this.connectionInitialized = false
    this.subscriptionStarted = false
    this.realtimeAttached = false
    this.syncScheduled = false
    this.pendingMutatedTables.clear()

    // Unsubscribe from the active subscription to release its emitter/callbacks
    if (this.currentSubscription) {
      try {
        const sub = this.currentSubscription as { isActive?: () => boolean; unsubscribe?: () => void }
        if (sub.isActive?.() && sub.unsubscribe) {
          sub.unsubscribe()
        }
      } catch { /* ignore — subscription may already be ended */ }
      this.currentSubscription = null
    }

    this.detachRealtimeListeners()

    try {
      disconnectConnection()
    } catch (e) {
      console.warn('Disconnect failed:', e)
    }

    this.updateState({ connectionStatus: 'disconnected', identity: null })
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

  private trySyncFromExistingConnection(): void {
    try {
      const conn = getConn()
      const identity = getMyIdentity()
      if (conn.isActive && identity) {
        this.updateState({ identity, connectionStatus: 'connected', error: null })
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

    if (!this.subscriptionStarted) {
      // Unsubscribe from any previous subscription to release its emitter/callbacks
      if (this.currentSubscription) {
        try {
          const sub = this.currentSubscription as { isActive?: () => boolean; unsubscribe?: () => void }
          if (sub.isActive?.() && sub.unsubscribe) {
            sub.unsubscribe()
          }
        } catch { /* ignore — subscription may already be ended */ }
        this.currentSubscription = null
      }

      this.currentSubscription = conn
        .subscriptionBuilder()
        .onApplied(() => {
          this.syncFromCache()
        })
        .onError(() => {
          this.updateState({ connectionStatus: 'error', error: 'Subscription error' })
        })
        .subscribeToAllTables()
      this.subscriptionStarted = true
    }

    const db = conn.db as unknown as Record<string, TableLike>
    const missingTableKeys: string[] = []

    for (const key of TABLE_KEYS) {
      const table = db[key]
      if (!table) {
        missingTableKeys.push(key)
        continue
      }

      const handler = this.createTableMutationHandler(key)
      table.onInsert?.(handler)
      table.onDelete?.(handler)
      table.onUpdate?.(handler)
      this.attachedTables.push({ table, handler })
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
      this.attachedTables.push({ table: preferredVoiceTable, handler })
    }

    this.realtimeAttached = true;
  }

  private detachRealtimeListeners(): void {
    for (const { table, handler } of this.attachedTables) {
      table.removeOnInsert?.(handler)
      table.removeOnDelete?.(handler)
      table.removeOnUpdate?.(handler)
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
    const presenceEventChanged = mutated.has('presence_change_event')

    const identity = getMyIdentity()
    const prev = this.state
    const next: Partial<StringState> = { identity }

    const usersChanged = syncAll || presenceEventChanged || mutated.has('my_visible_users')
    const profileChanged = syncAll || presenceEventChanged || mutated.has('my_profile')
    const friendsChanged = syncAll || presenceEventChanged || mutated.has('my_friends')

    const users = usersChanged ? this.readRows<User>(db, 'my_visible_users') : prev.users
    if (usersChanged) next.users = users

    if (profileChanged || usersChanged) {
      const profileRows = this.readRows<User>(db, 'my_profile')
      const identityKey = identity ? String(identity) : ''
      next.myProfile = profileRows[0] ?? (identityKey ? users.find((user) => String(user.identity) === identityKey) ?? null : null)
    }

    if (syncAll || mutated.has('my_guilds')) next.guilds = this.readRows<Guild>(db, 'my_guilds')
    if (syncAll || mutated.has('my_guild_members')) next.guildMembers = this.readRows<GuildMember>(db, 'my_guild_members')
    if (syncAll || mutated.has('my_channels')) next.channels = this.readRows<Channel>(db, 'my_channels')
    if (syncAll || mutated.has('my_messages')) next.messages = this.readRows<Message>(db, 'my_messages')
    if (syncAll || mutated.has('my_dm_channels')) next.dmChannels = this.readRows<DmChannel>(db, 'my_dm_channels')
    if (syncAll || mutated.has('my_dm_participants')) next.dmParticipants = this.readRows<DmParticipant>(db, 'my_dm_participants')
    if (syncAll || mutated.has('my_dm_messages')) next.dmMessages = this.readRows<DmMessage>(db, 'my_dm_messages')
    if (syncAll || mutated.has('my_reactions')) next.reactions = this.readRows<Reaction>(db, 'my_reactions')
    if (syncAll || mutated.has('dm_reaction')) next.dmReactions = this.readRows<DmReaction>(db, 'dm_reaction')
    if (syncAll || mutated.has('guild_invite')) next.guildInvites = this.readRows<GuildInvite>(db, 'guild_invite')
    if (friendsChanged) next.friends = this.readRows<User>(db, 'my_friends')
    if (syncAll || mutated.has('my_friend_requests_incoming')) next.incomingFriendRequests = this.readRows<FriendRequest>(db, 'my_friend_requests_incoming')
    if (syncAll || mutated.has('my_friend_requests_outgoing')) next.outgoingFriendRequests = this.readRows<FriendRequest>(db, 'my_friend_requests_outgoing')
    if (syncAll || mutated.has('my_voice_states')) next.voiceStates = this.readRows<VoiceState>(db, PREFERRED_VOICE_TABLE_KEYS[0])
    if (syncAll || mutated.has('my_rtc_signals')) next.myRtcSignals = this.readRows<RtcSignal>(db, 'my_rtc_signals')
    if (syncAll || mutated.has('dm_call_request')) next.dmCallRequests = this.readRows<DmCallRequest>(db, 'dm_call_request')

    this.updateState(next)
  }

  private readRows<T>(db: Record<string, TableLike>, tableKey: string): T[] {
    const table = db[tableKey]
    if (!table?.iter) {
      return []
    }

    return Array.from(table.iter() as IterableIterator<T>)
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
