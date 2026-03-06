import React, { useRef, useEffect } from 'react'
import { Circle } from 'lucide-react'
import { getAvatarColor, getInitial, getProfileColor } from '../../lib/avatarUtils'

export interface ProfilePopupUser {
  displayName: string
  username: string
  bio?: string
  status?: string
  avatarUrl?: string
  profileColor?: string
}

export interface UserProfilePopupProps {
  user: ProfilePopupUser
  onClose: () => void
  isLocalUser?: boolean
}

export const UserProfilePopup: React.FC<UserProfilePopupProps> = ({ user, onClose, isLocalUser = false }) => {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [onClose])

  const hashColor = getAvatarColor(user.displayName)
  const color = user.profileColor
    ? user.profileColor
    : isLocalUser && getProfileColor()
      ? getProfileColor()!
      : hashColor

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
    <div ref={ref} style={{
      background: 'var(--bg-panel)', borderRadius: 'var(--radius-lg)', width: 300,
      boxShadow: '0 12px 32px rgba(0,0,0,0.5)', border: '1px solid var(--border-subtle)',
      overflow: 'hidden',
    }} onClick={e => e.stopPropagation()}>
      {/* Banner/header */}
      <div style={{ height: 60, background: color }} />

      {/* Avatar */}
      <div style={{ padding: '0 16px', marginTop: -30 }}>
        {user.avatarUrl ? (
          <img src={user.avatarUrl} alt="" style={{
            width: 60, height: 60, borderRadius: '50%',
            border: '4px solid var(--bg-panel)', objectFit: 'cover',
          }} />
        ) : (
          <div style={{
            width: 60, height: 60, borderRadius: '50%',
            backgroundColor: color, display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: '#fff', fontSize: 24, fontWeight: 700,
            border: '4px solid var(--bg-panel)',
          }}>
            {getInitial(user.displayName)}
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '8px 16px 16px' }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-header-primary)' }}>{user.displayName}</div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{user.username}</div>
        {user.status && (
          <div style={{ marginTop: 8, fontSize: 13, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
            {user.status === 'Online' ? (
              <><Circle size={10} fill="var(--status-online)" stroke="none" /> Online</>
            ) : user.status === 'DoNotDisturb' ? (
              <><Circle size={10} fill="var(--status-dnd)" stroke="none" /> Do Not Disturb</>
            ) : user.status === 'Away' ? (
              <><Circle size={10} fill="var(--status-idle)" stroke="none" /> Away</>
            ) : (
              <><Circle size={10} fill="none" stroke="var(--status-offline)" strokeWidth={2} /> Offline</>
            )}
          </div>
        )}
        {user.bio && (
          <div style={{ marginTop: 12, padding: '12px', background: 'var(--bg-hover)', borderRadius: 'var(--radius-md)', fontSize: 13, color: 'var(--text-normal)', lineHeight: 1.4 }}>
            {user.bio}
          </div>
        )}
      </div>
    </div>
    </div>
  )
}
