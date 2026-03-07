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
  onResetClick: () => void
  canReset: boolean
}

export const ProfileAvatarSection = React.memo(function ProfileAvatarSection({
  avatarPreview,
  name,
  profileColor,
  statusColor,
  avatarError,
  onUploadClick,
  onResetClick,
  canReset,
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
              style={{ width: 64, height: 64, borderRadius: 'var(--radius-sm)', objectFit: 'cover' }}
            />
          ) : (
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 'var(--radius-sm)',
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
              bottom: -2,
              right: -2,
              width: 14,
              height: 14,
              borderRadius: '50%',
              backgroundColor: statusColor,
              border: '2px solid var(--bg-panel)',
            }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0, flex: '1 1 220px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <button type="button" onClick={onUploadClick} style={S_uploadBtn} className="string-outline-button">
              Upload Avatar
            </button>
            <button
              type="button"
              onClick={onResetClick}
              disabled={!canReset}
              style={S_uploadBtn}
              className="string-outline-button"
            >
              Reset
            </button>
          </div>
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
