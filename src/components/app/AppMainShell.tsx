/**
 * AppMainShell
 *
 * Renders the layout shell (WorkspaceShell / AppShell) and wires all layout
 * slot components based on the active layoutMode. Pure rendering concern —
 * no data-fetching or side-effects live here.
 */
import { useEffect, useState } from 'react'

import { ChannelColumn } from '../layout/ChannelColumn'
import { MessageArea } from '../layout/MessageArea'
import { MemberColumn } from '../layout/MemberColumn'
import { AppShell } from '../layout/AppShell'
import { WorkspaceShell } from '../layout/WorkspaceShell'
import { ServerColumnClassic } from '../layout/ServerColumnClassic'
import { ServerColumnString } from '../layout/ServerColumnString'
import { TopNavBarClassic } from '../layout/TopNavBarClassic'
import { SidebarBottomClassic } from '../layout/SidebarBottomClassic'
import { TopNavBarString } from '../layout/TopNavBarString'
import { SidebarBottomString } from '../layout/SidebarBottomString'
import { AppMobileShell } from './mobile/AppMobileShell'
import { S_main } from '../../constants/appStyles'
import type { LayoutMode } from '../../constants/theme'
import type { ServerColumnVariantProps } from '../layout/ServerColumn'
import type { ChannelColumnProps } from '../layout/ChannelColumn'
import type { TopNavBarVariantProps } from '../layout/TopNavBar'
import type { MessageAreaProps } from '../layout/MessageArea'
import type { SidebarBottomVariantProps } from '../layout/SidebarBottom'
import type { MemberColumnProps } from '../layout/MemberColumn'
import type { ProfileSettingsModalProps } from '../modals/ProfileSettingsModal'

export interface AppMainShellProps {
  layoutMode: LayoutMode
  showMemberList: boolean
  serverColumn: ServerColumnVariantProps
  channelColumn: ChannelColumnProps
  topNav: TopNavBarVariantProps
  messageArea: MessageAreaProps
  sidebarBottom: SidebarBottomVariantProps
  mobileProfile: Pick<ProfileSettingsModalProps, 'currentUser' | 'onUpdateProfile' | 'onSetStatus'>
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
  mobileProfile,
  memberColumn,
}: AppMainShellProps) {
  const Shell = layoutMode === 'string' ? WorkspaceShell : AppShell
  const ServerColumnComponent = layoutMode === 'string' ? ServerColumnString : ServerColumnClassic
  const TopNavBarComponent = layoutMode === 'string' ? TopNavBarString : TopNavBarClassic
  const SidebarBottomComponent = layoutMode === 'string' ? SidebarBottomString : SidebarBottomClassic
  const shouldShowMemberList = showMemberList && !topNav.isHomeView
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 900px)')
    const applyMatch = (matches: boolean) => {
      setIsMobile(matches)
    }

    applyMatch(mediaQuery.matches)
    const handleChange = (event: MediaQueryListEvent) => applyMatch(event.matches)
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  const serverColumnNode = <ServerColumnComponent {...serverColumn} />
  const channelColumnNode = <ChannelColumn {...channelColumn} />
  const sidebarBottomNode = <SidebarBottomComponent {...sidebarBottom} />
  const memberColumnNode = <MemberColumn {...memberColumn} />
  const messageAreaNode = <MessageArea {...messageArea} />
  const desktopTopNavNode = <TopNavBarComponent {...topNav} />

  if (isMobile) {
    return (
      <AppMobileShell
        layoutMode={layoutMode}
        showMemberList={showMemberList}
        serverColumn={serverColumn}
        channelColumn={channelColumn}
        topNav={topNav}
        messageArea={messageArea}
        sidebarBottom={sidebarBottom}
        mobileProfile={mobileProfile}
        memberColumn={memberColumn}
      />
    )
  }

  return (
    <main style={S_main}>
      <Shell
        serverColumn={serverColumnNode}
        channelColumn={channelColumnNode}
        showMemberList={shouldShowMemberList}
        topNav={desktopTopNavNode}
        messageArea={messageAreaNode}
        inputArea={null}
        sidebarBottom={sidebarBottomNode}
        memberColumn={memberColumnNode}
      />
    </main>
  )
}
