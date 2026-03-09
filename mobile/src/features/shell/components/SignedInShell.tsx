import { useMemo, useState, useCallback, useEffect } from 'react'
import { Keyboard, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Colors } from '../../../shared/theme'
import { EmptyState } from '../../../shared/ui'
import { avatarBytesToUri } from '../../../shared/lib/avatarUtils'
import { useSpacetime } from '../../../core/spacetime'
import { useAuth } from '../../auth'
import { BrowseScreen } from '../../browse'
import { IncomingCallModal, MobileCallBanner, useDmRtcMedia, useMobileCallSfx, useMobileCallState } from '../../calls'
import { ChatScreen, useDmList } from '../../dm'
import { FriendsScreen } from '../../friends'
import { ChannelChatScreen } from '../../guild'
import { ProfileScreen } from '../../profile'
import { useMobileNotificationSfx } from '../hooks/useMobileNotificationSfx'
import { mapSpacetimeDataToShell } from '../liveData'
import { usePersistedShellSelection } from '../hooks/usePersistedShellSelection'
import { useMobileShellController } from '../useMobileShellController'
import { MobileSwipeShell, ShellBottomNav, ShellDetailScreen, ShellMembersPane, ShellTopBar, type ShellMemberItem } from './index'
import {
  buildShellHeaderContext,
  type ShellActiveDetail,
} from '../presentation'
import type { ShellTabDefinition, ShellTabKey } from '../types'

