import { describe, expect, it } from 'vitest'

import { mapSpacetimeDataToShell } from '../liveData'
import type { SpacetimeDataSnapshot } from '../../../core/spacetime'

describe('mapSpacetimeDataToShell browse data', () => {
  it('preserves category and layout metadata for browse channel grouping', () => {
    const data = {
      myProfile: null,
      users: [],
      userPresence: [],
      friendEdges: [],
      incomingFriendRequests: [],
      outgoingFriendRequests: [],
      guilds: [
        {
          guildId: 7n,
          name: 'String Labs',
          bio: 'Build faster',
        },
      ],
      guildMembers: [],
      channels: [
        {
          channelId: 100n,
          guildId: 7n,
          categoryId: null,
          name: 'General',
          channelType: { Category: {} },
          position: 0,
          topic: null,
          createdAt: new Date(),
        },
        {
          channelId: 101n,
          guildId: 7n,
          categoryId: 100n,
          name: 'general',
          channelType: { Text: {} },
          position: 1,
          topic: 'Chat here',
          createdAt: new Date(),
        },
      ],
      guildInvites: [],
      dmChannels: [],
      dmParticipants: [],
      dmMessages: [],
    } as unknown as SpacetimeDataSnapshot

    const shell = mapSpacetimeDataToShell({
      data,
      identity: null,
      session: {
        status: 'signed-out',
      },
    })

    expect(shell.channels).toEqual([
      expect.objectContaining({
        id: '100',
        type: 'category',
        parentCategoryId: null,
        position: 0,
      }),
      expect.objectContaining({
        id: '101',
        type: 'text',
        parentCategoryId: '100',
        position: 1,
      }),
    ])
  })
})