import type { LayoutMode } from '../../../constants/theme'

export type DmChannelId = string | number

export interface DmListItem {
  id: DmChannelId
  name: string
  avatarUrl?: string
  status?: 'online' | 'idle' | 'dnd' | 'offline'
  lastMessage?: string
  unreadCount?: number
}

export interface DmListPaneProps {
  title?: string
  channels: DmListItem[]
  selectedChannelId?: DmChannelId
  onSelectChannel?: (channelId: DmChannelId) => void
  onLeaveChannel?: (channelId: DmChannelId) => void
  onStartVoiceCall?: (channelId: DmChannelId) => void
  onCreateChannel?: () => void
  onShowFriends?: () => void
  createButtonLabel?: string
  className?: string
  /** Channel IDs that have an active voice call */
  activeCallChannelIds?: Set<string>
  /**
   * 'classic' — Discord-style dark sidebar (default, Phase 1 visuals).
   * 'string'  — Editorial sidebar using CSS design tokens.
   */
  layoutMode?: LayoutMode
}
