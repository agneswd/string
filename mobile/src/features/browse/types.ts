/**
 * Types for the Browse / navigation panel.
 * React Native-safe – no DOM APIs.
 */

/** A guild (server) entry shown in the Browse panel. */
export interface Guild {
  id: string
  name: string
  /** Short description or topic, may be absent. */
  description: string | null
  /** Optional guild avatar snapshot for parity with web settings. */
  avatarBytes?: Uint8Array | null
  /** Optional guild avatar preview uri for rail rendering. */
  avatarUri?: string
  ownerName?: string | null
  isOwner?: boolean
  /** Approximate member count, -1 if unknown. */
  memberCount: number
  /** Whether the current user is a member. */
  joined: boolean
  /** Optional activity cue shown in polished mobile placeholders. */
  activityLabel?: string | null
}

/** A channel within a guild shown in the Browse panel. */
export type BrowseChannelType = 'category' | 'text' | 'voice' | 'announcement'

export interface Channel {
  id: string
  guildId: string
  name: string
  type: BrowseChannelType
  /** True when the current user has unread messages in this channel. */
  hasUnread: boolean
  /** Mention count for this channel (0 = no badge). */
  mentionCount: number
  /** Short topic or preview shown in the mobile list. */
  topic?: string | null
  /** Parent category id when the shell data includes structured channel layout. */
  parentCategoryId?: string | null
  /** Server-defined ordering index when available. */
  position?: number
  /** Approximate active participant count for placeholder density. */
  activeCount?: number
}

export interface BrowseChannelSection {
  id: string
  title: string
  sectionKind: 'category' | 'cluster' | 'type'
  collapsible: boolean
  channels: Channel[]
}

/** Params passed to the channel content screen. */
export interface ChannelScreenParams {
  channelId: string
  channelName: string
  guildId: string
  guildName: string
}

/** Params passed to the guild detail screen. */
export interface GuildScreenParams {
  guildId: string
  guildName: string
}
