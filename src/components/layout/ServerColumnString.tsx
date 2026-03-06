import { useMemo, memo } from 'react'
import { toIdKey } from '../../lib/helpers'
import { ServerListPaneString, type GuildId } from '../guild/ServerListPane'
import type { ServerColumnVariantProps } from './ServerColumn'

export const ServerColumnString = memo(function ServerColumnString({
  orderedGuilds,
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
}: ServerColumnVariantProps) {
  const guilds = useMemo(
    () => orderedGuilds.map((guild) => ({ id: toIdKey(guild.guildId), name: guild.name })),
    [orderedGuilds],
  )

  return (
    <ServerListPaneString
      guilds={guilds}
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
    />
  )
})
