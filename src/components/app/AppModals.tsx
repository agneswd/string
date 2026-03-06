/**
 * AppModals
 *
 * Renders all modal dialogs and the context-menu / profile-popup overlay.
 * Receives open-state booleans and callbacks from App.
 */
import { ModalSection } from '../layout/ModalSection'
import { SettingsModal } from '../index'
import { ContextMenuOverlay } from '../ui/ContextMenuOverlay'
import type { ProfileSettingsModalProps } from '../modals/ProfileSettingsModal'
import type { LayoutMode } from '../../constants/theme'
import type { ContextMenuOverlayProps } from '../ui/ContextMenuOverlay'

export interface AppModalsProps {
  // Create Guild Modal
  showCreateGuildModal: boolean
  onCloseCreateGuild: () => void
  newGuildName: string
  onGuildNameChange: (v: string) => void
  onCreateGuild: () => void
  // Create Channel Modal
  showCreateChannelModal: boolean
  onCloseCreateChannel: () => void
  newChannelName: string
  onChannelNameChange: (v: string) => void
  newChannelType: string
  onChannelTypeChange: (v: string) => void
  onCreateChannel: () => void
  // Invite Modal
  showInviteModal: boolean
  onCloseInvite: () => void
  friends: Array<{ id: string; username: string; displayName: string; status: string }>
  onInviteFriend: (id: string) => void
  // Profile Modal
  showProfileModal: boolean
  onCloseProfile: () => void
  currentUser: ProfileSettingsModalProps['currentUser']
  onUpdateProfile: (params: {
    displayName?: string | null
    bio?: string | null
    avatarBytes?: Uint8Array | null
    profileColor?: string | null
  }) => Promise<void>
  onSetStatus: (statusTag: string) => void
  // Settings Modal
  showSettingsModal: boolean
  onCloseSettings: () => void
  uiSoundLevel: number
  onUiSoundLevelChange: (v: number) => void
  friendStatusNotificationsEnabled: boolean
  onFriendStatusNotificationsChange: (v: boolean) => void
  dmMessageNotificationsEnabled: boolean
  onDmMessageNotificationsChange: (v: boolean) => void
  layoutMode: LayoutMode
  onLayoutModeChange: (v: LayoutMode) => void
  // Context Menu / Profile Popup Overlay
  contextMenuOverlay: Omit<ContextMenuOverlayProps, 'layoutMode'> & { layoutMode?: LayoutMode }
}

export function AppModals({
  showCreateGuildModal, onCloseCreateGuild, newGuildName, onGuildNameChange, onCreateGuild,
  showCreateChannelModal, onCloseCreateChannel, newChannelName, onChannelNameChange,
  newChannelType, onChannelTypeChange, onCreateChannel,
  showInviteModal, onCloseInvite, friends, onInviteFriend,
  showProfileModal, onCloseProfile, currentUser, onUpdateProfile, onSetStatus,
  showSettingsModal, onCloseSettings,
  uiSoundLevel, onUiSoundLevelChange,
  friendStatusNotificationsEnabled, onFriendStatusNotificationsChange,
  dmMessageNotificationsEnabled, onDmMessageNotificationsChange,
  layoutMode, onLayoutModeChange,
  contextMenuOverlay,
}: AppModalsProps) {
  return (
    <>
      <ModalSection
        showCreateGuildModal={showCreateGuildModal}
        onCloseCreateGuild={onCloseCreateGuild}
        newGuildName={newGuildName}
        onGuildNameChange={onGuildNameChange}
        onCreateGuild={onCreateGuild}
        showCreateChannelModal={showCreateChannelModal}
        onCloseCreateChannel={onCloseCreateChannel}
        newChannelName={newChannelName}
        onChannelNameChange={onChannelNameChange}
        newChannelType={newChannelType}
        onChannelTypeChange={onChannelTypeChange}
        onCreateChannel={onCreateChannel}
        showInviteModal={showInviteModal}
        onCloseInvite={onCloseInvite}
        friends={friends}
        onInviteFriend={onInviteFriend}
        showProfileModal={showProfileModal}
        onCloseProfile={onCloseProfile}
        currentUser={currentUser}
        onUpdateProfile={async (params) => {
          await onUpdateProfile({
            displayName: params.displayName ?? undefined,
            bio: params.bio === null ? '' : params.bio,
            avatarBytes: params.avatarBytes === null ? null : (params.avatarBytes ?? undefined),
            profileColor: params.profileColor === null ? '' : params.profileColor,
          })
        }}
        onSetStatus={(statusTag) => {
          void onSetStatus(statusTag as never)
        }}
      />

      <SettingsModal
        isOpen={showSettingsModal}
        onClose={onCloseSettings}
        uiSoundLevel={uiSoundLevel}
        onUiSoundLevelChange={onUiSoundLevelChange}
        friendStatusNotificationsEnabled={friendStatusNotificationsEnabled}
        onFriendStatusNotificationsChange={onFriendStatusNotificationsChange}
        dmMessageNotificationsEnabled={dmMessageNotificationsEnabled}
        onDmMessageNotificationsChange={onDmMessageNotificationsChange}
        layoutMode={layoutMode}
        onLayoutModeChange={onLayoutModeChange}
      />

      <ContextMenuOverlay {...contextMenuOverlay} />
    </>
  )
}
