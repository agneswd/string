/**
 * Types for the Profile / "You" panel.
 * React Native-safe – no DOM APIs.
 */

import type { UserId } from '../../shared/types/common'
import type { PresenceStatus } from '../../shared/ui/PresenceDot'

export type { PresenceStatus }

/** The signed-in user's own profile data. */
export interface OwnProfile {
  id: UserId
  displayName: string
  username: string
  /** Email address from the auth provider, may be absent. */
  email: string | null
  status: PresenceStatus
  statusMessage: string | null
  avatarBytes?: Uint8Array | null
  profileColor?: string | null
  /** Optional short role or membership label for the mobile shell hero. */
  headline?: string | null
}

/** Values submitted by ProfileEditForm. */
export interface ProfileEditValues {
  displayName: string
  username: string
  bio: string
  avatarBytes?: Uint8Array | null
  profileColor?: string | null
}

/** A single row in the profile settings list. */
export interface ProfileSettingItem {
  id: string
  label: string
  value?: string
  /** When true, a chevron is shown to indicate navigation. */
  navigable?: boolean
  /** Renders a destructive (red) tint when true. */
  destructive?: boolean
}
