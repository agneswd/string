import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { Identity } from 'spacetimedb/sdk'

import { useDmChat } from '../useDmChat'
import type { AppData } from '../useAppData'

function createAppData(overrides: Partial<AppData> = {}): AppData {
  return {
    dmChannels: [],
    dmParticipants: [],
    dmMessages: [],
    dmReactions: [],
    dmCallEvents: [],
    dmUnreadCountsByChannel: new Map(),
    dmLastMessageByChannel: new Map(),
    identityString: 'me-1',
    usersByIdentity: new Map(),
    extendedActions: {
      createDmChannel: vi.fn(),
      leaveDmChannel: vi.fn(),
      toggleDmReaction: vi.fn(),
    },
    ...overrides,
  } as AppData & typeof overrides
}

describe('useDmChat', () => {
  it('auto-creates a DM for a friend that does not yet have one', async () => {
    const friendIdentity = 'z-friend-1' as Identity
    const createDmChannel = vi.fn()
    const callActionOrReducer = vi.fn(() => Promise.resolve())

    renderHook(() => useDmChat({
      appData: createAppData({
        identityString: 'a-me-1',
        usersByIdentity: new Map([
          ['z-friend-1', { username: 'friend', displayName: 'Friend', status: { tag: 'Online' } }],
        ]),
        extendedActions: {
          createDmChannel,
          leaveDmChannel: vi.fn(),
          toggleDmReaction: vi.fn(),
        },
      }),
      friendIdentityById: new Map([['friend-row', friendIdentity]]),
      runAction: async (fn) => { await fn() },
      callActionOrReducer,
      setActionError: vi.fn(),
      setActionStatus: vi.fn(),
    }))

    await waitFor(() => {
      expect(callActionOrReducer).toHaveBeenCalledWith(createDmChannel, 'createDmChannel', {
        participants: [friendIdentity],
        title: undefined,
      })
    })
  })

  it('hides an existing DM instead of deleting it and reopens it from the friend button', () => {
    const friendIdentity = 'friend-1' as Identity
    const callActionOrReducer = vi.fn(() => Promise.resolve())

    const { result } = renderHook(() => useDmChat({
      appData: createAppData({
        dmChannels: [{ dmChannelId: 1n }] as AppData['dmChannels'],
        dmParticipants: [
          { dmChannelId: 1n, identity: 'me-1', lastReadMessageId: null },
          { dmChannelId: 1n, identity: friendIdentity, lastReadMessageId: null },
        ] as AppData['dmParticipants'],
        usersByIdentity: new Map([
          ['friend-1', { username: 'friend', displayName: 'Friend', status: { tag: 'Online' } }],
        ]),
      }),
      friendIdentityById: new Map([['friend-row', friendIdentity]]),
      runAction: async (fn) => { await fn() },
      callActionOrReducer,
      setActionError: vi.fn(),
      setActionStatus: vi.fn(),
    }))

    expect(result.current.dmListItems).toHaveLength(1)

    act(() => {
      result.current.onLeaveDmChannel('1')
    })

    expect(result.current.dmListItems).toHaveLength(0)

    act(() => {
      result.current.onStartDmFromFriend('friend-row')
    })

    expect(result.current.selectedDmChannelId).toBe('1')
    expect(result.current.dmListItems).toHaveLength(1)
    expect(callActionOrReducer).not.toHaveBeenCalled()
  })

  it('sorts DM list items by most recent message first', () => {
    const { result } = renderHook(() => useDmChat({
      appData: createAppData({
        dmChannels: [{ dmChannelId: 1n }, { dmChannelId: 2n }] as AppData['dmChannels'],
        dmParticipants: [
          { dmChannelId: 1n, identity: 'me-1', lastReadMessageId: null },
          { dmChannelId: 1n, identity: 'friend-1', lastReadMessageId: null },
          { dmChannelId: 2n, identity: 'me-1', lastReadMessageId: null },
          { dmChannelId: 2n, identity: 'friend-2', lastReadMessageId: null },
        ] as AppData['dmParticipants'],
        dmLastMessageByChannel: new Map([
          ['1', { dmChannelId: 1n, dmMessageId: 1n, content: 'older', sentAt: '2026-03-07T10:00:00.000Z', authorIdentity: 'friend-1' }],
          ['2', { dmChannelId: 2n, dmMessageId: 2n, content: 'newer', sentAt: '2026-03-07T11:00:00.000Z', authorIdentity: 'friend-2' }],
        ]),
        usersByIdentity: new Map([
          ['friend-1', { username: 'alice', displayName: 'Alice', status: { tag: 'Online' } }],
          ['friend-2', { username: 'bob', displayName: 'Bob', status: { tag: 'Online' } }],
        ]),
      }),
      friendIdentityById: new Map(),
      runAction: async (fn) => { await fn() },
      callActionOrReducer: vi.fn(() => Promise.resolve()),
      setActionError: vi.fn(),
      setActionStatus: vi.fn(),
    }))

    expect(result.current.dmListItems.map((item) => item.name)).toEqual(['Bob', 'Alice'])
  })
})
