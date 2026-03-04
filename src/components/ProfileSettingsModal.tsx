import React, { useState, useCallback, useRef, useEffect, useMemo, type CSSProperties } from 'react'
import { Check } from 'lucide-react'

import { Modal } from './Modal'
import { getAvatarColor, getInitial, avatarBytesToUrl, setProfileColor as persistProfileColor } from '../lib/avatarUtils'

// ── Types ────────────────────────────────────────────────────────────────────

export interface ProfileUser {
  displayName: string
  username: string
  bio?: string | null
  status: { tag: string } | unknown
  avatarBytes?: Uint8Array | null
}

export interface ProfileSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  currentUser: ProfileUser | null
  onUpdateProfile: (params: { displayName?: string | null; bio?: string | null; avatarBytes?: Uint8Array | null; profileColor?: string | null }) => Promise<void>
  onSetStatus: (statusTag: string) => void
}

// ── Status options ───────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { tag: 'Online', label: 'Online', color: '#43b581' },
  { tag: 'DoNotDisturb', label: 'Do Not Disturb', color: '#ed4245' },
  { tag: 'Offline', label: 'Appear as Offline', color: '#747f8d' },
] as const

function getStatusTag(status: unknown): string {
  if (!status) return 'Online'
  if (typeof status === 'string') return status
  if (typeof status === 'object' && status !== null) {
    const s = status as Record<string, unknown>
    if (typeof s.tag === 'string') return s.tag
    const keys = Object.keys(s)
    if (keys.length > 0) return keys[0]
  }
  return 'Online'
}

function getStatusColor(tag: string): string {
  return STATUS_OPTIONS.find((s) => s.tag === tag)?.color ?? '#43b581'
}

// ── Styles ───────────────────────────────────────────────────────────────────

const S_section: CSSProperties = { display: 'flex', flexDirection: 'column', gap: '16px' }
const S_label: CSSProperties = { fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary, #b5bac1)', marginBottom: '4px' }
const S_input: CSSProperties = { padding: '10px', borderRadius: '4px', border: 'none', backgroundColor: '#1e1f22', color: 'var(--text-primary, #dbdee1)', fontSize: '14px', width: '100%', boxSizing: 'border-box', outline: 'none' }
const S_textarea: CSSProperties = { ...S_input, resize: 'vertical', minHeight: '80px', fontFamily: 'inherit' }
const S_avatarContainer: CSSProperties = { display: 'flex', alignItems: 'center', gap: '16px' }
const S_charCount: CSSProperties = { fontSize: '11px', color: 'var(--text-muted, #949ba4)', textAlign: 'right', marginTop: '4px' }
const S_saveBtn: CSSProperties = {
  padding: '10px 24px', borderRadius: '4px', border: 'none',
  backgroundColor: 'var(--accent-primary, #5865f2)', color: '#fff',
  fontWeight: 600, fontSize: '14px', cursor: 'pointer', marginTop: '8px',
}
const S_saveBtnDisabled: CSSProperties = { ...S_saveBtn, opacity: 0.5, cursor: 'not-allowed' }
const S_statusBtn: CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '8px',
  padding: '8px 12px', borderRadius: '4px', border: '2px solid transparent',
  backgroundColor: '#1e1f22', color: 'var(--text-primary, #dbdee1)',
  cursor: 'pointer', fontSize: '14px', width: '100%', boxSizing: 'border-box',
}
const S_statusBtnActive: CSSProperties = { ...S_statusBtn, borderColor: 'var(--accent-primary, #5865f2)' }
const S_uploadBtn: CSSProperties = {
  padding: '6px 14px', borderRadius: '4px', border: 'none',
  backgroundColor: 'var(--accent-primary, #5865f2)', color: '#fff',
  fontWeight: 600, fontSize: '13px', cursor: 'pointer',
}

const PROFILE_COLORS = [
  '#5865f2', '#3ba55c', '#faa61a', '#ed4245', '#9b59b6',
  '#e91e63', '#1abc9c', '#2ecc71', '#3498db', '#e67e22',
  '#f1c40f', '#95a5a6',
]

