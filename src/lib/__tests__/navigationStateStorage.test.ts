import { beforeEach, describe, expect, it } from 'vitest'

import { readNavigationState, writeNavigationState } from '../navigationStateStorage'

function installLocalStorageMock() {
  const store = new Map<string, string>()

  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value)
      },
      removeItem: (key: string) => {
        store.delete(key)
      },
      clear: () => {
        store.clear()
      },
    },
  })
}

describe('navigationStateStorage', () => {
  beforeEach(() => {
    installLocalStorageMock()
    window.localStorage.clear()
  })

  it('clears stored ids when undefined values are written intentionally', () => {
    writeNavigationState({
      homeViewActive: false,
      selectedGuildId: 'guild-1',
      selectedTextChannelId: 'text-1',
      selectedVoiceChannelId: 'voice-1',
      selectedDmChannelId: 'dm-1',
    })

    writeNavigationState({
      homeViewActive: true,
      selectedGuildId: undefined,
      selectedTextChannelId: undefined,
      selectedVoiceChannelId: undefined,
      selectedDmChannelId: undefined,
    })

    expect(readNavigationState()).toEqual({
      homeViewActive: true,
      selectedGuildId: undefined,
      selectedTextChannelId: undefined,
      selectedVoiceChannelId: undefined,
      selectedDmChannelId: undefined,
      hiddenDmChannelIds: undefined,
    })
  })
})