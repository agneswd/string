import { MessageSquare, Check, X, Trash2 } from 'lucide-react'
import { getAvatarColor, getInitial } from '../../../lib/avatarUtils'
import type { LayoutMode } from '../../../constants/theme'
import type { PanelStyles } from './FriendsStyles'
import { statusDotColor } from './FriendsStyles'
import type { FriendListItem, IncomingFriendRequestItem, OutgoingFriendRequestItem, GuildInviteItem, FriendUserId, FriendRequestItemId } from './types'

// ── Avatar ──────────────────────────────────────────────────────────────────

function Avatar({
  username,
  displayName,
  avatarUrl,
  profileColor,
  size = 32,
  layoutMode,
}: {
  username: string
  displayName?: string
  avatarUrl?: string
  profileColor?: string
  size?: number
  layoutMode: LayoutMode
}) {
  const label = displayName || username
  const bg = profileColor || getAvatarColor(label)
  const letter = getInitial(label)
  const isString = layoutMode === 'string'
  return (
    <div
      style={{
        width: size,
        height: size,
        minWidth: size,
        borderRadius: isString ? '3px' : '50%',
        backgroundColor: bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontWeight: 600,
        fontSize: size * 0.45,
        userSelect: 'none',
        fontFamily: isString ? 'var(--font-mono)' : undefined,
      }}
      aria-hidden="true"
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt=""
          style={{ width: size, height: size, objectFit: 'cover', borderRadius: isString ? 'var(--radius-sm)' : '50%' }}
        />
      ) : (
        letter
      )}
    </div>
  )
}

// ── Shared row state types ──────────────────────────────────────────────────

interface RowSharedProps {
  styles: PanelStyles
  layoutMode: LayoutMode
  hoveredRow: string | null
  hoveredBtn: string | null
  setHoveredRow: (key: string | null) => void
  setHoveredBtn: (key: string | null) => void
}

// ── FriendRow ───────────────────────────────────────────────────────────────

interface FriendRowProps extends RowSharedProps {
  friend: FriendListItem
  onStartDm: (id: FriendUserId) => void
  onRemoveFriend: (id: FriendUserId) => void
}

export function FriendRow({ friend, styles: s, layoutMode, hoveredRow, hoveredBtn, setHoveredRow, setHoveredBtn, onStartDm, onRemoveFriend }: FriendRowProps) {
  const key = `f-${friend.id}`
  const hovered = hoveredRow === key
  return (
    <div
      style={{
        ...s.row,
        backgroundColor: hovered ? s.rowHoverBg : 'transparent',
        borderRadius: hovered ? s.rowHoverRadius : 0,
      }}
      onMouseEnter={() => setHoveredRow(key)}
      onMouseLeave={() => setHoveredRow(null)}
    >
      <div style={s.avatarWrap}>
        <Avatar username={friend.username} displayName={friend.displayName} avatarUrl={friend.avatarUrl} profileColor={friend.profileColor} size={32} layoutMode={layoutMode} />
        <div style={s.statusDot(statusDotColor(friend.status))} />
      </div>
      <div style={s.rowInfo}>
        <span style={s.rowName}>{friend.displayName || friend.username}</span>
        <span style={s.rowSub}>{friend.status || (layoutMode === 'string' ? 'offline' : 'Offline')}</span>
      </div>
      <div style={{ ...s.rowActions, opacity: hovered ? 1 : 0 }}>
        <button
          type="button"
          style={s.iconBtn(hoveredBtn === `msg-${key}`, false)}
          title="Message"
          aria-label={`Message ${friend.username}`}
          onClick={() => onStartDm(friend.id)}
          onMouseEnter={() => setHoveredBtn(`msg-${key}`)}
          onMouseLeave={() => setHoveredBtn(null)}
        >
          <MessageSquare width={16} height={16} />
        </button>
        <button
          type="button"
          style={s.iconBtn(hoveredBtn === `rm-${key}`, true)}
          title="Remove Friend"
          aria-label={`Remove ${friend.username}`}
          onClick={() => onRemoveFriend(friend.id)}
          onMouseEnter={() => setHoveredBtn(`rm-${key}`)}
          onMouseLeave={() => setHoveredBtn(null)}
        >
          <Trash2 width={16} height={16} />
        </button>
      </div>
    </div>
  )
}

// ── IncomingRow ─────────────────────────────────────────────────────────────

interface IncomingRowProps extends RowSharedProps {
  req: IncomingFriendRequestItem
  onAccept: (id: FriendRequestItemId) => void
  onDecline: (id: FriendRequestItemId) => void
}

