import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import type { Identity } from 'spacetimedb/sdk'

import type { AppData } from './useAppData'
import type { ActionFeedback } from './useActionFeedback'
import type { DmCallEvent, DmChannel, DmMessage } from '../module_bindings/types'
import { toIdKey, identityToString, formatTimestamp, compareById, toSortableBigInt } from '../lib/helpers'

interface ReactionEntry {
  emoji: string
  count: number
  isActive: boolean
}

interface UseDmChatParams {
  appData: AppData
  friendIdentityById: Map<string, Identity>
  runAction: ActionFeedback['runAction']
  callActionOrReducer: ActionFeedback['callActionOrReducer']
  setActionError: ActionFeedback['setActionError']
  setActionStatus: ActionFeedback['setActionStatus']
}

const formatDuration = (durationSeconds: number): string => {
  const totalSeconds = Math.max(0, Math.floor(durationSeconds))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  const parts: string[] = []
  if (hours > 0) {
    parts.push(`${hours} hour${hours === 1 ? '' : 's'}`)
  }
  if (minutes > 0) {
    parts.push(`${minutes} minute${minutes === 1 ? '' : 's'}`)
  }
  if (parts.length === 0 || (hours === 0 && minutes === 0 && seconds > 0)) {
    parts.push(`${seconds} second${seconds === 1 ? '' : 's'}`)
  }

  if (parts.length === 1) {
    return parts[0]
  }

  const tail = parts.pop()
  return `${parts.join(', ')} and ${tail}`
}

const timestampToMillis = (value: unknown): number => {
  if (typeof value === 'object' && value !== null) {
    const withToDate = value as { toDate?: () => Date }
    const maybeDate = withToDate.toDate?.()
    if (maybeDate instanceof Date) {
      return maybeDate.getTime()
    }
  }
  return new Date(String(value)).getTime()
}

const isDmMessageNewer = (left: DmMessage, right: DmMessage): boolean => {
  const leftId = toSortableBigInt(left.dmMessageId)
  const rightId = toSortableBigInt(right.dmMessageId)
  if (leftId !== null && rightId !== null && leftId !== rightId) {
    return leftId > rightId
  }
  return timestampToMillis(left.sentAt) > timestampToMillis(right.sentAt)
}

const compareTimelineItems = (left: { sortTime: number; sortId: bigint | null }, right: { sortTime: number; sortId: bigint | null }): number => {
  if (left.sortTime !== right.sortTime) {
    return left.sortTime - right.sortTime
  }

  if (left.sortId !== null && right.sortId !== null && left.sortId !== right.sortId) {
    return left.sortId < right.sortId ? -1 : 1
  }

  return 0
}

