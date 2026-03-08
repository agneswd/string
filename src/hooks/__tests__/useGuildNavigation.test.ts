import { act, renderHook } from '@testing-library/react'
import { useState } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useAppNavigation } from '../useAppNavigation'
import { useGuildNavigation } from '../useGuildNavigation'
import type { AppData } from '../useAppData'

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

function createAppData(): AppData {
  return {
    identityString: 'me',
    state: {
      guilds: [
        { guildId: 1n, name: 'Alpha', ownerIdentity: 'me' },
      ],
      guildMembers: [
        { guildId: 1n, identity: 'me' },
      ],
      channels: [
        { channelId: 10n, guildId: 1n, name: 'general', position: 0, categoryId: null, channelType: { tag: 'Text' } },
        { channelId: 11n, guildId: 1n, name: 'lobby', position: 1, categoryId: null, channelType: { tag: 'Voice' } },
      ],
    },
  } as AppData
}

function useNavigationHarness(appData: AppData) {
  const [selectedDmChannelId, setSelectedDmChannelId] = useState<string | undefined>(undefined)
  const guildNavigation = useGuildNavigation({
    appData,
    currentVoiceState: null,
    selectedDmChannelId,
  })

  const appNavigation = useAppNavigation({
    memberGuilds: guildNavigation.memberGuilds,
    homeViewActiveRef: guildNavigation.homeViewActiveRef,
    setSelectedGuildId: guildNavigation.setSelectedGuildId,
    setSelectedDmChannelId,
    setSelectedTextChannelId: guildNavigation.setSelectedTextChannelId,
    setSelectedVoiceChannelId: guildNavigation.setSelectedVoiceChannelId,
    channelsForGuild: guildNavigation.channelsForGuild,
    onJoinVoice: vi.fn(),
    setShowInviteModal: vi.fn(),
    runAction: async (fn) => { await fn() },
    extendedActions: {},
    voiceStates: [],
    identityString: 'me',
    usersByIdentity: new Map(),
    getAvatarUrlForUser: () => undefined,
    setContextMenu: vi.fn(),
  })

  return {
    selectedDmChannelId,
    ...guildNavigation,
    ...appNavigation,
  }
}

describe('useGuildNavigation', () => {
  beforeEach(() => {
    installLocalStorageMock()
    window.localStorage.clear()
  })

  it('auto-selects the first text channel when returning to a guild from a DM', () => {
    const { result } = renderHook(() => useNavigationHarness(createAppData()))

    act(() => {
      result.current.handleSelectGuild('1')
    })

    act(() => {
      result.current.handleSelectTextOrVoiceChannel('10')
      result.current.setSelectedVoiceChannelId('11')
    })

    act(() => {
      result.current.handleSelectDmChannel('dm-1')
    })

    act(() => {
      result.current.handleSelectGuild('1')
    })

    expect(result.current.selectedGuildId).toBe('1')
    expect(result.current.selectedDmChannelId).toBeUndefined()
    // Auto-selects first text channel so the content pane isn't empty
    expect(result.current.selectedTextChannelId).toBe('10')
    expect(result.current.selectedVoiceChannelId).toBeUndefined()
  })

  it('auto-selects the first text channel when restoring a guild without a saved channel', () => {
    window.localStorage.setItem('string.navigation.state', JSON.stringify({
      homeViewActive: false,
      selectedGuildId: '1',
    }))

    const { result } = renderHook(() => useGuildNavigation({
      appData: createAppData(),
      currentVoiceState: null,
      selectedDmChannelId: undefined,
    }))

    expect(result.current.selectedGuildId).toBe('1')
    // Auto-selects the first text channel of the guild
    expect(result.current.selectedTextChannelId).toBe('10')
    expect(result.current.selectedVoiceChannelId).toBeUndefined()
  })
})