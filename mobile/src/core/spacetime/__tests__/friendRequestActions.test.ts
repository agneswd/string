import { describe, expect, it, vi } from 'vitest'

import {
  acceptFriendRequest,
  cancelFriendRequest,
  declineFriendRequest,
} from '../liveActions'

type ReducerMap = Record<string, ((payload: unknown) => Promise<void>) | undefined>

function createConnection(reducers: ReducerMap) {
  return {
    reducers,
  }
}

describe('friend request live actions', () => {
  it('invokes the accept reducer with the request id payload', async () => {
    const reducer = vi.fn().mockResolvedValue(undefined)

    await acceptFriendRequest(createConnection({ acceptFriendRequest: reducer }), '42')

    expect(reducer).toHaveBeenCalledWith({ requestId: 42n })
  })

  it('invokes the decline reducer with the request id payload', async () => {
    const reducer = vi.fn().mockResolvedValue(undefined)

    await declineFriendRequest(createConnection({ declineFriendRequest: reducer }), 7)

    expect(reducer).toHaveBeenCalledWith({ requestId: 7n })
  })

  it('invokes the cancel reducer with the request id payload', async () => {
    const reducer = vi.fn().mockResolvedValue(undefined)

    await cancelFriendRequest(createConnection({ cancelFriendRequest: reducer }), 9n)

    expect(reducer).toHaveBeenCalledWith({ requestId: 9n })
  })

  it('throws when the reducer is unavailable', async () => {
    await expect(acceptFriendRequest(createConnection({}), '5')).rejects.toThrow(
      'acceptFriendRequest reducer is not available.',
    )
  })
})