export function useDmChat({
  appData,
  friendIdentityById,
  runAction,
  callActionOrReducer,
  setActionError,
  setActionStatus,
}: UseDmChatParams) {
  const {
    dmChannels,
    dmParticipants,
    dmMessages,
    dmReactions,
    dmCallEvents,
    dmUnreadCountsByChannel,
    dmLastMessageByChannel,
    identityString,
    usersByIdentity,
    extendedActions,
  } = appData

  const [selectedDmChannelId, setSelectedDmChannelId] = useState<string | undefined>(undefined)

  const myDmChannels = useMemo(() => {
    if (!identityString) {
      return [] as DmChannel[]
    }

    const dmIdsForMe = new Set(
      dmParticipants
        .filter((participant) => identityToString(participant.identity) === identityString)
        .map((participant) => toIdKey(participant.dmChannelId)),
    )

    return dmChannels
      .filter((channel) => dmIdsForMe.has(toIdKey(channel.dmChannelId)))
      .slice()
      .sort((left, right) => compareById(left.dmChannelId, right.dmChannelId))
  }, [dmChannels, dmParticipants, identityString])

  const dmListItems = useMemo(() => {
    const mapUserStatus = (tag: string): 'online' | 'idle' | 'dnd' | 'offline' => {
      switch (tag) {
        case 'Online': return 'online'
        case 'Away': return 'idle'
        case 'DoNotDisturb': return 'dnd'
        default: return 'offline'
      }
    }

    return myDmChannels.map((channel) => {
      const dmChannelKey = toIdKey(channel.dmChannelId)
      const otherParticipantIds = dmParticipants
        .filter((participant) => toIdKey(participant.dmChannelId) === dmChannelKey)
        .map((participant) => identityToString(participant.identity))
        .filter((participantId) => participantId && participantId !== identityString)

      const names = otherParticipantIds.map((participantId) => {
        const participantUser = usersByIdentity.get(participantId)
        return participantUser?.displayName ?? participantUser?.username ?? participantId.slice(0, 12)
      })

      // Derive status from the first other participant
      let status: 'online' | 'idle' | 'dnd' | 'offline' = 'offline'
      if (otherParticipantIds.length > 0) {
        const otherUser = usersByIdentity.get(otherParticipantIds[0])
        if (otherUser?.status && typeof otherUser.status === 'object' && 'tag' in otherUser.status) {
          status = mapUserStatus((otherUser.status as { tag: string }).tag)
        }
      }

      const unreadCount = dmUnreadCountsByChannel.get(dmChannelKey) ?? 0
      const latestDmMessage = dmLastMessageByChannel.get(dmChannelKey)

      return {
        id: dmChannelKey,
        name: names.length > 0 ? names.join(', ') : `dm-${dmChannelKey}`,
        status,
        unreadCount,
        lastMessage: latestDmMessage ? String(latestDmMessage.content ?? '') : undefined,
      }
    })
  }, [dmParticipants, identityString, myDmChannels, usersByIdentity, dmUnreadCountsByChannel, dmLastMessageByChannel])

  const selectedDmChannel = useMemo(
    () => myDmChannels.find((channel) => toIdKey(channel.dmChannelId) === selectedDmChannelId) ?? null,
    [myDmChannels, selectedDmChannelId],
  )

  const selectedDmName = useMemo(
    () => dmListItems.find((channel) => String(channel.id) === selectedDmChannelId)?.name ?? null,
    [dmListItems, selectedDmChannelId],
  )

  const dmMessagesForSelectedChannel = useMemo(() => {
    if (!selectedDmChannel) {
      return [] as Array<{
        id: string
        authorId: string
        authorName: string
        content: string
        timestamp: string
        canEditDelete: boolean
      }>
    }

    const selectedDmChannelKey = toIdKey(selectedDmChannel.dmChannelId)

    const participantsForSelectedChannel = dmParticipants
      .filter((participant) => toIdKey(participant.dmChannelId) === selectedDmChannelKey)
      .map((participant) => identityToString(participant.identity))

    const otherParticipantId = participantsForSelectedChannel.find((participantId) => participantId !== identityString)
    const otherParticipantName = otherParticipantId
      ? (usersByIdentity.get(otherParticipantId)?.displayName
        ?? usersByIdentity.get(otherParticipantId)?.username
        ?? otherParticipantId.slice(0, 12))
      : 'Someone'

    const seenIds = new Set<string>()

    const messageTimeline = dmMessages
      .filter((message) => {
        if (message.isDeleted) return false
        const idKey = toIdKey(message.dmMessageId)
        if (seenIds.has(idKey)) return false
        seenIds.add(idKey)
        return true
      })
      .map((message) => {
        const authorId = identityToString(message.authorIdentity)
        const author = usersByIdentity.get(authorId)

        return {
          id: toIdKey(message.dmMessageId),
          authorId,
          authorName: author?.displayName ?? author?.username ?? authorId.slice(0, 12),
          content: message.content,
          timestamp: formatTimestamp(message.sentAt),
          canEditDelete: true,
          profileColor: (author as any)?.profileColor ?? undefined,
          sortTime: timestampToMillis(message.sentAt),
          sortId: toSortableBigInt(message.dmMessageId),
        }
      })

    const callEventTimeline = dmCallEvents
      .filter((event) => toIdKey(event.dmChannelId) === selectedDmChannelKey)
      .map((event) => {
        const eventId = toIdKey(event.eventId)
        const actorId = identityToString(event.actorIdentity)
        const actorName = usersByIdentity.get(actorId)?.displayName
          ?? usersByIdentity.get(actorId)?.username
          ?? actorId.slice(0, 12)

        let content = 'Call activity'
        switch (String(event.eventType)) {
          case 'started':
            content = `${actorName} started a call`
            break
          case 'missed':
            content = actorId === identityString
              ? `${otherParticipantName} tried to call you`
              : `${actorName} didn’t pick up`
            break
          case 'canceled':
            content = actorId === identityString
              ? 'You canceled the call'
              : `${actorName} canceled the call`
            break
          case 'ended': {
            const secondsRaw = event.durationSeconds
            const secondsBigInt = secondsRaw !== null && secondsRaw !== undefined ? toSortableBigInt(secondsRaw) : null
            const seconds = secondsBigInt !== null ? Number(secondsBigInt) : 0
            content = seconds > 0
              ? `Call ended after ${formatDuration(seconds)}`
              : 'Call ended'
            break
          }
          default:
            content = 'Call activity'
        }

        return {
          id: `call-event-${eventId}`,
          authorId: 'system',
          authorName: 'Call',
          content,
          timestamp: formatTimestamp(event.createdAt),
          canEditDelete: false,
          profileColor: undefined,
          sortTime: timestampToMillis(event.createdAt),
          sortId: toSortableBigInt(event.eventId),
        }
      })

    return [...messageTimeline, ...callEventTimeline]
      .slice()
      .sort(compareTimelineItems)
      .map(({ sortTime: _sortTime, sortId: _sortId, ...row }) => row)
  }, [dmMessages, dmCallEvents, dmParticipants, selectedDmChannel, usersByIdentity, identityString])

  const dmReactionsForSelectedChannel = useMemo(() => {
    if (!selectedDmChannel) {
      return new Map<string, ReactionEntry[]>()
    }

    const grouped = new Map<string, Map<string, { count: number; isActive: boolean }>>()

    for (const reaction of dmReactions) {
      const messageKey = toIdKey(reaction.dmMessageId)
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
  }, [dmReactions, identityString, selectedDmChannel])

  const onToggleDmReaction = useCallback(
    (messageId: string | number, emoji: string): void => {
      void runAction(() =>
        callActionOrReducer(extendedActions.toggleDmReaction, 'toggleDmReaction', {
          dmMessageId: BigInt(messageId),
          emoji,
        }),
      )
    },
    [runAction, callActionOrReducer, extendedActions.toggleDmReaction],
  )

  const getDmReactionsForMessage = useCallback(
    (messageId: string | number): ReactionEntry[] =>
      dmReactionsForSelectedChannel.get(String(messageId)) ?? [],
    [dmReactionsForSelectedChannel],
  )

  const onStartDmFromFriend = useCallback(
    (friendId: string | number): void => {
      const friendIdentity = friendIdentityById.get(String(friendId))
      if (!friendIdentity) {
        setActionStatus(null)
        setActionError('Friend identity not available')
        return
      }

      const friendIdentityStr = identityToString(friendIdentity)

      const participantsByChannel = new Map<string, string[]>()
      for (const p of dmParticipants) {
        const channelId = toIdKey(p.dmChannelId)
        const list = participantsByChannel.get(channelId) ?? []
        list.push(identityToString(p.identity))
        participantsByChannel.set(channelId, list)
      }

      let existingDmChannelId: string | null = null
      for (const channel of myDmChannels) {
        const channelId = toIdKey(channel.dmChannelId)
        const pList = participantsByChannel.get(channelId) || []
        if (pList.length === 2 && pList.includes(identityString || '') && pList.includes(friendIdentityStr)) {
          existingDmChannelId = channelId
          break
        }
      }

      if (existingDmChannelId) {
        setSelectedDmChannelId(existingDmChannelId)
        return
      }

      pendingDmWithRef.current = friendIdentityStr

      void runAction(
        () =>
          callActionOrReducer(extendedActions.createDmChannel, 'createDmChannel', {
            participants: [friendIdentity],
            title: undefined,
          }),
        'DM created',
      )
    },
    [
      friendIdentityById,
      setActionStatus,
      setActionError,
      dmParticipants,
      myDmChannels,
      identityString,
      runAction,
      callActionOrReducer,
      extendedActions,
    ],
  )

  // Auto-select newly created DM channel after reducer completes
  const pendingDmWithRef = useRef<string | null>(null)

  useEffect(() => {
    const pendingIdentity = pendingDmWithRef.current
    if (!pendingIdentity || !identityString) return

    const participantsByChannel = new Map<string, string[]>()
    for (const p of dmParticipants) {
      const channelId = toIdKey(p.dmChannelId)
      const list = participantsByChannel.get(channelId) ?? []
      list.push(identityToString(p.identity))
      participantsByChannel.set(channelId, list)
    }

    for (const channel of myDmChannels) {
      const channelId = toIdKey(channel.dmChannelId)
      const pList = participantsByChannel.get(channelId) || []
      if (pList.length === 2 && pList.includes(identityString) && pList.includes(pendingIdentity)) {
        pendingDmWithRef.current = null
        setSelectedDmChannelId(channelId)
        return
      }
    }
  }, [myDmChannels, dmParticipants, identityString])

  const onLeaveDmChannel = useCallback(
    (dmChannelId: string | number): void => {
      void runAction(
        () => extendedActions.leaveDmChannel({ dmChannelId: BigInt(dmChannelId) }),
        'Left DM',
      )
      if (String(selectedDmChannelId) === String(dmChannelId)) {
        setSelectedDmChannelId(undefined)
      }
    },
    [runAction, extendedActions, selectedDmChannelId],
  )

  return {
    selectedDmChannelId,
    setSelectedDmChannelId,
    myDmChannels,
    dmListItems,
    selectedDmChannel,
    selectedDmName,
    dmMessagesForSelectedChannel,
    dmReactionsForSelectedChannel,
    onToggleDmReaction,
    getDmReactionsForMessage,
    onStartDmFromFriend,
    onLeaveDmChannel,
  }
}
