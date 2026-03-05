import { useEffect, useRef, useState } from 'react'

import type { DmMessage, DmParticipant, User } from '../module_bindings/types'
import type { NotificationItem } from '../components/ui/NotificationToast'
import type { FriendEntry } from './useFriends'
import { identityToString } from './useAppData'
import { playSound } from '../lib/sfx'
import { toIdKey, toSortableBigInt } from '../lib/helpers'

// ---------------------------------------------------------------------------
// Params
// ---------------------------------------------------------------------------

interface UseNotificationEffectsParams {
  actionStatus: string | null
  actionError: string | null
  addNotification: (notif: Omit<NotificationItem, 'id'>) => void
  friends: FriendEntry[]
  identityString: string
  dmParticipants: DmParticipant[]
  dmLastMessageByChannel: Map<string, DmMessage>
  selectedDmChannelId: string | undefined
  usersByIdentity: Map<string, User>
  setSelectedDmChannelId: (id: string | undefined) => void
  setSelectedGuildId: (id: string | undefined) => void
}

const OFFLINE_NOTIFICATION_DELAY_MS = 900
const ONLINE_STATUSES = new Set(['online', 'idle', 'dnd', 'away', 'do not disturb', 'donotdisturb'])

const isOnlineStatus = (status: string): boolean => ONLINE_STATUSES.has(status.toLowerCase())

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useNotificationEffects({
  actionStatus,
  actionError,
  addNotification,
  friends,
  identityString,
  dmParticipants,
  dmLastMessageByChannel,
  selectedDmChannelId,
  usersByIdentity,
  setSelectedDmChannelId,
  setSelectedGuildId,
}: UseNotificationEffectsParams): void {
  // Convert action feedback to notifications
  useEffect(() => {
    if (actionStatus) {
      addNotification({
        message: actionStatus,
        type: actionStatus.toLowerCase().includes('error') || actionStatus.toLowerCase().includes('fail') ? 'error' : 'success',
      })
    }
  }, [actionStatus, addNotification])

  useEffect(() => {
    if (actionError) {
      addNotification({ message: actionError, type: 'error' })
    }
  }, [actionError, addNotification])

  // Online/offline friend notifications
  const prevFriendStatuses = useRef<Map<string, string>>(new Map())
  const pendingOfflineNotifications = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
  useEffect(() => {
    const prev = prevFriendStatuses.current
    const pending = pendingOfflineNotifications.current
    const friendIds = new Set(friends.map((friend) => friend.id))

    for (const [friendId, timeoutHandle] of pending) {
      if (!friendIds.has(friendId)) {
        clearTimeout(timeoutHandle)
        pending.delete(friendId)
      }
    }

    for (const friendId of Array.from(prev.keys())) {
      if (!friendIds.has(friendId)) {
        prev.delete(friendId)
      }
    }

    for (const friend of friends) {
      const prevStatus = prev.get(friend.id)
      if (prevStatus !== undefined) {
        const wasOnline = isOnlineStatus(prevStatus)
        const isOnline = isOnlineStatus(friend.status)

        if (!wasOnline && isOnline) {
          const offlineTimer = pending.get(friend.id)
          if (offlineTimer) {
            clearTimeout(offlineTimer)
            pending.delete(friend.id)
          } else {
            playSound('contact-online')
            addNotification({ message: `${friend.displayName || friend.username} is now online`, type: 'info' })
          }
        } else if (wasOnline && !isOnline) {
          const offlineTimer = pending.get(friend.id)
          if (offlineTimer) {
            clearTimeout(offlineTimer)
          }

          const friendName = friend.displayName || friend.username
          const timeoutHandle = setTimeout(() => {
            pending.delete(friend.id)
            playSound('contact-offline')
            addNotification({ message: `${friendName} went offline`, type: 'info' })
          }, OFFLINE_NOTIFICATION_DELAY_MS)

          pending.set(friend.id, timeoutHandle)
        }
      }

      prev.set(friend.id, friend.status)
    }
  }, [friends, addNotification])

  useEffect(() => {
    const pending = pendingOfflineNotifications.current
    return () => {
      for (const timeoutHandle of pending.values()) {
        clearTimeout(timeoutHandle)
      }
      pending.clear()
    }
  }, [])

  // ---------------------------------------------------------
  // DM Notifications
  // ---------------------------------------------------------
  
  // 1. Create a 1.5s silent window on mount to swallow the initial database sync flood
  const [isReadyToNotify, setIsReadyToNotify] = useState(false)
  useEffect(() => {
    const timer = setTimeout(() => setIsReadyToNotify(true), 1500)
    return () => clearTimeout(timer)
  }, [])

  const prevDmLastMessageIdByChannel = useRef<Map<string, bigint>>(new Map())
  const notifiedDmMessageIds = useRef<Set<string>>(new Set())
  
  useEffect(() => {
    const prev = prevDmLastMessageIdByChannel.current
    const notified = notifiedDmMessageIds.current

    // Convert the current cache to a manageable map of Channel ID -> Message ID
    const currentLastMessageIdByChannel = new Map<string, bigint>()
    for (const [channelId, message] of dmLastMessageByChannel) {
      const msgId = toSortableBigInt(message.dmMessageId)
      if (msgId !== null) currentLastMessageIdByChannel.set(channelId, msgId)
    }

    // 2. If we are in the initial loading window, update our trackers silently and abort
    if (!isReadyToNotify) {
      prev.clear()
      for (const [channelId, messageId] of currentLastMessageIdByChannel) {
        prev.set(channelId, messageId)
      }
      return
    }

    // 3. Normal notification processing
    const myLastReadMessageIdByChannel = new Map<string, bigint | null>()
    for (const participant of dmParticipants) {
      if (identityToString(participant.identity) !== identityString) continue
      const chKey = toIdKey(participant.dmChannelId)
      myLastReadMessageIdByChannel.set(chKey, participant.lastReadMessageId ? toSortableBigInt(participant.lastReadMessageId) : null)
    }

    for (const [channelId, lastMessage] of dmLastMessageByChannel) {
      const messageId = toSortableBigInt(lastMessage.dmMessageId)
      if (messageId === null) continue

      const previousMessageId = prev.get(channelId)
      
      // Check if this message physically arrived in this exact render cycle
      const hasNewLatestMessage = previousMessageId === undefined || messageId > previousMessageId
      if (!hasNewLatestMessage) continue

      const senderId = identityToString(lastMessage.authorIdentity)
      if (senderId === identityString || channelId === selectedDmChannelId) continue

      const lastReadMessageId = myLastReadMessageIdByChannel.get(channelId) ?? null
      const isUnread = lastReadMessageId === null || messageId > lastReadMessageId
      if (!isUnread) continue

      const notificationKey = `${channelId}:${messageId.toString()}`
      if (notified.has(notificationKey)) continue
      
      notified.add(notificationKey)

      const senderUser = usersByIdentity.get(senderId)
      const senderName = senderUser?.displayName ?? senderUser?.username ?? 'Someone'
      playSound('message-received')
      
      addNotification({
        message: `${senderName}`,
        subtitle: String(lastMessage.content ?? '').slice(0, 100),
        type: 'message' as const,
        onClick: () => {
          setSelectedDmChannelId(channelId)
          setSelectedGuildId(undefined)
        },
      })
    }

    // Update the tracker for the next render tick
    prev.clear()
    for (const [channelId, messageId] of currentLastMessageIdByChannel) {
      prev.set(channelId, messageId)
    }
  }, [isReadyToNotify, dmParticipants, dmLastMessageByChannel, identityString, selectedDmChannelId, addNotification, usersByIdentity, setSelectedDmChannelId, setSelectedGuildId])
}