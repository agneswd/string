import { useCallback, useMemo, useState } from 'react'

import { toIdKey, isVoiceChannel, statusToLabel } from '../lib/helpers'
import { identityToString } from './useAppData'
import type { ProfilePopupUser } from '../components/social/UserProfilePopup'
import type { ActionFeedback } from './useActionFeedback'
import type { Channel, Guild, User, VoiceState } from '../module_bindings/types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ExtendedActions = {
  initiateDmCall?: (params: { dmChannelId: bigint }) => Promise<void>
  joinVoiceDm?: (params: { dmChannelId: bigint }) => Promise<void>
}

export interface UseAppNavigationParams {
  memberGuilds: Guild[]
  homeViewActiveRef: React.MutableRefObject<boolean>
  setSelectedGuildId: React.Dispatch<React.SetStateAction<string | undefined>>
  setSelectedDmChannelId: (id: string | undefined) => void
  setSelectedTextChannelId: React.Dispatch<React.SetStateAction<string | undefined>>
  setSelectedVoiceChannelId: React.Dispatch<React.SetStateAction<string | undefined>>
  channelsForGuild: Channel[]
  onJoinVoice: (channel: Channel) => void
  setShowInviteModal: (show: boolean) => void
  runAction: ActionFeedback['runAction']
  extendedActions: ExtendedActions
  voiceStates: VoiceState[]
  identityString: string
  usersByIdentity: Map<string, User>
  getAvatarUrlForUser: (identityStr: string) => string | undefined
  setContextMenu: (menu: { x: number; y: number; userId: string; user: ProfilePopupUser } | null) => void
}

export interface AppNavigation {
  guildOrder: string[]
  setGuildOrder: React.Dispatch<React.SetStateAction<string[]>>
  orderedGuilds: Guild[]
  handleReorderGuilds: (newOrder: string[]) => void
  handleSelectGuild: (guildId: string | number) => void
  handleHomeClick: () => void
  handleSelectDmChannel: (channelId: string | number) => void
  handleInitiateDmCall: (dmChannelId: string | number) => void
  handleSelectTextOrVoiceChannel: (channelId: string | number) => void
  handleViewProfile: (user: { displayName: string; username: string; bio?: string; status?: string; avatarUrl?: string }, x: number, y: number) => void
  handleInviteToGuild: (guildId: string) => void
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAppNavigation({
  memberGuilds,
  homeViewActiveRef,
  setSelectedGuildId,
  setSelectedDmChannelId,
  setSelectedTextChannelId,
  setSelectedVoiceChannelId,
  channelsForGuild,
  onJoinVoice,
  setShowInviteModal,
  runAction,
  extendedActions,
  voiceStates,
  identityString,
  usersByIdentity,
  getAvatarUrlForUser,
  setContextMenu,
}: UseAppNavigationParams): AppNavigation {
  // ---------------------------------------------------------------------------
  // Guild ordering (client-side preference, persisted via localStorage)
  // ---------------------------------------------------------------------------
  const [guildOrder, setGuildOrder] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('guildOrder') || '[]') } catch { return [] }
  })

  const orderedGuilds = useMemo(() => {
    if (guildOrder.length === 0) return memberGuilds
    const orderMap = new Map(guildOrder.map((id, idx) => [id, idx]))
    return [...memberGuilds].sort((a, b) => {
      const aIdx = orderMap.get(toIdKey(a.guildId)) ?? Infinity
      const bIdx = orderMap.get(toIdKey(b.guildId)) ?? Infinity
      return aIdx - bIdx
    })
  }, [memberGuilds, guildOrder])

  const handleReorderGuilds = useCallback((newOrder: string[]) => {
    setGuildOrder(newOrder)
    localStorage.setItem('guildOrder', JSON.stringify(newOrder))
  }, [])

  const handleSelectGuild = useCallback((guildId: string | number) => {
    homeViewActiveRef.current = false
    setSelectedGuildId(String(guildId))
    setSelectedDmChannelId(undefined)
  }, [homeViewActiveRef, setSelectedGuildId, setSelectedDmChannelId])

  const handleHomeClick = useCallback(() => {
    homeViewActiveRef.current = true
    setSelectedGuildId(undefined)
  }, [homeViewActiveRef, setSelectedGuildId])

  const handleSelectDmChannel = useCallback((channelId: string | number) => {
    setSelectedDmChannelId(String(channelId))
  }, [setSelectedDmChannelId])

  const handleInitiateDmCall = useCallback((dmChannelId: string | number) => {
    const id = String(dmChannelId)
    // If partner is already in DM voice, rejoin directly without ringing
    const partnerInDmVoice = voiceStates.some(
      vs => toIdKey(vs.guildId) === '0' && toIdKey(vs.channelId) === id && identityToString(vs.identity) !== identityString
    )
    if (partnerInDmVoice && extendedActions.joinVoiceDm) {
      void runAction(() => extendedActions.joinVoiceDm!({ dmChannelId: BigInt(id) }))
    } else {
      void runAction(() => extendedActions.initiateDmCall?.({ dmChannelId: BigInt(id) }) ?? Promise.resolve())
    }
  }, [runAction, extendedActions, voiceStates, identityString])

  const handleViewProfile = useCallback((user: { displayName: string; username: string; bio?: string; status?: string; avatarUrl?: string }, x: number, y: number) => {
    // Enrich with data from usersByIdentity if available
    const found = Array.from(usersByIdentity.values()).find(u => u.username === user.username || u.displayName === user.displayName)
    const enriched: ProfilePopupUser = {
      displayName: found?.displayName ?? user.displayName,
      username: found?.username ?? user.username,
      bio: found?.bio ?? user.bio,
      status: found ? statusToLabel(found.status) : user.status,
      avatarUrl: user.avatarUrl ?? (found ? getAvatarUrlForUser(identityToString(found.identity)) : undefined),
      profileColor: (found as any)?.profileColor ?? undefined,
    }
    const userId = found ? identityToString(found.identity) : ''
    setContextMenu({ x, y, userId, user: enriched })
  }, [usersByIdentity, getAvatarUrlForUser, setContextMenu])

  const handleSelectTextOrVoiceChannel = useCallback((channelId: string | number) => {
    const channel = channelsForGuild.find((c) => toIdKey(c.channelId) === String(channelId))
    if (channel && isVoiceChannel(channel)) {
      setSelectedVoiceChannelId(String(channelId))
      onJoinVoice(channel)
    } else {
      setSelectedTextChannelId(String(channelId))
      setSelectedDmChannelId(undefined)
    }
  }, [channelsForGuild, setSelectedVoiceChannelId, onJoinVoice, setSelectedTextChannelId, setSelectedDmChannelId])

  const handleInviteToGuild = useCallback((guildId: string) => {
    setSelectedGuildId(String(guildId));
    setShowInviteModal(true);
  }, [setSelectedGuildId, setShowInviteModal])

  return {
    guildOrder,
    setGuildOrder,
    orderedGuilds,
    handleReorderGuilds,
    handleSelectGuild,
    handleHomeClick,
    handleSelectDmChannel,
    handleInitiateDmCall,
    handleSelectTextOrVoiceChannel,
    handleViewProfile,
    handleInviteToGuild,
  }
}
