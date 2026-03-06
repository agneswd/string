import { useState, useMemo, useCallback, memo } from 'react'
import { getAvatarColor } from '../../lib/avatarUtils'
import { Users, Phone, X } from 'lucide-react'

export type DmChannelId = string | number

export interface DmListItem {
  id: DmChannelId
  name: string
  avatarUrl?: string
  status?: 'online' | 'idle' | 'dnd' | 'offline'
  lastMessage?: string
  unreadCount?: number
}

export interface DmListPaneProps {
  title?: string
  channels: DmListItem[]
  selectedChannelId?: DmChannelId
  onSelectChannel?: (channelId: DmChannelId) => void
  onLeaveChannel?: (channelId: DmChannelId) => void
  onStartVoiceCall?: (channelId: DmChannelId) => void
  onCreateChannel?: () => void
  onShowFriends?: () => void
  createButtonLabel?: string
  className?: string
  /** Channel IDs that have an active voice call */
  activeCallChannelIds?: Set<string>
}

/* ── Status indicator color map ── */
const STATUS_COLORS: Record<string, string> = {
  online: 'var(--status-online)',
  idle: 'var(--status-idle)',
  dnd: 'var(--status-dnd)',
  offline: 'var(--status-offline)',
}

/* ──────────── Styles (module-level) ──────────── */
const rootStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  minHeight: 0,
  background: 'var(--bg-sidebar-light)',
  color: 'var(--text-muted)',
  fontFamily:
    'gg sans, Noto Sans, Helvetica Neue, Helvetica, Arial, sans-serif',
}

const headerStyle: React.CSSProperties = {
  padding: '0 10px',
  height: 48,
  minHeight: 48,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderBottom: '1px solid var(--border-subtle)',
}

const searchWrapStyle: React.CSSProperties = {
  padding: '0 8px',
  width: '100%',
}

const searchInputStyle: React.CSSProperties = {
  width: '100%',
  height: 28,
  borderRadius: 4,
  border: 'none',
  outline: 'none',
  padding: '0 8px',
  fontSize: 13,
  background: 'var(--bg-input)',
  color: 'var(--text-primary)',
}

const navBtnStyle = (active: boolean, hovered: boolean): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '8px 12px',
  margin: '0 8px',
  borderRadius: 4,
  border: 'none',
  cursor: 'pointer',
  width: 'calc(100% - 16px)',
  textAlign: 'left' as const,
  fontSize: 15,
  fontWeight: 500,
  background: active ? 'var(--bg-active)' : hovered ? 'var(--bg-hover)' : 'transparent',
  color: active ? 'var(--text-interactive-active)' : hovered ? 'var(--text-interactive-hover)' : 'var(--text-interactive-normal)',
  transition: 'background .12s, color .12s',
})

const sectionLabelStyle: React.CSSProperties = {
  padding: '16px 18px 4px',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  userSelect: 'none',
}

const listStyle: React.CSSProperties = {
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  overflowX: 'hidden',
  paddingBottom: 8,
}

const itemStyle = (active: boolean, hovered: boolean): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '5px 8px',
  margin: '1px 6px',
  borderRadius: 6,
  border: 'none',
  cursor: 'pointer',
  width: 'calc(100% - 12px)',
  textAlign: 'left' as const,
  background: active
    ? 'var(--bg-active)'
    : hovered
      ? 'var(--bg-hover)'
      : 'transparent',
  color: active ? 'var(--text-interactive-active)' : hovered ? 'var(--text-interactive-hover)' : 'var(--text-interactive-normal)',
  transition: 'background .12s, color .12s',
  position: 'relative' as const,
})

const avatarWrapStyle: React.CSSProperties = {
  position: 'relative',
  flexShrink: 0,
  width: 32,
  height: 32,
}

const avatarCircleStyle = (bg: string): React.CSSProperties => ({
  width: 32,
  height: 32,
  borderRadius: '50%',
  background: bg,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 13,
  fontWeight: 600,
  color: '#fff',
  overflow: 'hidden',
  userSelect: 'none',
})

const statusDotStyle = (status: string): React.CSSProperties => ({
  position: 'absolute',
  bottom: -1,
  right: -1,
  width: 10,
  height: 10,
  borderRadius: '50%',
  border: '2.5px solid var(--bg-sidebar-light)',
  background: STATUS_COLORS[status] ?? STATUS_COLORS.offline,
  boxSizing: 'content-box',
})

const nameStyle: React.CSSProperties = {
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
  fontSize: 15,
  fontWeight: 500,
  lineHeight: '20px',
}

const previewTextStyle: React.CSSProperties = {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  fontSize: 12,
  lineHeight: '16px',
  color: 'var(--text-muted)',
}

const closeStyle = (visible: boolean): React.CSSProperties => ({
  display: visible ? 'flex' : 'none',
  alignItems: 'center',
  justifyContent: 'center',
  width: 20,
  height: 20,
  borderRadius: '50%',
  border: 'none',
  background: 'transparent',
  color: 'var(--text-interactive-normal)',
  cursor: 'pointer',
  flexShrink: 0,
  padding: 0,
})

