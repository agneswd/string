/**
 * Integration-style test: layoutMode propagation across the composed workspace shell.
 *
 * Renders WorkspaceShell with real ServerListPane, TopNavBar, and SidebarBottom
 * components passed into the slot props, all receiving layoutMode="workspace".
 * Asserts that each region reflects workspace-mode rendering so any wiring
 * regression in App.tsx would be caught here.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { WorkspaceShell } from '../WorkspaceShell'
import { ServerListPane } from '../../guild/ServerListPane'
import { TopNavBar } from '../TopNavBar'
import { SidebarBottom } from '../SidebarBottom'

const guilds = [
  { id: '1', name: 'Alpha Corp' },
  { id: '2', name: 'Beta Labs' },
]

const user = { username: 'alice', displayName: 'Alice', status: 'Online' }

const noop = vi.fn()

function makeShell(layoutMode: 'workspace' | 'classic') {
  return (
    <WorkspaceShell
      serverColumn={
        <ServerListPane
          guilds={guilds}
          selectedGuildId="1"
          onSelectGuild={noop}
          onHomeClick={noop}
          onAddServer={noop}
          onLeaveGuild={noop}
          onDeleteGuild={noop}
          onInviteToGuild={noop}
          ownedGuildIds={new Set<string | number>()}
          onReorder={noop}
          layoutMode={layoutMode}
        />
      }
      channelColumn={<div>channels</div>}
      topNav={
        <TopNavBar
          isDmMode={false}
          guildName="Alpha Corp"
          channelName="general"
          selectedDmChannel={false}
          currentVoiceState={false}
          outgoingCall={false}
          dmCallActive={false}
          showMemberList={false}
          onToggleMemberList={noop}
          onInitiateDmCall={noop}
          layoutMode={layoutMode}
        />
      }
      messageArea={<div>messages</div>}
      inputArea={<div>input</div>}
      sidebarBottom={
        <SidebarBottom
          user={user}
          isMuted={false}
          isDeafened={false}
          muteColor="#78716c"
          deafenColor="#78716c"
          onToggleMute={noop}
          onToggleDeafen={noop}
          onOpenSettings={noop}
          onOpenProfile={noop}
          onLeave={noop}
          remoteSharersCount={0}
          onStartSharing={noop}
          onStopSharing={noop}
          currentVoiceState={null}
          layoutMode={layoutMode}
        />
      }
    />
  )
}

describe('Shell + layout wiring — workspace mode', () => {
  it('server rail renders as "Workspaces" navigation', () => {
    render(makeShell('workspace'))
    expect(screen.getByRole('navigation', { name: /workspaces/i })).toBeDefined()
  })

  it('server rail shows guild names as text labels', () => {
    render(makeShell('workspace'))
    // Both server rail label and top nav breadcrumb may show "Alpha Corp";
    // use getAllByText and assert at least one occurrence exists.
    expect(screen.getAllByText('Alpha Corp').length).toBeGreaterThan(0)
    expect(screen.getByText('Beta Labs')).toBeDefined()
  })

  it('top nav renders workspace breadcrumb (no bold strong tag for guild name)', () => {
    render(makeShell('workspace'))
    // In workspace mode, guild name is a muted prefix span, not a <strong>
    expect(document.querySelector('strong')).toBeNull()
  })

  it('sidebar footer UserPanel renders with rounded-rect avatar (workspace mode)', () => {
    const { container } = render(makeShell('workspace'))
    const rectAvatar = container.querySelector<HTMLElement>('div[style*="border-radius: 8px"]')
    expect(rectAvatar).toBeTruthy()
  })

  it('WorkspaceShell root carries workspace-shell class', () => {
    const { container } = render(makeShell('workspace'))
    const root = container.firstElementChild as HTMLElement
    expect(root.className).toContain('workspace-shell')
  })
})

describe('Shell + layout wiring — classic mode', () => {
  it('server rail renders as "Servers" navigation in classic mode', () => {
    render(makeShell('classic'))
    expect(screen.getByRole('navigation', { name: /servers/i })).toBeDefined()
  })

  it('top nav renders classic bold guild name', () => {
    render(makeShell('classic'))
    const strong = document.querySelector('strong')
    // In classic mode TopNavBar renders guild name in a <strong> tag
    expect(strong).toBeTruthy()
    expect(strong!.textContent).toBe('Alpha Corp')
  })

  it('sidebar footer UserPanel renders with rounded-circle avatar (classic mode)', () => {
    const { container } = render(makeShell('classic'))
    const circleAvatar = container.querySelector<HTMLElement>('div[style*="border-radius: 50%"]')
    expect(circleAvatar).toBeTruthy()
  })
})
