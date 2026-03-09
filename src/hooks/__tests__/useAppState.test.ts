import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useAppState } from '../useAppState'

function createParams() {
  return {
    viewingScreenShareKey: null,
    remoteStreams: new Map<string, MediaStream>(),
    isStreaming: false,
    onStartSharing: vi.fn(),
    onStopSharing: vi.fn(),
    connectionStatus: 'connected',
    runAction: vi.fn(async (fn: () => Promise<void>) => fn()),
    actions: { registerUser: vi.fn(async () => undefined) },
    currentVoiceIsMuted: false,
    currentVoiceIsDeafened: false,
    preMuted: false,
    preDeafened: false,
  }
}

describe('useAppState', () => {
  it('keeps only the newest notification', () => {
    const { result } = renderHook(() => useAppState(createParams()))

    act(() => {
      result.current.addNotification({ message: 'First', type: 'info' })
      result.current.addNotification({ message: 'Second', type: 'success' })
    })

    expect(result.current.notifications).toHaveLength(1)
    expect(result.current.notifications[0]?.message).toBe('Second')
    expect(result.current.notifications[0]?.type).toBe('success')
  })
})