export function SignedInShell() {
  const { session, signOut } = useAuth()
  const sessionUserId = session.status === 'signed-in' ? session.userId : null
  const {
    phase: connectionPhase,
    data,
    identity,
    subscriptionsReady,
    updateProfile,
    setStatus,
    acceptFriendRequest,
    declineFriendRequest,
    cancelFriendRequest,
    sendFriendRequest,
    removeFriend,
    updateVoiceState,
    createGuild,
    createChannel,
    joinVoiceChannel,
    joinVoiceDm,
    leaveVoiceChannel,
    initiateDmCall,
    acceptDmCall,
    declineDmCall,
    sendDmRtcSignal,
    ackRtcSignal,
    updateGuild,
    inviteMember,
    leaveGuild,
    deleteGuild,
  } = useSpacetime()
  const canMutateSpacetime = connectionPhase === 'connected' && subscriptionsReady
  const insets = useSafeAreaInsets()
  const [activeDetail, setActiveDetail] = useState<ShellActiveDetail>(null)
  const [ignoredCallIds, setIgnoredCallIds] = useState<Set<string>>(() => new Set())
  const [rtcError, setRtcError] = useState<string | null>(null)
  const [preMuted, setPreMuted] = useState(false)
  const [preDeafened, setPreDeafened] = useState(false)
  const [hasRestoredSelection, setHasRestoredSelection] = useState(false)
  const { conversations } = useDmList()
  const persistedSelection = usePersistedShellSelection(sessionUserId)

  const hasLiveSnapshot = Boolean(
    data.myProfile
    || data.guilds.length > 0
    || data.channels.length > 0
    || data.friendEdges.length > 0
    || data.dmChannels.length > 0
    || data.incomingFriendRequests.length > 0
    || data.outgoingFriendRequests.length > 0,
  )
  const shouldShowShellLoading = !subscriptionsReady && !hasLiveSnapshot

  const [displayProfile, liveShellData, tabs] = useMemo(() => {
    const fallbackProfile = session.status === 'signed-in'
      ? {
          id: session.userId,
          displayName: session.displayName,
          username: session.displayName.toLowerCase().replace(/[^a-z0-9]+/g, ''),
          email: session.email,
          status: 'online' as const,
          statusMessage: null,
          headline: 'String member',
        }
      : undefined

    const nextLiveShellData = (subscriptionsReady || hasLiveSnapshot)
      ? mapSpacetimeDataToShell({ data, identity, session })
      : {}

    const pendingRequests = nextLiveShellData.requests?.filter((request) => request.direction === 'incoming').length ?? 0
    const nextTabs: ShellTabDefinition[] = [
      { key: 'browse', label: 'Browse', iconText: 'B', hint: 'Servers' },
      { key: 'friends', label: 'Friends', iconText: 'F', badgeCount: pendingRequests || undefined, hint: 'DMs' },
      { key: 'you', label: 'You', iconText: 'Y', hint: 'Profile' },
    ]

    return [fallbackProfile, nextLiveShellData, nextTabs] as const
  }, [data, hasLiveSnapshot, identity, session, subscriptionsReady])

  const selectedGuildId = activeDetail?.kind === 'channel'
    ? activeDetail.guildId ?? null
    : activeDetail?.kind === 'guild'
      ? activeDetail.guildId ?? null
      : null

  const memberItems = useMemo<ShellMemberItem[]>(() => {
    const usersByIdentity = new Map(data.users.map((user) => [identityToString(user.identity), user]))
    const presenceByIdentity = new Map(data.userPresence.map((presence) => [identityToString(presence.identity), presence]))

    if (activeDetail?.kind === 'dm') {
      const peerUser = Array.from(usersByIdentity.values()).find((user) => (
        user.displayName === activeDetail.peerName || user.username === activeDetail.peerName
      ))

      if (!peerUser) {
        return []
      }

      const peerIdentity = identityToString(peerUser.identity)
      const presence = presenceByIdentity.get(peerIdentity)

      return [{
        id: peerIdentity,
        displayName: peerUser.displayName,
        username: peerUser.username,
        status: toPresenceStatus(presence?.status ?? peerUser.status),
        subtitle: peerUser.bio ?? null,
        avatarUri: avatarBytesToUri(peerUser.avatarBytes),
        profileColor: peerUser.profileColor ?? null,
        isOwner: false,
      }]
    }

    if (!selectedGuildId) {
      return []
    }

    return data.guildMembers
      .filter((member) => toIdKey(member.guildId) === selectedGuildId)
      .map((member) => {
        const memberIdentity = identityToString(member.identity)
        const user = usersByIdentity.get(memberIdentity)
        const presence = presenceByIdentity.get(memberIdentity)

        return {
          id: memberIdentity,
          displayName: member.nickname ?? user?.displayName ?? user?.username ?? 'Member',
          username: user?.username ?? memberIdentity.slice(0, 12),
          status: toPresenceStatus(presence?.status ?? user?.status),
          subtitle: user?.bio ?? null,
          avatarUri: avatarBytesToUri(user?.avatarBytes),
          profileColor: user?.profileColor ?? null,
          isOwner: hasMemberRole(member.role, 'Owner'),
        }
      })
      .sort((left, right) => left.displayName.localeCompare(right.displayName))
  }, [activeDetail, data.guildMembers, data.userPresence, data.users, selectedGuildId])

  const activeDmChannelId = useMemo(() => {
    if (activeDetail?.kind !== 'dm' || !identity) {
      return null
    }

    const peerUser = data.users.find((user) => (
      user.displayName === activeDetail.peerName || user.username === activeDetail.peerName
    ))
    if (!peerUser) {
      return null
    }

    const peerIdentity = identityToString(peerUser.identity)
    const participantMap = new Map<string, string[]>()

    for (const participant of data.dmParticipants) {
      const channelId = toIdKey(participant.dmChannelId)
      const identities = participantMap.get(channelId) ?? []
      identities.push(identityToString(participant.identity))
      participantMap.set(channelId, identities)
    }

    const channel = data.dmChannels.find((entry) => {
      const identities = participantMap.get(toIdKey(entry.dmChannelId)) ?? []
      return identities.includes(identity) && identities.includes(peerIdentity)
    })

    return channel?.dmChannelId ?? null
  }, [activeDetail, data.dmChannels, data.dmParticipants, data.users, identity])

  const {
    incomingCall,
    outgoingCall,
    incomingCallPeer,
    outgoingCallPeer,
    currentDmVoiceChannelId,
    currentCallPeer,
    activeDmHasLiveCall,
    isCurrentCallForActiveDm,
    isOutgoingCallForActiveDm,
  } = useMobileCallState({
    data,
    identity,
    activeDmChannelId,
  })

  const {
    playHangupSound,
    playCallDeclinedSound,
    markOutgoingCallCanceledLocally,
  } = useMobileCallSfx({
    outgoingCall,
    incomingCall,
    currentDmVoiceChannelId,
    voiceStates: data.voiceStates,
    identity: identity ?? '',
  })

  useMobileNotificationSfx({
    identity: identity ?? '',
    conversations,
    selectedConversationId: activeDetail?.kind === 'dm' ? activeDetail.conversationId : null,
    liveShellData,
  })

  const invitableFriends = useMemo(() => {
    const usersByIdentity = new Map(data.users.map((user) => [identityToString(user.identity), user]))
    const selfId = identity ?? ''

    return data.friendEdges.flatMap((edge) => {
      const low = identityToString(edge.identityLow)
      const high = identityToString(edge.identityHigh)
      const friendIdentityString = low === selfId ? high : high === selfId ? low : null

      if (!friendIdentityString) {
        return []
      }

      const user = usersByIdentity.get(friendIdentityString)
      if (!user) {
        return []
      }

      return [{
        id: friendIdentityString,
        displayName: user.displayName,
        username: user.username,
        avatarUri: avatarBytesToUri(user.avatarBytes),
        profileColor: user.profileColor ?? null,
        identity: user.identity,
      }]
    })
  }, [data.friendEdges, data.users, identity])

  const mobileShell = useMobileShellController({
    isMobile: true,
    isHomeView: true,
    selectedGuildId,
    hasActiveContent: Boolean(activeDetail),
    hasMembersPane: memberItems.length > 0 && activeDetail !== null,
  })

  const handlePaneChange = useCallback((pane: 'navigation' | 'content' | 'members') => {
    if (pane !== 'content') {
      Keyboard.dismiss()
    }

    mobileShell.setPane(pane)
  }, [mobileShell])

  const activeTab = mobileShell.navigationSection as ShellTabKey
  const displayName = session.status === 'signed-in' ? session.displayName : 'You'
  const headerContext = buildShellHeaderContext({
    activeTab,
    activeDetail,
    displayName,
  })
  const profile = liveShellData.profile ?? displayProfile
  const contentHeaderBadgeLabel = activeDetail?.kind === 'channel'
    ? activeDetail.guildName
    : activeDetail?.kind === 'dm'
      ? activeDetail.peerName
      : undefined
  const contentHeaderTitle = activeDetail?.kind === 'channel'
    ? `/  # ${activeDetail.channelName}`
    : activeDetail?.kind === 'dm'
      ? ''
      : headerContext.title
  const contentHeaderSubtitle = activeDetail ? undefined : headerContext.subtitle
  const membersContextTitle = activeDetail?.kind === 'channel'
    ? activeDetail.guildName
    : activeDetail?.kind === 'dm'
      ? activeDetail.peerName
    : activeDetail?.kind === 'guild'
      ? activeDetail.title
      : 'this guild'

  // Derive self’s current voice state (present only when in a voice channel).
  const myVoiceState = useMemo(() => {
    if (!identity) return null
    return data.voiceStates.find((vs) => identityToString(vs.identity) === identity) ?? null
  }, [data.voiceStates, identity])

  const currentGuildVoiceChannelId = useMemo(() => {
    if (!myVoiceState || !selectedGuildId) {
      return null
    }

    return toIdKey(myVoiceState.guildId) === selectedGuildId
      ? toIdKey(myVoiceState.channelId)
      : null
  }, [myVoiceState, selectedGuildId])

  useEffect(() => {
    if (myVoiceState) {
      setPreMuted(myVoiceState.isMuted)
      setPreDeafened(myVoiceState.isDeafened)
    }
  }, [myVoiceState])

  const { rtcReady } = useDmRtcMedia({
    identity,
    activeDmChannelId: currentDmVoiceChannelId ? activeDmChannelId : null,
    currentCallPeer,
    outgoingCallActive: Boolean(outgoingCall),
    incomingCallActive: Boolean(incomingCall),
    voiceStates: data.voiceStates,
    rtcSignals: data.rtcSignals,
    isMuted: myVoiceState?.isMuted ?? false,
    sendDmRtcSignal,
    ackRtcSignal,
    onError: setRtcError,
  })

  useEffect(() => {
    setHasRestoredSelection(false)
  }, [session.status, sessionUserId])

  useEffect(() => {
    if (!persistedSelection.hydrated || shouldShowShellLoading) {
      return
    }

    if (activeDetail !== null) {
      setHasRestoredSelection(true)
      return
    }

    if (hasRestoredSelection) {
      return
    }

    const restoredDetail = persistedSelection.resolveInitialDetail({
      guilds: liveShellData.guilds ?? [],
      channels: liveShellData.channels ?? [],
      conversations,
    })

    if (restoredDetail) {
      setActiveDetail(restoredDetail)
    }

    setHasRestoredSelection(true)
  }, [activeDetail, conversations, hasRestoredSelection, liveShellData.channels, liveShellData.guilds, persistedSelection, shouldShowShellLoading])

  useEffect(() => {
    persistedSelection.rememberDetail(activeDetail)
  }, [activeDetail, persistedSelection])

  const handleToggleMute = useCallback(async () => {
    if (!myVoiceState) {
      setPreMuted((current) => !current)
      return
    }
    await updateVoiceState({
      isMuted: !myVoiceState.isMuted,
      isDeafened: myVoiceState.isDeafened,
      isStreaming: myVoiceState.isStreaming,
    })
  }, [myVoiceState, updateVoiceState])

  const handleToggleDeafen = useCallback(async () => {
    if (!myVoiceState) {
      setPreDeafened((current) => !current)
      return
    }
    await updateVoiceState({
      isMuted: myVoiceState.isMuted,
      isDeafened: !myVoiceState.isDeafened,
      isStreaming: myVoiceState.isStreaming,
    })
  }, [myVoiceState, updateVoiceState])

  const openDmCallPeer = useCallback((peer: { conversationId: string; peerName: string }) => {
    setActiveDetail({
      kind: 'dm',
      conversationId: peer.conversationId,
      peerName: peer.peerName,
    })
    mobileShell.openContent()
  }, [mobileShell])

  const handleDmCallAction = useCallback(() => {
    if (!canMutateSpacetime || !activeDmChannelId) {
      return
    }

    if (isCurrentCallForActiveDm) {
      playHangupSound()
      void leaveVoiceChannel()
      return
    }

    if (isOutgoingCallForActiveDm && outgoingCall) {
      markOutgoingCallCanceledLocally()
      playHangupSound()
      void declineDmCall(outgoingCall.callId)
      return
    }

    if (activeDmHasLiveCall) {
      void joinVoiceDm(activeDmChannelId)
      return
    }

    void initiateDmCall(activeDmChannelId)
  }, [
    activeDmChannelId,
    activeDmHasLiveCall,
    canMutateSpacetime,
    declineDmCall,
    initiateDmCall,
    isCurrentCallForActiveDm,
    isOutgoingCallForActiveDm,
    joinVoiceDm,
    leaveVoiceChannel,
    outgoingCall,
  ])

  const handleAcceptIncomingCall = useCallback(() => {
    if (!incomingCall) {
      return
    }

    if (incomingCallPeer) {
      openDmCallPeer(incomingCallPeer)
    }

    void acceptDmCall(incomingCall.callId)
  }, [acceptDmCall, incomingCall, incomingCallPeer, openDmCallPeer])

  const handleDeclineIncomingCall = useCallback(() => {
    if (!incomingCall) {
      return
    }

    playCallDeclinedSound()
    void declineDmCall(incomingCall.callId)
  }, [declineDmCall, incomingCall, playCallDeclinedSound])

  const handleIgnoreIncomingCall = useCallback(() => {
    if (!incomingCall) {
      return
    }

    setIgnoredCallIds((current) => new Set(current).add(String(incomingCall.callId)))
  }, [incomingCall])

  const handleCancelOutgoingCall = useCallback(() => {
    if (!outgoingCall) {
      return
    }

    markOutgoingCallCanceledLocally()
    playHangupSound()
    void declineDmCall(outgoingCall.callId)
  }, [declineDmCall, markOutgoingCallCanceledLocally, outgoingCall, playHangupSound])

  const handleOpenCurrentCall = useCallback(() => {
    if (currentCallPeer) {
      openDmCallPeer(currentCallPeer)
      return
    }

    if (outgoingCallPeer) {
      openDmCallPeer(outgoingCallPeer)
    }
  }, [currentCallPeer, openDmCallPeer, outgoingCallPeer])

  const incomingCallVisible = Boolean(incomingCall && !ignoredCallIds.has(String(incomingCall.callId)))
  const voiceChannelLabel = useMemo(() => {
    if (!myVoiceState || currentDmVoiceChannelId) {
      return null
    }

    const activeChannel = data.channels.find((channel) => toIdKey(channel.channelId) === toIdKey(myVoiceState.channelId))
    return activeChannel?.name ?? 'Voice channel'
  }, [currentDmVoiceChannelId, data.channels, myVoiceState])

  const navigationBody = useMemo(() => {
    if (activeTab === 'browse') {
      return (
        <BrowseScreen
          guilds={liveShellData.guilds ?? []}
          channels={liveShellData.channels ?? []}
          conversations={conversations}
          isLoading={shouldShowShellLoading}
          topInset={insets.top}
          selectedGuildId={selectedGuildId}
          selectedChannelId={activeDetail?.kind === 'channel' ? activeDetail.channelId : null}
          currentVoiceChannelId={currentGuildVoiceChannelId}
          selectedConversationId={activeDetail?.kind === 'dm' ? activeDetail.conversationId : null}
          pendingFriendCount={(liveShellData.requests ?? []).filter((request) => request.direction === 'incoming').length}
          onCreateLoom={async (name) => {
            await createGuild({ name })
          }}
          onCreateChannel={canMutateSpacetime ? async ({ guildId, name, channelType, parentCategoryId }) => {
            await createChannel({
              guildId: BigInt(guildId),
              name,
              channelType: { tag: channelType },
              parentCategoryId: parentCategoryId ? BigInt(parentCategoryId) : null,
            })
          } : undefined}
          onUpdateGuild={canMutateSpacetime ? async ({ guildId, name, bio, avatarBytes }) => {
            await updateGuild({
              guildId: BigInt(guildId),
              name,
              bio,
              avatarBytes,
            })
          } : undefined}
          invitableFriends={invitableFriends}
          onInviteMember={canMutateSpacetime ? async (guildId, targetIdentity) => {
            await inviteMember({ guildId: BigInt(guildId), targetIdentity })
          } : undefined}
          onLeaveGuild={canMutateSpacetime ? async (guildId) => {
            await leaveGuild(BigInt(guildId))
            setActiveDetail(null)
          } : undefined}
          onDeleteGuild={canMutateSpacetime ? async (guildId) => {
            await deleteGuild(BigInt(guildId))
            setActiveDetail(null)
          } : undefined}
          onSelectGuild={(guildId) => {
            const guild = (liveShellData.guilds ?? []).find((item) => item.id === guildId)
            if (!guild) {
              return
            }

            setActiveDetail(persistedSelection.resolveGuildDetail({
              guildId: guild.id,
              guildName: guild.name,
              channels: liveShellData.channels ?? [],
            }))
          }}
          onSelectBrowseHome={() => {
            setActiveDetail(persistedSelection.resolveLastDmDetail(conversations))
            mobileShell.setPane('navigation')
          }}
          onOpenDm={(conversationId, peerName) => {
            setActiveDetail({
              kind: 'dm',
              conversationId,
              peerName,
            })
            mobileShell.openContent()
          }}
          onShowFriends={() => {
            setActiveDetail(null)
            mobileShell.showFriends()
          }}
          onOpenChannel={({ channelId, channelName, guildId, guildName, channelType }) => {
            if (channelType === 'voice') {
              if (canMutateSpacetime) {
                void joinVoiceChannel(BigInt(channelId))
              }
              return
            }

            setActiveDetail({
              kind: 'channel',
              guildId,
              title: `#${channelName}`,
              subtitle: `Inside ${guildName}. Channel history and composer will connect here.`,
              channelId,
              channelName,
              guildName,
            })
            mobileShell.openContent()
          }}
        />
      )
    }

    if (activeTab === 'friends') {
      return (
        <FriendsScreen
          friends={liveShellData.friends ?? []}
          requests={liveShellData.requests ?? []}
          isLoading={shouldShowShellLoading}
          onAcceptRequest={acceptFriendRequest}
          onDeclineRequest={declineFriendRequest}
          onCancelRequest={cancelFriendRequest}
          onSendFriendRequest={sendFriendRequest}
          onRemoveFriend={removeFriend}
          onOpenDm={(friendId, friendName) => {
            setActiveDetail({
              kind: 'dm',
              conversationId: `dm:${friendId}`,
              peerName: friendName,
            })
            mobileShell.openContent()
          }}
        />
      )
    }

    return (
      <ProfileScreen
        profile={profile}
        onSignOut={() => { void signOut() }}
        onNavigate={() => {
          // The mobile profile screen keeps settings inline for now.
        }}
          onUpdateProfile={canMutateSpacetime ? async (values) => {
            await updateProfile({
              username: values.username,
              displayName: values.displayName,
              bio: values.bio,
              avatarBytes: values.avatarBytes,
              profileColor: values.profileColor,
            })
          } : undefined}
          onSetStatus={canMutateSpacetime ? async (statusTag) => {
            await setStatus(statusTag)
          } : undefined}
        isMuted={myVoiceState?.isMuted ?? preMuted}
        isDeafened={myVoiceState?.isDeafened ?? preDeafened}
        onToggleMute={() => { void handleToggleMute() }}
        onToggleDeafen={() => { void handleToggleDeafen() }}
      />
    )
  }, [
    acceptFriendRequest,
    activeDetail,
    activeTab,
    canMutateSpacetime,
    cancelFriendRequest,
    conversations,
    createGuild,
    createChannel,
    currentGuildVoiceChannelId,
    updateGuild,
    deleteGuild,
    declineFriendRequest,
    handleToggleDeafen,
    handleToggleMute,
    insets.top,
    invitableFriends,
    inviteMember,
    joinVoiceChannel,
    leaveGuild,
    liveShellData.channels,
    liveShellData.friends,
    liveShellData.guilds,
    liveShellData.requests,
    mobileShell,
    myVoiceState,
    persistedSelection,
    preDeafened,
    preMuted,
    profile,
    removeFriend,
    selectedGuildId,
    sendFriendRequest,
    setStatus,
    shouldShowShellLoading,
    signOut,
    updateProfile,
  ])

  const contentBody = useMemo(() => {
    if (activeDetail?.kind === 'dm') {
      return (
        <ChatScreen
          conversationId={activeDetail.conversationId}
          peerName={activeDetail.peerName}
          onBack={() => mobileShell.setPane('navigation')}
          showHeader={false}
        />
      )
    }

    if (activeDetail?.kind === 'channel') {
      return (
        <ChannelChatScreen
          channelId={activeDetail.channelId}
          channelName={activeDetail.channelName}
          guildName={activeDetail.guildName}
        />
      )
    }

    if (activeDetail) {
      return (
        <ShellDetailScreen
          detail={activeDetail}
          title={activeDetail.title}
          subtitle={activeDetail.subtitle}
          eyebrow={activeDetail.kind === 'guild' ? 'Server' : 'Channel'}
        />
      )
    }

    return (
      <EmptyState
        title="Pick a conversation"
        body="Open a DM or channel from the navigation pane to mirror the web mobile flow."
      />
    )
  }, [activeDetail, mobileShell])

  return (
    <View style={styles.root}>
      <View style={styles.shellFrame}>
        <MobileSwipeShell
          navigationPane={(
            <View style={styles.pane}>
              <View style={[styles.body, { paddingTop: activeTab === 'browse' ? 0 : Math.max(insets.top, 12) }]}>{navigationBody}</View>
            </View>
          )}
          navigationFooter={(
            <View style={[styles.bottomNavWrap, { paddingBottom: insets.bottom }]}> 
              <ShellBottomNav
                tabs={tabs}
                activeTab={activeTab}
                onSelectTab={(tab) => {
                  setActiveDetail(null)
                  if (tab === 'browse') {
                    mobileShell.showBrowse()
                    return
                  }

                  if (tab === 'friends') {
                    mobileShell.showFriends()
                    return
                  }

                  mobileShell.showYou()
                }}
              />
            </View>
          )}
          contentHeader={(
            <View style={{ paddingTop: Math.max(insets.top, 12), backgroundColor: Colors.bgPrimary }}>
              <ShellTopBar
                badgeLabel={contentHeaderBadgeLabel}
                eyebrow={activeDetail ? undefined : headerContext.eyebrow}
                title={contentHeaderTitle}
                subtitle={contentHeaderSubtitle}
                canGoBack={true}
                onBack={() => {
                  Keyboard.dismiss()
                  mobileShell.setPane('navigation')
                }}
                onCallAction={activeDetail?.kind === 'dm' && activeDmChannelId
                  ? handleDmCallAction
                  : undefined}
                onRightAction={memberItems.length > 0 && activeDetail
                  ? mobileShell.openMembers
                  : undefined}
              />
              {myVoiceState ? (
                <MobileCallBanner
                  mode="connected"
                  title={currentCallPeer ? `In call with ${currentCallPeer.peerName}` : `Voice connected — ${voiceChannelLabel ?? 'Call'}`}
                  subtitle={currentCallPeer
                    ? (rtcError
                      ?? (activeDetail?.kind === 'dm' && currentCallPeer.conversationId === activeDetail.conversationId
                        ? (rtcReady ? 'Call controls are live for this conversation.' : 'Connecting direct message voice…')
                        : 'Tap to jump back to the active DM call.'))
                    : 'Voice controls stay available while you browse.'}
                  canOpen={Boolean(currentCallPeer && (!activeDetail || activeDetail.kind !== 'dm' || currentCallPeer.conversationId !== activeDetail.conversationId))}
                  onOpen={currentCallPeer ? handleOpenCurrentCall : undefined}
                  onMute={() => { void handleToggleMute() }}
                  onDeafen={() => { void handleToggleDeafen() }}
                  onHangUp={() => {
                    playHangupSound()
                    void leaveVoiceChannel()
                  }}
                  isMuted={myVoiceState.isMuted}
                  isDeafened={myVoiceState.isDeafened}
                />
              ) : outgoingCall && outgoingCallPeer ? (
                <MobileCallBanner
                  mode="calling"
                  title={`Calling ${outgoingCallPeer.peerName}…`}
                  subtitle="Waiting for them to accept on another device."
                  onCancel={handleCancelOutgoingCall}
                />
              ) : null}
            </View>
          )}
          contentBody={contentBody}
          membersHeader={(
            <View style={{ paddingTop: Math.max(insets.top, 12), backgroundColor: Colors.bgPrimary }}>
              <ShellTopBar
                eyebrow={undefined}
                title="Members"
                subtitle={membersContextTitle}
                canGoBack={true}
                onBack={mobileShell.openContent}
              />
            </View>
          )}
          membersPane={memberItems.length > 0 ? (
            <ShellMembersPane
              title={membersContextTitle}
              members={memberItems}
            />
          ) : null}
          activePane={mobileShell.activePane}
          onActivePaneChange={handlePaneChange}
          canNavigateToContent={mobileShell.canNavigateToContent}
          canNavigateToMembers={mobileShell.canNavigateToMembers}
        />
      </View>
      <IncomingCallModal
        visible={incomingCallVisible && Boolean(incomingCallPeer)}
        callerName={incomingCallPeer?.peerName ?? 'Incoming caller'}
        callerAvatarUri={incomingCallPeer?.avatarUri}
        callerProfileColor={incomingCallPeer?.profileColor ?? null}
        onAccept={handleAcceptIncomingCall}
        onDecline={handleDeclineIncomingCall}
        onIgnore={handleIgnoreIncomingCall}
      />
    </View>
  )
}

