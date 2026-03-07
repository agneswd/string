import { Headphones, HeadphoneOff, Mic, MicOff, Settings } from 'lucide-react'
import type { CSSProperties } from 'react'

import { avatarBytesToUrl, getAvatarColor, getInitial } from '../../../lib/avatarUtils'
import { ProfileSettingsForm } from '../../modals/profile/ProfileSettingsForm'
import { getStatusColor } from '../../modals/profile/constants'
import { useProfileSettingsForm } from '../../modals/profile/useProfileSettingsForm'
import type { SidebarBottomVariantProps } from '../SidebarBottom'
import type { ProfileSettingsModalProps } from '../../modals/ProfileSettingsModal'
import { S_stringOutlineButton } from '../../../constants/appStyles'

export interface MobileUserSectionProps {
  sidebarBottom: SidebarBottomVariantProps
  currentUser: ProfileSettingsModalProps['currentUser']
  onUpdateProfile: ProfileSettingsModalProps['onUpdateProfile']
  onSetStatus: ProfileSettingsModalProps['onSetStatus']
}

export function MobileUserSection({
  sidebarBottom,
  currentUser,
  onUpdateProfile,
  onSetStatus,
}: MobileUserSectionProps) {
  const form = useProfileSettingsForm({
    isOpen: true,
    currentUser,
    onUpdateProfile,
    onSetStatus,
  })

  const displayName = sidebarBottom.user?.displayName ?? sidebarBottom.user?.username ?? '?'
  const avatarUrl = sidebarBottom.user?.avatarUrl ?? avatarBytesToUrl(sidebarBottom.user?.avatarBytes)
  const statusColor = getStatusColor(sidebarBottom.user?.status ?? 'Online')

  return (
    <section
      aria-label="Your mobile profile"
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        height: '100%',
        overflowY: 'auto',
        padding: '1rem 0.875rem 1.25rem',
        gap: '1rem',
        backgroundColor: 'var(--bg-sidebar-light)',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
          You
        </span>
        <h2 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
          Profile & controls
        </h2>
      </div>

      <div style={S_card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', minWidth: 0, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt=""
                style={{ width: 56, height: 56, borderRadius: '14px', objectFit: 'cover' }}
              />
            ) : (
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '14px',
                  backgroundColor: sidebarBottom.user?.profileColor || getAvatarColor(displayName),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: '1.25rem',
                  fontWeight: 700,
                }}
              >
                {getInitial(displayName)}
              </div>
            )}
            <div
              style={{
                position: 'absolute',
                right: -3,
                bottom: -3,
                width: 14,
                height: 14,
                borderRadius: '50%',
                border: '2px solid var(--bg-sidebar-light)',
                backgroundColor: statusColor,
              }}
            />
          </div>

          <div style={{ flex: '1 1 180px', minWidth: 0 }}>
            <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>{displayName}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              @{sidebarBottom.user?.username ?? 'unknown'}
            </div>
            <div style={{ marginTop: '0.35rem', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              {sidebarBottom.user?.status ?? 'Online'}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '0.5rem' }}>
          <MobileActionButton label="Settings" onClick={sidebarBottom.onOpenSettings}>
            <Settings size={16} />
          </MobileActionButton>
          <MobileActionButton label={sidebarBottom.isMuted ? 'Unmute' : 'Mute'} onClick={sidebarBottom.onToggleMute} danger={sidebarBottom.isMuted}>
            {sidebarBottom.isMuted ? <MicOff size={16} /> : <Mic size={16} />}
          </MobileActionButton>
          <MobileActionButton label={sidebarBottom.isDeafened ? 'Undeafen' : 'Deafen'} onClick={sidebarBottom.onToggleDeafen} danger={sidebarBottom.isDeafened}>
            {sidebarBottom.isDeafened ? <HeadphoneOff size={16} /> : <Headphones size={16} />}
          </MobileActionButton>
        </div>
      </div>

      {currentUser ? (
        <div style={S_card}>
          <ProfileSettingsForm controller={form} submitLabel="Save profile" />
        </div>
      ) : (
        <div style={S_card}>
          <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Your account details will appear here after profile data loads.
          </p>
        </div>
      )}
    </section>
  )
}

function MobileActionButton({
  children,
  label,
  onClick,
  danger = false,
}: {
  children: React.ReactNode
  label: string
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...S_stringOutlineButton,
        minWidth: 0,
        width: '100%',
        padding: '0.75rem 0.5rem',
        flexDirection: 'column',
        gap: '0.35rem',
        color: danger ? 'var(--text-danger)' : 'var(--text-primary)',
        borderColor: danger ? 'var(--text-danger)' : 'var(--border-subtle)',
      }}
      className="string-outline-button"
    >
      {children}
      <span style={{ fontSize: '0.75rem', lineHeight: 1.2, whiteSpace: 'normal' }}>{label}</span>
    </button>
  )
}

const S_card: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.875rem',
  padding: '0.875rem',
  borderRadius: '14px',
  border: '1px solid var(--border-subtle)',
  backgroundColor: 'var(--bg-panel)',
  minWidth: 0,
}
