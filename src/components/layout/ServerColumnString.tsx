import { useMemo, memo } from 'react'
import { toIdKey } from '../../lib/helpers'
import { avatarBytesToUrl } from '../../lib/avatarUtils'
import { ServerListPaneString, type GuildId } from '../guild/ServerListPane'
import type { ServerColumnVariantProps } from './ServerColumn'

export interface ServerColumnStringProps extends ServerColumnVariantProps {
  compact?: boolean
}

export const ServerColumnString = memo(function ServerColumnString({
  orderedGuilds,
  dmQuickEntries,
  selectedDmChannelId,
  onSelectDmChannel,
  selectedGuildId,
  onSelectGuild,
  onHomeClick,
  isDmMode,
  onAddServer,
  onLeaveGuild,
  onDeleteGuild,
  onInviteToGuild,
  onViewGuildInfo,
  onOpenGuildSettings,
  ownedGuildIds,
  onReorder,
  compact = false,
}: ServerColumnStringProps) {
  const guilds = useMemo(
    () => orderedGuilds.map((guild) => ({
      id: toIdKey(guild.guildId),
      name: guild.name,
      iconUrl: avatarBytesToUrl(guild.avatarBytes),
    })),
    [orderedGuilds],
  )

  return (
    <ServerListPaneString
      guilds={guilds}
      dmQuickEntries={dmQuickEntries}
      selectedDmChannelId={selectedDmChannelId}
      onSelectDmChannel={onSelectDmChannel}
      selectedGuildId={selectedGuildId ?? undefined}
      onSelectGuild={onSelectGuild as (id: GuildId) => void}
      onHomeClick={onHomeClick}
      isHomeSelected={isDmMode || !selectedGuildId}
      onAddServer={onAddServer}
      onLeaveGuild={onLeaveGuild as (id: GuildId) => void}
      onDeleteGuild={onDeleteGuild as (id: GuildId) => void}
      onInviteToGuild={onInviteToGuild as (id: GuildId) => void}
      onViewGuildInfo={onViewGuildInfo as (id: GuildId) => void}
      onOpenGuildSettings={onOpenGuildSettings as (id: GuildId) => void}
      ownedGuildIds={ownedGuildIds as Set<GuildId>}
      onReorder={onReorder}
      compact={compact}
    />
  )
})
