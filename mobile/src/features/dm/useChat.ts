import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useSpacetime } from '../../core/spacetime'
import type { ChatMessage, ConversationId } from './types'

interface UseChatResult {
  messages: ChatMessage[]
  isLoading: boolean
  error: string | null
  /**
   * Send a message. Adds an optimistic entry immediately; the real
   * implementation calls the SpacetimeDB `send_dm` reducer and removes
   * the optimistic entry on acknowledgement.
   */
  sendMessage: (text: string) => void
}

/**
 * useChat
 *
 * Manages the message list for a single DM conversation using the subscribed
 * mobile Spacetime snapshot. Falls back cleanly when the live snapshot is not
 * ready yet.
 */
export function useChat(
  conversationId: ConversationId,
  currentUserId: string,
): UseChatResult {
  const { data, subscriptionsReady, createDmChannel, sendDmMessage, markDmRead } = useSpacetime()
  const [pendingError, setPendingError] = useState<string | null>(null)
  const markReadInFlightRef = useRef<string | null>(null)

  const peerIdentity = useMemo(() => {
    if (!conversationId.startsWith('dm:')) {
      return ''
    }

    return conversationId.slice(3)
  }, [conversationId])

  const peerUser = useMemo(
    () => data.users.find((user) => identityToString(user.identity) === peerIdentity) ?? null,
    [data.users, peerIdentity],
  )

  const activeChannel = useMemo(() => {
    if (!currentUserId || !peerIdentity) {
      return null
    }

    const participantMap = new Map<string, string[]>()

    for (const participant of data.dmParticipants) {
      const channelId = toIdKey(participant.dmChannelId)
      const identities = participantMap.get(channelId) ?? []
      identities.push(identityToString(participant.identity))
      participantMap.set(channelId, identities)
    }

    return data.dmChannels.find((channel) => {
      const identities = participantMap.get(toIdKey(channel.dmChannelId)) ?? []
      return identities.includes(currentUserId) && identities.includes(peerIdentity)
    }) ?? null
  }, [currentUserId, data.dmChannels, data.dmParticipants, peerIdentity])

  const messages = useMemo<ChatMessage[]>(() => {
    if (!activeChannel) {
      return []
    }

    return data.dmMessages
      .filter((message) => toIdKey(message.dmChannelId) === toIdKey(activeChannel.dmChannelId) && !message.isDeleted)
      .sort((left, right) => timestampToMillis(left.sentAt) - timestampToMillis(right.sentAt))
      .map((message) => ({
        id: toIdKey(message.dmMessageId),
        conversationId,
        senderId: identityToString(message.authorIdentity),
        text: message.content,
        sentAt: timestampToMillis(message.sentAt),
      }))
  }, [activeChannel, conversationId, data.dmMessages])

  const isLoading = !subscriptionsReady
  const error = pendingError

  useEffect(() => {
    if (!activeChannel || !currentUserId || messages.length === 0) {
      return
    }

    const latestMessage = messages[messages.length - 1]
    if (!latestMessage) {
      return
    }

    const latestMessageId = toBigInt(latestMessage.id)
    if (latestMessageId === null) {
      return
    }

    const myParticipant = data.dmParticipants.find((participant) => (
      toIdKey(participant.dmChannelId) === toIdKey(activeChannel.dmChannelId)
      && identityToString(participant.identity) === currentUserId
    ))
    if (!myParticipant) {
      return
    }

    const lastReadMessageId = toBigInt(myParticipant.lastReadMessageId)
    if (lastReadMessageId !== null && latestMessageId <= lastReadMessageId) {
      return
    }

    const inFlightKey = `${toIdKey(activeChannel.dmChannelId)}:${latestMessage.id}`
    if (markReadInFlightRef.current === inFlightKey) {
      return
    }

    markReadInFlightRef.current = inFlightKey
    void markDmRead({
      dmChannelId: activeChannel.dmChannelId,
      messageId: latestMessageId,
    }).finally(() => {
      if (markReadInFlightRef.current === inFlightKey) {
        markReadInFlightRef.current = null
      }
    })
  }, [activeChannel, currentUserId, data.dmParticipants, markDmRead, messages])

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return

      setPendingError(null)

      try {
        if (!activeChannel) {
          if (!peerUser) {
            throw new Error('The DM participant is not available in the current mobile snapshot yet.')
          }

          await createDmChannel({ participants: [peerUser.identity], title: null })
          setPendingError('DM created. Send the message again in a moment.')
          return
        }

        await sendDmMessage({
          dmChannelId: activeChannel.dmChannelId,
          content: text.trim(),
          replyTo: null,
        })
      } catch (nextError) {
        setPendingError(nextError instanceof Error ? nextError.message : 'Could not send the message.')
      }
    },
    [activeChannel, createDmChannel, peerUser, sendDmMessage],
  )

  return { messages, isLoading, error, sendMessage }
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