function toIdKey(value: unknown): string {
  if (typeof value === 'bigint') {
    return value.toString()
  }

  return String(value)
}

function identityToString(value: unknown): string {
  if (!value) {
    return ''
  }

  if (typeof value === 'object') {
    const withToHex = value as { toHex?: () => { toString: () => string } }
    const hex = withToHex.toHex?.()
    if (hex) {
      return hex.toString()
    }
  }

  return String(value)
}

function toPresenceStatus(value: unknown): 'online' | 'idle' | 'dnd' | 'offline' {
  if (!value) {
    return 'offline'
  }

  if (typeof value === 'string') {
    if (value === 'Online') return 'online'
    if (value === 'Away') return 'idle'
    if (value === 'DoNotDisturb') return 'dnd'
    return 'offline'
  }

  const enumLike = value as Record<string, unknown>
  if ('Online' in enumLike) return 'online'
  if ('Away' in enumLike) return 'idle'
  if ('DoNotDisturb' in enumLike) return 'dnd'
  return 'offline'
}

function hasMemberRole(value: unknown, role: 'Owner'): boolean {
  if (!value || typeof value !== 'object') {
    return false
  }

  return role in (value as Record<string, unknown>)
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  shellFrame: {
    flex: 1,
  },
  pane: {
    flex: 1,
  },
  body: {
    flex: 1,
    minHeight: 0,
  },
  bottomNavWrap: {
    backgroundColor: Colors.bgPrimary,
    paddingHorizontal: 0,
    paddingTop: 0,
  },
})
