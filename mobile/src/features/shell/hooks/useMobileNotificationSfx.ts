import { useEffect, useRef, useState } from 'react'

import { playSound } from '../../../shared/sfx'
import type { DmConversation } from '../../dm'
import type { LiveShellData } from '../liveData'

interface UseMobileNotificationSfxParams {
  identity: string
  conversations: DmConversation[]
  selectedConversationId: string | null
  liveShellData: LiveShellData
}

const OFFLINE_NOTIFICATION_DELAY_MS = 900
const ONLINE_STATUSES = new Set(['online', 'idle', 'dnd', 'away', 'do not disturb', 'donotdisturb'])

export function useMobileNotificationSfx({
  identity,
  conversations,
  selectedConversationId,
  liveShellData,
}: UseMobileNotificationSfxParams) {
  const [isReadyToNotify, setIsReadyToNotify] = useState(false)
  const prevFriendStatuses = useRef<Map<string, string>>(new Map())
  const pendingOfflineNotifications = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
  const prevConversationState = useRef<Map<string, { messageText: string | null; unreadCount: number }>>(new Map())

  useEffect(() => {
    const timer = setTimeout(() => setIsReadyToNotify(true), 1500)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const prev = prevFriendStatuses.current
    const pending = pendingOfflineNotifications.current
    const friends = liveShellData.friends ?? []
    const friendIds = new Set(friends.map((friend) => friend.id))

    for (const [friendId, timeoutId] of pending) {
      if (!friendIds.has(friendId)) {
        clearTimeout(timeoutId)
        pending.delete(friendId)
      }
    }

    for (const friendId of Array.from(prev.keys())) {
      if (!friendIds.has(friendId)) {
        prev.delete(friendId)
      }
    }

    for (const friend of friends) {
      const previousStatus = prev.get(friend.id)
      if (previousStatus !== undefined && isReadyToNotify) {
        const wasOnline = isOnlineStatus(previousStatus)
        const isOnline = isOnlineStatus(friend.status)

        if (!wasOnline && isOnline) {
          const pendingOffline = pending.get(friend.id)
          if (pendingOffline) {
            clearTimeout(pendingOffline)
            pending.delete(friend.id)
          } else {
            playSound('contact-online')
          }
        } else if (wasOnline && !isOnline) {
          const pendingOffline = pending.get(friend.id)
          if (pendingOffline) {
            clearTimeout(pendingOffline)
          }

          const timeoutId = setTimeout(() => {
            pending.delete(friend.id)
            playSound('contact-offline')
          }, OFFLINE_NOTIFICATION_DELAY_MS)

          pending.set(friend.id, timeoutId)
        }
      }

      prev.set(friend.id, friend.status)
    }
  }, [isReadyToNotify, liveShellData.friends])

  useEffect(() => {
    const pending = pendingOfflineNotifications.current
    return () => {
      for (const timeoutId of pending.values()) {
        clearTimeout(timeoutId)
      }
      pending.clear()
    }
  }, [])

  useEffect(() => {
    if (!identity) {
      return
    }

    const previous = prevConversationState.current
    const next = new Map<string, { messageText: string | null; unreadCount: number }>()

    for (const conversation of conversations) {
      const currentState = {
        messageText: conversation.lastMessageText,
        unreadCount: conversation.unreadCount,
      }
      const previousState = previous.get(conversation.id)

      if (
        isReadyToNotify
        && previousState
        && conversation.id !== selectedConversationId
        && currentState.unreadCount > previousState.unreadCount
        && currentState.messageText !== previousState.messageText
      ) {
        playSound('message-received')
      }

      next.set(conversation.id, currentState)
    }

    previous.clear()
    for (const [key, value] of next) {
      previous.set(key, value)
    }
  }, [conversations, identity, isReadyToNotify, selectedConversationId])
}

function isOnlineStatus(status: string): boolean {
  return ONLINE_STATUSES.has(status.toLowerCase())
}
