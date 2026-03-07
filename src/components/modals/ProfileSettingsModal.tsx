import React from 'react'

import { Modal } from './Modal'
import type { ProfileUser, ProfileSettingsModalProps } from './profile/types'
import { ProfileSettingsForm } from './profile/ProfileSettingsForm'
import { useProfileSettingsForm } from './profile/useProfileSettingsForm'

// Re-export so existing consumers (App.tsx, ModalSection.tsx) keep working
export type { ProfileUser, ProfileSettingsModalProps }

export const ProfileSettingsModal = React.memo(function ProfileSettingsModal({
  isOpen,
  onClose,
  currentUser,
  onUpdateProfile,
  onSetStatus,
}: ProfileSettingsModalProps) {
  const controller = useProfileSettingsForm({
    isOpen,
    currentUser,
    onUpdateProfile,
    onSetStatus,
    onSaveSuccess: onClose,
  })

  if (!currentUser) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Profile Settings">
      <ProfileSettingsForm controller={controller} />
    </Modal>
  )
})
