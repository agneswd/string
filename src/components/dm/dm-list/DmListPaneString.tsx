/**
 * DmListPaneString — editorial DM sidebar for String layout mode.
 * Uses CSS design tokens (var(--*)). Only rendered when layoutMode="string".
 */
import { useState, useMemo, useCallback, memo } from 'react'
import { Users } from 'lucide-react'
import { DmNavButton } from './DmNavButton'
import { DmItem } from './DmItem'
import type { DmListPaneProps, DmChannelId } from './types'

/* ── Layout styles ── */
const rootStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  minHeight: 0,
  background: 'var(--bg-sidebar-light)',
  color: 'var(--text-channels-default)',
  fontFamily: 'var(--font-sans)',
}

const searchSectionStyle: React.CSSProperties = {
  padding: '8px',
  borderBottom: '1px solid var(--border-subtle)',
  flexShrink: 0,
}

const searchInputStyle: React.CSSProperties = {
  width: '100%',
  height: 26,
  borderRadius: 2,
  border: '1px solid var(--border-subtle)',
  outline: 'none',
  padding: '0 8px',
  fontSize: 12,
  fontFamily: 'var(--font-sans)',
  background: 'var(--bg-input)',
  color: 'var(--text-primary)',
  boxSizing: 'border-box',
}

const navSectionStyle: React.CSSProperties = {
  padding: '6px 0 2px',
  flexShrink: 0,
}

/* Mono uppercase label — matches theme.md section heading style */
const sectionLabelStyle: React.CSSProperties = {
  padding: '12px 16px 4px',
  fontSize: '0.7rem',
  fontWeight: 600,
  letterSpacing: '0.07em',
  textTransform: 'uppercase',
  fontFamily: 'var(--font-mono)',
  color: 'var(--text-muted)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  userSelect: 'none',
  flexShrink: 0,
}

const addBtnStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: 'var(--text-muted)',
  cursor: 'pointer',
  fontSize: 16,
  lineHeight: 1,
  padding: '0 2px',
}

const listStyle: React.CSSProperties = {
  flex: 1,
  minHeight: 0,
  overflowY: 'auto',
  overflowX: 'hidden',
  paddingBottom: 8,
}

const emptyStyle: React.CSSProperties = {
  padding: '24px 16px',
  fontSize: 12,
  color: 'var(--text-muted)',
  textAlign: 'center',
  lineHeight: 1.6,
  fontFamily: 'var(--font-sans)',
}

/* ── Component ── */
export const DmListPaneString = memo(function DmListPaneString({
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
}: Omit<DmListPaneProps, 'layoutMode'>) {
  const [filter, setFilter] = useState('')

  const filteredChannels = useMemo(() => {
    if (!filter.trim()) return channels
    const q = filter.toLowerCase()
    return channels.filter((c) => c.name.toLowerCase().includes(q))
  }, [channels, filter])

  const handleSelect = useCallback(
    (id: DmChannelId) => onSelectChannel?.(id),
    [onSelectChannel],
  )

  return (
    <nav
      className={`tw-dm-list ${className ?? ''}`.trim()}
      style={rootStyle}
      aria-label="Direct Messages"
    >
      {/* ── Search ── */}
      <div style={searchSectionStyle}>
        <input
          type="search"
          placeholder="Search Direct Messages"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={searchInputStyle}
          aria-label="Search direct messages"
        />
      </div>

      {/* ── Nav buttons (Friends, etc.) ── */}
      <div style={navSectionStyle}>
        <DmNavButton
          label="Friends"
          icon={<Users style={{ width: 18, height: 18 }} aria-hidden="true" />}
          onClick={() => onShowFriends?.()}
        />
      </div>

      {/* ── DM section label ── */}
      <div style={sectionLabelStyle}>
        <span>{title ?? 'Direct Messages'}</span>
        {onCreateChannel && (
          <button
            type="button"
            onClick={onCreateChannel}
            title={createButtonLabel ?? 'Create DM'}
            aria-label={createButtonLabel ?? 'Create DM'}
            style={addBtnStyle}
          >
            +
          </button>
        )}
      </div>

      {/* ── Scrollable list ── */}
      <ul style={listStyle} role="list">
        {filteredChannels.length === 0 && (
          <li>
            <p style={emptyStyle}>
              {filter ? 'No conversations found.' : 'No direct messages yet.'}
            </p>
          </li>
        )}
        {filteredChannels.map((channel) => (
          <DmItem
            key={String(channel.id)}
            channel={channel}
            isActive={String(channel.id) === String(selectedChannelId)}
            hasActiveCall={activeCallChannelIds?.has(String(channel.id)) ?? false}
            showVoiceCallBtn={!!onStartVoiceCall}
            onSelect={handleSelect}
            onLeave={onLeaveChannel}
            onStartVoiceCall={onStartVoiceCall}
          />
        ))}
      </ul>
    </nav>
  )
})
