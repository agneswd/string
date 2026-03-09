import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft } from 'lucide-react'

import { ChannelColumn } from '../../layout/ChannelColumn'
import { MemberColumn } from '../../layout/MemberColumn'
import { MessageArea } from '../../layout/MessageArea'
import { ServerColumnClassic } from '../../layout/ServerColumnClassic'
import { ServerColumnString } from '../../layout/ServerColumnString'
import { SidebarBottomClassic } from '../../layout/SidebarBottomClassic'
import { SidebarBottomString } from '../../layout/SidebarBottomString'
import { TopNavBarClassic } from '../../layout/TopNavBarClassic'
import { TopNavBarString } from '../../layout/TopNavBarString'
import { MobileBottomNav } from '../../layout/mobile/MobileBottomNav'
import { MobileSwipeShell } from '../../layout/mobile/MobileSwipeShell'
import { MobileUserSection } from '../../layout/mobile/MobileUserSection'
import { VoicePanel } from '../../voice/VoicePanel'
import { S_main } from '../../../constants/appStyles'
import type { LayoutMode } from '../../../constants/theme'
import type { ChannelColumnProps } from '../../layout/ChannelColumn'
import type { MemberColumnProps } from '../../layout/MemberColumn'
import type { MessageAreaProps } from '../../layout/MessageArea'
import type { ServerColumnVariantProps } from '../../layout/ServerColumn'
import type { SidebarBottomVariantProps } from '../../layout/SidebarBottom'
import type { TopNavBarVariantProps } from '../../layout/TopNavBar'
import type { ProfileSettingsModalProps } from '../../modals/ProfileSettingsModal'
import { useMobileShellController } from './useMobileShellController'

