import { useCallback, useMemo, useEffect, useLayoutEffect } from 'react'

import {
  CallBanner,
  ChannelColumn,
  IncomingCallModal,
  RegisterOverlay,
} from './components'
import { ServerColumn } from './components/layout/ServerColumn'
import type { ProfileSettingsModalProps } from './components/modals/ProfileSettingsModal'
import { ModalSection } from './components/layout/ModalSection'
import { AudioStreams } from './components/voice/AudioStreams'
import { ContextMenuOverlay } from './components/ui/ContextMenuOverlay'
import { AppShell } from './components/layout/AppShell'
import { MessageArea } from './components/layout/MessageArea'
import { MemberColumn } from './components/layout/MemberColumn'
import { SidebarBottom } from './components/layout/SidebarBottom'
import { TopNavBar } from './components/layout/TopNavBar'
import { ScreenShareViewer } from './components/voice/ScreenShareViewer'
import { useRtcOrchestrator } from './lib/webrtc'
import { toIdKey, isVoiceChannel, statusToLabel } from './lib/helpers'
import { avatarBytesToUrl } from './lib/avatarUtils'
import { identityToString } from './hooks/useAppData'

import { useAppData } from './hooks/useAppData'
import { useActionFeedback } from './hooks/useActionFeedback'
import { useGuildNavigation } from './hooks/useGuildNavigation'
import { useFriends } from './hooks/useFriends'
import { useDmChat } from './hooks/useDmChat'
import { useGuildMessages } from './hooks/useGuildMessages'
import { useVoiceChat } from './hooks/useVoiceChat'
import { useRtcSignaling } from './hooks/useRtcSignaling'
import { useGuildActions } from './hooks/useGuildActions'
import { useCallHandling } from './hooks/useCallHandling'
import { useCallSfx } from './hooks/useCallSfx'
import { useNotificationEffects } from './hooks/useNotificationEffects'
import { useMessageActions } from './hooks/useMessageActions'
import { useAppNavigation } from './hooks/useAppNavigation'
import { useAppState } from './hooks/useAppState'
import { useSendSignal } from './hooks/useSendSignal'

import { NotificationToast } from './components/ui/NotificationToast'
import {
  S_appShell,
  S_main,
} from './constants/appStyles'

