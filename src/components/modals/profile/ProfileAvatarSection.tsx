import React from 'react'
import { getAvatarColor, getInitial } from '../../../lib/avatarUtils'
import { S_label, S_avatarContainer, S_uploadBtn } from './styles'

interface ProfileAvatarSectionProps {
  avatarPreview: string | null
  name: string
  /** Active profile color (hex). Falls back to computed avatar color. */
  profileColor: string
  /** Resolved hex color for the current status dot. */
  statusColor: string
  avatarError: string | null
  onUploadClick: () => void
}

export const ProfileAvatarSection = React.memo(function ProfileAvatarSection({
  avatarPreview,
  name,
  profileColor,
  statusColor,
  avatarError,
  onUploadClick,
}: ProfileAvatarSectionProps) {
  return (
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
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                backgroundColor: profileColor || getAvatarColor(name),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: '24px',
                fontWeight: 700,
              }}
            >
              {getInitial(name)}
            </div>
          )}
          {/* Status dot */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: 14,
              height: 14,
              borderRadius: '50%',
              backgroundColor: statusColor,
              border: '2px solid var(--bg-panel)',
            }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <button type="button" onClick={onUploadClick} style={S_uploadBtn}>
            Upload Avatar
          </button>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Max 100 KB, image only
          </span>
          {avatarError && (
            <span style={{ fontSize: '11px', color: 'var(--text-danger)' }}>
              {avatarError}
            </span>
          )}
        </div>
      </div>
    </div>
  )
})
