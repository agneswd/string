import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

import { MemberColumn } from '../MemberColumn'

describe('MemberColumn', () => {
  it('renders a DM profile card instead of the member list in DM mode', () => {
    render(
      <MemberColumn
        isDmMode={true}
        friends={[{ id: 'u2', username: 'kyuh', displayName: 'Kyuh', status: 'online' }]}
        memberListItems={[]}
        getAvatarUrl={() => undefined}
        usersByIdentity={new Map([['u2', { bio: 'Listening to the void', profileColor: '#123456' }]])}
        onViewProfile={vi.fn()}
        layoutMode="string"
      />,
    )

    expect(screen.getByRole('complementary', { name: /direct message profile/i })).toBeTruthy()
    expect(screen.getByText('Kyuh')).toBeTruthy()
    expect(screen.getByText('@kyuh')).toBeTruthy()
    expect(screen.getByText('Listening to the void')).toBeTruthy()
    expect(screen.queryByRole('complementary', { name: /members/i })).toBeNull()
  })

  it('keeps the guild member list for non-DM mode', () => {
    render(
      <MemberColumn
        isDmMode={false}
        guildName="Alpha"
        friends={[]}
        memberListItems={[{ id: 'u1', username: 'alice', displayName: 'Alice', status: 'online' }]}
        getAvatarUrl={() => undefined}
        usersByIdentity={new Map()}
        onViewProfile={vi.fn()}
        layoutMode="string"
      />,
    )

    expect(screen.getByRole('complementary')).toBeTruthy()
    expect(screen.getByText('Alice')).toBeTruthy()
  })
})
