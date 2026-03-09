import type { BrowseChannelSection, Channel, Guild } from './types'

export interface BrowseGuildStats {
  totalChannels: number
  unreadChannels: number
  mentionCount: number
  voiceChannels: number
}

export interface BrowsePaneModel {
  guilds: Guild[]
  selectedGuild: Guild | null
  selectedGuildChannels: Channel[]
  selectedGuildSections: BrowseChannelSection[]
  primaryChannel: Channel | null
  selectedGuildStats: BrowseGuildStats
}

export interface BuildBrowsePaneModelArgs {
  guilds?: Guild[]
  channels?: Channel[]
  selectedGuildId?: string | null
  selectedChannelId?: string | null
}

const CHANNEL_TYPE_PRIORITY: Record<Exclude<Channel['type'], 'category'>, number> = {
  text: 0,
  announcement: 1,
  voice: 2,
}

const EMPTY_GUILD_STATS: BrowseGuildStats = {
  totalChannels: 0,
  unreadChannels: 0,
  mentionCount: 0,
  voiceChannels: 0,
}

export function buildBrowsePaneModel({
  guilds = [],
  channels = [],
  selectedGuildId,
  selectedChannelId,
}: BuildBrowsePaneModelArgs): BrowsePaneModel {
  const orderedGuilds = [...guilds].sort((left, right) => {
    if (left.joined !== right.joined) {
      return left.joined ? -1 : 1
    }

    return left.name.localeCompare(right.name)
  })

  const selectedChannel = selectedChannelId
    ? channels.find((channel) => channel.id === selectedChannelId) ?? null
    : null

  const guildById = new Map(orderedGuilds.map((guild) => [guild.id, guild]))
  const selectedGuild = resolveSelectedGuild({
    guildById,
    orderedGuilds,
    selectedGuildId,
    selectedChannel,
  })

  const selectedGuildSourceChannels = selectedGuild
    ? channels
      .filter((channel) => channel.guildId === selectedGuild.id)
      .sort(compareBrowseChannels)
    : []

  const selectedGuildSections = buildBrowseChannelSections(selectedGuildSourceChannels)
  const selectedGuildChannels = selectedGuildSections.flatMap((section) => section.channels)

  const selectedGuildStats = selectedGuildChannels.reduce<BrowseGuildStats>((stats, channel) => ({
    totalChannels: stats.totalChannels + 1,
    unreadChannels: stats.unreadChannels + (channel.hasUnread ? 1 : 0),
    mentionCount: stats.mentionCount + channel.mentionCount,
    voiceChannels: stats.voiceChannels + (channel.type === 'voice' ? 1 : 0),
  }), EMPTY_GUILD_STATS)

  const primaryChannel = resolvePrimaryChannel({
    channels: selectedGuildChannels,
    selectedChannelId,
  })

  return {
    guilds: orderedGuilds,
    selectedGuild,
    selectedGuildChannels,
    selectedGuildSections,
    primaryChannel,
    selectedGuildStats,
  }
}

function buildBrowseChannelSections(channels: Channel[]): BrowseChannelSection[] {
  const selectableChannels = channels.filter(isSelectableChannel)
  if (!selectableChannels.length) {
    return []
  }

  if (!usesStructuredLayout(channels)) {
    return [buildClusterSection(selectableChannels, 0)]
  }

  const categoryById = new Map(
    channels
      .filter((channel) => channel.type === 'category')
      .map((channel) => [channel.id, channel] as const),
  )
  const channelsByCategory = new Map<string, Channel[]>()

  for (const channel of selectableChannels) {
    if (!channel.parentCategoryId || !categoryById.has(channel.parentCategoryId)) {
      continue
    }

    const existing = channelsByCategory.get(channel.parentCategoryId)
    if (existing) {
      existing.push(channel)
    } else {
      channelsByCategory.set(channel.parentCategoryId, [channel])
    }
  }

  const rootItems = channels.filter((channel) => (
    channel.type === 'category'
      || !channel.parentCategoryId
      || !categoryById.has(channel.parentCategoryId)
  ))

  const sections: BrowseChannelSection[] = []
  let rootCluster: Channel[] = []

  const flushRootCluster = () => {
    if (!rootCluster.length) {
      return
    }

    sections.push(buildClusterSection(rootCluster, sections.length))
    rootCluster = []
  }

  for (const item of rootItems) {
    if (item.type === 'category') {
      flushRootCluster()
      sections.push({
        id: `category:${item.id}`,
        title: item.name,
        sectionKind: 'category',
        collapsible: true,
        channels: channelsByCategory.get(item.id) ?? [],
      })
      continue
    }

    if (isSelectableChannel(item)) {
      rootCluster.push(item)
    }
  }

  flushRootCluster()

  return sections.length ? sections : [buildClusterSection(selectableChannels, 0)]
}

function buildClusterSection(
  channels: Channel[],
  index: number,
): BrowseChannelSection {
  return {
    id: `cluster:${index}`,
    title: 'Channels',
    sectionKind: 'cluster',
    collapsible: false,
    channels,
  }
}

function resolveSelectedGuild({
  guildById,
  orderedGuilds,
  selectedGuildId,
  selectedChannel,
}: {
  guildById: Map<string, Guild>
  orderedGuilds: Guild[]
  selectedGuildId?: string | null
  selectedChannel: Channel | null
}): Guild | null {
  if (selectedGuildId === null) {
    return null
  }

  if (selectedGuildId && guildById.has(selectedGuildId)) {
    return guildById.get(selectedGuildId) ?? null
  }

  if (selectedChannel && guildById.has(selectedChannel.guildId)) {
    return guildById.get(selectedChannel.guildId) ?? null
  }

  return orderedGuilds.find((guild) => guild.joined) ?? orderedGuilds[0] ?? null
}

function resolvePrimaryChannel({
  channels,
  selectedChannelId,
}: {
  channels: Channel[]
  selectedChannelId?: string | null
}): Channel | null {
  if (!channels.length) {
    return null
  }

  if (selectedChannelId) {
    const selectedChannel = channels.find((channel) => channel.id === selectedChannelId)
    if (selectedChannel) {
      return selectedChannel
    }
  }

  return channels.find((channel) => channel.type !== 'voice') ?? channels[0]
}

function usesStructuredLayout(channels: Channel[]): boolean {
  return channels.some((channel) => channel.type === 'category' || channel.parentCategoryId != null)
}

function isSelectableChannel(channel: Channel): channel is Channel & { type: Exclude<Channel['type'], 'category'> } {
  return channel.type !== 'category'
}

function compareBrowseChannels(left: Channel, right: Channel): number {
  const positionDelta = (left.position ?? Number.MAX_SAFE_INTEGER) - (right.position ?? Number.MAX_SAFE_INTEGER)
  if (positionDelta !== 0) {
    return positionDelta
  }

  if (left.type === 'category' || right.type === 'category') {
    if (left.type === right.type) {
      return left.name.localeCompare(right.name)
    }

    return left.type === 'category' ? -1 : 1
  }

  const typeDelta = CHANNEL_TYPE_PRIORITY[left.type] - CHANNEL_TYPE_PRIORITY[right.type]
  if (typeDelta !== 0) {
    return typeDelta
  }

  return left.name.localeCompare(right.name)
}
