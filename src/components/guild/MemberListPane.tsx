import React, { useMemo, memo } from 'react'
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

export type MemberLayoutMode = 'classic' | 'string'

export interface MemberListPaneProps {
  members: MemberListItem[]
  title: string
  onViewProfile?: (user: { displayName: string; username: string; bio?: string; status?: string; avatarUrl?: string }, x: number, y: number) => void
  localUserId?: MemberId
  /** Controls visual treatment: 'classic' = Discord-like (default), 'string' = editorial. */
  layoutMode?: MemberLayoutMode
}

/* ── colour helpers ─────────────────────────────── */

function isOnline(status: string): boolean {
  const s = status.toLowerCase()
  return s === 'online' || s === 'idle' || s === 'dnd' || s === 'do not disturb'
}

/* ── mode-resolved styles ─────────────────────────── */

interface MemberStyleSheet {
  root: React.CSSProperties
  scroll: React.CSSProperties
  groupHeader: React.CSSProperties
  memberRow: React.CSSProperties
  avatar: React.CSSProperties
  statusDot: React.CSSProperties
  name: React.CSSProperties
  hoverBg: string
  emptyColor: string
  statusDotBorderColor: string
  onlineNameColor: string
  offlineNameColor: string
}

function resolveMemberStyles(mode: MemberLayoutMode): MemberStyleSheet {
  const isString = mode === 'string'
  return {
    root: {
      width: 240,
      minWidth: 240,
      maxWidth: 240,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: isString ? 'var(--bg-sidebar-light)' : '#2b2d31',
      borderLeft: isString ? '1px solid var(--border-subtle)' : '1px solid #1f2023',
    },
    scroll: {
      flex: 1,
      overflowY: 'auto',
      padding: '0 8px 12px',
    },
    groupHeader: {
      padding: isString ? '16px 8px 4px' : '18px 8px 4px',
      fontFamily: isString ? 'var(--font-mono)' : undefined,
      fontSize: isString ? 11 : 12,
      fontWeight: 600,
      lineHeight: '16px',
      letterSpacing: isString ? '0.06em' : '0.02em',
      textTransform: 'uppercase' as const,
      color: isString ? 'var(--text-muted)' : '#949ba4',
      userSelect: 'none' as const,
    },
    memberRow: {
      display: 'flex',
      alignItems: 'center',
      gap: isString ? 10 : 12,
      padding: isString ? '5px 8px' : '4px 8px',
      borderRadius: isString ? 'var(--radius-sm)' : 4,
      cursor: 'pointer',
      transition: 'background .12s',
    },
    avatar: {
      position: 'relative' as const,
      width: 32,
      height: 32,
      borderRadius: isString ? 'var(--radius-sm)' : '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 13,
      fontWeight: 600,
      color: '#fff',
      flexShrink: 0,
    },
    statusDot: {
      position: 'absolute' as const,
      bottom: -1,
      right: -1,
      width: 10,
      height: 10,
      borderRadius: '50%',
    },
    name: {
      fontSize: isString ? 13 : 14,
      fontWeight: isString ? 400 : 500,
      lineHeight: '18px',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap' as const,
    },
    hoverBg: isString ? 'var(--bg-hover)' : 'rgba(79,84,92,0.32)',
    emptyColor: isString ? 'var(--text-muted)' : '#949ba4',
    statusDotBorderColor: isString ? 'var(--bg-sidebar-light)' : '#2b2d31',
    onlineNameColor: isString ? 'var(--text-primary)' : '#f2f3f5',
    offlineNameColor: isString ? 'var(--text-muted)' : '#949ba4',
  }
}

/* ── component ──────────────────────────────────── */

export const MemberListPane = memo(function MemberListPane({ members, title, onViewProfile, localUserId, layoutMode = 'classic' }: MemberListPaneProps) {
  const styles = useMemo(() => resolveMemberStyles(layoutMode), [layoutMode])

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
    <div style={styles.root} aria-label={title} role="complementary">
      <div style={styles.scroll}>
        {online.length > 0 && (
          <MemberGroup label={`Online — ${online.length}`} members={online} showStatusDot onViewProfile={onViewProfile} localUserId={localUserId} styles={styles} />
        )}
        {offline.length > 0 && (
          <MemberGroup label={`Offline — ${offline.length}`} members={offline} showStatusDot={false} onViewProfile={onViewProfile} localUserId={localUserId} styles={styles} />
        )}
        {members.length === 0 && (
          <p style={{ color: styles.emptyColor, fontSize: 13, textAlign: 'center', padding: '32px 8px', lineHeight: 1.6 }}>
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
  styles: MemberStyleSheet
}

const MemberGroup = memo(function MemberGroup({ label, members, showStatusDot, onViewProfile, localUserId, styles }: MemberGroupProps) {
  return (
    <section>
      <h3 style={styles.groupHeader}>{label}</h3>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }} role="list">
        {members.map((m) => (
          <MemberRow key={String(m.id)} member={m} showStatusDot={showStatusDot} onViewProfile={onViewProfile} localUserId={localUserId} styles={styles} />
        ))}
      </ul>
    </section>
  )
})

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const MemberRow = memo(function MemberRow({ member, showStatusDot, onViewProfile, localUserId: _localUserId, styles }: { member: MemberListItem; showStatusDot: boolean; onViewProfile?: (user: { displayName: string; username: string; bio?: string; status?: string; avatarUrl?: string }, x: number, y: number) => void; localUserId?: MemberId; styles: MemberStyleSheet }) {
  const displayName = member.displayName || member.username
  const initial = getInitial(displayName)
  const online = isOnline(member.status)
  const baseAvatarColor = getAvatarColor(displayName)
  const avatarColor = member.profileColor || baseAvatarColor
  const nameColor = member.profileColor || (online ? styles.onlineNameColor : styles.offlineNameColor)

  return (
    <li
      style={styles.memberRow}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLElement).style.background = styles.hoverBg
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
      <div style={{ ...styles.avatar, background: member.avatarUrl ? 'transparent' : avatarColor, opacity: online ? 1 : 0.45 }}>
        {member.avatarUrl ? (
          <img src={member.avatarUrl} alt="" style={{ width: '100%', height: '100%', borderRadius: styles.avatar.borderRadius, objectFit: 'cover' }} />
        ) : (
          initial
        )}
        {showStatusDot && (
          <span
            style={{
              ...styles.statusDot,
              border: `2px solid ${styles.statusDotBorderColor}`,
              background: statusDotColor(member.status),
            }}
            aria-label={member.status}
          />
        )}
      </div>

      {/* Name */}
      <span style={{ ...styles.name, display: 'inline-flex', alignItems: 'center', color: nameColor, gap: '4px' }}>
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