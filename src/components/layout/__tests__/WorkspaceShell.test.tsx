import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { WorkspaceShell } from '../WorkspaceShell'

const defaultProps = {
  serverColumn: <div data-testid="server-col">servers</div>,
  channelColumn: <div data-testid="channel-col">channels</div>,
  topNav: <div data-testid="top-nav">nav</div>,
  messageArea: <div data-testid="message-area">messages</div>,
  inputArea: <div data-testid="input-area">input</div>,
}

describe('WorkspaceShell', () => {
  it('renders root element with workspace-shell class', () => {
    const { container } = render(<WorkspaceShell {...defaultProps} />)
    const root = container.firstElementChild as HTMLElement
    expect(root).toBeTruthy()
    expect(root.className).toContain('workspace-shell')
  })

  it('renders all slot content', () => {
    render(<WorkspaceShell {...defaultProps} />)
    expect(screen.getByTestId('server-col')).toBeDefined()
    expect(screen.getByTestId('channel-col')).toBeDefined()
    expect(screen.getByTestId('top-nav')).toBeDefined()
    expect(screen.getByTestId('message-area')).toBeDefined()
    expect(screen.getByTestId('input-area')).toBeDefined()
  })

  it('server rail has 56px width', () => {
    const { container } = render(<WorkspaceShell {...defaultProps} />)
    const serverAside = container.querySelector('.workspace-shell__servers') as HTMLElement
    expect(serverAside).toBeTruthy()
    expect(serverAside.style.width).toBe('56px')
  })

  it('channel sidebar has 220px width', () => {
    const { container } = render(<WorkspaceShell {...defaultProps} />)
    // The channel wrapper div holds the channel aside
    const root = container.firstElementChild as HTMLElement
    // Find the sidebar wrapper (second direct child, after server aside)
    const sidebarWrapper = root.children[1] as HTMLElement
    expect(sidebarWrapper).toBeTruthy()
    expect(sidebarWrapper.style.width).toBe('220px')
  })

  it('top nav header has 2.75rem height', () => {
    const { container } = render(<WorkspaceShell {...defaultProps} />)
    const header = container.querySelector('.workspace-shell__top-nav') as HTMLElement
    expect(header).toBeTruthy()
    expect(header.style.height).toBe('2.75rem')
  })

  it('shows member column when showMemberList is true', () => {
    const memberCol = <div data-testid="member-col">members</div>
    render(
      <WorkspaceShell
        {...defaultProps}
        memberColumn={memberCol}
        showMemberList={true}
      />,
    )
    expect(screen.getByTestId('member-col')).toBeDefined()
  })

  it('hides member column when showMemberList is false', () => {
    const memberCol = <div data-testid="member-col">members</div>
    render(
      <WorkspaceShell
        {...defaultProps}
        memberColumn={memberCol}
        showMemberList={false}
      />,
    )
    expect(screen.queryByTestId('member-col')).toBeNull()
  })

  it('renders sidebarBottom when provided', () => {
    render(
      <WorkspaceShell
        {...defaultProps}
        sidebarBottom={<div data-testid="sidebar-bottom">user panel</div>}
      />,
    )
    expect(screen.getByTestId('sidebar-bottom')).toBeDefined()
  })

  it('does not render sidebarBottom when not provided', () => {
    render(<WorkspaceShell {...defaultProps} />)
    expect(screen.queryByTestId('sidebar-bottom')).toBeNull()
  })

  it('member column has 220px width when shown', () => {
    const { container } = render(
      <WorkspaceShell
        {...defaultProps}
        memberColumn={<div>members</div>}
        showMemberList={true}
      />,
    )
    const memberAside = container.querySelector('.workspace-shell__members') as HTMLElement
    expect(memberAside).toBeTruthy()
    expect(memberAside.style.width).toBe('220px')
  })

  it('accepts optional className on root', () => {
    const { container } = render(
      <WorkspaceShell {...defaultProps} className="custom-class" />,
    )
    const root = container.firstElementChild as HTMLElement
    expect(root.className).toContain('custom-class')
  })

  it('server rail has no right border (workspace uses bg diff only)', () => {
    const { container } = render(<WorkspaceShell {...defaultProps} />)
    const serverAside = container.querySelector('.workspace-shell__servers') as HTMLElement
    // Workspace shell: no explicit border-right on the server rail
    expect(serverAside.style.borderRight).toBeFalsy()
  })
})
