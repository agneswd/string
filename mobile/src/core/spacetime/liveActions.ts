type ReducerInvoker = (payload: Record<string, unknown>) => Promise<void>

export type ReducerIdLike = string | number | bigint

export interface ReducerConnectionLike {
  reducers: Record<string, unknown>
}

function requireReducer(
  connection: ReducerConnectionLike,
  reducerName: keyof ReducerConnectionLike['reducers'] & string,
): ReducerInvoker {
  const reducer = connection.reducers[reducerName]
  if (typeof reducer !== 'function') {
    throw new Error(`${reducerName} reducer is not available.`)
  }

  return reducer as ReducerInvoker
}

function toRequestId(requestId: ReducerIdLike): bigint {
  if (typeof requestId === 'bigint') {
    return requestId
  }

  if (typeof requestId === 'number' && Number.isInteger(requestId)) {
    return BigInt(requestId)
  }

  if (typeof requestId === 'string' && /^\d+$/.test(requestId.trim())) {
    return BigInt(requestId.trim())
  }

  throw new Error('Friend request id must be an integer-compatible value.')
}

async function invokeFriendRequestReducer(
  connection: ReducerConnectionLike,
  reducerName: 'acceptFriendRequest' | 'declineFriendRequest' | 'cancelFriendRequest',
  requestId: ReducerIdLike,
): Promise<void> {
  const reducer = requireReducer(connection, reducerName)

  await reducer({ requestId: toRequestId(requestId) })
}

export function acceptFriendRequest(connection: ReducerConnectionLike, requestId: ReducerIdLike) {
  return invokeFriendRequestReducer(connection, 'acceptFriendRequest', requestId)
}

export function declineFriendRequest(connection: ReducerConnectionLike, requestId: ReducerIdLike) {
  return invokeFriendRequestReducer(connection, 'declineFriendRequest', requestId)
}

export function cancelFriendRequest(connection: ReducerConnectionLike, requestId: ReducerIdLike) {
  return invokeFriendRequestReducer(connection, 'cancelFriendRequest', requestId)
}

export function sendFriendRequest(connection: ReducerConnectionLike, targetUsername: string): Promise<void> {
  const reducer = requireReducer(connection, 'sendFriendRequest')
  return reducer({ targetUsername })
}

/**
 * Remove an existing friend.  `friendIdentity` must be the raw SDK Identity
 * object obtained from the `friendEdges` snapshot – not a string.
 */
export function removeFriend(connection: ReducerConnectionLike, friendIdentity: unknown): Promise<void> {
  const reducer = requireReducer(connection, 'removeFriend')
  return reducer({ friendIdentity } as Record<string, unknown>)
}

export function updateVoiceState(
  connection: ReducerConnectionLike,
  params: { isMuted: boolean; isDeafened: boolean; isStreaming: boolean },
): Promise<void> {
  const reducer = requireReducer(connection, 'updateVoiceState')
  return reducer(params as Record<string, unknown>)
}
