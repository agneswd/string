/**
 * Types for the Friends panel.
 * React Native-safe – no DOM APIs.
 */

import type { UserId, EpochMs } from '../../shared/types/common'
import type { PresenceStatus } from '../../shared/ui/PresenceDot'

export type { PresenceStatus }

/** A friend/contact entry. */
export interface Friend {
  id: UserId
  displayName: string
  username: string
  status: PresenceStatus
  avatarUri?: string
  profileColor?: string | null
  /** Custom status message set by the user, if any. */
  statusMessage: string | null
  /** Optional current activity label shown in richer placeholders. */
  activity?: string | null
  /** Optional shared context count. */
  mutualCount?: number
}

/** An incoming or outgoing friend request. */
export interface FriendRequest {
  id: string
  /** Identity of the user who sent the request. */
  fromId: UserId
  fromName: string
  fromUsername: string
  avatarUri?: string
  profileColor?: string | null
  direction: 'incoming' | 'outgoing'
  sentAt: EpochMs
}
