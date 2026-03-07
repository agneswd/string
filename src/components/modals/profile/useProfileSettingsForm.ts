import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { avatarBytesToUrl, setProfileColor as persistProfileColor } from '../../../lib/avatarUtils'
import { compressAvatarFile, MAX_AVATAR_BYTES } from './avatarProcessing'
import { getStatusTag } from './constants'
import type { ProfileSettingsModalProps } from '../ProfileSettingsModal'

export interface ProfileSettingsFormController {
  fileInputRef: React.RefObject<HTMLInputElement | null>
  name: string
  editUsername: string
  setEditUsername: React.Dispatch<React.SetStateAction<string>>
  editDisplayName: string
  setEditDisplayName: React.Dispatch<React.SetStateAction<string>>
  editBio: string
  setEditBio: React.Dispatch<React.SetStateAction<string>>
  editStatus: string
  setEditStatus: React.Dispatch<React.SetStateAction<string>>
  profileColor: string
  setProfileColor: React.Dispatch<React.SetStateAction<string>>
  avatarPreview: string | null
  avatarError: string | null
  saving: boolean
  hasChanges: boolean
  focusedField: string | null
  setFocusedField: React.Dispatch<React.SetStateAction<string | null>>
  handleAvatarUpload: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>
  handleAvatarReset: () => void
  handleSave: () => Promise<void>
}

export interface UseProfileSettingsFormOptions {
  isOpen: boolean
  currentUser: ProfileSettingsModalProps['currentUser']
  onUpdateProfile: ProfileSettingsModalProps['onUpdateProfile']
  onSetStatus: ProfileSettingsModalProps['onSetStatus']
  onSaveSuccess?: () => void
}

export function useProfileSettingsForm({
  isOpen,
  currentUser,
  onUpdateProfile,
  onSetStatus,
  onSaveSuccess,
}: UseProfileSettingsFormOptions): ProfileSettingsFormController {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [editUsername, setEditUsername] = useState('')
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

  const existingAvatarUrl = useMemo(
    () => avatarBytesToUrl(currentUser?.avatarBytes),
    [currentUser?.avatarBytes],
  )

  const avatarPreview = uploadedPreview ?? (avatarRemoved ? null : existingAvatarUrl ?? null)

  useEffect(() => {
    if (isOpen && currentUser) {
      const justOpened = !wasOpenRef.current
      if (justOpened) {
        setEditUsername(currentUser.username ?? '')
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
      } else if (!avatarDirtyRef.current) {
        setAvatarBytes(null)
        if (uploadedPreviewRef.current) {
          URL.revokeObjectURL(uploadedPreviewRef.current)
          uploadedPreviewRef.current = null
        }
        setUploadedPreview(null)
      }
    }

    wasOpenRef.current = isOpen
  }, [currentUser, isOpen])

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      if (uploadedPreviewRef.current) {
        URL.revokeObjectURL(uploadedPreviewRef.current)
      }
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

  const handleAvatarUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
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
      const isUploadStale = !isMountedRef.current || !isOpenRef.current || uploadToken !== avatarUploadTokenRef.current
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

      if (uploadedPreviewRef.current) {
        URL.revokeObjectURL(uploadedPreviewRef.current)
      }

      const nextPreviewUrl = URL.createObjectURL(processedBlob)
      uploadedPreviewRef.current = nextPreviewUrl
      setUploadedPreview(nextPreviewUrl)
    } catch {
      if (isMountedRef.current && uploadToken === avatarUploadTokenRef.current) {
        setAvatarError('Could not process avatar image. Try a smaller image.')
      }
    } finally {
      event.target.value = ''
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
    if (!currentUser || saving) {
      return
    }

    setSaving(true)

    try {
      const originalStatus = getStatusTag(currentUser.status)
      const params: {
        username?: string | null
        displayName?: string | null
        bio?: string | null
        avatarBytes?: Uint8Array | null
        profileColor?: string | null
      } = {}
      let hasProfileChange = false

      const trimmedUsername = editUsername.trim()
      const originalUsername = currentUser.username ?? ''
      if (trimmedUsername && trimmedUsername !== originalUsername) {
        params.username = trimmedUsername
        hasProfileChange = true
      }

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

      if (profileColor !== initialProfileColor.current) {
        params.profileColor = profileColor || null
        hasProfileChange = true
        persistProfileColor(profileColor)
      }

      if (hasProfileChange) {
        await onUpdateProfile(params)
      }

      if (editStatus !== originalStatus) {
        onSetStatus(editStatus)
      }

      onSaveSuccess?.()
    } catch (error) {
      console.error('Failed to update profile:', error)
    } finally {
      setSaving(false)
    }
  }, [
    avatarBytes,
    avatarRemoved,
    currentUser,
    editBio,
    editDisplayName,
    editStatus,
    editUsername,
    onSaveSuccess,
    onSetStatus,
    onUpdateProfile,
    profileColor,
    saving,
  ])

  const name = currentUser?.displayName || currentUser?.username || '?'
  const hasChanges = (() => {
    if (!currentUser) {
      return false
    }

    const originalStatus = getStatusTag(currentUser.status)
    const currentBio = (currentUser.bio as string) ?? ''
    const originalUsername = currentUser.username ?? ''
    const originalDisplayName = currentUser.displayName ?? ''

    return (
      (!!editUsername.trim() && editUsername.trim() !== originalUsername) ||
      (!!editDisplayName.trim() && editDisplayName.trim() !== originalDisplayName) ||
      editBio !== currentBio ||
      editStatus !== originalStatus ||
      avatarRemoved ||
      avatarBytes !== null ||
      profileColor !== initialProfileColor.current
    )
  })()

  return {
    fileInputRef,
    name,
    editUsername,
    setEditUsername,
    editDisplayName,
    setEditDisplayName,
    editBio,
    setEditBio,
    editStatus,
    setEditStatus,
    profileColor,
    setProfileColor,
    avatarPreview,
    avatarError,
    saving,
    hasChanges,
    focusedField,
    setFocusedField,
    handleAvatarUpload,
    handleAvatarReset,
    handleSave,
  }
}
