import { useMemo } from 'react'

import { useStringActions, useStringStore } from '../lib/useStringStore'
import type { StringState } from '../lib/stringStore'
import { toIdKey } from '../lib/helpers'
import type { User, DmCallEvent, DmCallRequest, DmChannel, DmMessage, DmParticipant, DmReaction, GuildInvite, GuildMember, Reaction } from '../module_bindings/types'

// ---------------------------------------------------------------------------
// Helper – identity to hex string (mirrors App.tsx logic)
// ---------------------------------------------------------------------------
const identityToString = (value: unknown): string => {
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

// ---------------------------------------------------------------------------
// Extended-state / extended-actions overlay types (same as App.tsx)
// ---------------------------------------------------------------------------
import type { Identity } from 'spacetimedb/sdk'

type AppExtendedState = {
  dmChannels?: DmChannel[]
  dmParticipants?: DmParticipant[]
  dmMessages?: DmMessage[]
  reactions?: Reaction[]
  myFriends?: unknown[]
  friends?: unknown[]
  myFriendRequestsIncoming?: unknown[]
  incomingFriendRequests?: unknown[]
  myFriendRequestsOutgoing?: unknown[]
  outgoingFriendRequests?: unknown[]
}

type AppExtendedActions = {
  createDmChannel?: (params: { participants: Identity[]; title?: string }) => Promise<void>
  sendDmMessage?: (params: { dmChannelId: unknown; content: string; replyTo: unknown }) => Promise<void>
  toggleReaction?: (params: { messageId: unknown; emoji: string }) => Promise<void>
  toggleDmReaction?: (params: { dmMessageId: bigint; emoji: string }) => Promise<void>
  joinGuild?: (params: { guildName: string }) => Promise<void>
  sendFriendRequest?: (params: { targetUsername: string }) => Promise<void>
  acceptFriendRequest?: (params: { requestId: unknown }) => Promise<void>
  declineFriendRequest?: (params: { requestId: unknown }) => Promise<void>
  cancelFriendRequest?: (params: { requestId: unknown }) => Promise<void>
  removeFriend?: (params: { friendIdentity: Identity }) => Promise<void>
  acceptGuildInvite?: (params: { inviteId: unknown }) => Promise<void>
  declineGuildInvite?: (params: { inviteId: unknown }) => Promise<void>
  joinVoiceDm?: (params: { dmChannelId: bigint }) => Promise<void>
  sendDmRtcSignal?: (params: { dmChannelId: bigint; recipientIdentity: unknown; signalType: unknown; payload: string }) => Promise<void>
  initiateDmCall?: (params: { dmChannelId: bigint }) => Promise<void>
  acceptDmCall?: (params: { callId: bigint }) => Promise<void>
  declineDmCall?: (params: { callId: bigint }) => Promise<void>
}

// ---------------------------------------------------------------------------
// Return type
// ---------------------------------------------------------------------------
export interface AppData {
  state: StringState
  actions: ReturnType<typeof useStringActions>
  extendedState: StringState & AppExtendedState
  extendedActions: ReturnType<typeof useStringActions> & AppExtendedActions
  identityString: string
  usersByIdentity: Map<string, User>
  me: User | null
  dmChannels: DmChannel[]
  dmParticipants: DmParticipant[]
  dmMessages: DmMessage[]
  guildMembersByGuildId: Map<string, GuildMember[]>
  dmUnreadCountsByChannel: Map<string, number>
  dmMessageCountsByChannel: Map<string, number>
  dmLastMessageByChannel: Map<string, DmMessage>
  dmReactions: DmReaction[]
  reactions: Reaction[]
  guildInvites: GuildInvite[]
  dmCallRequests: DmCallRequest[]
  dmCallEvents: DmCallEvent[]
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function useAppData(): AppData {
  const state = useStringStore()
  const actions = useStringActions()

  const extendedState = state as StringState & AppExtendedState
  const extendedActions = actions as ReturnType<typeof useStringActions> & AppExtendedActions

  const dmChannels = useMemo(() => extendedState.dmChannels ?? [], [extendedState.dmChannels])
  const dmParticipants = useMemo(() => extendedState.dmParticipants ?? [], [extendedState.dmParticipants])
  const dmMessages = useMemo(() => extendedState.dmMessages ?? [], [extendedState.dmMessages])

  const guildMembersByGuildId = useMemo(() => {
    const grouped = new Map<string, GuildMember[]>()

    for (const member of state.guildMembers) {
      const guildKey = toIdKey(member.guildId)
      const current = grouped.get(guildKey)
      if (current) {
        current.push(member)
      } else {
        grouped.set(guildKey, [member])
      }
    }

    return grouped
  }, [state.guildMembers])

  const dmMessageCountsByChannel = useMemo(
    () => state.dmMessageCountsByChannel ?? new Map<string, number>(),
    [state.dmMessageCountsByChannel],
  )

  const dmUnreadCountsByChannel = useMemo(
    () => state.dmUnreadCountsByChannel ?? new Map<string, number>(),
    [state.dmUnreadCountsByChannel],
  )

  const dmLastMessageByChannel = useMemo(
    () => state.dmLastMessageByChannel ?? new Map<string, DmMessage>(),
    [state.dmLastMessageByChannel],
  )

  const dmReactions = useMemo(() => state.dmReactions ?? [], [state.dmReactions])
  const reactions = useMemo(() => extendedState.reactions ?? [], [extendedState.reactions])
  const guildInvites = useMemo(() => state.guildInvites ?? [], [state.guildInvites])
  const dmCallRequests = useMemo(() => state.dmCallRequests ?? [], [state.dmCallRequests])
  const dmCallEvents = useMemo(() => state.dmCallEvents ?? [], [state.dmCallEvents])

  const identityString = useMemo(() => identityToString(state.identity), [state.identity])

  const usersByIdentity = useMemo(
    () => new Map(state.users.map((user) => [identityToString(user.identity), user])),
    [state.users],
  )

  const me = useMemo(
    () => state.myProfile ?? usersByIdentity.get(identityString) ?? null,
    [identityString, state.myProfile, usersByIdentity],
  )

  return useMemo(() => ({
    state,
    actions,
    extendedState,
    extendedActions,
    identityString,
    usersByIdentity,
    me,
    dmChannels,
    dmParticipants,
    dmMessages,
    guildMembersByGuildId,
    dmUnreadCountsByChannel,
    dmMessageCountsByChannel,
    dmLastMessageByChannel,
    dmReactions,
    reactions,
    guildInvites,
    dmCallRequests,
    dmCallEvents,
  }), [state, actions, extendedState, extendedActions, identityString, usersByIdentity, me, dmChannels, dmParticipants, dmMessages, guildMembersByGuildId, dmUnreadCountsByChannel, dmMessageCountsByChannel, dmLastMessageByChannel, dmReactions, reactions, guildInvites, dmCallRequests, dmCallEvents])
}

export { identityToString }
export type { AppExtendedState, AppExtendedActions }
