import { avatarBytesToUri } from '../../shared/lib/avatarUtils'
import { useCallback, useMemo } from 'react'

import { useSpacetime } from '../../core/spacetime'
import type { DmConversation } from './types'

interface UseDmListResult {
  conversations: DmConversation[]
  isLoading: boolean
  error: string | null
  /** Refresh the list manually (e.g. pull-to-refresh). */
  refresh: () => void
}

/**
 * useDmList
 *
 * Returns the current user's direct-message conversation list.
 *
 * ─ Assumptions ────────────────────────────────────────────────────────────
 *  • A real implementation subscribes to a SpacetimeDB table (e.g.
 *    `dm_conversation`) via the generated module bindings and updates
 *    `conversations` through `on_insert` / `on_update` / `on_delete`
 *    callbacks fed from the connection context.
 *  • This stub returns an empty array until wired up.
 *  • React Native-safe: no DOM APIs.
 * ──────────────────────────────────────────────────────────────────────────
 */
export function useDmList(): UseDmListResult {
  const { data, identity, subscriptionsReady, reconnect } = useSpacetime()

  const conversations = useMemo<DmConversation[]>(() => {
    if (!identity) {
      return []
    }

    const usersByIdentity = new Map(
      data.users.map((user) => [identityToString(user.identity), user]),
    )

    return data.dmChannels
      .flatMap<DmConversation>((channel) => {
        const channelId = toIdKey(channel.dmChannelId)
        const participants = data.dmParticipants.filter(
          (participant) => toIdKey(participant.dmChannelId) === channelId,
        )

        const selfParticipant = participants.find(
          (participant) => identityToString(participant.identity) === identity,
        )
        const peerParticipant = participants.find(
          (participant) => identityToString(participant.identity) !== identity,
        )

        if (!selfParticipant || !peerParticipant) {
          return []
        }

        const peerIdentity = identityToString(peerParticipant.identity)
        const peerUser = usersByIdentity.get(peerIdentity)
        const channelMessages = data.dmMessages
          .filter((message) => toIdKey(message.dmChannelId) === channelId && !message.isDeleted)
          .sort((left, right) => timestampToMillis(right.sentAt) - timestampToMillis(left.sentAt))

        const latestMessage = channelMessages[0] ?? null
        const lastReadId = selfParticipant.lastReadMessageId
        const unreadCount = channelMessages.filter((message) => isMessageUnread(message.dmMessageId, lastReadId)).length

        return [{
          id: `dm:${peerIdentity}`,
          peerId: peerIdentity,
          peerName: peerUser?.displayName ?? peerUser?.username ?? 'Unknown user',
          avatarUri: avatarBytesToUri(peerUser?.avatarBytes),
          profileColor: peerUser?.profileColor ?? null,
          lastMessageText: latestMessage?.content ?? null,
          lastActivityAt: latestMessage ? timestampToMillis(latestMessage.sentAt) : null,
          unreadCount,
        }]
      })
      .sort((left, right) => (right.lastActivityAt ?? 0) - (left.lastActivityAt ?? 0))
  }, [data.dmChannels, data.dmMessages, data.dmParticipants, data.users, identity])

  const refresh = useCallback(() => {
    reconnect()
  }, [reconnect])

  return {
    conversations,
    isLoading: !subscriptionsReady,
    error: null,
    refresh,
  }
}

function toIdKey(value: unknown): string {
  if (typeof value === 'bigint') {
    return value.toString()
  }

  return String(value)
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

function isMessageUnread(messageId: unknown, lastReadMessageId: unknown): boolean {
  if (lastReadMessageId === null || lastReadMessageId === undefined) {
    return true
  }

  const left = toBigInt(messageId)
  const right = toBigInt(lastReadMessageId)
  if (left !== null && right !== null) {
    return left > right
  }

  return String(messageId) !== String(lastReadMessageId)
}

function toBigInt(value: unknown): bigint | null {
  if (typeof value === 'bigint') {
    return value
  }

  if (typeof value === 'number' && Number.isInteger(value)) {
    return BigInt(value)
  }

  if (typeof value === 'string' && /^\d+$/.test(value)) {
    return BigInt(value)
  }

  return null
}
