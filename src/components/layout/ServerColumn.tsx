import { useMemo, memo } from 'react'
import { toIdKey } from '../../lib/helpers'
import { ServerListPane } from '../guild/ServerListPane'
import type { GuildId } from '../guild/ServerListPane'

export interface ServerColumnProps {
  orderedGuilds: Array<{ guildId: any; name: string }>
  selectedGuildId: string | null
  onSelectGuild: (id: string) => void
  onHomeClick: () => void
  isDmMode: boolean
  onAddServer: () => void
  onLeaveGuild: (id: string) => void
  onDeleteGuild: (id: string) => void
  onInviteToGuild: (guildId: string) => void
  ownedGuildIds: Set<string>
  onReorder: (ids: string[]) => void
}

export const ServerColumn = memo(function ServerColumn({
  orderedGuilds,
  selectedGuildId,
  onSelectGuild,
  onHomeClick,
  isDmMode,
  onAddServer,
  onLeaveGuild,
  onDeleteGuild,
  onInviteToGuild,
  ownedGuildIds,
  onReorder,
}: ServerColumnProps) {
  const guilds = useMemo(
    () => orderedGuilds.map((guild) => ({ id: toIdKey(guild.guildId), name: guild.name })),
    [orderedGuilds],
  )

  return (
    <ServerListPane
      guilds={guilds}
      selectedGuildId={selectedGuildId ?? undefined}
      onSelectGuild={onSelectGuild as (id: GuildId) => void}
      onHomeClick={onHomeClick}
      isHomeSelected={isDmMode || !selectedGuildId}
      onAddServer={onAddServer}
      onLeaveGuild={onLeaveGuild as (id: GuildId) => void}
      onDeleteGuild={onDeleteGuild as (id: GuildId) => void}
      onInviteToGuild={onInviteToGuild as (id: GuildId) => void}
      ownedGuildIds={ownedGuildIds as Set<GuildId>}
      onReorder={onReorder}
    />
  )
})
