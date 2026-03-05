import { useEffect, useRef } from 'react'

import type { DmMessage, User } from '../module_bindings/types'
import type { NotificationItem } from '../components/ui/NotificationToast'
import type { FriendEntry } from './useFriends'
import { toIdKey } from '../lib/helpers'
import { identityToString } from './useAppData'
import { playSound } from '../lib/sfx'

// ---------------------------------------------------------------------------
// Params
// ---------------------------------------------------------------------------

interface DmMessageView {
  id: string
  authorId: string
  authorName: string
  content: string
  timestamp: string
}

interface UseNotificationEffectsParams {
  actionStatus: string | null
  actionError: string | null
  addNotification: (notif: Omit<NotificationItem, 'id'>) => void
  friends: FriendEntry[]
  dmMessagesForSelectedChannel: DmMessageView[]
  identityString: string
  dmMessageCountsByChannel: Map<string, number>
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
  dmMessagesForSelectedChannel,
  identityString,
  dmMessageCountsByChannel,
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

  // DM message received sound for current channel
  const prevSelectedDmMsgCount = useRef(0)
  const prevSelectedDmChannelForMsgRef = useRef<string | undefined>(undefined)
  useEffect(() => {
    const msgs = dmMessagesForSelectedChannel
    const count = msgs?.length ?? 0
    // Reset count when switching channels to avoid false positives
    if (selectedDmChannelId !== prevSelectedDmChannelForMsgRef.current) {
      prevSelectedDmChannelForMsgRef.current = selectedDmChannelId
      prevSelectedDmMsgCount.current = count
      return
    }
    if (count > prevSelectedDmMsgCount.current && prevSelectedDmMsgCount.current > 0) {
      const lastMsg = msgs?.[count - 1]
      if (lastMsg && lastMsg.authorId !== identityString) {
        playSound('message-received')
      }
    }
    prevSelectedDmMsgCount.current = count
  }, [dmMessagesForSelectedChannel, identityString, selectedDmChannelId])

  // DM notifications for messages in non-selected channels
  const prevDmMsgCounts = useRef<Map<string, number>>(new Map())
  useEffect(() => {
    const prev = prevDmMsgCounts.current
    for (const [chId, count] of dmMessageCountsByChannel) {
      const prevCount = prev.get(chId) ?? 0
      if (count > prevCount && prevCount > 0) {
        // New message(s) in this channel
        const lastMsg = dmLastMessageByChannel.get(chId)
        if (lastMsg) {
          const senderId = identityToString(lastMsg.authorIdentity)
          if (senderId !== identityString && chId !== selectedDmChannelId) {
            // Not from us, and not in the currently open channel
            const senderUser = usersByIdentity.get(senderId)
            const senderName = senderUser?.displayName ?? senderUser?.username ?? 'Someone'
            playSound('message-received')
            addNotification({
              message: `${senderName}`,
              subtitle: String(lastMsg.content ?? '').slice(0, 100),
              type: 'message' as const,
              onClick: () => {
                setSelectedDmChannelId(chId)
                setSelectedGuildId(undefined)
              },
            })
          }
        }
      }
      prev.set(chId, count)
    }
  }, [dmMessageCountsByChannel, dmLastMessageByChannel, identityString, selectedDmChannelId, addNotification, usersByIdentity, setSelectedDmChannelId, setSelectedGuildId])
}
