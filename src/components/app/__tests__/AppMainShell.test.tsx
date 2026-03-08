import { describe, expect, it, beforeEach, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'

const swipeShellSpy = vi.fn()

vi.mock('../../layout/ChannelColumn', () => ({
  ChannelColumn: ({ onShowFriends }: { onShowFriends?: () => void }) => (
    <button type="button" onClick={onShowFriends}>channel column</button>
  ),
}))

vi.mock('../../layout/MessageArea', () => ({
  MessageArea: ({ selectedDmChannelId, selectedTextChannel, onStartDm }: { selectedDmChannelId?: string; selectedTextChannel?: { name?: string } | null; onStartDm?: (friendId: string) => void }) => (
    <div>
      message area
      <span>{selectedDmChannelId ?? selectedTextChannel?.name ?? 'none'}</span>
      <button type="button" onClick={() => onStartDm?.('friend-1')}>start dm</button>
    </div>
  ),
}))

vi.mock('../../layout/MemberColumn', () => ({
  MemberColumn: () => <div>member column</div>,
}))

vi.mock('../../layout/AppShell', () => ({
  AppShell: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock('../../layout/WorkspaceShell', () => ({
  WorkspaceShell: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock('../../layout/ServerColumnClassic', () => ({
  ServerColumnClassic: () => <div>server classic</div>,
}))

vi.mock('../../layout/ServerColumnString', () => ({
  ServerColumnString: ({ onSelectGuild }: { onSelectGuild?: (id: string) => void }) => (
    <button type="button" onClick={() => onSelectGuild?.('guild-1')}>server string</button>
  ),
}))

vi.mock('../../layout/TopNavBarClassic', () => ({
  TopNavBarClassic: () => <div>top classic</div>,
}))

vi.mock('../../layout/TopNavBarString', () => ({
  TopNavBarString: () => <div>top string</div>,
}))

vi.mock('../../layout/SidebarBottomClassic', () => ({
  SidebarBottomClassic: () => <div>sidebar classic</div>,
}))

vi.mock('../../layout/SidebarBottomString', () => ({
  SidebarBottomString: () => <div>sidebar string</div>,
}))

vi.mock('../../layout/mobile/MobileBottomNav', () => ({
  MobileBottomNav: ({ onFriends, onBrowse }: { onFriends?: () => void; onBrowse?: () => void }) => (
    <div>
      <button type="button" onClick={onFriends}>friends tab</button>
      <button type="button" onClick={onBrowse}>browse tab</button>
    </div>
  ),
}))

vi.mock('../../layout/mobile/MobileUserSection', () => ({
  MobileUserSection: () => <div>mobile user section</div>,
}))

vi.mock('../../layout/mobile/MobileSwipeShell', () => ({
  MobileSwipeShell: (props: Record<string, unknown>) => {
    swipeShellSpy(props)
    return (
      <div data-testid="mobile-swipe-shell">
        <button type="button" onClick={() => (props.onActivePaneChange as ((pane: 'content') => void) | undefined)?.('content')}>go content</button>
        <div data-testid="active-pane">{String(props.activePane)}</div>
        <div data-testid="can-members">{String(props.canNavigateToMembers)}</div>
        <div>{props.navigationPane as React.ReactNode}</div>
        <div>{props.navigationFooter as React.ReactNode}</div>
      </div>
    )
  },
}))

vi.mock('../../voice/VoicePanel', () => ({
  VoicePanel: () => <div>voice panel</div>,
}))

import { AppMainShell } from '../AppMainShell'

beforeEach(() => {
  swipeShellSpy.mockReset()
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(() => ({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  })
})

describe('AppMainShell mobile member gating', () => {
  it('does not expose the members pane on mobile until a DM or text channel is actually open', () => {
    render(
      <AppMainShell
        layoutMode="string"
        showMemberList={true}
        serverColumn={{
          orderedGuilds: [],
          selectedGuildId: 'guild-1',
          onSelectGuild: vi.fn(),
          onHomeClick: vi.fn(),
          isDmMode: false,
          onAddServer: vi.fn(),
          onLeaveGuild: vi.fn(),
          onDeleteGuild: vi.fn(),
          onInviteToGuild: vi.fn(),
          onViewGuildInfo: vi.fn(),
          onOpenGuildSettings: vi.fn(),
          ownedGuildIds: new Set(),
          onReorder: vi.fn(),
        }}
        channelColumn={{
          isDmMode: false,
          dmListItems: [],
          onSelectDmChannel: vi.fn(),
          onLeaveDmChannel: vi.fn(),
          onShowFriends: vi.fn(),
          activeCallChannelIds: new Set(),
          channels: [],
          onSelectChannel: vi.fn(),
          onCreateChannel: vi.fn(),
          onViewScreenShare: vi.fn(),
          locallyMutedUsers: new Set(),
          voiceUserVolumes: {},
          onToggleLocalMuteUser: vi.fn(),
          onSetVoiceUserVolume: vi.fn(),
          getAvatarUrl: vi.fn(),
        } as never}
        topNav={{
          isDmMode: false,
          isHomeView: false,
          showMemberList: true,
          onToggleMemberList: vi.fn(),
          onInitiateDmCall: vi.fn(),
        } as never}
        messageArea={{
          selectedDmChannelId: undefined,
          selectedTextChannel: undefined,
        } as never}
        sidebarBottom={{
          showVoicePanel: false,
          currentVoiceState: null,
          onLeave: vi.fn(),
          remoteSharersCount: 0,
          onStartSharing: vi.fn(),
          onStopSharing: vi.fn(),
        } as never}
        mobileProfile={{
          currentUser: null,
          onUpdateProfile: vi.fn(async () => { }),
          onSetStatus: vi.fn(),
        }}
        memberColumn={{
          isDmMode: false,
          friends: [],
          memberListItems: [],
          getAvatarUrl: vi.fn(),
          usersByIdentity: new Map(),
          onViewProfile: vi.fn(),
        } as never}
      />,
    )

    expect(screen.getByTestId('mobile-swipe-shell')).toBeTruthy()
    expect(swipeShellSpy).toHaveBeenCalled()
    const props = swipeShellSpy.mock.calls.at(-1)?.[0] as { canNavigateToMembers: boolean; membersPane: unknown }
    expect(props.canNavigateToMembers).toBe(false)
    expect(props.membersPane).toBeNull()
  })

  it('hard-resets back to browse navigation when opening a guild after an active DM on mobile', () => {
    function Harness() {
      const [selectedGuildId, setSelectedGuildId] = useState<string | null>(null)
      const [selectedDmChannelId, setSelectedDmChannelId] = useState<string | undefined>('dm-1')

      return (
        <AppMainShell
          layoutMode="string"
          showMemberList={true}
          serverColumn={{
            orderedGuilds: [],
            selectedGuildId,
            onSelectGuild: (id) => {
              setSelectedGuildId(id)
              setSelectedDmChannelId(undefined)
            },
            onHomeClick: () => {
              setSelectedGuildId(null)
              setSelectedDmChannelId(undefined)
            },
            isDmMode: selectedDmChannelId !== undefined,
            onAddServer: vi.fn(),
            onLeaveGuild: vi.fn(),
            onDeleteGuild: vi.fn(),
            onInviteToGuild: vi.fn(),
            onViewGuildInfo: vi.fn(),
            onOpenGuildSettings: vi.fn(),
            ownedGuildIds: new Set(),
            onReorder: vi.fn(),
          }}
          channelColumn={{
            isDmMode: selectedDmChannelId !== undefined,
            dmListItems: [],
            selectedDmChannelId,
            onSelectDmChannel: vi.fn(),
            onLeaveDmChannel: vi.fn(),
            onShowFriends: () => setSelectedDmChannelId(undefined),
            activeCallChannelIds: new Set(),
            channels: [],
            onSelectChannel: vi.fn(),
            onCreateChannel: vi.fn(),
            onViewScreenShare: vi.fn(),
            locallyMutedUsers: new Set(),
            voiceUserVolumes: {},
            onToggleLocalMuteUser: vi.fn(),
            onSetVoiceUserVolume: vi.fn(),
            getAvatarUrl: vi.fn(),
          } as never}
          topNav={{
            isDmMode: selectedDmChannelId !== undefined,
            isHomeView: false,
            showMemberList: true,
            onToggleMemberList: vi.fn(),
            onInitiateDmCall: vi.fn(),
          } as never}
          messageArea={{
            selectedDmChannelId,
            selectedTextChannel: undefined,
          } as never}
          sidebarBottom={{
            showVoicePanel: false,
            currentVoiceState: null,
            onLeave: vi.fn(),
            remoteSharersCount: 0,
            onStartSharing: vi.fn(),
            onStopSharing: vi.fn(),
          } as never}
          mobileProfile={{
            currentUser: null,
            onUpdateProfile: vi.fn(async () => { }),
            onSetStatus: vi.fn(),
          }}
          memberColumn={{
            isDmMode: selectedDmChannelId !== undefined,
            friends: [],
            memberListItems: [],
            getAvatarUrl: vi.fn(),
            usersByIdentity: new Map(),
            onViewProfile: vi.fn(),
          } as never}
        />
      )
    }

    render(<Harness />)

    fireEvent.click(screen.getByRole('button', { name: /go content/i }))
    fireEvent.click(screen.getByRole('button', { name: /server string/i }))

    expect(screen.getByTestId('active-pane').textContent).toBe('navigation')
    expect(screen.getByTestId('can-members').textContent).toBe('false')
  })

  it('clamps a stale content pane back to navigation when a guild is selected without an active conversation', () => {
    function Harness() {
      const [selectedGuildId, setSelectedGuildId] = useState<string | null>(null)
      const [selectedDmChannelId, setSelectedDmChannelId] = useState<string | undefined>('dm-1')

      return (
        <>
          <button
            type="button"
            onClick={() => {
              setSelectedGuildId('guild-1')
              setSelectedDmChannelId(undefined)
            }}
          >
            external transition
          </button>

          <AppMainShell
            layoutMode="string"
            showMemberList={true}
            serverColumn={{
              orderedGuilds: [],
              selectedGuildId,
              onSelectGuild: setSelectedGuildId,
              onHomeClick: () => {
                setSelectedGuildId(null)
                setSelectedDmChannelId(undefined)
              },
              isDmMode: selectedDmChannelId !== undefined,
              onAddServer: vi.fn(),
              onLeaveGuild: vi.fn(),
              onDeleteGuild: vi.fn(),
              onInviteToGuild: vi.fn(),
              onViewGuildInfo: vi.fn(),
              onOpenGuildSettings: vi.fn(),
              ownedGuildIds: new Set(),
              onReorder: vi.fn(),
            }}
            channelColumn={{
              isDmMode: selectedDmChannelId !== undefined,
              selectedGuildId: selectedGuildId ?? undefined,
              dmListItems: [],
              selectedDmChannelId,
              onSelectDmChannel: vi.fn(),
              onLeaveDmChannel: vi.fn(),
              onShowFriends: () => setSelectedDmChannelId(undefined),
              activeCallChannelIds: new Set(),
              channels: [],
              onSelectChannel: vi.fn(),
              onCreateChannel: vi.fn(),
              onViewScreenShare: vi.fn(),
              locallyMutedUsers: new Set(),
              voiceUserVolumes: {},
              onToggleLocalMuteUser: vi.fn(),
              onSetVoiceUserVolume: vi.fn(),
              getAvatarUrl: vi.fn(),
            } as never}
            topNav={{
              isDmMode: selectedDmChannelId !== undefined,
              isHomeView: false,
              showMemberList: true,
              onToggleMemberList: vi.fn(),
              onInitiateDmCall: vi.fn(),
            } as never}
            messageArea={{
              selectedDmChannelId,
              selectedTextChannel: undefined,
            } as never}
            sidebarBottom={{
              showVoicePanel: false,
              currentVoiceState: null,
              onLeave: vi.fn(),
              remoteSharersCount: 0,
              onStartSharing: vi.fn(),
              onStopSharing: vi.fn(),
            } as never}
            mobileProfile={{
              currentUser: null,
              onUpdateProfile: vi.fn(async () => { }),
              onSetStatus: vi.fn(),
            }}
            memberColumn={{
              isDmMode: selectedDmChannelId !== undefined,
              friends: [],
              memberListItems: [],
              getAvatarUrl: vi.fn(),
              usersByIdentity: new Map(),
              onViewProfile: vi.fn(),
            } as never}
          />
        </>
      )
    }

    render(<Harness />)

    fireEvent.click(screen.getByRole('button', { name: /go content/i }))
    expect(screen.getByTestId('active-pane').textContent).toBe('content')

    fireEvent.click(screen.getByRole('button', { name: /external transition/i }))

    expect(screen.getByTestId('active-pane').textContent).toBe('navigation')
  })

  it('opens the conversation pane when a DM is started from the mobile friends view', () => {
    function Harness() {
      const [selectedGuildId, setSelectedGuildId] = useState<string | null>(null)
      const [selectedDmChannelId, setSelectedDmChannelId] = useState<string | undefined>(undefined)

      return (
        <AppMainShell
          layoutMode="string"
          showMemberList={true}
          serverColumn={{
            orderedGuilds: [],
            selectedGuildId,
            onSelectGuild: setSelectedGuildId,
            onHomeClick: () => {
              setSelectedGuildId(null)
              setSelectedDmChannelId(undefined)
            },
            isDmMode: selectedDmChannelId !== undefined,
            onAddServer: vi.fn(),
            onLeaveGuild: vi.fn(),
            onDeleteGuild: vi.fn(),
            onInviteToGuild: vi.fn(),
            onViewGuildInfo: vi.fn(),
            onOpenGuildSettings: vi.fn(),
            ownedGuildIds: new Set(),
            onReorder: vi.fn(),
          }}
          channelColumn={{
            isDmMode: selectedDmChannelId !== undefined,
            selectedGuildId: selectedGuildId ?? undefined,
            dmListItems: [],
            selectedDmChannelId,
            onSelectDmChannel: vi.fn(),
            onLeaveDmChannel: vi.fn(),
            onShowFriends: () => setSelectedDmChannelId(undefined),
            activeCallChannelIds: new Set(),
            channels: [],
            onSelectChannel: vi.fn(),
            onCreateChannel: vi.fn(),
            onViewScreenShare: vi.fn(),
            locallyMutedUsers: new Set(),
            voiceUserVolumes: {},
            onToggleLocalMuteUser: vi.fn(),
            onSetVoiceUserVolume: vi.fn(),
            getAvatarUrl: vi.fn(),
          } as never}
          topNav={{
            isDmMode: selectedDmChannelId !== undefined,
            isHomeView: selectedDmChannelId === undefined && selectedGuildId === null,
            showMemberList: true,
            onToggleMemberList: vi.fn(),
            onInitiateDmCall: vi.fn(),
          } as never}
          messageArea={{
            selectedDmChannelId,
            selectedTextChannel: undefined,
            onStartDm: () => setSelectedDmChannelId('dm-1'),
          } as never}
          sidebarBottom={{
            showVoicePanel: false,
            currentVoiceState: null,
            onLeave: vi.fn(),
            remoteSharersCount: 0,
            onStartSharing: vi.fn(),
            onStopSharing: vi.fn(),
          } as never}
          mobileProfile={{
            currentUser: null,
            onUpdateProfile: vi.fn(async () => { }),
            onSetStatus: vi.fn(),
          }}
          memberColumn={{
            isDmMode: selectedDmChannelId !== undefined,
            friends: [],
            memberListItems: [],
            getAvatarUrl: vi.fn(),
            usersByIdentity: new Map(),
            onViewProfile: vi.fn(),
          } as never}
        />
      )
    }

    render(<Harness />)

    fireEvent.click(screen.getByRole('button', { name: /friends tab/i }))
    fireEvent.click(screen.getByRole('button', { name: /start dm/i }))

    expect(screen.getByTestId('active-pane').textContent).toBe('content')
  })

  it('stays on navigation when a guild auto-selects a text channel after DM dismissal', () => {
    function Harness() {
      const [selectedGuildId, setSelectedGuildId] = useState<string | null>(null)
      const [selectedDmChannelId, setSelectedDmChannelId] = useState<string | undefined>('dm-1')
      const [selectedTextChannel, setSelectedTextChannel] = useState<{ name: string } | undefined>(undefined)

      return (
        <AppMainShell
          layoutMode="string"
          showMemberList={true}
          serverColumn={{
            orderedGuilds: [],
            selectedGuildId,
            onSelectGuild: (id) => {
              setSelectedGuildId(id)
              setSelectedDmChannelId(undefined)
              // Simulate the auto-selection that useGuildNavigation does
              setSelectedTextChannel({ name: 'general' })
            },
            onHomeClick: () => {
              setSelectedGuildId(null)
              setSelectedDmChannelId(undefined)
              setSelectedTextChannel(undefined)
            },
            isDmMode: selectedDmChannelId !== undefined,
            onAddServer: vi.fn(),
            onLeaveGuild: vi.fn(),
            onDeleteGuild: vi.fn(),
            onInviteToGuild: vi.fn(),
            onViewGuildInfo: vi.fn(),
            onOpenGuildSettings: vi.fn(),
            ownedGuildIds: new Set(),
            onReorder: vi.fn(),
          }}
          channelColumn={{
            isDmMode: selectedDmChannelId !== undefined,
            dmListItems: [],
            selectedDmChannelId,
            onSelectDmChannel: vi.fn(),
            onLeaveDmChannel: vi.fn(),
            onShowFriends: () => setSelectedDmChannelId(undefined),
            activeCallChannelIds: new Set(),
            channels: [],
            onSelectChannel: vi.fn(),
            onCreateChannel: vi.fn(),
            onViewScreenShare: vi.fn(),
            locallyMutedUsers: new Set(),
            voiceUserVolumes: {},
            onToggleLocalMuteUser: vi.fn(),
            onSetVoiceUserVolume: vi.fn(),
            getAvatarUrl: vi.fn(),
          } as never}
          topNav={{
            isDmMode: selectedDmChannelId !== undefined,
            isHomeView: selectedGuildId === null && selectedDmChannelId === undefined,
            showMemberList: true,
            onToggleMemberList: vi.fn(),
            onInitiateDmCall: vi.fn(),
          } as never}
          messageArea={{
            selectedDmChannelId,
            selectedTextChannel,
          } as never}
          sidebarBottom={{
            showVoicePanel: false,
            currentVoiceState: null,
            onLeave: vi.fn(),
            remoteSharersCount: 0,
            onStartSharing: vi.fn(),
            onStopSharing: vi.fn(),
          } as never}
          mobileProfile={{
            currentUser: null,
            onUpdateProfile: vi.fn(async () => { }),
            onSetStatus: vi.fn(),
          }}
          memberColumn={{
            isDmMode: selectedDmChannelId !== undefined,
            friends: [],
            memberListItems: [],
            getAvatarUrl: vi.fn(),
            usersByIdentity: new Map(),
            onViewProfile: vi.fn(),
          } as never}
        />
      )
    }

    render(<Harness />)

    // Start viewing a DM then go to content pane
    fireEvent.click(screen.getByRole('button', { name: /go content/i }))
    expect(screen.getByTestId('active-pane').textContent).toBe('content')

    // Click a server — this simultaneously clears the DM and auto-selects a text channel
    fireEvent.click(screen.getByRole('button', { name: /server string/i }))

    // Should stay on navigation despite hasActiveContent becoming true
    expect(screen.getByTestId('active-pane').textContent).toBe('navigation')
  })
})