// ── Component ────────────────────────────────────────────────────────────────

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
  const [avatarBytes, setAvatarBytes] = useState<Uint8Array | null>(null)
  const [saving, setSaving] = useState(false)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [profileColor, setProfileColor] = useState<string>('')
  const initialProfileColor = useRef('')

  // Sync profile color from server data when modal opens
  useEffect(() => {
    if (isOpen && currentUser) {
      const serverColor = (currentUser as any).profileColor ?? ''
      setProfileColor(serverColor)
      initialProfileColor.current = serverColor
    }
  }, [isOpen, currentUser])

  // Stable data URL from current user's avatar (no blob lifecycle issues)
  const existingAvatarUrl = useMemo(
    () => avatarBytesToUrl(currentUser?.avatarBytes),
    [currentUser?.avatarBytes],
  )

  // The preview to display: uploaded file takes priority, then existing avatar
  const avatarPreview = uploadedPreview ?? existingAvatarUrl ?? null

  // Sync form with currentUser when modal opens
  useEffect(() => {
    if (isOpen && currentUser) {
      setEditDisplayName(currentUser.displayName ?? '')
      setEditBio((currentUser.bio as string) ?? '')
      setEditStatus(getStatusTag(currentUser.status))
      setAvatarBytes(null)
      setAvatarError(null)
      setUploadedPreview(null)
    }
  }, [isOpen, currentUser])

  // Revoke uploaded blob URL on unmount
  useEffect(() => {
    return () => {
      if (uploadedPreview) URL.revokeObjectURL(uploadedPreview)
    }
  }, [uploadedPreview])

  const handleAvatarUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarError(null)

    if (!file.type.startsWith('image/')) {
      setAvatarError('Please select an image file')
      return
    }
    if (file.size > 102_400) {
      setAvatarError('Avatar must be ≤ 100 KB')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const arrayBuffer = reader.result as ArrayBuffer
      const bytes = new Uint8Array(arrayBuffer)
      setAvatarBytes(bytes)
      // Revoke previous uploaded preview before setting new one
      if (uploadedPreview) URL.revokeObjectURL(uploadedPreview)
      setUploadedPreview(URL.createObjectURL(file))
    }
    reader.readAsArrayBuffer(file)
  }, [])

  const handleSave = useCallback(async () => {
    if (!currentUser || saving) return
    setSaving(true)

    try {
      const originalStatus = getStatusTag(currentUser.status)

      // Build update params — only include changed fields
      const params: { displayName?: string | null; bio?: string | null; avatarBytes?: Uint8Array | null; profileColor?: string | null } = {}
      let hasProfileChange = false

      if (editDisplayName.trim() && editDisplayName.trim() !== currentUser.displayName) {
        params.displayName = editDisplayName.trim()
        hasProfileChange = true
      }

      const currentBio = (currentUser.bio as string) ?? ''
      if (editBio !== currentBio) {
        params.bio = editBio || null
        hasProfileChange = true
      }

      if (avatarBytes) {
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
  }, [currentUser, saving, editDisplayName, editBio, editStatus, avatarBytes, profileColor, onUpdateProfile, onSetStatus, onClose])

  if (!currentUser) return null

  const name = currentUser.displayName || currentUser.username || '?'
  const hasChanges = (() => {
    if (!currentUser) return false
    const originalStatus = getStatusTag(currentUser.status)
    const currentBio = (currentUser.bio as string) ?? ''
    return (
      (editDisplayName.trim() !== '' && editDisplayName.trim() !== currentUser.displayName) ||
      editBio !== currentBio ||
      editStatus !== originalStatus ||
      avatarBytes !== null ||
      profileColor !== initialProfileColor.current
    )
  })()

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Profile Settings">
      <div style={S_section}>
        {/* Avatar */}
        <div>
          <div style={S_label}>AVATAR</div>
          <div style={S_avatarContainer}>
            <div style={{ position: 'relative' }}>
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar"
                  style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{
                  width: 64, height: 64, borderRadius: '50%',
                  backgroundColor: profileColor || getAvatarColor(name),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: '24px', fontWeight: 700,
                }}>
                  {getInitial(name)}
                </div>
              )}
              {/* Status dot on preview avatar */}
              <div style={{
                position: 'absolute', bottom: 0, right: 0,
                width: 16, height: 16, borderRadius: '50%',
                backgroundColor: getStatusColor(editStatus),
                border: '3px solid #2b2d31',
              }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={S_uploadBtn}
              >
                Upload Avatar
              </button>
              <span style={{ fontSize: '11px', color: 'var(--text-muted, #949ba4)' }}>
                Max 100 KB, image only
              </span>
              {avatarError && (
                <span style={{ fontSize: '11px', color: '#ed4245' }}>{avatarError}</span>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              style={{ display: 'none' }}
            />
          </div>
        </div>

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
              boxShadow: focusedField === 'displayName' ? '0 0 0 2px #5865f2' : 'none',
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
              boxShadow: focusedField === 'bio' ? '0 0 0 2px #5865f2' : 'none',
              transition: 'box-shadow 0.15s ease',
            }}
          />
          <div style={S_charCount}>{editBio.length}/500</div>
        </div>

        {/* Profile Color */}
        <div>
          <div style={S_label}>PROFILE COLOR</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {PROFILE_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  setProfileColor(c)
                }}
                style={{
                  width: 32, height: 32, borderRadius: '50%', border: profileColor === c ? '2px solid #fff' : '2px solid transparent',
                  backgroundColor: c, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: 0, outline: 'none',
                }}
                aria-label={`Select color ${c}`}
              >
                {profileColor === c && (
                  <Check size={14} color="#fff" strokeWidth={2} />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Status */}
        <div>
          <div style={S_label}>STATUS</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.tag}
                type="button"
                onClick={() => setEditStatus(opt.tag)}
                style={editStatus === opt.tag ? S_statusBtnActive : S_statusBtn}
              >
                <div style={{
                  width: 10, height: 10, borderRadius: '50%',
                  backgroundColor: opt.color,
                  flexShrink: 0,
                }} />
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Save */}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !hasChanges}
          style={hasChanges && !saving ? S_saveBtn : S_saveBtnDisabled}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </Modal>
  )
})
