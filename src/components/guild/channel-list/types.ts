import type { GuildId } from '../ServerListPane'
import type { LayoutMode } from './styles'

export type { LayoutMode }

export type ChannelKind = 'category' | 'text' | 'voice'

export interface ChannelListItem {
  id: GuildId
  name: string
  kind?: ChannelKind
  category?: string
  parentCategoryId?: GuildId | null
  position?: number
  unreadCount?: number
}

export interface ChannelLayoutUpdateItem {
  channelId: GuildId
  categoryId?: GuildId | null
  position: number
}

export interface UserPanelInfo {
  displayName: string
  username?: string
  status?: string
  avatarUrl?: string
}

export interface VoiceChannelUser {
  identity: string
  displayName: string
  isMuted: boolean
  isDeafened: boolean
  isSpeaking?: boolean
  isStreaming?: boolean
}

export interface ChannelListPaneProps {
  guildName?: string
  channels: ChannelListItem[]
  selectedChannelId?: GuildId
  onSelectChannel?: (channelId: GuildId) => void
  /** Optional user info to render in the bottom user panel */
  userPanel?: UserPanelInfo
  onCreateChannel?: (parentCategoryId?: GuildId | null) => void
  onCreateCategory?: () => void
  onEditChannel?: (channelId: GuildId) => void
  onDeleteChannel?: (channelId: GuildId) => void
  onSaveLayout?: (layout: ChannelLayoutUpdateItem[]) => void
  onMuteToggle?: () => void
  onDeafenToggle?: () => void
  onViewScreenShare?: (identity: string) => void
  isMuted?: boolean
  isDeafened?: boolean
  voiceChannelUsers?: Map<string | number, VoiceChannelUser[]>
  currentVoiceChannelId?: string | number
  locallyMutedUsers?: Set<string>
  onToggleLocalMuteUser?: (identity: string) => void
  localIdentity?: string
  getAvatarUrl?: (identity: string) => string | undefined
  className?: string
  /** Controls visual treatment: 'classic' = Discord-like, 'string' = editorial string mode. Defaults to 'classic'. */
  layoutMode?: LayoutMode
}

export interface CategoryGroup {
  label: string
  channels: ChannelListItem[]
}
