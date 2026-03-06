import type { LayoutMode } from '../../constants/theme'
import { ServerColumnClassic } from './ServerColumnClassic'
import { ServerColumnString } from './ServerColumnString'

export interface ServerColumnProps {
  orderedGuilds: Array<{ guildId: unknown; name: string }>
  selectedGuildId: string | null
  onSelectGuild: (id: string) => void
  onHomeClick: () => void
  isDmMode: boolean
  onAddServer: () => void
  onLeaveGuild: (id: string) => void
  onDeleteGuild: (id: string) => void
  onInviteToGuild: (guildId: string) => void
  onViewGuildInfo: (guildId: string) => void
  onOpenGuildSettings: (guildId: string) => void
  ownedGuildIds: Set<string>
  onReorder: (ids: string[]) => void
  layoutMode?: LayoutMode
}

export type ServerColumnVariantProps = Omit<ServerColumnProps, 'layoutMode'>

export function ServerColumn({ layoutMode = 'classic', ...props }: ServerColumnProps) {
  if (layoutMode === 'string') {
    return <ServerColumnString {...props} />
  }

  return <ServerColumnClassic {...props} />
}

