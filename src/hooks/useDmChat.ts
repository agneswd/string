import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import type { Identity } from 'spacetimedb/sdk'

import type { AppData } from './useAppData'
import type { ActionFeedback } from './useActionFeedback'
import type { DmChannel } from '../module_bindings/types'
import { toIdKey, identityToString, formatTimestamp, compareById } from '../lib/helpers'

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

export function useDmChat({
  appData,
  friendIdentityById,
  runAction,
  callActionOrReducer,
  setActionError,
  setActionStatus,
}: UseDmChatParams) {
  const { dmChannels, dmParticipants, dmMessages, dmReactions, identityString, usersByIdentity, extendedActions } = appData

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

      return {
        id: dmChannelKey,
        name: names.length > 0 ? names.join(', ') : `dm-${dmChannelKey}`,
        status,
      }
    })
  }, [dmParticipants, identityString, myDmChannels, usersByIdentity])

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
      }>
    }

    const selectedDmKey = toIdKey(selectedDmChannel.dmChannelId)

    const seenIds = new Set<string>()

    return dmMessages
      .filter((message) => {
        if (toIdKey(message.dmChannelId) !== selectedDmKey || message.isDeleted) return false
        const idKey = toIdKey(message.dmMessageId)
        if (seenIds.has(idKey)) return false
        seenIds.add(idKey)
        return true
      })
      .slice()
      .sort((left, right) => compareById(left.dmMessageId, right.dmMessageId))
      .map((message) => {
        const authorId = identityToString(message.authorIdentity)
        const author = usersByIdentity.get(authorId)

        return {
          id: toIdKey(message.dmMessageId),
          authorId,
          authorName: author?.displayName ?? author?.username ?? authorId.slice(0, 12),
          content: message.content,
          timestamp: formatTimestamp(message.sentAt),
          profileColor: (author as any)?.profileColor ?? undefined,
        }
      })
  }, [dmMessages, selectedDmChannel, usersByIdentity])

  const dmReactionsForSelectedChannel = useMemo(() => {
    if (!selectedDmChannel) {
      return new Map<string, ReactionEntry[]>()
    }

    const channelKey = toIdKey(selectedDmChannel.dmChannelId)
    const grouped = new Map<string, Map<string, { count: number; isActive: boolean }>>()

    for (const reaction of dmReactions) {
      if (toIdKey(reaction.dmChannelId) !== channelKey) continue

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
