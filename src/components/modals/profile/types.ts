// Types shared across ProfileSettingsModal and its sub-components

export interface ProfileUser {
  displayName: string
  username: string
  bio?: string | null
  status: { tag: string } | unknown
  avatarBytes?: Uint8Array | null
  /** Optional avatar background color persisted via the profileColor field */
  profileColor?: string | null
}

export interface ProfileSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  currentUser: ProfileUser | null
  onUpdateProfile: (params: {
    username?: string | null
    displayName?: string | null
    bio?: string | null
    avatarBytes?: Uint8Array | null
    profileColor?: string | null
  }) => Promise<void>
  onSetStatus: (statusTag: string) => void
}