const badgeStyle: React.CSSProperties = {
  flexShrink: 0,
  minWidth: 16,
  height: 16,
  borderRadius: 8,
  padding: '0 5px',
  background: 'var(--text-danger)',
  color: '#fff',
  fontSize: 11,
  fontWeight: 700,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

const navBtnPadStyle: React.CSSProperties = { padding: '8px 0 0' }


export const DmListPane = memo(function DmListPane({
  title,
  channels,
  selectedChannelId,
  onSelectChannel,
  onLeaveChannel,
  onStartVoiceCall,
  onCreateChannel,
  onShowFriends,
  createButtonLabel,
  className,
  activeCallChannelIds,
}: DmListPaneProps) {
  const [filter, setFilter] = useState('')
  const [hoveredId, setHoveredId] = useState<DmChannelId | null>(null)

  const filteredChannels = useMemo(() => {
    if (!filter.trim()) return channels
    const q = filter.toLowerCase()
    return channels.filter((c) => c.name.toLowerCase().includes(q))
  }, [channels, filter])

  const handleSelect = useCallback(
    (id: DmChannelId) => onSelectChannel?.(id),
    [onSelectChannel],
  )

  const [friendsBtnHover, setFriendsBtnHover] = useState(false)

  return (
    <nav
      className={`tw-dm-list ${className ?? ''}`.trim()}
      style={rootStyle}
      aria-label="Direct Messages"
    >
      {/* ── Nav buttons ── */}
      <div style={navBtnPadStyle}>
        <button
          type="button"
          style={navBtnStyle(false, friendsBtnHover)}
          onMouseEnter={() => setFriendsBtnHover(true)}
          onMouseLeave={() => setFriendsBtnHover(false)}
          onClick={() => onShowFriends?.()}
          aria-label="Friends"
        >
          <Users style={{ width: 24, height: 24 }} aria-hidden="true" />
          <span>Friends</span>
        </button>
      </div>

      {/* ── Section label ── */}
      <div style={sectionLabelStyle}>
        <span>{title || 'Direct Messages'}</span>
        {onCreateChannel && (
          <button
            type="button"
            onClick={onCreateChannel}
            title={createButtonLabel ?? 'Create DM'}
            aria-label={createButtonLabel ?? 'Create DM'}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: 18,
              lineHeight: 1,
              padding: '0 2px',
            }}
          >
            +
          </button>
        )}
      </div>

      {/* ── Scrollable DM list ── */}
      <ul style={listStyle} role="list">
        {filteredChannels.length === 0 && (
          <li
            style={{
              padding: '28px 20px',
              fontSize: 13,
              color: 'var(--text-muted)',
              textAlign: 'center',
              lineHeight: 1.6,
            }}
          >
            {filter ? 'No conversations found.' : 'No direct messages yet.'}
          </li>
        )}
        {filteredChannels.map((channel) => {
          const key = String(channel.id)
          const isActive = key === String(selectedChannelId)
          const isHovered = hoveredId === channel.id
          const bg = channel.avatarUrl ? 'var(--bg-sidebar-light)' : getAvatarColor(channel.name)
          const status = channel.status ?? 'offline'

          return (
            <li
              key={key}
              role="listitem"
              onMouseEnter={() => setHoveredId(channel.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <button
                type="button"
                style={itemStyle(isActive, isHovered)}
                onClick={() => handleSelect(channel.id)}
                aria-pressed={isActive}
                aria-label={`Direct message with ${channel.name}`}
              >
                {/* Avatar with status */}
                <div style={avatarWrapStyle}>
                  <div style={avatarCircleStyle(bg)}>
                    {channel.avatarUrl ? (
                      <img
                        src={channel.avatarUrl}
                        alt=""
                        style={{ width: 32, height: 32, objectFit: 'cover', borderRadius: '50%' }}
                      />
                    ) : (
                      (channel.name || '?')[0].toUpperCase()
                    )}
                  </div>
                  <div style={statusDotStyle(status)} aria-label={status} />
                </div>

                {/* Name + preview */}
                <div style={nameStyle}>
                  <span style={{ ...nameTextStyle, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {channel.name}
                    {activeCallChannelIds?.has(String(channel.id)) && (
                      <Phone style={{ width: 14, height: 14, color: 'var(--text-success)', flexShrink: 0 }} aria-label="In call" />
                    )}
                  </span>
                  {channel.lastMessage && (
                    <span style={previewTextStyle}>{channel.lastMessage}</span>
                  )}
                </div>

                {/* Unread badge */}
                {!!channel.unreadCount && (
                  <span style={badgeStyle}>{channel.unreadCount}</span>
                )}

                {/* Voice call button */}
                {onStartVoiceCall && (isHovered || isActive) && (
                  <span
                    role="button"
                    tabIndex={0}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--text-interactive-normal)',
                      cursor: 'pointer',
                      flexShrink: 0,
                      padding: 0,
                    }}
                    onClick={(e) => {
                      e.stopPropagation()
                      onStartVoiceCall(channel.id)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.stopPropagation()
                        e.preventDefault()
                        onStartVoiceCall(channel.id)
                      }
                    }}
                    title="Start Voice Call"
                    aria-label="Start Voice Call"
                  >
                    <Phone style={{ width: 16, height: 16 }} />
                  </span>
                )}

                {/* Close button */}
                {onLeaveChannel && (
                  <span
                    role="button"
                    tabIndex={0}
                    style={closeStyle(isHovered || isActive)}
                    onClick={(e) => {
                      e.stopPropagation()
                      onLeaveChannel(channel.id)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.stopPropagation()
                        e.preventDefault()
                        onLeaveChannel(channel.id)
                      }
                    }}
                    title="Close DM"
                    aria-label="Close Direct Message"
                  >
                    <X style={{ width: 14, height: 14 }} />
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ul>

      {/* ── Search bar ── */}
      <header style={headerStyle}>
        <div style={searchWrapStyle}>
          <input
            type="text"
            placeholder="Search Direct Messages"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={searchInputStyle}
            aria-label="Search direct messages"
          />
        </div>
      </header>
    </nav>
  )
})

