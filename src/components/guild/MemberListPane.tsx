import { useMemo, memo } from 'react'
import { Crown } from 'lucide-react'
import { getAvatarColor, getInitial } from '../../lib/avatarUtils'

export type MemberId = string | number

export interface MemberListItem {
  id: MemberId
  username: string
  displayName: string
  status: string
  /** Whether this member is the guild/channel owner */
  isOwner?: boolean
  /** Pre-computed avatar data URL */
  avatarUrl?: string
  /** Server-side profile color */
  profileColor?: string
}

export interface MemberListPaneProps {
  members: MemberListItem[]
  title: string
  onViewProfile?: (user: { displayName: string; username: string; bio?: string; status?: string; avatarUrl?: string }, x: number, y: number) => void
  localUserId?: MemberId
}

/* ── colour helpers ─────────────────────────────── */

function isOnline(status: string): boolean {
  const s = status.toLowerCase()
  return s === 'online' || s === 'idle' || s === 'dnd' || s === 'do not disturb'
}

/* ── styles ─────────────────────────────────────── */

const ROOT: React.CSSProperties = {
  width: 240,
  minWidth: 240,
  maxWidth: 240,
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  background: 'var(--bg-sidebar-light)',
  borderLeft: '1px solid var(--border-subtle)',
}

const SCROLL: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: '0 8px 12px',
}

const GROUP_HEADER: React.CSSProperties = {
  padding: '16px 8px 4px',
  fontSize: 11,
  fontWeight: 700,
  lineHeight: '16px',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
  userSelect: 'none',
}

const MEMBER_ROW: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '5px 8px',
  borderRadius: 6,
  cursor: 'pointer',
  transition: 'background .12s',
}

const AVATAR: React.CSSProperties = {
  position: 'relative',
  width: 32,
  height: 32,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 13,
  fontWeight: 600,
  color: '#fff',
  flexShrink: 0,
}

const STATUS_DOT: React.CSSProperties = {
  position: 'absolute',
  bottom: -1,
  right: -1,
  width: 10,
  height: 10,
  borderRadius: '50%',
  border: '2px solid var(--bg-sidebar-light)',
}

const NAME: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 500,
  lineHeight: '18px',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}

/* ── component ──────────────────────────────────── */

export const MemberListPane = memo(function MemberListPane({ members, title, onViewProfile, localUserId }: MemberListPaneProps) {
  const { online, offline } = useMemo(() => {
    const on: MemberListItem[] = []
    const off: MemberListItem[] = []
    for (const m of members) {
      ;(isOnline(m.status) ? on : off).push(m)
    }
    on.sort((a, b) => (a.displayName || a.username).localeCompare(b.displayName || b.username))
    off.sort((a, b) => (a.displayName || a.username).localeCompare(b.displayName || b.username))
    return { online: on, offline: off }
  }, [members])

  return (
    <div style={ROOT} aria-label={title} role="complementary">
      <div style={SCROLL}>
        {online.length > 0 && (
          <MemberGroup label={`Online — ${online.length}`} members={online} showStatusDot onViewProfile={onViewProfile} localUserId={localUserId} />
        )}
        {offline.length > 0 && (
          <MemberGroup label={`Offline — ${offline.length}`} members={offline} showStatusDot={false} onViewProfile={onViewProfile} localUserId={localUserId} />
        )}
        {members.length === 0 && (
          <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '32px 8px', lineHeight: 1.6 }}>
            No members
          </p>
        )}
      </div>
    </div>
  )
})

/* ── sub-components ─────────────────────────────── */

interface MemberGroupProps {
  label: string
  members: MemberListItem[]
  showStatusDot: boolean
  onViewProfile?: (user: { displayName: string; username: string; bio?: string; status?: string; avatarUrl?: string }, x: number, y: number) => void
  localUserId?: MemberId
}

const MemberGroup = memo(function MemberGroup({ label, members, showStatusDot, onViewProfile, localUserId }: MemberGroupProps) {
  return (
    <section>
      <h3 style={GROUP_HEADER}>{label}</h3>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }} role="list">
        {members.map((m) => (
          <MemberRow key={String(m.id)} member={m} showStatusDot={showStatusDot} onViewProfile={onViewProfile} localUserId={localUserId} />
        ))}
      </ul>
    </section>
  )
})

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const MemberRow = memo(function MemberRow({ member, showStatusDot, onViewProfile, localUserId: _localUserId }: { member: MemberListItem; showStatusDot: boolean; onViewProfile?: (user: { displayName: string; username: string; bio?: string; status?: string; avatarUrl?: string }, x: number, y: number) => void; localUserId?: MemberId }) {
  const displayName = member.displayName || member.username
  const initial = getInitial(displayName)
  const online = isOnline(member.status)
  const baseAvatarColor = getAvatarColor(displayName)
  const avatarColor = member.profileColor || baseAvatarColor
  const nameColor = member.profileColor || (online ? 'var(--text-interactive-active)' : 'var(--text-muted)')

  return (
    <li
      style={MEMBER_ROW}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLElement).style.background = 'transparent'
      }}
      onContextMenu={(e) => {
        e.preventDefault()
        onViewProfile?.({ displayName, username: member.username, status: member.status }, e.clientX, e.clientY)
      }}
    >
      {/* Avatar */}
      <div style={{ ...AVATAR, background: member.avatarUrl ? 'transparent' : avatarColor, opacity: online ? 1 : 0.45 }}>
        {member.avatarUrl ? (
          <img src={member.avatarUrl} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
        ) : (
          initial
        )}
        {showStatusDot && (
          <span
            style={{
              ...STATUS_DOT,
              background: statusDotColor(member.status),
            }}
            aria-label={member.status}
          />
        )}
      </div>

      {/* Name */}
      <span style={{ ...NAME, display: 'inline-flex', alignItems: 'center', color: nameColor, gap: '4px' }}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{displayName}</span>
        {member.isOwner && (
          <Crown size={14} fill="#faa81a" color="#faa81a" style={{flexShrink:0}} role="img" aria-label="Server Owner" />
        )}
      </span>
    </li>
  )
})

function statusDotColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'online':
      return 'var(--status-online)'
    case 'idle':
      return 'var(--status-idle)'
    case 'dnd':
    case 'do not disturb':
      return 'var(--status-dnd)'
    default:
      return 'var(--status-offline)'
  }
}