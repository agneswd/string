import { useMemo, useCallback } from 'react'

import { toIdKey, identityToString, formatTimestamp, compareById, statusToLabel } from '../lib/helpers'
import { avatarBytesToUrl } from '../lib/avatarUtils'
import type { Channel, Guild, Message, Reaction, GuildMember, User } from '../module_bindings/types'

export type GuildMessageItem = {
  id: string
  rawMessageId: unknown
  authorId: string
  authorName: string
  content: string
  timestamp: string
  profileColor?: string
}

export type ReactionEntry = {
  emoji: string
  count: number
  isActive: boolean
}

export type MemberListItem = {
  id: string
  username: string
  displayName: string
  status: string
  isOwner: boolean
  profileColor?: string
}

type AppData = {
  messages: Message[]
  reactions: Reaction[]
  identityString: string
  usersByIdentity: Map<string, User>
  guildMembers: GuildMember[]
  extendedActions: {
    toggleReaction?: (params: { messageId: unknown; emoji: string }) => Promise<void>
  }
}

export function useGuildMessages(
  appData: AppData,
  selectedGuild: Guild | null,
  selectedTextChannel: Channel | null,
  channelIdsForSelectedGuild: Set<string>,
  runAction: (fn: () => Promise<void>, successStatus?: string) => Promise<void>,
  callActionOrReducer: <TParams extends Record<string, unknown>>(
    actionFn: ((params: TParams) => Promise<void>) | undefined,
    reducerName: string,
    params: TParams,
  ) => Promise<void>,
) {
  const { messages, reactions, identityString, usersByIdentity, guildMembers, extendedActions } = appData

  const messagesForSelectedTextChannel = useMemo(() => {
    if (!selectedGuild || !selectedTextChannel) {
      return [] as GuildMessageItem[]
    }

    const channelKey = toIdKey(selectedTextChannel.channelId)
    if (!channelIdsForSelectedGuild.has(channelKey)) {
      return []
    }

    const seenIds = new Set<string>()

    return messages
      .filter((message) => {
        const idKey = toIdKey(message.messageId)
        if (toIdKey(message.channelId) === channelKey && !message.isDeleted && !seenIds.has(idKey)) {
          seenIds.add(idKey)
          return true
        }
        return false
      })
      .slice()
      .sort((left, right) => compareById(left.messageId, right.messageId))
      .map((message) => {
        const authorId = identityToString(message.authorIdentity)
        const author = usersByIdentity.get(authorId)

        return {
          id: toIdKey(message.messageId),
          rawMessageId: message.messageId,
          authorId,
          authorName: author?.displayName ?? author?.username ?? authorId.slice(0, 12),
          content: message.content,
          timestamp: formatTimestamp(message.sentAt),
          profileColor: (author as any)?.profileColor ?? undefined,
        }
      })
  }, [channelIdsForSelectedGuild, selectedGuild, selectedTextChannel, messages, usersByIdentity])

  const guildMessageIdByUiId = useMemo(
    () => new Map(messagesForSelectedTextChannel.map((message) => [message.id, message.rawMessageId])),
    [messagesForSelectedTextChannel],
  )

  const reactionsForSelectedTextChannel = useMemo(() => {
    if (!selectedTextChannel) {
      return new Map<string, ReactionEntry[]>()
    }

    const channelKey = toIdKey(selectedTextChannel.channelId)
    if (!channelIdsForSelectedGuild.has(channelKey)) {
      return new Map<string, ReactionEntry[]>()
    }

    const grouped = new Map<string, Map<string, { count: number; isActive: boolean }>>()

    for (const reaction of reactions) {
      if (toIdKey(reaction.channelId) !== channelKey) {
        continue
      }

      const messageKey = toIdKey(reaction.messageId)
      const reactionEmoji = reaction.emoji
      const current = grouped.get(messageKey) ?? new Map<string, { count: number; isActive: boolean }>()
      const next = current.get(reactionEmoji) ?? { count: 0, isActive: false }
      const isMine = identityToString(reaction.reactorIdentity) === identityString

      current.set(reactionEmoji, {
        count: next.count + 1,
        isActive: next.isActive || isMine,
      })
      grouped.set(messageKey, current)
    }

    const result = new Map<string, ReactionEntry[]>()
    for (const [messageKey, perEmoji] of grouped) {
      const entries = Array.from(perEmoji.entries())
        .map(([emoji, value]) => ({ emoji, count: value.count, isActive: value.isActive }))
        .sort((left, right) => left.emoji.localeCompare(right.emoji))
      result.set(messageKey, entries)
    }

    return result
  }, [channelIdsForSelectedGuild, identityString, reactions, selectedTextChannel])

  const memberListItems = useMemo(() => {
    if (!selectedGuild) {
      return []
    }

    const guildKey = toIdKey(selectedGuild.guildId)
    return guildMembers
      .filter((member) => toIdKey(member.guildId) === guildKey)
      .map((member) => {
        const memberIdentity = identityToString(member.identity)
        const user = usersByIdentity.get(memberIdentity)
        const username = user?.username ?? memberIdentity.slice(0, 12)
        return {
          id: memberIdentity,
          username,
          displayName: user?.displayName ?? username,
          status: statusToLabel(user?.status),
          isOwner: selectedGuild ? identityToString(member.identity) === identityToString(selectedGuild.ownerIdentity) : false,
          avatarUrl: avatarBytesToUrl(user?.avatarBytes as Uint8Array | null | undefined),
          profileColor: (user as any)?.profileColor ?? undefined,
        }
      })
      .sort((left, right) => left.displayName.localeCompare(right.displayName))
  }, [selectedGuild, guildMembers, usersByIdentity])

  const onToggleReaction = useCallback(
    (messageId: string | number, emoji: string): void => {
      const messageKey = String(messageId)
      if (!guildMessageIdByUiId.has(messageKey)) {
        return
      }

      const rawMessageId = guildMessageIdByUiId.get(messageKey)
      if (rawMessageId === undefined) {
        return
      }

      void runAction(() =>
        callActionOrReducer(extendedActions.toggleReaction, 'toggleReaction', {
          messageId: rawMessageId,
          emoji,
        }),
      )
    },
    [guildMessageIdByUiId, runAction, callActionOrReducer, extendedActions.toggleReaction],
  )

  const getReactionsForMessage = useCallback(
    (messageId: string | number): ReactionEntry[] =>
      reactionsForSelectedTextChannel.get(String(messageId)) ?? [],
    [reactionsForSelectedTextChannel],
  )

  return {
    messagesForSelectedTextChannel,
    guildMessageIdByUiId,
    reactionsForSelectedTextChannel,
    memberListItems,
    onToggleReaction,
    getReactionsForMessage,
  }
}
