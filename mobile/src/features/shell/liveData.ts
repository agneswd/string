import { avatarBytesToUri } from '../../shared/lib/avatarUtils'
import type { AuthSession } from '../auth/types'
import type { Guild as BrowseGuild, Channel as BrowseChannel } from '../browse/types'
import type { Friend as FriendsFriend, FriendRequest as FriendsRequest } from '../friends/types'
import type { OwnProfile } from '../profile/types'
import type { SpacetimeDataSnapshot } from '../../core/spacetime'

type PresenceStatus = OwnProfile['status']

interface LiveShellDataParams {
  data: SpacetimeDataSnapshot
  identity: string | null
  session: AuthSession
}

export interface LiveShellData {
  profile?: OwnProfile
  guilds?: BrowseGuild[]
  channels?: BrowseChannel[]
  friends?: FriendsFriend[]
  requests?: FriendsRequest[]
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

function toPresenceStatus(value: unknown): PresenceStatus {
  if (!value) {
    return 'offline'
  }

  if (typeof value === 'string') {
    if (value === 'Online') return 'online'
    if (value === 'Away') return 'idle'
    if (value === 'DoNotDisturb') return 'dnd'
    return 'offline'
  }

  const enumLike = value as Record<string, unknown>
  if ('Online' in enumLike) return 'online'
  if ('Away' in enumLike) return 'idle'
  if ('DoNotDisturb' in enumLike) return 'dnd'
  return 'offline'
}

function toRequestTimestamp(_value: unknown): number {
  return Date.now()
}

export function mapSpacetimeDataToShell({ data, identity, session }: LiveShellDataParams): LiveShellData {
  const usersByIdentity = new Map(data.users.map((user) => [identityToString(user.identity), user]))
  const presenceByIdentity = new Map(data.userPresence.map((presence) => [identityToString(presence.identity), presence]))
  const selfIdentity = identity ?? (session.status === 'signed-in' ? session.userId : '')

  const profile = data.myProfile
    ? {
        id: identityToString(data.myProfile.identity),
        displayName: data.myProfile.displayName,
        username: data.myProfile.username,
        email: session.status === 'signed-in' ? session.email : null,
        status: toPresenceStatus(data.myProfile.status),
        statusMessage: data.myProfile.bio ?? null,
        avatarBytes: data.myProfile.avatarBytes ?? null,
        profileColor: data.myProfile.profileColor ?? null,
        headline: 'String member',
      }
    : undefined

  const guildMemberCounts = new Map<string, number>()
  for (const member of data.guildMembers) {
    const key = toIdKey(member.guildId)
    guildMemberCounts.set(key, (guildMemberCounts.get(key) ?? 0) + 1)
  }

  const guilds = data.guilds.map<BrowseGuild>((guild) => ({
    id: toIdKey(guild.guildId),
    name: guild.name,
    description: guild.bio ?? null,
    avatarBytes: guild.avatarBytes ?? null,
    avatarUri: avatarBytesToUri(guild.avatarBytes),
    ownerName: usersByIdentity.get(identityToString(guild.ownerIdentity))?.displayName
      ?? usersByIdentity.get(identityToString(guild.ownerIdentity))?.username
      ?? null,
    isOwner: identityToString(guild.ownerIdentity) === selfIdentity,
    memberCount: guildMemberCounts.get(toIdKey(guild.guildId)) ?? -1,
    joined: true,
    activityLabel: null,
  }))

  const channels = data.channels.map<BrowseChannel>((channel) => ({
    id: toIdKey(channel.channelId),
    guildId: toIdKey(channel.guildId),
    name: channel.name,
    type: 'Announcement' in (channel.channelType as Record<string, unknown>)
      ? 'announcement'
      : 'Category' in (channel.channelType as Record<string, unknown>)
        ? 'category'
        : 'Voice' in (channel.channelType as Record<string, unknown>)
          ? 'voice'
          : 'text',
    hasUnread: false,
    mentionCount: 0,
    topic: channel.topic ?? null,
    parentCategoryId: channel.categoryId == null ? null : toIdKey(channel.categoryId),
    position: Number(channel.position),
  }))

  const friends = data.friendEdges.flatMap<FriendsFriend>((edge) => {
    const low = identityToString(edge.identityLow)
    const high = identityToString(edge.identityHigh)
    const friendIdentity = low === selfIdentity ? high : high === selfIdentity ? low : null

    if (!friendIdentity) {
      return []
    }

    const user = usersByIdentity.get(friendIdentity)
    if (!user) {
      return []
    }

    const presence = presenceByIdentity.get(friendIdentity)

    return [{
      id: friendIdentity,
      displayName: user.displayName,
      username: user.username,
      status: toPresenceStatus(presence?.status ?? user.status),
      avatarUri: avatarBytesToUri(user.avatarBytes),
      profileColor: user.profileColor ?? null,
      statusMessage: user.bio ?? null,
      activity: null,
    }]
  })

  const requests = [
    ...data.incomingFriendRequests.map<FriendsRequest>((request) => {
      const senderIdentity = identityToString(request.senderIdentity)
      const sender = usersByIdentity.get(senderIdentity)

      return {
        id: toIdKey(request.friendRequestId),
        fromId: senderIdentity,
        fromName: sender?.displayName ?? sender?.username ?? 'Unknown user',
        fromUsername: sender?.username ?? senderIdentity.slice(0, 12),
        avatarUri: avatarBytesToUri(sender?.avatarBytes),
        profileColor: sender?.profileColor ?? null,
        direction: 'incoming',
        sentAt: toRequestTimestamp(request.createdAt),
      }
    }),
    ...data.outgoingFriendRequests.map<FriendsRequest>((request) => {
      const recipientIdentity = identityToString(request.recipientIdentity)
      const recipient = usersByIdentity.get(recipientIdentity)

      return {
        id: toIdKey(request.friendRequestId),
        fromId: recipientIdentity,
        fromName: recipient?.displayName ?? recipient?.username ?? 'Unknown user',
        fromUsername: recipient?.username ?? recipientIdentity.slice(0, 12),
        avatarUri: avatarBytesToUri(recipient?.avatarBytes),
        profileColor: recipient?.profileColor ?? null,
        direction: 'outgoing',
        sentAt: toRequestTimestamp(request.createdAt),
      }
    }),
  ]

  return {
    profile,
    guilds,
    channels,
    friends,
    requests,
  }
}
