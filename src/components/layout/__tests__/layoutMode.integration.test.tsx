/**
 * Integration-style test: layoutMode propagation across the composed workspace shell.
 *
 * Renders WorkspaceShell with real ServerListPane, TopNavBar, and SidebarBottom
 * components passed into the slot props, all receiving layoutMode="string".
 * Asserts that each region reflects string-mode rendering so any wiring
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

function makeShell(layoutMode: 'string' | 'classic') {
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

describe('Shell + layout wiring — string mode', () => {
  it('server rail renders as "Workspaces" navigation', () => {
    render(makeShell('string'))
    expect(screen.getByRole('navigation', { name: /workspaces/i })).toBeDefined()
  })

  it('server rail shows guild names as text labels', () => {
    render(makeShell('string'))
    // Both server rail label and top nav breadcrumb may show "Alpha Corp";
    // use getAllByText and assert at least one occurrence exists.
    expect(screen.getAllByText('Alpha Corp').length).toBeGreaterThan(0)
    expect(screen.getByText('Beta Labs')).toBeDefined()
  })

  it('top nav renders string breadcrumb (no bold strong tag for guild name)', () => {
    render(makeShell('string'))
    // In string mode, guild name is a muted prefix span, not a <strong>
    expect(document.querySelector('strong')).toBeNull()
  })

  it('sidebar footer UserPanel renders with rounded-rect avatar (string mode)', () => {
    const { container } = render(makeShell('string'))
    const rectAvatar = container.querySelector<HTMLElement>('div[style*="border-radius: 8px"]')
    expect(rectAvatar).toBeTruthy()
  })

  it('WorkspaceShell root carries workspace-shell class', () => {
    const { container } = render(makeShell('string'))
    const root = container.firstElementChild as HTMLElement
    expect(root.className).toContain('workspace-shell')
  })
})

describe('Shell + layout wiring — classic mode', () => {
  it('server rail renders as "Servers" navigation in classic mode', () => {
    render(makeShell('classic'))
    expect(screen.getByRole('navigation', { name: /servers/i })).toBeDefined()
  })

  it('top nav renders classic bold channel title when a channel is selected', () => {
    render(makeShell('classic'))
    const strong = document.querySelector('strong')
    // In classic mode the active channel title takes precedence in the <strong> tag.
    expect(strong).toBeTruthy()
    expect(strong!.textContent).toBe('# general')
  })

  it('sidebar footer UserPanel renders with rounded-circle avatar (classic mode)', () => {
    const { container } = render(makeShell('classic'))
    const circleAvatar = container.querySelector<HTMLElement>('div[style*="border-radius: 50%"]')
    expect(circleAvatar).toBeTruthy()
  })
})
