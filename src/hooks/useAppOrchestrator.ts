/**
 * useAppOrchestrator
 *
 * Combines all domain hooks into a single view-model object consumed by App.
 * Handles data, side-effects, RTC signalling, navigation and message actions.
 * Layout-mode selection and settings-modal open state remain in App.tsx.
 */
import { useCallback, useMemo, useEffect, useLayoutEffect, useState } from 'react'

import { useRtcOrchestrator } from '../lib/webrtc'
import { toIdKey, isCategoryChannel, isVoiceChannel } from '../lib/helpers'
import { avatarBytesToUrl } from '../lib/avatarUtils'
import { setSfxLevels } from '../lib/sfx'
import { identityToString, useAppData } from './useAppData'
import { useActionFeedback } from './useActionFeedback'
import { useGuildNavigation } from './useGuildNavigation'
import { useFriends } from './useFriends'
import { useDmChat } from './useDmChat'
import { useGuildMessages } from './useGuildMessages'
import { useVoiceChat } from './useVoiceChat'
import { useRtcSignaling } from './useRtcSignaling'
import { useGuildActions } from './useGuildActions'
import { useCallHandling } from './useCallHandling'
import { useCallSfx } from './useCallSfx'
import { useNotificationEffects } from './useNotificationEffects'
import { useMessageActions } from './useMessageActions'
import { useAppNavigation } from './useAppNavigation'
import { useAppState } from './useAppState'
import { useSendSignal } from './useSendSignal'
import { useTypingIndicators } from './useTypingIndicators'
import {
  readUiSoundLevel,
  readPercentageSetting,
  readNumberRecordSetting,
  readBooleanSetting,
  UI_SOUND_LEVEL_STORAGE_KEY,
  CALL_SOUND_LEVEL_STORAGE_KEY,
  DM_ALERT_SOUND_LEVEL_STORAGE_KEY,
  FRIEND_ALERT_SOUND_LEVEL_STORAGE_KEY,
  VOICE_DEFAULT_VOLUME_STORAGE_KEY,
  VOICE_USER_VOLUMES_STORAGE_KEY,
  FRIEND_STATUS_NOTIFICATIONS_STORAGE_KEY,
  DM_MESSAGE_NOTIFICATIONS_STORAGE_KEY,
} from '../lib/settingsStorage'

