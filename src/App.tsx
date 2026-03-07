import { useState } from 'react'

import { AppCallOverlays } from './components/app/AppCallOverlays'
import { AppMainShell } from './components/app/AppMainShell'
import { AppModals } from './components/app/AppModals'
import { ClerkAuthOverlay } from './components/layout/ClerkAuthOverlay'
import type { ProfileSettingsModalProps } from './components/modals/ProfileSettingsModal'
import { S_appShell } from './constants/appStyles'
import { useClerkSpacetimeAuth } from './hooks/useClerkSpacetimeAuth'
import { avatarBytesToUrl } from './lib/avatarUtils'
import { useAppOrchestrator } from './hooks/useAppOrchestrator'
import { identityToString } from './hooks/useAppData'
import { useLayoutMode } from './hooks/useLayoutMode'
import { statusToLabel } from './lib/helpers'
import { useMemo } from 'react'

function AuthenticatedApp() {
  const app = useAppOrchestrator()
  const { layoutMode, setLayoutMode } = useLayoutMode()
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [settingsInitialSection, setSettingsInitialSection] = useState<'general' | 'account'>('general')

  const sidebarUser = app.me
    ? {
        username: app.me.username,
        displayName: app.me.displayName,
        status: statusToLabel(app.me.status) || 'Online',
        avatarBytes: app.me.avatarBytes,
        profileColor: app.me.profileColor ?? undefined,
      }
    : null

  const currentGuild = app.selectedGuild
    ? {
        guildId: app.selectedGuild.guildId,
        name: app.selectedGuild.name,
        bio: app.selectedGuild.bio ?? null,
        avatarBytes: app.selectedGuild.avatarBytes ?? null,
      }
    : null

  const availableChannelCategories = app.channelsForGuild
    .filter((channel) => channel.channelType.tag === 'Category')
    .map((channel) => ({ id: String(channel.channelId), name: channel.name }))

  const guildPopupGuild = app.guildPopup
    ? app.state.guilds.find((guild) => String(guild.guildId) === app.guildPopup?.guildId) ?? null
    : null

  const guildPopup = guildPopupGuild
    ? {
        name: guildPopupGuild.name,
        bio: guildPopupGuild.bio ?? null,
        avatarUrl: avatarBytesToUrl(guildPopupGuild.avatarBytes),
        ownerName: app.usersByIdentity.get(identityToString(guildPopupGuild.ownerIdentity))?.displayName ?? undefined,
      }
    : null

  const incomingRequests = app.incomingFriendRequests.map((request) => ({
    id: request.id,
    username: request.username,
  }))

  const outgoingRequests = app.outgoingFriendRequests.map((request) => ({
    id: request.id,
    username: request.username,
  }))

  const dmQuickEntries = useMemo(() => {
    const seen = new Set<string>()
    return app.dmListItems
      .filter((item) => {
        const channelId = String(item.id)
        return app.activeCallChannelIds.has(channelId)
          || (app.dmUnreadCountsByChannel.get(channelId) ?? item.unreadCount ?? 0) > 0
      })
      .filter((item) => {
        const channelId = String(item.id)
        if (seen.has(channelId)) {
          return false
        }
        seen.add(channelId)
        return true
      })
      .sort((left, right) => {
        const leftCall = app.activeCallChannelIds.has(String(left.id)) ? 1 : 0
        const rightCall = app.activeCallChannelIds.has(String(right.id)) ? 1 : 0
        if (leftCall !== rightCall) {
          return rightCall - leftCall
        }

        return (app.dmUnreadCountsByChannel.get(String(right.id)) ?? right.unreadCount ?? 0)
          - (app.dmUnreadCountsByChannel.get(String(left.id)) ?? left.unreadCount ?? 0)
      })
      .map((item) => ({
        channelId: String(item.id),
        label: item.name,
        avatarUrl: item.avatarUrl,
        unreadCount: app.dmUnreadCountsByChannel.get(String(item.id)) ?? item.unreadCount,
        hasActiveCall: app.activeCallChannelIds.has(String(item.id)),
      }))
  }, [app.activeCallChannelIds, app.dmListItems, app.dmUnreadCountsByChannel])

  const homeFriends = app.friends.map((friend) => ({
    id: friend.id,
    username: friend.username,
    displayName: friend.displayName,
    status: friend.status,
    avatarUrl: app.getAvatarUrlForUser(friend.id),
    profileColor: (app.usersByIdentity.get(friend.id) as { profileColor?: string } | undefined)?.profileColor,
  }))

  const handleAddServer = () => {
    const userName = app.me?.displayName ?? app.me?.username ?? 'My'
    app.setNewGuildName(`${userName}'s Loom`)
    app.setShowCreateGuildModal(true)
  }

  return (
    <div className="app-shell" style={S_appShell} data-layout-mode={layoutMode}>
      <AppCallOverlays
        showCallBanner={Boolean(app.currentVoiceState || app.outgoingCall)}
        currentVoiceState={Boolean(app.currentVoiceState)}
        outgoingCall={Boolean(app.outgoingCall)}
        callBannerProps={app.callBannerProps}
        onCancelCall={app.handleCancelOutgoingCall}
        onNavigateToCall={app.handleNavigateToCall}
        audioStreams={app.audioStreams}
        isDeafened={app.currentVoiceState?.isDeafened ?? false}
        locallyMutedUsers={app.locallyMutedUsers}
        voiceDefaultVolume={app.voiceDefaultVolume}
        voiceUserVolumes={app.voiceUserVolumes}
        incomingCall={app.incomingCall}
        ignoredCallIds={app.ignoredCallIds}
        usersByIdentity={app.usersByIdentity}
        getAvatarUrlForUser={app.getAvatarUrlForUser}
        onAcceptCall={app.handleAcceptCall}
        onDeclineCall={app.handleDeclineCall}
        onIgnoreCall={app.handleIgnoreCall}
        viewingScreenStream={app.viewingScreenStream}
        onCloseScreenShare={() => app.setViewingScreenShareKey(null)}
        notifications={app.notifications}
        onDismissNotification={app.dismissNotification}
      />

      <AppMainShell
        layoutMode={layoutMode}
        showMemberList={app.showMemberList}
        serverColumn={{
          orderedGuilds: app.orderedGuilds,
          dmQuickEntries,
          selectedDmChannelId: app.selectedDmChannelId,
          onSelectDmChannel: app.handleSelectDmChannel,
          selectedGuildId: app.selectedGuildId ?? null,
          onSelectGuild: app.handleSelectGuild,
          onHomeClick: app.handleHomeClick,
          isDmMode: app.isDmMode,
          onAddServer: handleAddServer,
          onLeaveGuild: app.onLeaveGuild,
          onDeleteGuild: app.onDeleteGuild,
          onInviteToGuild: app.handleInviteToGuild,
          onViewGuildInfo: (guildId) => app.setGuildPopup({ guildId }),
          onOpenGuildSettings: (guildId) => {
            app.handleSelectGuild(guildId)
            app.setShowGuildSettingsModal(true)
          },
          ownedGuildIds: app.ownedGuildIds,
          onReorder: app.handleReorderGuilds,
        }}
        channelColumn={{
          layoutMode,
          isDmMode: app.isDmMode,
          selectedGuildId: app.selectedGuildId,
          dmListItems: app.dmListItems,
          selectedDmChannelId: app.selectedDmChannelId,
          onSelectDmChannel: app.handleSelectDmChannel,
          onLeaveDmChannel: app.onLeaveDmChannel,
          onShowFriends: () => app.setSelectedDmChannelId(undefined),
          activeCallChannelIds: app.activeCallChannelIds,
          guildName: app.selectedGuild?.name,
          channels: app.channelItems,
          selectedTextChannelId: app.selectedTextChannelId,
          onSelectChannel: app.handleSelectTextOrVoiceChannel,
          onCreateChannel: (parentCategoryId) => app.openCreateChannelModal(parentCategoryId ? String(parentCategoryId) : null),
          onCreateCategory: () => app.openCreateCategoryModal(),
          onEditChannel: (channelId) => app.openEditChannelModal(String(channelId)),
          onDeleteChannel: (channelId) => app.onDeleteChannel(String(channelId)),
          onSaveChannelLayout: app.saveChannelLayout,
          onViewScreenShare: app.setViewingScreenShareKey,
          voiceChannelUsers: app.voiceChannelUsers,
          currentVoiceChannelId: app.currentVoiceState?.channelId,
          locallyMutedUsers: app.locallyMutedUsers,
          voiceUserVolumes: app.voiceUserVolumes,
          onToggleLocalMuteUser: app.toggleLocalMuteUser,
          onSetVoiceUserVolume: app.setVoiceUserVolume,
          localIdentity: app.identityString,
          getAvatarUrl: app.getAvatarUrlForUser,
        }}
        topNav={{
          isDmMode: app.isDmMode,
          isHomeView: app.isHomeView,
          dmName: app.selectedDmName,
          guildName: app.selectedGuild?.name,
          selectedDmChannel: Boolean(app.selectedDmChannel),
          currentVoiceState: Boolean(app.currentVoiceState),
          outgoingCall: Boolean(app.outgoingCall),
          dmCallActive: Boolean(app.dmCallActive),
          selectedDmChannelId: app.selectedDmChannelId,
          showMemberList: app.showMemberList,
          onToggleMemberList: () => app.setShowMemberList((current) => !current),
          onInitiateDmCall: app.handleInitiateDmCall,
          channelName: app.activeChannelName,
        }}
        messageArea={{
          layoutMode,
          isInDmVoice: app.isInDmVoice,
          isDmMode: app.isDmMode,
          isHomeView: app.isHomeView,
          selectedDmChannelId: app.selectedDmChannelId,
          dmVoiceChannelId: app.dmVoiceChannelId,
          localUser: {
            name: app.me?.displayName ?? app.me?.username ?? '?',
            avatarUrl: app.getAvatarUrlForUser(app.identityString),
            isMuted: app.currentVoiceState?.isMuted ?? false,
            isDeafened: app.currentVoiceState?.isDeafened ?? false,
          },
          remoteUser: app.dmCallRemoteUser ?? { name: 'Connecting...' },
          onMute: app.onToggleMute,
          onDeafen: app.onToggleDeafen,
          onScreenShare: app.handleToggleScreenShare,
          onHangUp: app.handleHangUpWithSfx,
          isMuted: app.currentVoiceState?.isMuted ?? false,
          isDeafened: app.currentVoiceState?.isDeafened ?? false,
          isScreenSharing: app.currentVoiceState?.isStreaming ?? false,
          isLocalSpeaking: app.isLocalSpeaking,
          isRemoteSpeaking: app.dmRemoteSpeaking,
          remoteScreenStream: app.dmRemoteScreenStream,
          dmRemoteScreenShareKey: app.dmRemoteScreenShareKey,
          onViewScreenShareFullscreen: app.setViewingScreenShareKey,
          activeChannelName: app.activeChannelName,
          activeMessages: app.activeMessages,
          channelName: app.activeChannelName,
          messages: app.activeMessages,
          dmMessages: app.dmMessagesForSelectedChannel,
          composerValue: app.composerValue,
          onComposerChange: app.setComposerValue,
          onSend: app.handleSendMessageWithSfx,
          getDmReactionsForMessage: app.getDmReactionsForMessage,
          getReactionsForMessage: app.getReactionsForMessage,
          onToggleDmReaction: app.onToggleDmReaction,
          onToggleReaction: app.onToggleReaction,
          currentUserId: app.identityString || undefined,
          onViewProfile: app.handleViewProfile,
          getAvatarUrl: app.getAvatarUrlForUser,
          onDeleteMessage: app.handleDeleteMessage,
          onEditMessage: app.handleEditMessage,
          dmPartnerAvatarUrl: app.dmPartnerAvatarUrl,
          dmPartnerProfileColor: app.dmPartnerProfileColor,
          selectedTextChannel: app.selectedTextChannel,
          dmCallActive: Boolean(app.dmCallActive),
          friendRequestUsername: app.friendRequestUsername,
          onRequestUsernameChange: app.setFriendRequestUsername,
          onSendRequest: app.onSendFriendRequest,
          incomingRequests,
          onAcceptRequest: app.onAcceptFriendRequest,
          onDeclineRequest: app.onDeclineFriendRequest,
          outgoingRequests,
          onCancelOutgoingRequest: app.onCancelOutgoingFriendRequest,
          friends: homeFriends,
          onStartDm: app.onStartDmFromFriend,
          onRemoveFriend: app.onRemoveFriend,
          guildInvites: app.myGuildInvites,
          onAcceptGuildInvite: app.onAcceptGuildInvite,
          onDeclineGuildInvite: app.onDeclineGuildInvite,
        }}
        sidebarBottom={{
          showVoicePanel: true,
          currentVoiceState: app.currentVoiceState,
          onLeave: app.handleHangUpWithSfx,
          remoteSharersCount: app.remoteSharersCount,
          onStartSharing: app.onStartSharing,
          onStopSharing: app.onStopSharing,
          user: sidebarUser,
          isMuted: app.isMuted,
          isDeafened: app.isDeafened,
          muteColor: app.muteColor,
          deafenColor: app.deafenColor,
          onToggleMute: app.onToggleMute,
          onToggleDeafen: app.onToggleDeafen,
          onOpenSettings: () => {
            setSettingsInitialSection('general')
            setShowSettingsModal(true)
          },
          onOpenProfile: () => app.setShowProfileModal(true),
        }}
        mobileProfile={{
          currentUser: app.me as ProfileSettingsModalProps['currentUser'],
          onUpdateProfile: app.actions.updateProfile,
          onSetStatus: (statusTag) => {
            void app.actions.setStatus({ status: { tag: statusTag } as never })
          },
        }}
        memberColumn={{
          layoutMode,
          isDmMode: app.isDmMode,
          guildName: app.selectedGuild?.name,
          friends: app.friends,
          memberListItems: app.memberListItems,
          getAvatarUrl: app.getAvatarUrlForUser,
          usersByIdentity: app.usersByIdentity,
          onViewProfile: app.handleViewProfile,
          localUserId: app.identityString || undefined,
        }}
      />

      <AppModals
        showCreateGuildModal={app.showCreateGuildModal}
        onCloseCreateGuild={() => app.setShowCreateGuildModal(false)}
        newGuildName={app.newGuildName}
        onGuildNameChange={app.setNewGuildName}
        onCreateGuild={() => void app.onCreateGuild()}
        showCreateChannelModal={app.showCreateChannelModal}
        onCloseCreateChannel={() => app.setShowCreateChannelModal(false)}
        newChannelName={app.newChannelName}
        onChannelNameChange={app.setNewChannelName}
        newChannelType={app.newChannelType}
        onChannelTypeChange={app.setNewChannelType}
        newChannelParentCategoryId={app.newChannelParentCategoryId}
        onChannelParentCategoryIdChange={app.setNewChannelParentCategoryId}
        availableChannelCategories={availableChannelCategories}
        editingChannelId={app.editingChannelId}
        onCreateChannel={() => void app.onCreateChannel()}
        showInviteModal={app.showInviteModal}
        onCloseInvite={() => app.setShowInviteModal(false)}
        friends={app.friends}
        onInviteFriend={app.onInviteFriend}
        showProfileModal={app.showProfileModal}
        onCloseProfile={() => app.setShowProfileModal(false)}
        currentUser={app.me as ProfileSettingsModalProps['currentUser']}
        onUpdateProfile={app.actions.updateProfile}
        onSetStatus={(statusTag) => {
          void app.actions.setStatus({ status: { tag: statusTag } as never })
        }}
        showGuildSettingsModal={app.showGuildSettingsModal}
        onCloseGuildSettings={() => app.setShowGuildSettingsModal(false)}
        currentGuild={currentGuild}
        onUpdateGuild={app.onUpdateGuild}
        showSettingsModal={showSettingsModal}
        onCloseSettings={() => setShowSettingsModal(false)}
        settingsInitialSection={settingsInitialSection}
        uiSoundLevel={app.uiSoundLevel}
        onUiSoundLevelChange={app.setUiSoundLevel}
        callSoundLevel={app.callSoundLevel}
        onCallSoundLevelChange={app.setCallSoundLevel}
        dmAlertSoundLevel={app.dmAlertSoundLevel}
        onDmAlertSoundLevelChange={app.setDmAlertSoundLevel}
        friendAlertSoundLevel={app.friendAlertSoundLevel}
        onFriendAlertSoundLevelChange={app.setFriendAlertSoundLevel}
        voiceDefaultVolume={app.voiceDefaultVolume}
        onVoiceDefaultVolumeChange={app.setVoiceDefaultVolume}
        friendStatusNotificationsEnabled={app.friendStatusNotificationsEnabled}
        onFriendStatusNotificationsChange={app.setFriendStatusNotificationsEnabled}
        dmMessageNotificationsEnabled={app.dmMessageNotificationsEnabled}
        onDmMessageNotificationsChange={app.setDmMessageNotificationsEnabled}
        layoutMode={layoutMode}
        onLayoutModeChange={setLayoutMode}
        settingsUsername={app.me?.username}
        settingsDisplayName={app.me?.displayName}
        settingsAvatarUrl={app.getAvatarUrlForUser(app.identityString)}
        settingsProfileColor={app.me?.profileColor ?? null}
        guildPopup={guildPopup}
        onCloseGuildPopup={() => app.setGuildPopup(null)}
        contextMenuOverlay={{
          layoutMode,
          contextMenu: app.contextMenu,
          profilePopup: app.profilePopup,
          identityString: app.identityString,
          friends: app.friends,
          usersByIdentity: app.usersByIdentity,
          getAvatarUrlForUser: app.getAvatarUrlForUser,
          onClose: () => app.setContextMenu(null),
          onCloseProfile: () => app.setProfilePopup(null),
          onViewProfile: (userId) => app.setProfilePopup({ userId }),
          onStartDm: app.onStartDmFromFriend,
        }}
      />
    </div>
  )
}

function App() {
  const auth = useClerkSpacetimeAuth()
  const shouldShowRestoringOverlay = auth.isRestoringSession && !auth.shouldShowAuthScreen
  const shouldShowAuthOverlay = shouldShowRestoringOverlay || auth.shouldShowAuthScreen || (auth.isLoaded && auth.isSignedIn && !auth.isReady)

  return (
    <>
      {shouldShowAuthOverlay
        ? (
            <ClerkAuthOverlay
              isAuthenticating={shouldShowRestoringOverlay || (auth.isLoaded && auth.isSignedIn)}
              message={auth.statusMessage ?? undefined}
            />
          )
        : <AuthenticatedApp />}
    </>
  )
}

export default App
