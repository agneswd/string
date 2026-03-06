import React, { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'

import { Modal } from './Modal'
import { avatarBytesToUrl } from '../../lib/avatarUtils'
import { compressAvatarFile, MAX_AVATAR_BYTES } from './profile/avatarProcessing'
import { S_formCol, S_labelCol, S_labelSpan, S_input, S_stringOutlineButton, S_stringOutlineButtonDisabled } from '../../constants/appStyles'

const S_textarea: CSSProperties = {
  ...S_input,
  minHeight: 96,
  resize: 'vertical',
  lineHeight: 1.5,
}

export interface GuildSettingsModalGuild {
  guildId: unknown
  name: string
  bio?: string | null
  avatarBytes?: Uint8Array | null
}

export interface GuildSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  currentGuild: GuildSettingsModalGuild | null
  onUpdateGuild: (params: {
    name?: string | null
    bio?: string | null
    avatarBytes?: Uint8Array | null
  }) => Promise<void>
}

export const GuildSettingsModal = React.memo(function GuildSettingsModal({
  isOpen,
  onClose,
  currentGuild,
  onUpdateGuild,
}: GuildSettingsModalProps) {
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [avatarBytes, setAvatarBytes] = useState<Uint8Array | null>(null)
  const [avatarRemoved, setAvatarRemoved] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isOpen || !currentGuild) {
      return
    }

    setName(currentGuild.name)
    setBio(currentGuild.bio ?? '')
    setAvatarBytes(null)
    setAvatarRemoved(false)
    setAvatarError(null)
    setPreviewUrl(null)
  }, [isOpen, currentGuild])

  useEffect(() => () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const currentAvatarUrl = useMemo(() => avatarBytesToUrl(currentGuild?.avatarBytes), [currentGuild?.avatarBytes])
  const avatarUrl = previewUrl ?? (avatarRemoved ? null : currentAvatarUrl ?? null)

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setAvatarError(null)

    try {
      const processedBlob = await compressAvatarFile(file)
      if (processedBlob.size > MAX_AVATAR_BYTES) {
        setAvatarError('Avatar must be ≤ 100 KB')
        return
      }

      const bytes = new Uint8Array(await processedBlob.arrayBuffer())
      setAvatarBytes(bytes)
      setAvatarRemoved(false)
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
      setPreviewUrl(URL.createObjectURL(processedBlob))
    } catch {
      setAvatarError('Could not process avatar image.')
    } finally {
      event.target.value = ''
    }
  }

  const handleAvatarReset = () => {
    setAvatarBytes(null)
    setAvatarRemoved(true)
    setAvatarError(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!currentGuild || saving) {
      return
    }

    setSaving(true)
    try {
      await onUpdateGuild({
        name: name.trim(),
        bio,
        avatarBytes: avatarRemoved ? null : avatarBytes ?? currentGuild.avatarBytes ?? null,
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Server Settings">
      <form onSubmit={handleSubmit} style={S_formCol}>
        <label style={S_labelCol}>
          <span style={S_labelSpan}>SERVER AVATAR</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {avatarUrl ? (
              <img src={avatarUrl} alt="" style={{ width: 56, height: 56, borderRadius: 8, objectFit: 'cover', border: '1px solid var(--border-subtle)' }} />
            ) : (
              <div style={{ width: 56, height: 56, borderRadius: 8, background: 'var(--bg-hover)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontWeight: 700 }}>
                {name.trim().slice(0, 2).toUpperCase() || '#'}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button type="button" onClick={() => fileInputRef.current?.click()} style={S_stringOutlineButton} className="string-outline-button">
                Upload Avatar
              </button>
              <button type="button" onClick={handleAvatarReset} style={S_stringOutlineButton} className="string-outline-button">
                Remove Avatar
              </button>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} />
          </div>
          {avatarError && <div style={{ color: 'var(--text-danger)', fontSize: 12 }}>{avatarError}</div>}
        </label>

        <label style={S_labelCol}>
          <span style={S_labelSpan}>SERVER NAME</span>
          <input value={name} onChange={(event) => setName(event.target.value)} style={S_input} maxLength={100} />
        </label>

        <label style={S_labelCol}>
          <span style={S_labelSpan}>SERVER BIO</span>
          <textarea value={bio} onChange={(event) => setBio(event.target.value)} style={S_textarea} rows={4} maxLength={240} />
        </label>

        <button type="submit" disabled={!name.trim() || saving} style={!name.trim() || saving ? S_stringOutlineButtonDisabled : S_stringOutlineButton} className="string-outline-button">
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </form>
    </Modal>
  )
})
