import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react'

import { Modal } from './Modal'
import { avatarBytesToUrl, setProfileColor as persistProfileColor } from '../../lib/avatarUtils'
import { compressAvatarFile, MAX_AVATAR_BYTES } from './profile/avatarProcessing'
import type { ProfileUser, ProfileSettingsModalProps } from './profile/types'
import { getStatusTag, getStatusColor } from './profile/constants'
import { S_section, S_label, S_input, S_textarea, S_charCount, S_saveBtn, S_saveBtnDisabled } from './profile/styles'
import { ProfileAvatarSection } from './profile/ProfileAvatarSection'
import { ProfileColorSection } from './profile/ProfileColorSection'
import { ProfileStatusSection } from './profile/ProfileStatusSection'

// Re-export so existing consumers (App.tsx, ModalSection.tsx) keep working
export type { ProfileUser, ProfileSettingsModalProps }

export const ProfileSettingsModal = React.memo(function ProfileSettingsModal({
  isOpen,
  onClose,
  currentUser,
  onUpdateProfile,
  onSetStatus,
}: ProfileSettingsModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Local form state
  const [editDisplayName, setEditDisplayName] = useState('')
  const [editBio, setEditBio] = useState('')
  const [editStatus, setEditStatus] = useState('Online')
  const [uploadedPreview, setUploadedPreview] = useState<string | null>(null)
  const uploadedPreviewRef = useRef<string | null>(null)
  const [avatarBytes, setAvatarBytes] = useState<Uint8Array | null>(null)
  const [avatarRemoved, setAvatarRemoved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [profileColor, setProfileColor] = useState<string>('')
  const initialProfileColor = useRef('')
  const wasOpenRef = useRef(false)
  const avatarDirtyRef = useRef(false)
  const isMountedRef = useRef(true)
  const isOpenRef = useRef(isOpen)
  const avatarUploadTokenRef = useRef(0)

  // Stable data URL from current user's avatar (no blob lifecycle issues)
  const existingAvatarUrl = useMemo(
    () => avatarBytesToUrl(currentUser?.avatarBytes),
    [currentUser?.avatarBytes],
  )

  // The preview to display: uploaded file takes priority, then existing avatar
  const avatarPreview = uploadedPreview ?? (avatarRemoved ? null : existingAvatarUrl ?? null)

  // Sync form with currentUser — full reset only on modal open transition;
  // while already open, only update fields the user hasn't locally modified.
  useEffect(() => {
    if (isOpen && currentUser) {
      const justOpened = !wasOpenRef.current
      if (justOpened) {
        // Modal just opened — populate all fields from server state
        setEditDisplayName(currentUser.displayName ?? '')
        setEditBio((currentUser.bio as string) ?? '')
        setEditStatus(getStatusTag(currentUser.status))
        setAvatarBytes(null)
        setAvatarError(null)
        if (uploadedPreviewRef.current) {
          URL.revokeObjectURL(uploadedPreviewRef.current)
          uploadedPreviewRef.current = null
        }
        setUploadedPreview(null)
        avatarDirtyRef.current = false
        setAvatarRemoved(false)
        const serverColor = currentUser.profileColor ?? ''
        setProfileColor(serverColor)
        initialProfileColor.current = serverColor
      } else {
        // Server pushed an update while modal is open —
        // only refresh fields the user hasn't touched locally.
        if (!avatarDirtyRef.current) {
          setAvatarBytes(null)
          if (uploadedPreviewRef.current) {
            URL.revokeObjectURL(uploadedPreviewRef.current)
            uploadedPreviewRef.current = null
          }
          setUploadedPreview(null)
        }
        // displayName / bio / status / profileColor are left as-is so the
        // user doesn't lose in-progress edits.
      }
    }
    wasOpenRef.current = isOpen
  }, [isOpen, currentUser])

  // Revoke uploaded blob URL on unmount
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      if (uploadedPreviewRef.current) URL.revokeObjectURL(uploadedPreviewRef.current)
    }
  }, [])

  useEffect(() => {
    isOpenRef.current = isOpen
    if (!isOpen) {
      avatarUploadTokenRef.current += 1
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen && uploadedPreviewRef.current) {
      URL.revokeObjectURL(uploadedPreviewRef.current)
      uploadedPreviewRef.current = null
      setUploadedPreview(null)
          setAvatarRemoved(false)
    }
  }, [isOpen])

  const handleAvatarUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const uploadToken = avatarUploadTokenRef.current + 1
    avatarUploadTokenRef.current = uploadToken
    setAvatarError(null)

    if (!file.type.startsWith('image/')) {
      setAvatarError('Please select an image file')
      return
    }

    try {
      const processedBlob = await compressAvatarFile(file)
      const isUploadStale =
        !isMountedRef.current ||
        !isOpenRef.current ||
        uploadToken !== avatarUploadTokenRef.current
      if (isUploadStale) {
        return
      }

      if (processedBlob.size > MAX_AVATAR_BYTES) {
        setAvatarError('Avatar must be ≤ 100 KB')
        return
      }

      const bytes = new Uint8Array(await processedBlob.arrayBuffer())
      setAvatarBytes(bytes)
      setAvatarRemoved(false)
      avatarDirtyRef.current = true

      if (uploadedPreviewRef.current) URL.revokeObjectURL(uploadedPreviewRef.current)
      const newUrl = URL.createObjectURL(processedBlob)
      uploadedPreviewRef.current = newUrl
      setUploadedPreview(newUrl)
    } catch {
      if (isMountedRef.current && uploadToken === avatarUploadTokenRef.current) {
        setAvatarError('Could not process avatar image. Try a smaller image.')
      }
    } finally {
      e.target.value = ''
    }
  }, [])

  const handleAvatarReset = useCallback(() => {
    setAvatarError(null)
    setAvatarBytes(null)
    setAvatarRemoved(true)
    avatarDirtyRef.current = true
    if (uploadedPreviewRef.current) {
      URL.revokeObjectURL(uploadedPreviewRef.current)
      uploadedPreviewRef.current = null
    }
    setUploadedPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  const handleSave = useCallback(async () => {
    if (!currentUser || saving) return
    setSaving(true)

    try {
      const originalStatus = getStatusTag(currentUser.status)

      // Build update params — only include changed fields
      const params: { displayName?: string | null; bio?: string | null; avatarBytes?: Uint8Array | null; profileColor?: string | null } = {}
      let hasProfileChange = false

      const trimmedDisplayName = editDisplayName.trim()
      const originalDisplayName = currentUser.displayName ?? ''
      if (trimmedDisplayName && trimmedDisplayName !== originalDisplayName) {
        params.displayName = trimmedDisplayName
        hasProfileChange = true
      }

      const currentBio = (currentUser.bio as string) ?? ''
      if (editBio !== currentBio) {
        params.bio = editBio || null
        hasProfileChange = true
      }

      if (avatarRemoved) {
        params.avatarBytes = null
        hasProfileChange = true
      } else if (avatarBytes) {
        params.avatarBytes = avatarBytes
        hasProfileChange = true
      }

      // Include profile color if changed
      if (profileColor !== initialProfileColor.current) {
        params.profileColor = profileColor || null
        hasProfileChange = true
        // Also persist locally for immediate reactivity
        persistProfileColor(profileColor)
      }

      if (hasProfileChange) {
        await onUpdateProfile(params)
      }

      if (editStatus !== originalStatus) {
        onSetStatus(editStatus)
      }

      onClose()
    } catch (err) {
      console.error('Failed to update profile:', err)
    } finally {
      setSaving(false)
    }
  }, [currentUser, saving, editDisplayName, editBio, editStatus, avatarBytes, avatarRemoved, profileColor, onUpdateProfile, onSetStatus, onClose])

  if (!currentUser) return null

  const name = currentUser.displayName || currentUser.username || '?'
  // Detects changes while keeping display-name clearing unsupported by the backend
  const hasChanges = (() => {
    const originalStatus = getStatusTag(currentUser.status)
    const currentBio = (currentUser.bio as string) ?? ''
    const originalDisplayName = currentUser.displayName ?? ''
    return (
      (!!editDisplayName.trim() && editDisplayName.trim() !== originalDisplayName) ||
      editBio !== currentBio ||
      editStatus !== originalStatus ||
      avatarRemoved ||
      avatarBytes !== null ||
      profileColor !== initialProfileColor.current
    )
  })()

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Profile Settings">
      <div style={S_section}>
        <ProfileAvatarSection
          avatarPreview={avatarPreview}
          name={name}
          profileColor={profileColor}
          statusColor={getStatusColor(editStatus)}
          avatarError={avatarError}
          onUploadClick={() => fileInputRef.current?.click()}
          onResetClick={handleAvatarReset}
          canReset={Boolean(avatarPreview)}
        />

        {/* Display Name */}
        <div>
          <div style={S_label}>DISPLAY NAME</div>
          <input
            type="text"
            value={editDisplayName}
            onChange={(e) => setEditDisplayName(e.target.value.slice(0, 64))}
            placeholder="Display Name"
            maxLength={64}
            onFocus={() => setFocusedField('displayName')}
            onBlur={() => setFocusedField(null)}
            style={{
              ...S_input,
              boxShadow: focusedField === 'displayName' ? '0 0 0 1px var(--border-focus)' : 'none',
              transition: 'box-shadow 0.15s ease',
            }}
          />
          <div style={S_charCount}>{editDisplayName.length}/64</div>
        </div>

        {/* Bio */}
        <div>
          <div style={S_label}>BIO</div>
          <textarea
            value={editBio}
            onChange={(e) => setEditBio(e.target.value.slice(0, 500))}
            placeholder="Tell us about yourself..."
            maxLength={500}
            onFocus={() => setFocusedField('bio')}
            onBlur={() => setFocusedField(null)}
            style={{
              ...S_textarea,
              boxShadow: focusedField === 'bio' ? '0 0 0 1px var(--border-focus)' : 'none',
              transition: 'box-shadow 0.15s ease',
            }}
          />
          <div style={S_charCount}>{editBio.length}/500</div>
        </div>

        <ProfileColorSection profileColor={profileColor} onChange={setProfileColor} />
        <ProfileStatusSection editStatus={editStatus} onChange={setEditStatus} />

        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !hasChanges}
          style={hasChanges && !saving ? S_saveBtn : S_saveBtnDisabled}
          className="string-outline-button"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleAvatarUpload}
          style={{ display: 'none' }}
        />
      </div>
    </Modal>
  )
})