export function IncomingRow({ req, styles: s, layoutMode, hoveredRow, hoveredBtn, setHoveredRow, setHoveredBtn, onAccept, onDecline }: IncomingRowProps) {
  const key = `in-${req.id}`
  const hovered = hoveredRow === key
  return (
    <div
      style={{
        ...s.row,
        backgroundColor: hovered ? s.rowHoverBg : 'transparent',
        borderRadius: hovered ? s.rowHoverRadius : 0,
      }}
      onMouseEnter={() => setHoveredRow(key)}
      onMouseLeave={() => setHoveredRow(null)}
    >
      <Avatar username={req.username} size={32} layoutMode={layoutMode} />
      <div style={s.rowInfo}>
        <span style={s.rowName}>{req.username}</span>
        <span style={s.rowSub}>{layoutMode === 'string' ? 'incoming request' : 'Incoming Friend Request'}</span>
      </div>
      <div style={s.rowActions}>
        <button
          type="button"
          style={s.iconBtn(hoveredBtn === `acc-${key}`, false)}
          title="Accept"
          aria-label={`Accept request from ${req.username}`}
          onClick={() => onAccept(req.id)}
          onMouseEnter={() => setHoveredBtn(`acc-${key}`)}
          onMouseLeave={() => setHoveredBtn(null)}
        >
          <Check width={16} height={16} />
        </button>
        <button
          type="button"
          style={s.iconBtn(hoveredBtn === `dec-${key}`, true)}
          title="Decline"
          aria-label={`Decline request from ${req.username}`}
          onClick={() => onDecline(req.id)}
          onMouseEnter={() => setHoveredBtn(`dec-${key}`)}
          onMouseLeave={() => setHoveredBtn(null)}
        >
          <X width={16} height={16} />
        </button>
      </div>
    </div>
  )
}

// ── OutgoingRow ─────────────────────────────────────────────────────────────

interface OutgoingRowProps extends RowSharedProps {
  req: OutgoingFriendRequestItem
  onCancel: (id: FriendRequestItemId) => void
}

export function OutgoingRow({ req, styles: s, layoutMode, hoveredRow, hoveredBtn, setHoveredRow, setHoveredBtn, onCancel }: OutgoingRowProps) {
  const key = `out-${req.id}`
  const hovered = hoveredRow === key
  return (
    <div
      style={{
        ...s.row,
        backgroundColor: hovered ? s.rowHoverBg : 'transparent',
        borderRadius: hovered ? s.rowHoverRadius : 0,
      }}
      onMouseEnter={() => setHoveredRow(key)}
      onMouseLeave={() => setHoveredRow(null)}
    >
      <Avatar username={req.username} size={32} layoutMode={layoutMode} />
      <div style={s.rowInfo}>
        <span style={s.rowName}>{req.username}</span>
        <span style={s.rowSub}>{layoutMode === 'string' ? 'outgoing request' : 'Outgoing Friend Request'}</span>
      </div>
      <div style={s.rowActions}>
        <button
          type="button"
          style={s.iconBtn(hoveredBtn === `can-${key}`, true)}
          title="Cancel"
          aria-label={`Cancel request to ${req.username}`}
          onClick={() => onCancel(req.id)}
          onMouseEnter={() => setHoveredBtn(`can-${key}`)}
          onMouseLeave={() => setHoveredBtn(null)}
        >
          <X width={16} height={16} />
        </button>
      </div>
    </div>
  )
}

// ── GuildInviteRow ──────────────────────────────────────────────────────────

interface GuildInviteRowProps extends RowSharedProps {
  invite: GuildInviteItem
  onAccept?: (id: string) => void
  onDecline?: (id: string) => void
}

export function GuildInviteRow({ invite, styles: s, layoutMode, hoveredRow, hoveredBtn, setHoveredRow, setHoveredBtn, onAccept, onDecline }: GuildInviteRowProps) {
  const key = `gi-${invite.id}`
  const hovered = hoveredRow === key
  return (
    <div
      style={{
        ...s.row,
        backgroundColor: hovered ? s.rowHoverBg : 'transparent',
        borderRadius: hovered ? s.rowHoverRadius : 0,
      }}
      onMouseEnter={() => setHoveredRow(key)}
      onMouseLeave={() => setHoveredRow(null)}
    >
      <Avatar username={invite.inviterName} size={32} layoutMode={layoutMode} />
      <div style={s.rowInfo}>
        <span style={s.rowName}>{layoutMode === 'string' ? `from ${invite.inviterName}` : `Server invite from ${invite.inviterName}`}</span>
        <span style={s.rowSub}>{layoutMode === 'string' ? 'server invitation' : 'Server Invitation'}</span>
      </div>
      <div style={s.rowActions}>
        <button
          type="button"
          style={s.iconBtn(hoveredBtn === `acc-${key}`, false)}
          title="Accept"
          aria-label={`Accept server invite from ${invite.inviterName}`}
          onClick={() => onAccept?.(invite.id)}
          onMouseEnter={() => setHoveredBtn(`acc-${key}`)}
          onMouseLeave={() => setHoveredBtn(null)}
        >
          <Check width={16} height={16} />
        </button>
        <button
          type="button"
          style={s.iconBtn(hoveredBtn === `dec-${key}`, true)}
          title="Decline"
          aria-label={`Decline server invite from ${invite.inviterName}`}
          onClick={() => onDecline?.(invite.id)}
          onMouseEnter={() => setHoveredBtn(`dec-${key}`)}
          onMouseLeave={() => setHoveredBtn(null)}
        >
          <X width={16} height={16} />
        </button>
      </div>
    </div>
  )
}

// ── EmptyState ──────────────────────────────────────────────────────────────

export function EmptyState({ title, desc, styles: s }: { title: string; desc: string; styles: PanelStyles }) {
  return (
    <div style={s.empty}>
      <div style={s.emptyTitle}>{title}</div>
      <div style={s.emptyDesc}>{desc}</div>
    </div>
  )
}
