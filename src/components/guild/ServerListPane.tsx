import type { LayoutMode } from '../../constants/theme'
import { ServerListPaneClassic } from './ServerListPaneClassic'
import { ServerListPaneString } from './ServerListPaneString'
import type { GuildId, GuildListItem, ServerListPaneVariantProps } from './ServerListPane.shared'

export type { GuildId, GuildListItem }

export interface ServerListPaneProps extends ServerListPaneVariantProps {
  layoutMode?: LayoutMode
}
export type ServerListPaneCompatProps = ServerListPaneVariantProps & ServerListPaneProps

export { ServerListPaneClassic, ServerListPaneString }

export function ServerListPane({ layoutMode = 'classic', ...props }: ServerListPaneCompatProps) {
  if (layoutMode === 'string') {
    return <ServerListPaneString {...props} />
  }

  return <ServerListPaneClassic {...props} />
}