export function useAppOrchestrator() {
  // ---------------------------------------------------------------------------
  // Core data & feedback
  // ---------------------------------------------------------------------------
  const appData = useAppData()
  const { state, actions, extendedState, extendedActions, identityString, usersByIdentity, me } = appData

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
  const {
    startAudio, setMuted, stopAudio, startScreenShare, stopScreenShare,
    handleIncomingSignal, remoteStreams, peerStates,
    isLocalSpeaking, remoteSpeaking, connectToPeers,
  } = useRtcOrchestrator({ localIdentity: identityString || '', sendSignal })

  // ---------------------------------------------------------------------------
  // Guild Navigation
  // ---------------------------------------------------------------------------
  const nav = useGuildNavigation({ appData, currentVoiceState, selectedDmChannelId })
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

  // Subscription wiring
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
      startAudio, setMuted, stopAudio, startScreenShare, stopScreenShare,
      remoteStreams, peerStates, isLocalSpeaking, remoteSpeaking,
      handleIncomingSignal, sendSignal, connectToPeers,
    },
  })
  const {
    viewingScreenShareKey, setViewingScreenShareKey,
    voiceChannelUsers, rtcRecipients, remoteSharersCount,
    onJoinVoice, onLeaveVoice, onToggleMute, onToggleDeafen,
    onStartSharing, onStopSharing, preMuted, preDeafened,
  } = voice

  // ---------------------------------------------------------------------------
  // Local app state
  // ---------------------------------------------------------------------------
  const appState = useAppState({
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
  const {
    composerValue, setComposerValue,
    locallyMutedUsers,
    showMemberList, setShowMemberList,
    showProfileModal, setShowProfileModal,
    profilePopup, setProfilePopup,
      showGuildSettingsModal, setShowGuildSettingsModal,
      guildPopup, setGuildPopup,
    contextMenu, setContextMenu,
    initialLoadComplete,
    notifications,
    ignoredCallIds, setIgnoredCallIds,
    addNotification, dismissNotification,
    toggleLocalMuteUser, handleToggleScreenShare,
    viewingScreenStream,
    audioStreams, isMuted, isDeafened, muteColor, deafenColor,
  } = appState

  const { typingUsers, handleComposerChange } = useTypingIndicators({
    composerValue,
    setComposerValue,
    selectedTextChannel: selectedTextChannel ?? null,
    selectedDmChannel: selectedDmChannel ?? null,
    identityString,
    usersByIdentity,
    getAvatarUrlForUser,
    channelTyping: appData.channelTyping,
    dmTyping: appData.dmTyping,
    actions,
  })

  // ---------------------------------------------------------------------------
  // Persisted settings state
  // ---------------------------------------------------------------------------
  const [uiSoundLevel, setUiSoundLevel] = useState<number>(() => readUiSoundLevel())
  const [callSoundLevel, setCallSoundLevel] = useState<number>(() => readPercentageSetting(CALL_SOUND_LEVEL_STORAGE_KEY, 50))
  const [dmAlertSoundLevel, setDmAlertSoundLevel] = useState<number>(() => readPercentageSetting(DM_ALERT_SOUND_LEVEL_STORAGE_KEY, 50))
  const [friendAlertSoundLevel, setFriendAlertSoundLevel] = useState<number>(() => readPercentageSetting(FRIEND_ALERT_SOUND_LEVEL_STORAGE_KEY, 50))
  const [voiceDefaultVolume, setVoiceDefaultVolume] = useState<number>(() => readPercentageSetting(VOICE_DEFAULT_VOLUME_STORAGE_KEY, 100))
  const [voiceUserVolumes, setVoiceUserVolumes] = useState<Record<string, number>>(() => readNumberRecordSetting(VOICE_USER_VOLUMES_STORAGE_KEY))
  const [friendStatusNotificationsEnabled, setFriendStatusNotificationsEnabled] = useState<boolean>(
    () => readBooleanSetting(FRIEND_STATUS_NOTIFICATIONS_STORAGE_KEY, true),
  )
  const [dmMessageNotificationsEnabled, setDmMessageNotificationsEnabled] = useState<boolean>(
    () => readBooleanSetting(DM_MESSAGE_NOTIFICATIONS_STORAGE_KEY, true),
  )

  useEffect(() => {
    setSfxLevels({
      ui: uiSoundLevel / 100,
      call: callSoundLevel / 100,
      dm: dmAlertSoundLevel / 100,
      friend: friendAlertSoundLevel / 100,
    })
    try { window.localStorage.setItem(UI_SOUND_LEVEL_STORAGE_KEY, String(uiSoundLevel)) } catch {}
  }, [callSoundLevel, dmAlertSoundLevel, friendAlertSoundLevel, uiSoundLevel])

  useEffect(() => {
    try { window.localStorage.setItem(CALL_SOUND_LEVEL_STORAGE_KEY, String(callSoundLevel)) } catch {}
  }, [callSoundLevel])

  useEffect(() => {
    try { window.localStorage.setItem(DM_ALERT_SOUND_LEVEL_STORAGE_KEY, String(dmAlertSoundLevel)) } catch {}
  }, [dmAlertSoundLevel])

  useEffect(() => {
    try { window.localStorage.setItem(FRIEND_ALERT_SOUND_LEVEL_STORAGE_KEY, String(friendAlertSoundLevel)) } catch {}
  }, [friendAlertSoundLevel])

  useEffect(() => {
    try { window.localStorage.setItem(VOICE_DEFAULT_VOLUME_STORAGE_KEY, String(voiceDefaultVolume)) } catch {}
  }, [voiceDefaultVolume])

  useEffect(() => {
    try { window.localStorage.setItem(VOICE_USER_VOLUMES_STORAGE_KEY, JSON.stringify(voiceUserVolumes)) } catch {}
  }, [voiceUserVolumes])

  useEffect(() => {
    try { window.localStorage.setItem(FRIEND_STATUS_NOTIFICATIONS_STORAGE_KEY, String(friendStatusNotificationsEnabled)) } catch {}
  }, [friendStatusNotificationsEnabled])

  useEffect(() => {
    try { window.localStorage.setItem(DM_MESSAGE_NOTIFICATIONS_STORAGE_KEY, String(dmMessageNotificationsEnabled)) } catch {}
  }, [dmMessageNotificationsEnabled])

  const setVoiceUserVolume = useCallback((identity: string, volume: number) => {
    const nextVolume = Math.max(0, Math.min(100, Math.round(volume)))
    setVoiceUserVolumes((current) => ({ ...current, [identity]: nextVolume }))
  }, [])

  // ---------------------------------------------------------------------------
  // RTC Signaling
  // ---------------------------------------------------------------------------
  useRtcSignaling({
    appData, currentVoiceState, rtcRecipients,
    sendSignal: voice.sendSignal, handleIncomingSignal,
    actions, setActionError, runAction,
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
  const { messagesForSelectedTextChannel, memberListItems, onToggleReaction, getReactionsForMessage } = guildMessages

  // ---------------------------------------------------------------------------
  // Guild Actions
  // ---------------------------------------------------------------------------
  const guildActions = useGuildActions({
    actions, selectedGuild, runAction, callActionOrReducer,
    setActionError, setActionStatus, setSelectedGuildId,
    identityString, guildInvites: appData.guildInvites,
    usersByIdentity, extendedActions, channelsForGuild,
  })
  const {
    newGuildName, setNewGuildName,
    newChannelName, setNewChannelName,
    newChannelParentCategoryId, setNewChannelParentCategoryId,
    newChannelType, setNewChannelType,
    showCreateGuildModal, setShowCreateGuildModal,
    showCreateChannelModal, setShowCreateChannelModal,
    showInviteModal, setShowInviteModal,
    editingChannelId,
    openCreateChannelModal,
    openCreateCategoryModal,
    openEditChannelModal,
    onDeleteChannel,
    saveChannelLayout,
    onCreateGuild, onCreateChannel, onUpdateGuild,
    onInviteFriend, onLeaveGuild, onDeleteGuild,
    myGuildInvites, onAcceptGuildInvite, onDeclineGuildInvite,
  } = guildActions

  // ---------------------------------------------------------------------------
  // Derived values
  // ---------------------------------------------------------------------------
  const isHomeView = !selectedGuildId && !selectedDmChannel
  const isDmMode = selectedDmChannel !== null

  // ---------------------------------------------------------------------------
  // Call Handling
  // ---------------------------------------------------------------------------
  const {
    incomingCall, outgoingCall,
    incomingCallId, outgoingCallId,
    isInDmVoice, dmVoiceChannelId,
    dmCallRemoteUser, dmCallActive,
    dmPartnerIdentity, dmPartnerAvatarUrl, dmPartnerProfileColor,
    dmRemoteSpeaking, dmRemoteScreenStream, dmRemoteScreenShareKey,
    activeCallChannelIds,
    handleAcceptCall, handleDeclineCall: baseHandleDeclineCall, handleCancelOutgoingCall: baseHandleCancelOutgoingCall, handleIgnoreCall,
    callBannerProps, handleNavigateToCall,
  } = useCallHandling({
    identityString, voiceStates: state.voiceStates,
    dmCallRequests: state.dmCallRequests, currentVoiceState,
    runAction, extendedActions, usersByIdentity, getAvatarUrlForUser,
    setSelectedDmChannelId, setSelectedGuildId,
    selectedDmChannel: selectedDmChannel ?? null, selectedDmChannelId,
    isDmMode, remoteSpeaking, remoteStreams,
    ignoredCallIds, setIgnoredCallIds,
    dmParticipants: appData.dmParticipants,
    channelsForGuild, selectedGuildId, selectedTextChannelId,
  })

  // ---------------------------------------------------------------------------
  // Call SFX
  // ---------------------------------------------------------------------------
  const { handleHangUpWithSfx, playHangupSound, playCallDeclinedSound, markOutgoingCallCanceledLocally } = useCallSfx({
    outgoingCallId, outgoingCall, incomingCallId,
    isInDmVoice, dmVoiceChannelId,
    voiceStates: state.voiceStates, identityString,
    onLeaveVoice,
  })

  const handleDeclineCall = useCallback(() => {
    playCallDeclinedSound()
    baseHandleDeclineCall()
  }, [playCallDeclinedSound, baseHandleDeclineCall])

  const handleCancelOutgoingCall = useCallback(() => {
    markOutgoingCallCanceledLocally()
    playHangupSound()
    baseHandleCancelOutgoingCall()
  }, [markOutgoingCallCanceledLocally, playHangupSound, baseHandleCancelOutgoingCall])

  // ---------------------------------------------------------------------------
  // Message Actions
  // ---------------------------------------------------------------------------
  const {
    handleDeleteMessage, handleEditMessage, onSendMessage,
    handleSendMessageWithSfx, activeChannelName, activeMessages, statusError,
  } = useMessageActions({
    isDmMode,
    selectedDmChannel: selectedDmChannel ?? null,
    selectedTextChannel: selectedTextChannel ?? null,
    selectedDmName, dmMessagesForSelectedChannel,
    messagesForSelectedTextChannel,
    stateError: state.error, actionError,
    runAction, callActionOrReducer,
    extendedActions, actions, setActionError, setComposerValue,
  })

  // ---------------------------------------------------------------------------
  // Notification Effects
  // ---------------------------------------------------------------------------
  useNotificationEffects({
    actionStatus, actionError, addNotification,
    friendStatusNotificationsEnabled, dmMessageNotificationsEnabled,
    friends, identityString,
    dmParticipants: appData.dmParticipants,
    dmLastMessageByChannel: appData.dmLastMessageByChannel,
    selectedDmChannelId, usersByIdentity,
    setSelectedDmChannelId, setSelectedGuildId,
  })

  // ---------------------------------------------------------------------------
  // App Navigation
  // ---------------------------------------------------------------------------
  const {
    guildOrder, orderedGuilds,
    handleReorderGuilds, handleSelectGuild, handleHomeClick,
    handleSelectDmChannel, handleInitiateDmCall,
    handleSelectTextOrVoiceChannel, handleViewProfile, handleInviteToGuild,
  } = useAppNavigation({
    memberGuilds, homeViewActiveRef,
    setSelectedGuildId, setSelectedDmChannelId,
    setSelectedTextChannelId, setSelectedVoiceChannelId,
    channelsForGuild, onJoinVoice: onJoinVoice,
    setShowInviteModal, runAction, extendedActions,
    voiceStates: state.voiceStates, identityString,
    usersByIdentity, getAvatarUrlForUser, setContextMenu,
  })

  // ---------------------------------------------------------------------------
  // Derived channel list for ChannelColumn
  // ---------------------------------------------------------------------------
  const channelItems = useMemo(
    () => channelsForGuild.map((ch) => ({
      id: toIdKey(ch.channelId),
      name: ch.name,
      kind: isCategoryChannel(ch)
        ? 'category' as const
        : isVoiceChannel(ch)
          ? 'voice' as const
          : 'text' as const,
      parentCategoryId: ch.categoryId ? toIdKey(ch.categoryId) : null,
      position: Number(ch.position),
    })),
    [channelsForGuild],
  )

  return {
    // App data
    state, actions, extendedState, extendedActions,
    identityString, usersByIdentity, me,
    getAvatarUrlForUser,
    dmUnreadCountsByChannel: appData.dmUnreadCountsByChannel,
    // Settings
    uiSoundLevel, setUiSoundLevel,
    callSoundLevel, setCallSoundLevel,
    dmAlertSoundLevel, setDmAlertSoundLevel,
    friendAlertSoundLevel, setFriendAlertSoundLevel,
    voiceDefaultVolume, setVoiceDefaultVolume,
    voiceUserVolumes, setVoiceUserVolume,
    friendStatusNotificationsEnabled, setFriendStatusNotificationsEnabled,
    dmMessageNotificationsEnabled, setDmMessageNotificationsEnabled,
    // Friends
    friendRequestUsername, setFriendRequestUsername,
    friends, incomingFriendRequests, outgoingFriendRequests,
    onSendFriendRequest, onAcceptFriendRequest, onDeclineFriendRequest,
    onCancelOutgoingFriendRequest, onRemoveFriend,
    // DM
    selectedDmChannelId, setSelectedDmChannelId,
    dmListItems, selectedDmChannel, selectedDmName,
    dmMessagesForSelectedChannel,
    onStartDmFromFriend, onLeaveDmChannel,
    onToggleDmReaction, getDmReactionsForMessage,
    // Voice
    currentVoiceState, sendSignal,
    viewingScreenShareKey, setViewingScreenShareKey,
    voiceChannelUsers, remoteSharersCount,
    onToggleMute, onToggleDeafen, onStartSharing, onStopSharing,
    // Navigation
    selectedGuildId, selectedTextChannelId,
    memberGuilds, ownedGuildIds, selectedGuild, channelsForGuild,
    selectedTextChannel, channelItems, textChannels, voiceChannels,
    // App state
    composerValue, setComposerValue,
    handleComposerChange,
    typingUsers,
    locallyMutedUsers, showMemberList, setShowMemberList,
    showGuildSettingsModal, setShowGuildSettingsModal,
    showProfileModal, setShowProfileModal,
    profilePopup, setProfilePopup,
    guildPopup, setGuildPopup,
    contextMenu, setContextMenu,
    initialLoadComplete, notifications,
    ignoredCallIds, addNotification, dismissNotification,
    toggleLocalMuteUser, handleToggleScreenShare,
    viewingScreenStream,
    audioStreams, isMuted, isDeafened, muteColor, deafenColor,
    // Guild messages
    memberListItems, onToggleReaction, getReactionsForMessage,
    // Guild actions
    newGuildName, setNewGuildName,
    newChannelName, setNewChannelName,
    newChannelParentCategoryId, setNewChannelParentCategoryId,
    newChannelType, setNewChannelType,
    showCreateGuildModal, setShowCreateGuildModal,
    showCreateChannelModal, setShowCreateChannelModal,
    showInviteModal, setShowInviteModal,
    editingChannelId,
    openCreateChannelModal,
    openCreateCategoryModal,
    openEditChannelModal,
    onDeleteChannel,
    saveChannelLayout,
    onCreateGuild, onCreateChannel, onUpdateGuild,
    onInviteFriend, onLeaveGuild, onDeleteGuild,
    myGuildInvites, onAcceptGuildInvite, onDeclineGuildInvite,
    // Derived
    isHomeView, isDmMode,
    // Call handling
    incomingCall, outgoingCall,
    incomingCallId, outgoingCallId,
    isInDmVoice, dmVoiceChannelId,
    dmCallRemoteUser, dmCallActive,
    dmPartnerIdentity,
    dmPartnerAvatarUrl, dmPartnerProfileColor,
    dmRemoteSpeaking, dmRemoteScreenStream, dmRemoteScreenShareKey,
    activeCallChannelIds,
    handleAcceptCall, handleDeclineCall, handleCancelOutgoingCall, handleIgnoreCall,
    callBannerProps, handleNavigateToCall,
    handleHangUpWithSfx,
    // Message actions
    handleDeleteMessage, handleEditMessage, handleSendMessageWithSfx,
    activeChannelName, activeMessages,
    // App navigation
    orderedGuilds, handleReorderGuilds, handleSelectGuild, handleHomeClick,
    handleSelectDmChannel, handleInitiateDmCall,
    handleSelectTextOrVoiceChannel, handleViewProfile, handleInviteToGuild,
    guildOrder,
  }
}