export interface AppMobileShellProps {
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

export function AppMobileShell({
  layoutMode,
  showMemberList,
  serverColumn,
  channelColumn,
  topNav,
  messageArea,
  sidebarBottom,
  mobileProfile,
  memberColumn,
}: AppMobileShellProps) {
  const dismissKeyboard = () => {
    const activeElement = document.activeElement
    if (!(activeElement instanceof HTMLElement)) {
      return
    }

    const tagName = activeElement.tagName.toLowerCase()
    const isEditable = tagName === 'input' || tagName === 'textarea' || activeElement.isContentEditable
    if (isEditable) {
      activeElement.blur()
    }
  }

  const ServerColumnComponent = layoutMode === 'string' ? ServerColumnString : ServerColumnClassic
  const TopNavBarComponent = layoutMode === 'string' ? TopNavBarString : TopNavBarClassic
  const SidebarBottomComponent = layoutMode === 'string' ? SidebarBottomString : SidebarBottomClassic
  const shouldShowMemberList = showMemberList && !topNav.isHomeView
  const activeSelectionKey = messageArea.selectedDmChannelId
    ? `dm:${messageArea.selectedDmChannelId}`
    : channelColumn.selectedTextChannelId
      ? `channel:${channelColumn.selectedTextChannelId}`
      : serverColumn.selectedGuildId
        ? `guild:${serverColumn.selectedGuildId}`
        : 'home'
  const previousSelectionKeyRef = useRef(activeSelectionKey)
  const [isSwitchingContentTarget, setIsSwitchingContentTarget] = useState(false)
  const hasResolvedMobileContent = Boolean(messageArea.selectedDmChannelId || channelColumn.selectedTextChannelId)
  const hasActiveMobileContent = hasResolvedMobileContent && !isSwitchingContentTarget
  const hasMobileMembersPane = shouldShowMemberList && hasActiveMobileContent

  useEffect(() => {
    if (isSwitchingContentTarget && activeSelectionKey !== previousSelectionKeyRef.current) {
      setIsSwitchingContentTarget(false)
    }

    previousSelectionKeyRef.current = activeSelectionKey
  }, [activeSelectionKey, isSwitchingContentTarget])

  const beginContentTargetSwitch = (nextSelectionKey: string) => {
    if (nextSelectionKey === activeSelectionKey) {
      return
    }

    previousSelectionKeyRef.current = activeSelectionKey
    setIsSwitchingContentTarget(true)
  }

  const mobileShell = useMobileShellController({
    isMobile: true,
    isHomeView: topNav.isHomeView,
    selectedGuildId: serverColumn.selectedGuildId,
    hasActiveContent: hasActiveMobileContent,
    hasMembersPane: hasMobileMembersPane,
  })

  const topNavProps = {
    ...topNav,
    showMemberList: mobileShell.activePane === 'members',
    onToggleMemberList: mobileShell.toggleMembers,
  }

  const serverColumnProps = {
    ...serverColumn,
    onSelectDmChannel: (id: string) => {
      if (String(id) === String(serverColumn.selectedDmChannelId ?? '')) {
        return
      }

      beginContentTargetSwitch(`dm:${id}`)
      serverColumn.onSelectDmChannel?.(id)
      mobileShell.openContent()
    },
    onSelectGuild: (id: string) => {
      if (!serverColumn.isDmMode && String(id) === String(serverColumn.selectedGuildId ?? '')) {
        return
      }

      beginContentTargetSwitch(`guild:${id}`)
      serverColumn.onSelectGuild(id)
      dismissKeyboard()
      mobileShell.showBrowse()
    },
    onHomeClick: () => {
      if (topNav.isHomeView) {
        return
      }

      serverColumn.onHomeClick()
      dismissKeyboard()
      mobileShell.showBrowse()
    },
    onAddServer: () => {
      serverColumn.onAddServer()
      dismissKeyboard()
      mobileShell.showBrowse()
    },
  }

  const channelColumnProps = {
    ...channelColumn,
    onSelectDmChannel: (id: string | number) => {
      beginContentTargetSwitch(`dm:${id}`)
      channelColumn.onSelectDmChannel(id)
      mobileShell.openContent()
    },
    onShowFriends: () => {
      channelColumn.onShowFriends()
      dismissKeyboard()
      mobileShell.showFriends()
    },
    onSelectChannel: (id: string | number) => {
      beginContentTargetSwitch(`channel:${id}`)
      channelColumn.onSelectChannel(id)
      const selectedChannel = channelColumn.channels.find((channel) => String(channel.id) === String(id))
      if (selectedChannel?.kind !== 'voice') {
        mobileShell.openContent()
      }
    },
  }

  const mobileServerColumnNode = layoutMode === 'string'
    ? <ServerColumnString {...serverColumnProps} compact />
    : <ServerColumnClassic {...serverColumnProps} />
  const channelColumnNode = <ChannelColumn {...channelColumnProps} />
  const memberColumnNode = <MemberColumn {...memberColumn} />
  const messageAreaNode = (
    <MessageArea
      {...messageArea}
      isMobile
      onStartDm={(friendId) => {
        beginContentTargetSwitch(`dm:friend:${friendId}`)
        messageArea.onStartDm(friendId)
        mobileShell.openContent()
      }}
    />
  )
  const contentBodyNode = isSwitchingContentTarget
    ? <div style={{ flex: 1, minHeight: 0, backgroundColor: 'var(--bg-panel)' }} />
    : messageAreaNode
  const sidebarBottomNode = <SidebarBottomComponent {...sidebarBottom} />

  const showMobileVoiceOverlay = Boolean(
    sidebarBottom.showVoicePanel
    && (sidebarBottom.currentVoiceState || sidebarBottom.outgoingCall)
    && (mobileShell.activePane === 'navigation' || (mobileShell.activePane === 'content' && topNav.isHomeView)),
  )

  const mobileServerWidth = '72px'
  const mobileServerBackground = 'var(--bg-sidebar-dark)'

  const mobileNavigationPane = useMemo(
    () => (
      <div style={{ display: 'flex', height: '100%', minHeight: 0, width: '100%', overflow: 'hidden', boxSizing: 'border-box' }}>
        {mobileShell.navigationSection === 'browse' ? (
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
        ) : mobileShell.navigationSection === 'friends' ? (
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
      messageAreaNode,
      mobileProfile.currentUser,
      mobileProfile.onSetStatus,
      mobileProfile.onUpdateProfile,
      mobileServerBackground,
      mobileServerColumnNode,
      mobileServerWidth,
      mobileShell.navigationSection,
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
        onClick={() => {
          dismissKeyboard()
          mobileShell.showBrowse()
        }}
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
        onClick={mobileShell.openContent}
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

  const mobileFooter = (
    <div style={{ display: 'flex', flexDirection: 'column', position: 'relative', padding: '0.5rem 0.75rem', backgroundColor: 'var(--bg-panel)', borderTop: '1px solid var(--border-subtle)' }}>
      {showMobileVoiceOverlay && (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            bottom: 'calc(100% - 12px)',
            pointerEvents: 'none',
            zIndex: 2,
          }}
        >
          <div style={{ pointerEvents: 'auto', maxWidth: 320 }}>
            <VoicePanel
              connected={true}
              compact={true}
              streaming={sidebarBottom.currentVoiceState?.isStreaming ?? false}
              statusLabel={sidebarBottom.outgoingCall && !sidebarBottom.currentVoiceState ? `Calling ${sidebarBottom.outgoingCallLabel ?? 'user'}…` : undefined}
              onLeave={sidebarBottom.onLeave}
              remoteSharersCount={sidebarBottom.remoteSharersCount}
            />
          </div>
        </div>
      )}
      <MobileBottomNav
        activeTab={mobileShell.activePane === 'navigation' ? mobileShell.navigationSection : null}
        onBrowse={() => {
          dismissKeyboard()
          mobileShell.showBrowse()
        }}
        onFriends={() => {
          serverColumn.onHomeClick()
          channelColumn.onShowFriends()
          dismissKeyboard()
          mobileShell.showFriends()
        }}
        onYou={mobileShell.showYou}
      />
    </div>
  )

  return (
    <main style={{ ...S_main, position: 'relative' }}>
      <MobileSwipeShell
        navigationPane={mobileNavigationPane}
        navigationFooter={mobileFooter}
        contentHeader={mobileContentHeader}
        contentBody={contentBodyNode}
        contentFooter={null}
        membersHeader={mobileMembersHeader}
        membersPane={mobileMembersPane}
        activePane={mobileShell.activePane}
        onActivePaneChange={(pane) => {
          if (pane === 'navigation') {
            dismissKeyboard()
          }
          mobileShell.setPane(pane)
        }}
        canNavigateToContent={mobileShell.canNavigateToContent}
        canNavigateToMembers={mobileShell.canNavigateToMembers}
      />

      <div style={{ display: 'none' }}>{sidebarBottomNode}</div>
    </main>
  )
}