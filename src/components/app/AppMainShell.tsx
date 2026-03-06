/**
 * AppMainShell
 *
 * Renders the layout shell (WorkspaceShell / AppShell) and wires all layout
 * slot components based on the active layoutMode. Pure rendering concern —
 * no data-fetching or side-effects live here.
 */
import { ChannelColumn } from '../layout/ChannelColumn'
import { MessageArea } from '../layout/MessageArea'
import { MemberColumn } from '../layout/MemberColumn'
import { AppShell } from '../layout/AppShell'
import { WorkspaceShell } from '../layout/WorkspaceShell'
import { ServerColumnClassic } from '../layout/ServerColumnClassic'
import { ServerColumnString } from '../layout/ServerColumnString'
import { TopNavBarClassic } from '../layout/TopNavBarClassic'
import { TopNavBarString } from '../layout/TopNavBarString'
import { SidebarBottomClassic } from '../layout/SidebarBottomClassic'
import { SidebarBottomString } from '../layout/SidebarBottomString'
import { S_main } from '../../constants/appStyles'
import type { LayoutMode } from '../../constants/theme'
import type { ServerColumnVariantProps } from '../layout/ServerColumn'
import type { ChannelColumnProps } from '../layout/ChannelColumn'
import type { TopNavBarVariantProps } from '../layout/TopNavBar'
import type { MessageAreaProps } from '../layout/MessageArea'
import type { SidebarBottomVariantProps } from '../layout/SidebarBottom'
import type { MemberColumnProps } from '../layout/MemberColumn'

export interface AppMainShellProps {
  layoutMode: LayoutMode
  showMemberList: boolean
  serverColumn: ServerColumnVariantProps
  channelColumn: ChannelColumnProps
  topNav: TopNavBarVariantProps
  messageArea: MessageAreaProps
  sidebarBottom: SidebarBottomVariantProps
  memberColumn: MemberColumnProps
}

export function AppMainShell({
  layoutMode,
  showMemberList,
  serverColumn,
  channelColumn,
  topNav,
  messageArea,
  sidebarBottom,
  memberColumn,
}: AppMainShellProps) {
  const Shell = layoutMode === 'string' ? WorkspaceShell : AppShell
  const ServerColumnComponent = layoutMode === 'string' ? ServerColumnString : ServerColumnClassic
  const TopNavBarComponent = layoutMode === 'string' ? TopNavBarString : TopNavBarClassic
  const SidebarBottomComponent = layoutMode === 'string' ? SidebarBottomString : SidebarBottomClassic

  return (
    <main style={S_main}>
      <Shell
        serverColumn={<ServerColumnComponent {...serverColumn} />}
        channelColumn={<ChannelColumn {...channelColumn} />}
        showMemberList={showMemberList}
        topNav={<TopNavBarComponent {...topNav} />}
        messageArea={<MessageArea {...messageArea} />}
        inputArea={null}
        sidebarBottom={<SidebarBottomComponent {...sidebarBottom} />}
        memberColumn={<MemberColumn {...memberColumn} />}
      />
    </main>
  )
}
