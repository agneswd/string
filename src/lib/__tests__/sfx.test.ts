import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { playLoop } from '../sfx'

class MockAudio {
  static instances: MockAudio[] = []

  volume = 1
  currentTime = 0
  private listeners = new Map<string, Set<() => void>>()

  constructor(_src?: string) {
    MockAudio.instances.push(this)
  }

  addEventListener(type: string, listener: () => void) {
    const listeners = this.listeners.get(type) ?? new Set<() => void>()
    listeners.add(listener)
    this.listeners.set(type, listeners)
  }

  removeEventListener(type: string, listener: () => void) {
    this.listeners.get(type)?.delete(listener)
  }

  play() {
    return Promise.resolve()
  }

  pause() {}

  emit(type: string) {
    for (const listener of this.listeners.get(type) ?? []) {
      listener()
    }
  }
}

describe('playLoop', () => {
  const OriginalAudio = globalThis.Audio

  beforeEach(() => {
    vi.useFakeTimers()
    MockAudio.instances = []
    globalThis.Audio = MockAudio as unknown as typeof Audio
  })

  afterEach(() => {
    globalThis.Audio = OriginalAudio
    vi.useRealTimers()
  })

  it('does not start a second loop iteration before the current audio ends', async () => {
    const stop = playLoop('call-sound', 10)

    expect(MockAudio.instances).toHaveLength(1)

    await vi.advanceTimersByTimeAsync(50)
    expect(MockAudio.instances).toHaveLength(1)

    MockAudio.instances[0]?.emit('ended')
    await vi.advanceTimersByTimeAsync(0)

    expect(MockAudio.instances).toHaveLength(2)

    stop()
  })
})