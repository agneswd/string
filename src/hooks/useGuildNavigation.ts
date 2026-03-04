import { useEffect, useMemo, useRef, useState } from 'react'

import type { AppData } from './useAppData'
import type { Channel, VoiceState } from '../module_bindings/types'
import { toIdKey, identityToString, isTextChannel, isVoiceChannel } from '../lib/helpers'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GuildNavigationParams {
  appData: AppData
  currentVoiceState?: VoiceState | null
  selectedDmChannelId?: string | undefined
}

export interface GuildNavigation {
  // State
  selectedGuildId: string | undefined
  setSelectedGuildId: React.Dispatch<React.SetStateAction<string | undefined>>
  selectedTextChannelId: string | undefined
  setSelectedTextChannelId: React.Dispatch<React.SetStateAction<string | undefined>>
  selectedVoiceChannelId: string | undefined
  setSelectedVoiceChannelId: React.Dispatch<React.SetStateAction<string | undefined>>

  // Ref
  homeViewActiveRef: React.MutableRefObject<boolean>

  // Memos
  memberGuildIds: Set<string>
  memberGuilds: ReturnType<AppData['state']['guilds']['filter']>
  ownedGuildIds: Set<string | number>
  selectedGuild: ReturnType<AppData['state']['guilds']['find']> | null
  channelsForGuild: Channel[]
  textChannels: Channel[]
  voiceChannels: Channel[]
  channelIdsForSelectedGuild: Set<string>
  selectedTextChannel: Channel | null
  selectedVoiceChannel: Channel | null
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useGuildNavigation({
  appData,
  currentVoiceState,
  selectedDmChannelId,
}: GuildNavigationParams): GuildNavigation {
  const { state, identityString } = appData

  // -------------------------------------------------------------------------
  // State
  // -------------------------------------------------------------------------
  const [selectedGuildId, setSelectedGuildId] = useState<string | undefined>(undefined)
  const [selectedTextChannelId, setSelectedTextChannelId] = useState<string | undefined>(undefined)
  const [selectedVoiceChannelId, setSelectedVoiceChannelId] = useState<string | undefined>(undefined)

  // -------------------------------------------------------------------------
  // Ref
  // -------------------------------------------------------------------------
  const homeViewActiveRef = useRef(false)

  // -------------------------------------------------------------------------
  // Memos
  // -------------------------------------------------------------------------

  const memberGuildIds = useMemo(() => {
    if (!identityString) {
      return new Set<string>()
    }

    return new Set(
      state.guildMembers
        .filter((member) => identityToString(member.identity) === identityString)
        .map((member) => toIdKey(member.guildId)),
    )
  }, [identityString, state.guildMembers])

  const memberGuilds = useMemo(
    () => state.guilds.filter((guild) => memberGuildIds.has(toIdKey(guild.guildId))),
    [memberGuildIds, state.guilds],
  )

  const ownedGuildIds = useMemo(() => {
    const set = new Set<string | number>();
    for (const guild of memberGuilds) {
      if (identityToString(guild.ownerIdentity) === identityString) {
        set.add(toIdKey(guild.guildId));
      }
    }
    return set;
  }, [memberGuilds, identityString]);

  const selectedGuild = useMemo(
    () => memberGuilds.find((guild) => toIdKey(guild.guildId) === selectedGuildId) ?? null,
    [memberGuilds, selectedGuildId],
  )

  const channelsForGuild = useMemo(() => {
    if (!selectedGuild) {
      return [] as Channel[]
    }
    const guildKey = toIdKey(selectedGuild.guildId)
    return state.channels
      .filter((channel) => toIdKey(channel.guildId) === guildKey)
      .slice()
      .sort((left, right) => Number(left.position) - Number(right.position))
  }, [selectedGuild, state.channels])

  const textChannels = useMemo(
    () => channelsForGuild.filter((channel) => isTextChannel(channel)),
    [channelsForGuild],
  )

  const voiceChannels = useMemo(
    () => channelsForGuild.filter((channel) => isVoiceChannel(channel)),
    [channelsForGuild],
  )

  const channelIdsForSelectedGuild = useMemo(
    () => new Set(channelsForGuild.map((channel) => toIdKey(channel.channelId))),
    [channelsForGuild],
  )

  const selectedTextChannel = useMemo(
    () => textChannels.find((channel) => toIdKey(channel.channelId) === selectedTextChannelId) ?? null,
    [selectedTextChannelId, textChannels],
  )

  const selectedVoiceChannel = useMemo(
    () => voiceChannels.find((channel) => toIdKey(channel.channelId) === selectedVoiceChannelId) ?? null,
    [selectedVoiceChannelId, voiceChannels],
  )

  // -------------------------------------------------------------------------
  // Effects – auto-selection
  // -------------------------------------------------------------------------

  // Auto-select first guild
  useEffect(() => {
    if (memberGuilds.length === 0) {
      if (selectedGuildId !== undefined) {
        setSelectedGuildId(undefined)
      }
      return
    }

    // Don't auto-select a guild when user is in DM/home mode
    if (homeViewActiveRef.current || selectedDmChannelId !== undefined) {
      return
    }

    const hasSelectedGuild =
      selectedGuildId !== undefined &&
      memberGuilds.some((guild) => toIdKey(guild.guildId) === selectedGuildId)

    if (!hasSelectedGuild) {
      setSelectedGuildId(toIdKey(memberGuilds[0].guildId))
    }
  }, [memberGuilds, selectedGuildId, selectedDmChannelId])

  // Auto-select first text channel
  useEffect(() => {
    if (textChannels.length === 0) {
      if (selectedTextChannelId !== undefined) {
        setSelectedTextChannelId(undefined)
      }
      return
    }

    const hasSelectedTextChannel =
      selectedTextChannelId !== undefined &&
      textChannels.some((channel) => toIdKey(channel.channelId) === selectedTextChannelId)

    if (!hasSelectedTextChannel) {
      setSelectedTextChannelId(toIdKey(textChannels[0].channelId))
    }
  }, [selectedTextChannelId, textChannels])

  // Auto-select voice channel, prefer active voice state channel
  useEffect(() => {
    if (voiceChannels.length === 0) {
      if (selectedVoiceChannelId !== undefined) {
        setSelectedVoiceChannelId(undefined)
      }
      return
    }

    const activeVoiceChannelId = currentVoiceState ? toIdKey(currentVoiceState.channelId) : undefined
    const preferredVoiceChannelId =
      activeVoiceChannelId && voiceChannels.some((channel) => toIdKey(channel.channelId) === activeVoiceChannelId)
        ? activeVoiceChannelId
        : selectedVoiceChannelId

    const hasPreferredVoiceChannel =
      preferredVoiceChannelId !== undefined &&
      voiceChannels.some((channel) => toIdKey(channel.channelId) === preferredVoiceChannelId)

    if (!hasPreferredVoiceChannel) {
      setSelectedVoiceChannelId(toIdKey(voiceChannels[0].channelId))
      return
    }

    if (selectedVoiceChannelId !== preferredVoiceChannelId) {
      setSelectedVoiceChannelId(preferredVoiceChannelId)
    }
  }, [currentVoiceState, selectedVoiceChannelId, voiceChannels])

  // -------------------------------------------------------------------------
  // Return
  // -------------------------------------------------------------------------

  return {
    selectedGuildId,
    setSelectedGuildId,
    selectedTextChannelId,
    setSelectedTextChannelId,
    selectedVoiceChannelId,
    setSelectedVoiceChannelId,
    homeViewActiveRef,
    memberGuildIds,
    memberGuilds,
    ownedGuildIds,
    selectedGuild,
    channelsForGuild,
    textChannels,
    voiceChannels,
    channelIdsForSelectedGuild,
    selectedTextChannel,
    selectedVoiceChannel,
  }
}
