import { memo, useState, useCallback } from 'react'
import { Phone, X } from 'lucide-react'
import { getAvatarColor } from '../../../lib/avatarUtils'
import type { DmListItem, DmChannelId } from './types'

/* ── Status indicator colors ── */
const STATUS_COLORS: Record<string, string> = {
  online: 'var(--status-online)',
  idle:   'var(--status-idle)',
  dnd:    'var(--status-dnd)',
  offline: 'var(--status-offline)',
}

/* ── Styles ── */
const makeRowStyle = (active: boolean, hovered: boolean): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '5px 8px',
  margin: '1px 6px',
  borderRadius: 2,
  border: 'none',
  cursor: 'pointer',
  width: 'calc(100% - 12px)',
  textAlign: 'left' as const,
  background: active
    ? 'var(--bg-active)'
    : hovered
      ? 'var(--bg-hover)'
      : 'transparent',
  color: active
    ? 'var(--text-interactive-active)'
    : hovered
      ? 'var(--text-interactive-hover)'
      : 'var(--text-channels-default)',
  transition: 'background .12s, color .12s',
  position: 'relative' as const,
})

const avatarWrapStyle: React.CSSProperties = {
  position: 'relative',
  flexShrink: 0,
  width: 30,
  height: 30,
}

const makeAvatarStyle = (bg: string): React.CSSProperties => ({
  width: 30,
  height: 30,
  borderRadius: 'var(--radius-sm)',
  background: bg,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 12,
  fontWeight: 600,
  color: '#fff',
  overflow: 'hidden',
  userSelect: 'none',
  flexShrink: 0,
})

const makeStatusDotStyle = (status: string): React.CSSProperties => ({
  position: 'absolute',
  bottom: -3,
  right: -3,
  width: 10,
  height: 10,
  borderRadius: '50%',
  border: '2px solid var(--bg-sidebar-light)',
  background: STATUS_COLORS[status] ?? STATUS_COLORS.offline,
  boxSizing: 'border-box',
})

const nameColStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 1,
}

const nameTextStyle: React.CSSProperties = {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  fontSize: 14,
  fontWeight: 500,
  lineHeight: '18px',
  fontFamily: 'var(--font-sans)',
}

const previewTextStyle: React.CSSProperties = {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  fontSize: 11,
  lineHeight: '14px',
  color: 'var(--text-muted)',
  fontFamily: 'var(--font-sans)',
}

const badgeStyle: React.CSSProperties = {
  flexShrink: 0,
  minWidth: 16,
  height: 16,
  borderRadius: 2,
  padding: '0 4px',
  background: 'var(--text-danger)',
  color: '#fff',
  fontSize: 11,
  fontWeight: 700,
  fontFamily: 'var(--font-mono)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

const actionBtnBaseStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 18,
  height: 18,
  borderRadius: 2,
  border: 'none',
  background: 'transparent',
  color: 'var(--text-muted)',
  cursor: 'pointer',
  flexShrink: 0,
  padding: 0,
}

/* ── Props ── */
interface DmItemProps {
  channel: DmListItem
  isActive: boolean
  hasActiveCall: boolean
  showVoiceCallBtn: boolean
  onSelect: (id: DmChannelId) => void
  onLeave?: (id: DmChannelId) => void
  onStartVoiceCall?: (id: DmChannelId) => void
}

/* ── Component ── */
export const DmItem = memo(function DmItem({
  channel,
  isActive,
  hasActiveCall,
  showVoiceCallBtn,
  onSelect,
  onLeave,
  onStartVoiceCall,
}: DmItemProps) {
  const [hovered, setHovered] = useState(false)

  const status = channel.status ?? 'offline'
  const avatarBg = channel.avatarUrl ? 'var(--bg-sidebar-light)' : (channel.profileColor || getAvatarColor(channel.name))
  const showActions = hovered || isActive

  const handleLeave = useCallback(
    (e: React.MouseEvent | React.KeyboardEvent) => {
      e.stopPropagation()
      if ('key' in e && e.key !== 'Enter' && e.key !== ' ') return
      e.preventDefault()
      onLeave?.(channel.id)
    },
    [onLeave, channel.id],
  )

  const handleVoice = useCallback(
    (e: React.MouseEvent | React.KeyboardEvent) => {
      e.stopPropagation()
      if ('key' in e && e.key !== 'Enter' && e.key !== ' ') return
      e.preventDefault()
      onStartVoiceCall?.(channel.id)
    },
    [onStartVoiceCall, channel.id],
  )

  return (
    <li
      role="listitem"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        type="button"
        style={makeRowStyle(isActive, hovered)}
        onClick={() => onSelect(channel.id)}
        aria-pressed={isActive}
        aria-label={`Direct message with ${channel.name}`}
      >
        {/* Avatar + status dot */}
        <div style={avatarWrapStyle}>
          <div style={makeAvatarStyle(avatarBg)}>
            {channel.avatarUrl ? (
              <img
                src={channel.avatarUrl}
                alt=""
                style={{ width: 30, height: 30, objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
              />
            ) : (
              (channel.name || '?')[0].toUpperCase()
            )}
          </div>
          <div style={makeStatusDotStyle(status)} aria-label={status} />
        </div>

        {/* Name + last message preview */}
        <div style={nameColStyle}>
          <span style={{ ...nameTextStyle, display: 'flex', alignItems: 'center', gap: 5 }}>
            {channel.name}
            {hasActiveCall && (
              <Phone
                style={{ width: 13, height: 13, color: 'var(--text-success)', flexShrink: 0 }}
                aria-label="In call"
              />
            )}
          </span>
          {channel.lastMessage && (
            <span style={previewTextStyle}>{channel.lastMessage}</span>
          )}
        </div>

        {/* Unread badge — square corners, mono numerals */}
        {!!channel.unreadCount && (
          <span style={badgeStyle} aria-label={`${channel.unreadCount} unread`}>
            {channel.unreadCount}
          </span>
        )}

        {/* Voice call action */}
        {showVoiceCallBtn && showActions && (
          <span
            role="button"
            tabIndex={0}
            style={actionBtnBaseStyle}
            onClick={handleVoice as React.MouseEventHandler}
            onKeyDown={handleVoice as React.KeyboardEventHandler}
            title="Start voice call"
            aria-label="Start voice call"
          >
            <Phone style={{ width: 14, height: 14 }} />
          </span>
        )}

        {/* Close / leave action */}
        {onLeave && (
          <span
            role="button"
            tabIndex={0}
            style={{ ...actionBtnBaseStyle, display: showActions ? 'flex' : 'none' }}
            onClick={handleLeave as React.MouseEventHandler}
            onKeyDown={handleLeave as React.KeyboardEventHandler}
            title="Close DM"
            aria-label="Close direct message"
          >
            <X style={{ width: 12, height: 12 }} />
          </span>
        )}
      </button>
    </li>
  )
})
