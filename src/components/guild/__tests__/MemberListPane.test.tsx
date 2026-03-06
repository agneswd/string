import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemberListPane, type MemberListItem } from '../MemberListPane'

const members: MemberListItem[] = [
  { id: 'u1', username: 'alice', displayName: 'Alice', status: 'online' },
  { id: 'u2', username: 'bob', displayName: 'Bob', status: 'offline' },
  { id: 'u3', username: 'carol', displayName: 'Carol', status: 'idle' },
]

const ownerMember: MemberListItem = {
  id: 'u4', username: 'owner', displayName: 'Owner', status: 'online', isOwner: true,
}

function renderPane(overrides: Partial<React.ComponentProps<typeof MemberListPane>> = {}) {
  return render(
    <MemberListPane
      members={members}
      title="Members"
      {...overrides}
    />,
  )
}

describe('MemberListPane', () => {
  it('renders with a complementary landmark', () => {
    renderPane()
    expect(screen.getByRole('complementary')).toBeTruthy()
  })

  it('renders all member display names', () => {
    renderPane()
    expect(screen.getByText('Alice')).toBeTruthy()
    expect(screen.getByText('Bob')).toBeTruthy()
    expect(screen.getByText('Carol')).toBeTruthy()
  })

  it('shows Online group header with count', () => {
    renderPane()
    // Alice and Carol are online/idle → 2 online
    expect(screen.getByText(/Online — 2/i)).toBeTruthy()
  })

  it('shows Offline group header with count', () => {
    renderPane()
    expect(screen.getByText(/Offline — 1/i)).toBeTruthy()
  })

  it('renders empty state when no members', () => {
    renderPane({ members: [] })
    expect(screen.getByText(/no members/i)).toBeTruthy()
  })

  it('calls onViewProfile on right-click of a member row', () => {
    const onViewProfile = vi.fn()
    renderPane({ onViewProfile })
    const rows = screen.getAllByRole('listitem')
    // Trigger context menu on first member row
    fireEvent.contextMenu(rows[0])
    expect(onViewProfile).toHaveBeenCalled()
  })

  it('renders the owner crown icon for owner members', () => {
    renderPane({ members: [...members, ownerMember] })
    const crown = screen.getByRole('img', { name: /server owner/i })
    expect(crown).toBeTruthy()
  })

  it('sorts online members alphabetically', () => {
    const unsorted: MemberListItem[] = [
      { id: 'u1', username: 'zoe', displayName: 'Zoe', status: 'online' },
      { id: 'u2', username: 'alice', displayName: 'Alice', status: 'online' },
    ]
    renderPane({ members: unsorted })
    const items = screen.getAllByRole('listitem')
    const names = items.map((li) => li.textContent?.trim())
    const aliceIdx = names.findIndex((n) => n?.includes('Alice'))
    const zoeIdx = names.findIndex((n) => n?.includes('Zoe'))
    expect(aliceIdx).toBeLessThan(zoeIdx)
  })

  it('uses rounded-square avatars in string mode', () => {
    const { container } = renderPane({
      layoutMode: 'string',
      members: [
        { id: 'u1', username: 'alice', displayName: 'Alice', status: 'online', avatarUrl: 'https://example.com/alice.png' },
      ],
    })
    const img = container.querySelector('img')
    expect(img).toBeTruthy()
    expect(img!.style.borderRadius).toBe('var(--radius-sm)')
  })
})
