import React, { useRef, useEffect } from 'react'
import { Circle } from 'lucide-react'
import { getAvatarColor, getInitial, getProfileColor } from '../../lib/avatarUtils'
import { useLayoutMode } from '../../hooks/useLayoutMode'
import type { LayoutMode } from '../../constants/theme'

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
  layoutMode?: LayoutMode
}

export const UserProfilePopup: React.FC<UserProfilePopupProps> = ({ user, onClose, isLocalUser = false, layoutMode: layoutModeProp }) => {
  const ref = useRef<HTMLDivElement>(null)
  const { layoutMode: hookLayoutMode } = useLayoutMode()
  const layoutMode = layoutModeProp ?? hookLayoutMode
  const isString = layoutMode === 'string'

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
      background: 'var(--bg-panel)',
      borderRadius: isString ? 'var(--radius-sm)' : 'var(--radius-lg)',
      width: 300,
      boxShadow: isString ? 'none' : '0 8px 24px rgba(0,0,0,0.4)',
      border: '1px solid var(--border-subtle)',
      overflow: 'hidden',
    }} onClick={e => e.stopPropagation()}>
      {/* Banner/header — full band in classic, thin accent line in string */}
      {isString
        ? <div style={{ height: 3, background: color }} />
        : <div style={{ height: 60, background: color }} />}

      {/* Avatar */}
      <div style={{ padding: '0 16px', marginTop: isString ? 12 : -30 }}>
        {user.avatarUrl ? (
          <img src={user.avatarUrl} alt="" style={{
            width: isString ? 40 : 60,
            height: isString ? 40 : 60,
            borderRadius: isString ? 'var(--radius-sm)' : '50%',
            border: isString ? '1px solid var(--border-subtle)' : '4px solid var(--bg-panel)',
            objectFit: 'cover',
          }} />
        ) : (
          <div style={{
            width: isString ? 40 : 60,
            height: isString ? 40 : 60,
            borderRadius: isString ? 'var(--radius-sm)' : '50%',
            backgroundColor: color,
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: '#fff',
            fontSize: isString ? 16 : 24,
            fontWeight: isString ? 500 : 700,
            fontFamily: isString ? 'var(--font-mono)' : undefined,
            border: isString ? '1px solid var(--border-subtle)' : '4px solid var(--bg-panel)',
          }}>
            {getInitial(user.displayName)}
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: isString ? '10px 16px 16px' : '8px 16px 16px' }}>
        <div style={{
          fontSize: isString ? 14 : 20,
          fontWeight: isString ? 600 : 700,
          color: 'var(--text-header-primary)',
        }}>{user.displayName}</div>
        <div style={{
          fontSize: isString ? 11 : 13,
          fontFamily: isString ? 'var(--font-mono)' : undefined,
          color: 'var(--text-muted)',
          marginTop: isString ? 2 : 0,
        }}>{user.username}</div>
        {user.status && (
          <div style={{
            marginTop: 8,
            fontSize: isString ? 11 : 13,
            fontFamily: isString ? 'var(--font-mono)' : undefined,
            color: 'var(--text-muted)',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            {(() => {
              const st = user.status!.toLowerCase()
              if (st === 'online')
                return <><Circle size={8} fill="var(--status-online)" stroke="none" /> Online</>
              if (st === 'donotdisturb' || st === 'dnd' || st === 'do not disturb')
                return <><Circle size={8} fill="var(--status-dnd)" stroke="none" /> Do Not Disturb</>
              if (st === 'away' || st === 'idle')
                return <><Circle size={8} fill="var(--status-idle)" stroke="none" /> Away</>
              return <><Circle size={8} fill="none" stroke="var(--status-offline)" strokeWidth={2} /> Offline</>
            })()}
          </div>
        )}
        {user.bio && (
          <div style={{
            marginTop: 12,
            padding: isString ? '8px 10px' : '12px',
            background: 'var(--bg-hover)',
            borderRadius: isString ? 'var(--radius-sm)' : 'var(--radius-md)',
            borderLeft: isString ? '2px solid var(--border-subtle)' : 'none',
            fontSize: isString ? 12 : 13,
            fontFamily: isString ? 'var(--font-mono)' : undefined,
            color: 'var(--text-secondary)',
            lineHeight: 1.5,
          }}>
            {user.bio}
          </div>
        )}
      </div>
    </div>
    </div>
  )
}
