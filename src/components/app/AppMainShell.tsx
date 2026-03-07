/**
 * AppMainShell
 *
 * Renders the layout shell (WorkspaceShell / AppShell) and wires all layout
 * slot components based on the active layoutMode. Pure rendering concern —
 * no data-fetching or side-effects live here.
 */
import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft } from 'lucide-react'

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
import { MobileBottomNav } from '../layout/mobile/MobileBottomNav'
import { MobileUserSection } from '../layout/mobile/MobileUserSection'
import { MobileSwipeShell } from '../layout/mobile/MobileSwipeShell'
import { VoicePanel } from '../voice/VoicePanel'
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
  const hasActiveMobileContent = Boolean(messageArea.selectedDmChannelId || messageArea.selectedTextChannel)
  const [isMobile, setIsMobile] = useState(false)
  const [mobilePane, setMobilePane] = useState<'navigation' | 'content' | 'members'>('navigation')
  const [mobileNavigationSection, setMobileNavigationSection] = useState<'browse' | 'friends' | 'you'>('browse')
  const hasMobileMembersPane = shouldShowMemberList && hasActiveMobileContent

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 900px)')
    const applyMatch = (matches: boolean) => {
      setIsMobile(matches)
      if (!matches) {
        setMobileNavigationSection('browse')
      }
    }

    applyMatch(mediaQuery.matches)
    const handleChange = (event: MediaQueryListEvent) => applyMatch(event.matches)
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  useEffect(() => {
    if (!isMobile) return

    if (mobilePane === 'members' && !hasMobileMembersPane) {
      setMobilePane('content')
    }
  }, [hasMobileMembersPane, isMobile, mobilePane])

  // Fallback to navigation if the user somehow ends up in the content view without a selected channel
  useEffect(() => {
    if (!isMobile || mobilePane === 'navigation') return
    if (topNav.isHomeView || messageArea.selectedDmChannelId || messageArea.selectedTextChannel) return
    
    setMobilePane('navigation')
  }, [isMobile, messageArea.selectedDmChannelId, messageArea.selectedTextChannel, mobilePane, topNav.isHomeView])

  // When switching to a new guild, reset back to browse/navigation if there's no active content
  useEffect(() => {
    if (!isMobile || !serverColumn.selectedGuildId) return

    // If we just clicked a server and there's no active channel for it
    if (!hasActiveMobileContent) {
      setMobileNavigationSection('browse')
      if (mobilePane !== 'navigation') {
        setMobilePane('navigation')
      }
    }
  }, [hasActiveMobileContent, isMobile, serverColumn.selectedGuildId])

  const topNavProps = {
    ...topNav,
    showMemberList: mobilePane === 'members',
    onToggleMemberList: () => {
      if (!hasMobileMembersPane) {
        return
      }

      setMobilePane((current) => (current === 'members' ? 'content' : 'members'))
    },
  }

  const serverColumnProps = {
    ...serverColumn,
    onSelectGuild: (id: string) => {
      serverColumn.onSelectGuild(id)
      if (isMobile) {
        setMobileNavigationSection('browse')
        setMobilePane('navigation')
      }
    },
    onHomeClick: () => {
      serverColumn.onHomeClick()
      if (isMobile) {
        setMobileNavigationSection('browse')
        setMobilePane('navigation')
      }
    },
    onAddServer: () => {
      serverColumn.onAddServer()
      if (isMobile) {
        setMobileNavigationSection('browse')
        setMobilePane('navigation')
      }
    },
  }

  const channelColumnProps = {
    ...channelColumn,
    onSelectDmChannel: (id: string | number) => {
      channelColumn.onSelectDmChannel(id)
      if (isMobile) {
        setMobilePane('content')
      }
    },
    onShowFriends: () => {
      channelColumn.onShowFriends()
      if (isMobile) {
        setMobileNavigationSection('friends')
        setMobilePane('navigation')
      }
    },
    onSelectChannel: (id: string | number) => {
      channelColumn.onSelectChannel(id)
      const selectedChannel = channelColumn.channels.find((channel) => String(channel.id) === String(id))
      if (isMobile && selectedChannel?.kind !== 'voice') {
        setMobilePane('content')
      }
    },
  }

  const serverColumnNode = <ServerColumnComponent {...serverColumnProps} />
  const mobileServerColumnNode = layoutMode === 'string'
    ? <ServerColumnString {...serverColumnProps} compact />
    : <ServerColumnClassic {...serverColumnProps} />
  const channelColumnNode = <ChannelColumn {...channelColumnProps} />
  const sidebarBottomNode = <SidebarBottomComponent {...sidebarBottom} />
  const memberColumnNode = <MemberColumn {...memberColumn} />
  const messageAreaNode = <MessageArea {...messageArea} />
  const desktopTopNavNode = <TopNavBarComponent {...topNav} />

  const canSwipeToContent = hasActiveMobileContent
  const showMobileVoiceOverlay = Boolean(sidebarBottom.showVoicePanel && sidebarBottom.currentVoiceState && (mobilePane === 'navigation' || (mobilePane === 'content' && topNav.isHomeView)))

  const mobileServerWidth = '72px'
  const mobileServerBackground = 'var(--bg-sidebar-dark)'

  const mobileNavigationPane = useMemo(
    () => (
      <div style={{ display: 'flex', height: '100%', minHeight: 0, width: '100%', overflow: 'hidden', paddingBottom: showMobileVoiceOverlay ? '72px' : 0, boxSizing: 'border-box' }}>
        {mobileNavigationSection === 'browse' ? (
          <>
            <aside
              style={{
                width: mobileServerWidth,
                flexShrink: 0,
                backgroundColor: mobileServerBackground,
                borderRight: '1px solid var(--border-subtle)',
                overflowY: 'auto',
                minHeight: 0,
              }}
            >
              {mobileServerColumnNode}
            </aside>

            <div
              style={{
                flex: 1,
                minWidth: 0,
                minHeight: 0,
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'var(--bg-sidebar-light)',
              }}
            >
              <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
                {channelColumnNode}
              </div>
            </div>
          </>
        ) : mobileNavigationSection === 'friends' ? (
          <div
            style={{
              flex: 1,
              minWidth: 0,
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: 'var(--bg-panel)',
              overflow: 'hidden',
            }}
          >
            {messageAreaNode}
          </div>
        ) : (
          <div style={{ flex: 1, minWidth: 0, minHeight: 0 }}>
            <MobileUserSection
              sidebarBottom={sidebarBottom}
              currentUser={mobileProfile.currentUser}
              onUpdateProfile={mobileProfile.onUpdateProfile}
              onSetStatus={mobileProfile.onSetStatus}
            />
          </div>
        )}
      </div>
    ),
    [
      channelColumnNode,
      mobileNavigationSection,
      mobileProfile.currentUser,
      mobileProfile.onSetStatus,
      mobileProfile.onUpdateProfile,
      messageAreaNode,
      mobileServerBackground,
      mobileServerWidth,
      mobileServerColumnNode,
      showMobileVoiceOverlay,
      sidebarBottom,
    ],
  )

  const mobileContentHeader = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', minWidth: 0 }}>
      <button
        type="button"
        aria-label="Back to navigation"
        title="Back"
        onClick={() => setMobilePane('navigation')}
        style={{
          minWidth: 32,
          height: 32,
          border: '1px solid var(--border-subtle)',
          borderRadius: 8,
          padding: '0 10px 0 8px',
          backgroundColor: 'var(--bg-hover)',
          color: 'var(--text-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        <ChevronLeft size={18} />
        <span style={{ fontSize: 12, fontWeight: 600 }}>Back</span>
      </button>

      <div style={{ minWidth: 0, flex: 1, display: 'flex' }}>
        <TopNavBarComponent {...topNavProps} />
      </div>
    </div>
  )

  const mobileMembersHeader = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', minWidth: 0 }}>
      <button
        type="button"
        aria-label="Back to conversation"
        title="Back"
        onClick={() => setMobilePane('content')}
        style={{
          minWidth: 32,
          height: 32,
          border: '1px solid var(--border-subtle)',
          borderRadius: 8,
          padding: '0 10px 0 8px',
          backgroundColor: 'var(--bg-hover)',
          color: 'var(--text-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        <ChevronLeft size={18} />
        <span style={{ fontSize: 12, fontWeight: 600 }}>Back</span>
      </button>

      <div style={{ minWidth: 0, flex: 1, display: 'flex', alignItems: 'center' }}>
        <strong style={{ fontSize: 14, color: 'var(--text-primary)' }}>Members</strong>
      </div>
    </div>
  )

  const mobileMembersPane = hasMobileMembersPane ? (
    <div style={{ height: '100%', backgroundColor: 'var(--bg-sidebar-light)', overflowY: 'auto' }}>
      {memberColumnNode}
    </div>
  ) : null

  const mobileBottomNav = (
    <MobileBottomNav
      activeTab={mobilePane === 'navigation' ? mobileNavigationSection : null}
      onBrowse={() => {
        setMobileNavigationSection('browse')
        setMobilePane('navigation')
      }}
      onFriends={() => {
        serverColumn.onHomeClick()
        channelColumn.onShowFriends()
        setMobileNavigationSection('friends')
        setMobilePane('navigation')
      }}
      onYou={() => {
        setMobileNavigationSection('you')
        setMobilePane('navigation')
      }}
    />
  )

  const mobileFooter = (
    <div style={{ display: 'flex', flexDirection: 'column', padding: '0.75rem', backgroundColor: 'var(--bg-panel)', borderTop: '1px solid var(--border-subtle)' }}>
      {mobileBottomNav}
    </div>
  )

  if (isMobile) {
    return (
      <main style={{ ...S_main, position: 'relative' }}>
        <MobileSwipeShell
          navigationPane={mobileNavigationPane}
          navigationFooter={mobileFooter}
          contentHeader={mobileContentHeader}
          contentBody={messageAreaNode}
          contentFooter={null}
          membersHeader={mobileMembersHeader}
          membersPane={mobileMembersPane}
          activePane={mobilePane}
          onActivePaneChange={setMobilePane}
          canNavigateToContent={canSwipeToContent}
          canNavigateToMembers={hasMobileMembersPane}
        />

        {showMobileVoiceOverlay && (
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: '72px',
              padding: '0 0.75rem 0.5rem',
              pointerEvents: 'none',
              zIndex: 5,
            }}
          >
            <div style={{ pointerEvents: 'auto' }}>
              <VoicePanel
                connected={true}
                streaming={sidebarBottom.currentVoiceState?.isStreaming ?? false}
                onLeave={sidebarBottom.onLeave}
                remoteSharersCount={sidebarBottom.remoteSharersCount}
                onStartSharing={sidebarBottom.onStartSharing}
                onStopSharing={sidebarBottom.onStopSharing}
              />
            </div>
          </div>
        )}
      </main>
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
