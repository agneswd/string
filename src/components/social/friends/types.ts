import type { LayoutMode } from '../../../constants/theme'

export type FriendRequestItemId = string | number
export type FriendUserId = string | number

export interface IncomingFriendRequestItem {
  id: FriendRequestItemId
  username: string
  displayName?: string
  avatarUrl?: string
  profileColor?: string
}

export interface OutgoingFriendRequestItem {
  id: FriendRequestItemId
  username: string
  displayName?: string
  avatarUrl?: string
  profileColor?: string
}

export interface FriendListItem {
  id: FriendUserId
  username: string
  displayName?: string
  status?: string
  avatarUrl?: string
  profileColor?: string
}

export interface GuildInviteItem {
  id: string
  guildId: string
  inviterName: string
  avatarUrl?: string
  profileColor?: string
}

export interface FriendRequestPanelProps {
  layoutMode?: LayoutMode
  requestUsername: string
  onRequestUsernameChange: (value: string) => void
  onSendRequest: (username: string) => void
  incomingRequests: IncomingFriendRequestItem[]
  onAcceptRequest: (requestId: FriendRequestItemId) => void
  onDeclineRequest: (requestId: FriendRequestItemId) => void
  outgoingRequests: OutgoingFriendRequestItem[]
  onCancelOutgoingRequest: (requestId: FriendRequestItemId) => void
  friends: FriendListItem[]
  onStartDm: (friendId: FriendUserId) => void
  onRemoveFriend: (friendId: FriendUserId) => void
  guildInvites?: GuildInviteItem[]
  onAcceptGuildInvite?: (inviteId: string) => void
  onDeclineGuildInvite?: (inviteId: string) => void
  className?: string
}

export type Tab = 'online' | 'all' | 'pending' | 'add'