function App() {
  // ---------------------------------------------------------------------------
  // Core data & feedback
  // ---------------------------------------------------------------------------
  const appData = useAppData()
  const { state, actions, extendedState, extendedActions, identityString, usersByIdentity, me } = appData

  // Helper to get a data URL for any user's avatar by identity string
  const getAvatarUrlForUser = useCallback((identityStr: string): string | undefined => {
    const user = usersByIdentity.get(identityStr)
    return avatarBytesToUrl(user?.avatarBytes as Uint8Array | null | undefined)
  }, [usersByIdentity])

  const feedback = useActionFeedback()
  const { actionError, actionStatus, setActionError, setActionStatus, runAction, callActionOrReducer } = feedback

  // ---------------------------------------------------------------------------
  // Friends
  // ---------------------------------------------------------------------------
  const friendsData = useFriends(appData, runAction, callActionOrReducer)
  const {
    friendRequestUsername, setFriendRequestUsername,
    friends, incomingFriendRequests, outgoingFriendRequests,
    friendIdentityById,
    onSendFriendRequest, onAcceptFriendRequest, onDeclineFriendRequest,
    onCancelOutgoingFriendRequest, onRemoveFriend,
  } = friendsData

  // ---------------------------------------------------------------------------
  // DM Chat
  // ---------------------------------------------------------------------------
  const dm = useDmChat({
    appData,
    friendIdentityById,
    runAction,
    callActionOrReducer,
    setActionError,
    setActionStatus,
  })
  const {
    selectedDmChannelId, setSelectedDmChannelId,
    dmListItems, selectedDmChannel, selectedDmName,
    dmMessagesForSelectedChannel,
    onStartDmFromFriend, onLeaveDmChannel,
    onToggleDmReaction, getDmReactionsForMessage,
  } = dm

  // ---------------------------------------------------------------------------
  // sendSignal callback (needed before useRtcOrchestrator)
  // ---------------------------------------------------------------------------
  const currentVoiceState = useMemo(
    () => state.voiceStates.find((vs) => identityToString(vs.identity) === identityString) ?? null,
    [identityString, state.voiceStates],
  )

  const sendSignal = useSendSignal({ currentVoiceState, usersByIdentity, actions, extendedActions })

  // ---------------------------------------------------------------------------
  // RTC Orchestrator
  // ---------------------------------------------------------------------------
  const { startAudio, setMuted, stopAudio, startScreenShare, stopScreenShare, handleIncomingSignal, remoteStreams, peerStates, isLocalSpeaking, remoteSpeaking, connectToPeers } =
    useRtcOrchestrator({ localIdentity: identityString || '', sendSignal })

  // ---------------------------------------------------------------------------
  // Guild Navigation
  // ---------------------------------------------------------------------------
  const nav = useGuildNavigation({
    appData,
    currentVoiceState,
    selectedDmChannelId,
  })
  const {
    selectedGuildId, setSelectedGuildId,
    selectedTextChannelId, setSelectedTextChannelId,
    setSelectedVoiceChannelId,
    homeViewActiveRef,
    memberGuilds, ownedGuildIds,
    selectedGuild, channelsForGuild,
    textChannels, voiceChannels,
    channelIdsForSelectedGuild,
    selectedTextChannel, selectedVoiceChannel,
  } = nav

  // ---------------------------------------------------------------------------
  // Subscriptions Refactor Phase 2 Wiring
  // ---------------------------------------------------------------------------
  useLayoutEffect(() => {
    if (actions.setActiveSubscriptions) {
      actions.setActiveSubscriptions(selectedTextChannelId, selectedDmChannelId)
    }
  }, [selectedTextChannelId, selectedDmChannelId, actions])

  // ---------------------------------------------------------------------------
  // Voice Chat
  // ---------------------------------------------------------------------------
  const voice = useVoiceChat({
    appData,
    selectedVoiceChannel,
    setActionError,
    runAction,
    rtcOrchestrator: {
      isVoiceConnected: Boolean(currentVoiceState),
      startAudio,
      setMuted,
      stopAudio,
      startScreenShare,
      stopScreenShare,
      remoteStreams,
      peerStates,
      isLocalSpeaking,
      remoteSpeaking,
      handleIncomingSignal,
      sendSignal,
      connectToPeers,
    },
  })
  const {
    viewingScreenShareKey, setViewingScreenShareKey,
    voiceChannelUsers,
    rtcRecipients,
    remoteSharersCount,
    onJoinVoice, onLeaveVoice,
    onToggleMute, onToggleDeafen,
    onStartSharing, onStopSharing,
    preMuted, preDeafened,
  } = voice

  // ---------------------------------------------------------------------------
  // Local state (extracted hook)
  // ---------------------------------------------------------------------------
  const {
    composerValue, setComposerValue,
    locallyMutedUsers,
    showMemberList, setShowMemberList,
    showProfileModal, setShowProfileModal,
    profilePopup, setProfilePopup,
    contextMenu, setContextMenu,
    initialLoadComplete,
    notifications,
    ignoredCallIds, setIgnoredCallIds,
    addNotification,
    dismissNotification,
    toggleLocalMuteUser,
    handleToggleScreenShare,
    viewingScreenStream,
    onRegister,
    onLoginAsUser,
    audioStreams,
    isMuted, isDeafened, muteColor, deafenColor,
  } = useAppState({
    viewingScreenShareKey,
    remoteStreams,
    isStreaming: currentVoiceState?.isStreaming,
    onStartSharing,
    onStopSharing,
    connectionStatus: state.connectionStatus,
    runAction,
    actions,
    currentVoiceIsMuted: currentVoiceState?.isMuted,
    currentVoiceIsDeafened: currentVoiceState?.isDeafened,
    preMuted,
    preDeafened,
  })

  // ---------------------------------------------------------------------------
  // RTC Signaling (debug panel)
  // ---------------------------------------------------------------------------
  useRtcSignaling({
    appData,
    currentVoiceState,
    rtcRecipients,
    sendSignal: voice.sendSignal,
    handleIncomingSignal,
    actions,
    setActionError,
    runAction,
  })

  // ---------------------------------------------------------------------------
  // Guild Messages & Members
  // ---------------------------------------------------------------------------
  const guildMessages = useGuildMessages(
    {
      messages: state.messages,
      reactions: appData.reactions,
      identityString,
      usersByIdentity,
      guildMembersByGuildId: appData.guildMembersByGuildId,
      extendedActions,
    },
    selectedGuild,
    selectedTextChannel,
    channelIdsForSelectedGuild,
    runAction,
    callActionOrReducer,
  )
  const {
    messagesForSelectedTextChannel,
    memberListItems,
    onToggleReaction,
    getReactionsForMessage,
  } = guildMessages

  // ---------------------------------------------------------------------------
  // Guild Actions (create guild/channel, invite, leave, delete)
  // ---------------------------------------------------------------------------
  const guildActions = useGuildActions({
    actions,
    selectedGuild,
    runAction,
    callActionOrReducer,
    setActionError,
    setActionStatus,
    setSelectedGuildId,
    identityString,
    guildInvites: appData.guildInvites,
    usersByIdentity,
    extendedActions,
  })
  const {
    newGuildName, setNewGuildName,
    newChannelName, setNewChannelName,
    newChannelType, setNewChannelType,
    showCreateGuildModal, setShowCreateGuildModal,
    showCreateChannelModal, setShowCreateChannelModal,
    showInviteModal, setShowInviteModal,
    onCreateGuild, onCreateChannel,
    onInviteFriend, onLeaveGuild, onDeleteGuild,
    myGuildInvites, onAcceptGuildInvite, onDeclineGuildInvite,
  } = guildActions

  // ---------------------------------------------------------------------------
  // Derived values
  // ---------------------------------------------------------------------------
  const isHomeView = !selectedGuildId && !selectedDmChannel
  const isDmMode = selectedDmChannel !== null

  // ---------------------------------------------------------------------------
  // Call handling (extracted hook)
  // ---------------------------------------------------------------------------
  const {
    incomingCall, outgoingCall,
    incomingCallId, outgoingCallId,
    isInDmVoice, dmVoiceChannelId,
    dmCallRemoteUser, dmCallActive,
    dmPartnerIdentity, dmPartnerAvatarUrl, dmPartnerProfileColor,
    dmRemoteSpeaking, dmRemoteScreenStream, dmRemoteScreenShareKey,
    activeCallChannelIds,
    handleAcceptCall, handleDeclineCall, handleCancelOutgoingCall, handleIgnoreCall,
    callBannerProps, handleNavigateToCall,
  } = useCallHandling({
    identityString,
    voiceStates: state.voiceStates,
    dmCallRequests: state.dmCallRequests,
    currentVoiceState,
    runAction,
    extendedActions,
    usersByIdentity,
    getAvatarUrlForUser,
    setSelectedDmChannelId,
    setSelectedGuildId,
    selectedDmChannel: selectedDmChannel ?? null,
    selectedDmChannelId,
    isDmMode,
    remoteSpeaking,
    remoteStreams,
    ignoredCallIds,
    setIgnoredCallIds,
    dmParticipants: appData.dmParticipants,
    channelsForGuild,
    selectedGuildId,
    selectedTextChannelId,
  })

  // ---------------------------------------------------------------------------
  // Call SFX (extracted hook)
  // ---------------------------------------------------------------------------
  const { handleHangUpWithSfx } = useCallSfx({
    outgoingCallId,
    outgoingCall,
    incomingCallId,
    isInDmVoice,
    dmVoiceChannelId,
    voiceStates: state.voiceStates,
    identityString,
    addNotification,
    onLeaveVoice,
  })

  // ---------------------------------------------------------------------------
  // Message Actions (extracted hook)
  // ---------------------------------------------------------------------------
  const { handleDeleteMessage, handleEditMessage, onSendMessage, handleSendMessageWithSfx, activeChannelName, activeMessages, statusError } = useMessageActions({
    isDmMode,
    selectedDmChannel: selectedDmChannel ?? null,
    selectedTextChannel: selectedTextChannel ?? null,
    selectedDmName,
    dmMessagesForSelectedChannel,
    messagesForSelectedTextChannel,
    stateError: state.error,
    actionError,
    runAction,
    callActionOrReducer,
    extendedActions,
    actions,
    setActionError,
    setComposerValue,
  })

  // ---------------------------------------------------------------------------
  // Notification effects (extracted hook)
  // ---------------------------------------------------------------------------
  useNotificationEffects({
    actionStatus,
    actionError,
    addNotification,
    friends,
    identityString,
    dmMessagesHydrated: state.dmMessagesHydrated,
    dmParticipants: appData.dmParticipants,
    dmLastMessageByChannel: appData.dmLastMessageByChannel,
    selectedDmChannelId,
    usersByIdentity,
    setSelectedDmChannelId,
    setSelectedGuildId,
  })



  // ---------------------------------------------------------------------------
  // App Navigation (extracted hook)
  // ---------------------------------------------------------------------------
  const {
    guildOrder, orderedGuilds,
    handleReorderGuilds, handleSelectGuild, handleHomeClick,
    handleSelectDmChannel, handleInitiateDmCall,
    handleSelectTextOrVoiceChannel, handleViewProfile, handleInviteToGuild,
  } = useAppNavigation({
    memberGuilds,
    homeViewActiveRef,
    setSelectedGuildId,
    setSelectedDmChannelId,
    setSelectedTextChannelId,
    setSelectedVoiceChannelId,
    channelsForGuild,
    onJoinVoice: onJoinVoice,
    setShowInviteModal,
    runAction,
    extendedActions,
    voiceStates: state.voiceStates,
    identityString,
    usersByIdentity,
    getAvatarUrlForUser,
    setContextMenu,
  })

  // ---------------------------------------------------------------------------
  // JSX
  // ---------------------------------------------------------------------------
  return (
    <div className="app-shell" style={S_appShell}>
      {/* Global call banner */}
      {(currentVoiceState || outgoingCall) && (
        <CallBanner
          currentVoiceState={!!currentVoiceState}
          outgoingCall={!!outgoingCall}
          calleeName={callBannerProps.calleeName}
          onCancelCall={handleCancelOutgoingCall}
          isDmCall={callBannerProps.isDmCall}
          callName={callBannerProps.callName}
          isOnCallPage={callBannerProps.isOnCallPage}
          onNavigateToCall={handleNavigateToCall}
        />
      )}
      <main style={S_main}>
        <AppShell
          serverColumn={
            <ServerColumn
              orderedGuilds={orderedGuilds}
              selectedGuildId={selectedGuildId ?? null}
              onSelectGuild={handleSelectGuild}
              onHomeClick={handleHomeClick}
              isDmMode={isDmMode}
              onAddServer={() => {
                const userName = (me as any)?.displayName ?? (me as any)?.username ?? 'My'
                setNewGuildName(`${userName}'s server`)
                setShowCreateGuildModal(true)
              }}
              onLeaveGuild={onLeaveGuild}
              onDeleteGuild={onDeleteGuild}
              onInviteToGuild={handleInviteToGuild}
              ownedGuildIds={ownedGuildIds}
              onReorder={handleReorderGuilds}
            />
          }
          channelColumn={
            <ChannelColumn
              isDmMode={isDmMode}
              selectedGuildId={selectedGuildId}
              dmListItems={dmListItems}
              selectedDmChannelId={selectedDmChannelId}
              onSelectDmChannel={handleSelectDmChannel}
              onLeaveDmChannel={(channelId) => onLeaveDmChannel(channelId)}
              onShowFriends={() => setSelectedDmChannelId(undefined)}
              activeCallChannelIds={activeCallChannelIds}
              guildName={selectedGuild?.name}
              channels={channelsForGuild.map((channel) => ({
                id: toIdKey(channel.channelId),
                name: channel.name,
                kind: isVoiceChannel(channel) ? 'voice' as const : 'text' as const,
              }))}
              selectedTextChannelId={selectedTextChannelId}
              onSelectChannel={handleSelectTextOrVoiceChannel}
              onCreateChannel={() => setShowCreateChannelModal(true)}
              onViewScreenShare={setViewingScreenShareKey}
              voiceChannelUsers={voiceChannelUsers}
              currentVoiceChannelId={currentVoiceState ? toIdKey(currentVoiceState.channelId) : undefined}
              locallyMutedUsers={locallyMutedUsers}
              onToggleLocalMuteUser={toggleLocalMuteUser}
              localIdentity={identityString}
              getAvatarUrl={getAvatarUrlForUser}
            />
          }
          showMemberList={showMemberList}
          topNav={
            <TopNavBar
              isDmMode={isDmMode}
              dmName={selectedDmName}
              guildName={selectedGuild?.name}
              selectedDmChannel={!!selectedDmChannel}
              currentVoiceState={!!currentVoiceState}
              outgoingCall={!!outgoingCall}
              dmCallActive={!!dmCallActive}
              selectedDmChannelId={selectedDmChannelId}
              showMemberList={showMemberList}
              onToggleMemberList={() => setShowMemberList(prev => !prev)}
              onInitiateDmCall={handleInitiateDmCall}
            />
          }
          messageArea={
            <MessageArea
              isInDmVoice={isInDmVoice}
              isDmMode={isDmMode}
              isHomeView={isHomeView}
              selectedDmChannelId={selectedDmChannelId}
              dmVoiceChannelId={dmVoiceChannelId}
              localUser={{
                name: me?.displayName ?? me?.username ?? '?',
                avatarUrl: getAvatarUrlForUser(identityString ?? ''),
                isMuted: currentVoiceState?.isMuted ?? false,
                isDeafened: currentVoiceState?.isDeafened ?? false,
              }}
              remoteUser={dmCallRemoteUser ?? { name: 'Connecting...' }}
              onMute={onToggleMute}
              onDeafen={onToggleDeafen}
              onScreenShare={handleToggleScreenShare}
              onHangUp={handleHangUpWithSfx}
              isMuted={currentVoiceState?.isMuted ?? false}
              isDeafened={currentVoiceState?.isDeafened ?? false}
              isScreenSharing={currentVoiceState?.isStreaming ?? false}
              isLocalSpeaking={isLocalSpeaking}
              isRemoteSpeaking={dmRemoteSpeaking}
              remoteScreenStream={dmRemoteScreenStream}
              dmRemoteScreenShareKey={dmRemoteScreenShareKey}
              onViewScreenShareFullscreen={setViewingScreenShareKey}
              activeChannelName={activeChannelName}
              activeMessages={activeMessages}
              channelName={activeChannelName}
              messages={activeMessages}
              dmMessages={dmMessagesForSelectedChannel}
              composerValue={composerValue}
              onComposerChange={setComposerValue}
              onSend={handleSendMessageWithSfx}
              getDmReactionsForMessage={getDmReactionsForMessage}
              getReactionsForMessage={getReactionsForMessage}
              onToggleDmReaction={onToggleDmReaction}
              onToggleReaction={onToggleReaction}
              currentUserId={identityString || undefined}
              onViewProfile={handleViewProfile}
              getAvatarUrl={getAvatarUrlForUser}
              onDeleteMessage={handleDeleteMessage}
              onEditMessage={handleEditMessage}
              dmPartnerAvatarUrl={dmPartnerAvatarUrl}
              dmPartnerProfileColor={dmPartnerProfileColor}
              selectedTextChannel={selectedTextChannel}
              dmCallActive={!!dmCallActive}
              friendRequestUsername={friendRequestUsername}
              onRequestUsernameChange={setFriendRequestUsername}
              onSendRequest={onSendFriendRequest}
              incomingRequests={incomingFriendRequests.map((request) => ({
                id: request.id,
                username: request.username,
              }))}
              onAcceptRequest={onAcceptFriendRequest}
              onDeclineRequest={onDeclineFriendRequest}
              outgoingRequests={outgoingFriendRequests.map((request) => ({
                id: request.id,
                username: request.username,
              }))}
              onCancelOutgoingRequest={onCancelOutgoingFriendRequest}
              friends={friends.map((friend) => ({
                id: friend.id,
                username: friend.username,
                displayName: friend.displayName,
                status: friend.status,
              }))}
              onStartDm={onStartDmFromFriend}
              onRemoveFriend={onRemoveFriend}
              guildInvites={myGuildInvites}
              onAcceptGuildInvite={onAcceptGuildInvite}
              onDeclineGuildInvite={onDeclineGuildInvite}
            />
          }
          inputArea={null}
          sidebarBottom={
            <SidebarBottom
              showVoicePanel={true}
              currentVoiceState={currentVoiceState}
              onLeave={handleHangUpWithSfx}
              remoteSharersCount={remoteSharersCount}
              onStartSharing={onStartSharing}
              onStopSharing={onStopSharing}
              user={me ? {
                username: (me as Record<string, unknown>).username as string,
                displayName: (me as Record<string, unknown>).displayName as string | undefined,
                status: statusToLabel((me as Record<string, unknown>).status) || 'Online',
                avatarBytes: (me as Record<string, unknown>).avatarBytes as Uint8Array | null,
              } : null}
              isMuted={isMuted}
              isDeafened={isDeafened}
              muteColor={muteColor}
              deafenColor={deafenColor}
              onToggleMute={onToggleMute}
              onToggleDeafen={onToggleDeafen}
              onOpenProfile={() => setShowProfileModal(true)}
            />
          }
          memberColumn={
            <MemberColumn
              isDmMode={isDmMode}
              guildName={selectedGuild?.name}
              friends={friends}
              memberListItems={memberListItems}
              getAvatarUrl={getAvatarUrlForUser}
              usersByIdentity={usersByIdentity}
              onViewProfile={handleViewProfile}
              localUserId={identityString || undefined}
            />
          }
        />

        {/* All modals */}
        <ModalSection
          showCreateGuildModal={showCreateGuildModal}
          onCloseCreateGuild={() => setShowCreateGuildModal(false)}
          newGuildName={newGuildName}
          onGuildNameChange={setNewGuildName}
          onCreateGuild={onCreateGuild}
          showCreateChannelModal={showCreateChannelModal}
          onCloseCreateChannel={() => setShowCreateChannelModal(false)}
          newChannelName={newChannelName}
          onChannelNameChange={setNewChannelName}
          newChannelType={newChannelType}
          onChannelTypeChange={setNewChannelType}
          onCreateChannel={onCreateChannel}
          showInviteModal={showInviteModal}
          onCloseInvite={() => setShowInviteModal(false)}
          friends={friends}
          onInviteFriend={onInviteFriend}
          showProfileModal={showProfileModal}
          onCloseProfile={() => setShowProfileModal(false)}
          currentUser={me as ProfileSettingsModalProps['currentUser']}
          onUpdateProfile={async (params) => {
            await actions.updateProfile({
              displayName: params.displayName ?? undefined,
              bio: params.bio ?? undefined,
              avatarBytes: params.avatarBytes ?? undefined,
              profileColor: params.profileColor ?? undefined,
            })
          }}
          onSetStatus={(statusTag) => {
            void actions.setStatus({ status: { tag: statusTag } as never })
          }}
        />

        <ContextMenuOverlay
          contextMenu={contextMenu}
          profilePopup={profilePopup}
          identityString={identityString}
          friends={friends}
          usersByIdentity={usersByIdentity}
          getAvatarUrlForUser={getAvatarUrlForUser}
          onClose={() => setContextMenu(null)}
          onCloseProfile={() => setProfilePopup(null)}
          onViewProfile={(userId) => setProfilePopup({ userId })}
          onStartDm={onStartDmFromFriend}
        />

        {/* Hidden audio elements for remote voice playback */}
        <AudioStreams
          audioStreams={audioStreams}
          isDeafened={currentVoiceState?.isDeafened ?? false}
          locallyMutedUsers={locallyMutedUsers}
        />

        {/* Incoming call modal */}
        {incomingCall && !ignoredCallIds.has(String(incomingCall.callId)) && (() => {
          const callerId = identityToString(incomingCall.callerIdentity)
          const callerUser = usersByIdentity.get(callerId)
          return (
            <IncomingCallModal
              callerName={callerUser?.displayName ?? callerUser?.username ?? callerId.slice(0, 12)}
              callerAvatarUrl={getAvatarUrlForUser(callerId)}
              onAccept={handleAcceptCall}
              onDecline={handleDeclineCall}
              onIgnore={handleIgnoreCall}
            />
          )
        })()}

        {/* Screen share viewer overlay */}
        {viewingScreenStream && (
          <ScreenShareViewer
            stream={viewingScreenStream}
            sharerName="Screen Share"
            onClose={() => setViewingScreenShareKey(null)}
          />
        )}
      </main>

      {/* Register overlay */}
      {!me && initialLoadComplete && state.connectionStatus === 'connected' && (
        <RegisterOverlay onRegister={onRegister} onLoginAsUser={onLoginAsUser} />
      )}

      {/* Notification toasts */}
      <NotificationToast notifications={notifications} onDismiss={dismissNotification} />
    </div>
  )
}

export default App
