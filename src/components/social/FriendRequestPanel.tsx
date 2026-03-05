import { type FormEvent, useState, useMemo, useCallback, type CSSProperties } from 'react'
import { MessageSquare, Check, X, Trash2, Search, Users } from 'lucide-react'
import { getAvatarColor } from '../../lib/avatarUtils'

export type FriendRequestItemId = string | number
export type FriendUserId = string | number

export interface IncomingFriendRequestItem {
  id: FriendRequestItemId
  username: string
}

export interface OutgoingFriendRequestItem {
  id: FriendRequestItemId
  username: string
}

export interface FriendListItem {
  id: FriendUserId
  username: string
  displayName?: string
  status?: string
}

export interface GuildInviteItem {
  id: string
  guildId: string
  inviterName: string
}

export interface FriendRequestPanelProps {
  requestUsername: string
  onRequestUsernameChange: (value: string) => void
  onSendRequest: (username: string) => void
  incomingRequests: IncomingFriendRequestItem[]
  onAcceptRequest: (requestId: FriendRequestItemId) => void
  onDeclineRequest: (requestId: FriendRequestItemId) => void
  outgoingRequests: OutgoingFriendRequestItem[]
  onCancelOutgoingRequest: (requestId: FriendRequestItemId) => void
  friends: FriendListItem[]
  onStartDm: (friendId: FriendUserId) => void
  onRemoveFriend: (friendId: FriendUserId) => void
  guildInvites?: GuildInviteItem[]
  onAcceptGuildInvite?: (inviteId: string) => void
  onDeclineGuildInvite?: (inviteId: string) => void
  className?: string
}

type Tab = 'online' | 'all' | 'pending' | 'add'

function statusDotColor(status?: string): string {
  switch (status?.toLowerCase()) {
    case 'online': return '#3ba55d'
    case 'idle': case 'away': return '#faa81a'
    case 'do not disturb': case 'dnd': return '#ed4245'
    default: return '#747f8d'
  }
}

function Avatar({ username, size = 32 }: { username: string; size?: number }) {
  const bg = getAvatarColor(username)
  const letter = username.charAt(0).toUpperCase()
  return (
    <div
      style={{
        width: size,
        height: size,
        minWidth: size,
        borderRadius: '50%',
        backgroundColor: bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontWeight: 600,
        fontSize: size * 0.45,
        userSelect: 'none',
      }}
      aria-hidden="true"
    >
      {letter}
    </div>
  )
}

/* ---- Icon Components (using lucide-react) ---- */
function MessageIcon() {
  return <MessageSquare width={20} height={20} />
}
function CheckIcon() {
  return <Check width={20} height={20} />
}
function CloseIcon() {
  return <X width={20} height={20} />
}
function RemoveIcon() {
  return <Trash2 width={20} height={20} />
}
function SearchIcon() {
  return <Search width={16} height={16} style={{ opacity: 0.5 }} />
}

/* ---- Inline style helpers ---- */
const s = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    overflow: 'hidden',
  } satisfies CSSProperties,

  /* Top toolbar / tab bar */
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 16px',
    borderBottom: '1px solid var(--border-subtle)',
    gap: 8,
    flexShrink: 0,
  } satisfies CSSProperties,

  toolbarTitle: {
    fontWeight: 700,
    fontSize: 15,
    color: 'var(--text-header-primary)',
    marginRight: 8,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  } satisfies CSSProperties,

  divider: {
    width: 1,
    height: 24,
    backgroundColor: 'var(--border-subtle)',
    marginRight: 4,
    flexShrink: 0,
  } satisfies CSSProperties,

  tab: (active: boolean): CSSProperties => ({
    padding: '4px 10px',
    borderRadius: 4,
    border: 'none',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 500,
    backgroundColor: active ? 'var(--bg-modifier-selected)' : 'transparent',
    color: active ? 'var(--text-interactive-active)' : 'var(--text-interactive-normal)',
    transition: 'background-color .15s, color .15s',
    whiteSpace: 'nowrap',
  }),

  tabBadge: {
    marginLeft: 4,
    padding: '0 5px',
    fontSize: 11,
    fontWeight: 700,
    borderRadius: 8,
    backgroundColor: 'var(--text-danger)',
    color: '#fff',
    lineHeight: '16px',
    minWidth: 16,
    textAlign: 'center',
    display: 'inline-block',
  } satisfies CSSProperties,

  addFriendTab: (active: boolean): CSSProperties => ({
    padding: '4px 10px',
    borderRadius: 4,
    border: 'none',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 500,
    backgroundColor: active ? 'transparent' : 'var(--accent-primary)',
    color: active ? 'var(--text-success)' : '#fff',
    transition: 'background-color .15s, color .15s',
    whiteSpace: 'nowrap',
  }),

  /* Search bar */
  searchWrap: {
    padding: '8px 20px 0 30px',
    position: 'relative',
    flexShrink: 0,
  } satisfies CSSProperties,

  searchInput: {
    width: '100%',
    padding: '6px 12px 6px 32px',
    borderRadius: 4,
    border: 'none',
    backgroundColor: 'var(--bg-input)',
    color: 'var(--text-primary)',
    fontSize: 14,
    outline: 'none',
  } satisfies CSSProperties,

  searchIconPos: {
    position: 'absolute',
    left: 10,
    top: '50%',
    transform: 'translateY(-50%)',
    pointerEvents: 'none',
  } satisfies CSSProperties,

  /* Section header */
  sectionHeader: {
    padding: '16px 30px 8px',
    fontSize: 12,
    fontWeight: 700,
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
    letterSpacing: '0.02em',
    flexShrink: 0,
  } satisfies CSSProperties,

  /* List area */
  listArea: {
    flex: 1,
    overflowY: 'auto',
    paddingBottom: 20,
  } satisfies CSSProperties,

  /* Friend / request row */
  row: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 20px 8px 30px',
    cursor: 'pointer',
    borderTop: '1px solid var(--border-subtle)',
    transition: 'background-color .1s',
    gap: 12,
  } satisfies CSSProperties,

  rowInfo: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
  } satisfies CSSProperties,

  rowName: {
    fontSize: 15,
    fontWeight: 600,
    color: 'var(--text-primary)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  } satisfies CSSProperties,

  rowSub: {
    fontSize: 13,
    color: 'var(--text-muted)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  } satisfies CSSProperties,

  rowActions: {
    display: 'flex',
    gap: 8,
    flexShrink: 0,
  } satisfies CSSProperties,

  iconBtn: (hoverColor?: string): CSSProperties => ({
    width: 36,
    height: 36,
    borderRadius: '50%',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--bg-sidebar-light)',
    color: 'var(--text-interactive-normal)',
    cursor: 'pointer',
    transition: 'background-color .15s, color .15s',
    padding: 0,
    // hover color applied via onMouseEnter/Leave
    ...(hoverColor ? {} : {}),
  }),

  /* Empty state */
  empty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    color: 'var(--text-muted)',
    textAlign: 'center',
    gap: 8,
  } satisfies CSSProperties,

  emptyTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: 'var(--text-secondary)',
  } satisfies CSSProperties,

  emptyDesc: {
    fontSize: 14,
    color: 'var(--text-muted)',
    maxWidth: 400,
  } satisfies CSSProperties,

  /* Add friend form */
  addSection: {
    padding: '20px 30px',
    borderBottom: '1px solid var(--border-subtle)',
    flexShrink: 0,
  } satisfies CSSProperties,

  addTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: 'var(--text-header-primary)',
    textTransform: 'uppercase',
    marginBottom: 8,
  } satisfies CSSProperties,

  addDesc: {
    fontSize: 14,
    color: 'var(--text-secondary)',
    marginBottom: 16,
  } satisfies CSSProperties,

  addInputRow: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'var(--bg-input)',
    borderRadius: 8,
    padding: '4px 4px 4px 16px',
    border: '1px solid var(--border-subtle)',
    transition: 'border-color .2s',
  } satisfies CSSProperties,

  addInput: {
    flex: 1,
    border: 'none',
    backgroundColor: 'transparent',
    color: 'var(--text-primary)',
    fontSize: 15,
    outline: 'none',
    padding: '8px 0',
  } satisfies CSSProperties,

  addBtn: (disabled: boolean): CSSProperties => ({
    padding: '8px 20px',
    borderRadius: 4,
    border: 'none',
    backgroundColor: disabled ? 'var(--accent-primary)' : 'var(--accent-primary)',
    color: '#fff',
    fontSize: 13,
    fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: 'opacity .15s, background-color .15s',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  }),

  statusDot: (color: string): CSSProperties => ({
    width: 10,
    height: 10,
    borderRadius: '50%',
    backgroundColor: color,
    border: '2px solid var(--bg-primary)',
    position: 'absolute',
    bottom: -1,
    right: -1,
  }),

  avatarWrap: {
    position: 'relative',
    flexShrink: 0,
  } satisfies CSSProperties,

  feedback: (success: boolean): CSSProperties => ({
    fontSize: 13,
    fontWeight: 500,
    marginTop: 8,
    color: success ? 'var(--text-success)' : 'var(--text-danger)',
  }),
}

const hoverStyles = `
  .frp-tab:hover { background-color: var(--bg-modifier-hover); color: var(--text-interactive-hover) !important; }
  .frp-tab-active:hover { background-color: var(--bg-modifier-selected); color: var(--text-interactive-active) !important; }
  .frp-add-btn:hover { opacity: 0.85; }
  .frp-add-btn-active:hover { opacity: 1; }
`

export function FriendRequestPanel({
  requestUsername,
  onRequestUsernameChange,
  onSendRequest,
  incomingRequests,
  onAcceptRequest,
  onDeclineRequest,
  outgoingRequests,
  onCancelOutgoingRequest,
  friends,
  onStartDm,
  onRemoveFriend,
  guildInvites,
  onAcceptGuildInvite,
  onDeclineGuildInvite,
  className,
}: FriendRequestPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null)
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [addFocused, setAddFocused] = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)

  const pendingCount = incomingRequests.length + outgoingRequests.length + (guildInvites?.length ?? 0)

  /* filtered data */
  const sq = searchQuery.toLowerCase().trim()

  const filteredFriends = useMemo(
    () => (sq ? friends.filter((f) => f.username.toLowerCase().includes(sq)) : friends),
    [friends, sq],
  )

  const filteredIncoming = useMemo(
    () => (sq ? incomingRequests.filter((r) => r.username.toLowerCase().includes(sq)) : incomingRequests),
    [incomingRequests, sq],
  )

  const filteredOutgoing = useMemo(
    () => (sq ? outgoingRequests.filter((r) => r.username.toLowerCase().includes(sq)) : outgoingRequests),
    [outgoingRequests, sq],
  )

  const handleSendRequest = useCallback((event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const username = requestUsername.trim()
    if (!username) return
    onSendRequest(username)
    setFeedbackMsg({ text: `Friend request sent to ${username}.`, ok: true })
  }, [requestUsername, onSendRequest])

  const onlineFriends = useMemo(
    () => filteredFriends.filter((f) => {
      const st = f.status?.toLowerCase()
      return st === 'online' || st === 'idle' || st === 'away' || st === 'do not disturb' || st === 'dnd'
    }),
    [filteredFriends],
  )

  /* ---- Render helpers ---- */

  function renderFriendRow(friend: FriendListItem) {
    const key = `f-${friend.id}`
    const hovered = hoveredRow === key
    return (
      <div
        key={key}
        style={{
          ...s.row,
          backgroundColor: hovered ? 'var(--bg-modifier-hover)' : 'transparent',
          borderRadius: hovered ? 8 : 0,
        }}
        onMouseEnter={() => setHoveredRow(key)}
        onMouseLeave={() => setHoveredRow(null)}
      >
        <div style={s.avatarWrap}>
          <Avatar username={friend.username} size={32} />
          <div style={s.statusDot(statusDotColor(friend.status))} />
        </div>
        <div style={s.rowInfo}>
          <span style={s.rowName}>{friend.username}</span>
          <span style={s.rowSub}>{friend.status || 'Offline'}</span>
        </div>
        <div style={{ ...s.rowActions, opacity: hovered ? 1 : 0 }}>
          <button
            type="button"
            style={{
              ...s.iconBtn(),
              color: hoveredBtn === `msg-${key}` ? 'var(--text-interactive-active)' : undefined,
              backgroundColor: hoveredBtn === `msg-${key}` ? 'var(--bg-modifier-selected)' : undefined,
            }}
            title="Message"
            onClick={() => onStartDm(friend.id)}
            onMouseEnter={() => setHoveredBtn(`msg-${key}`)}
            onMouseLeave={() => setHoveredBtn(null)}
          >
            <MessageIcon />
          </button>
          <button
            type="button"
            style={{
              ...s.iconBtn(),
              color: hoveredBtn === `rm-${key}` ? 'var(--text-danger)' : undefined,
              backgroundColor: hoveredBtn === `rm-${key}` ? 'var(--bg-modifier-selected)' : undefined,
            }}
            title="Remove Friend"
            onClick={() => onRemoveFriend(friend.id)}
            onMouseEnter={() => setHoveredBtn(`rm-${key}`)}
            onMouseLeave={() => setHoveredBtn(null)}
          >
            <RemoveIcon />
          </button>
        </div>
      </div>
    )
  }

  function renderIncomingRow(req: IncomingFriendRequestItem) {
    const key = `in-${req.id}`
    const hovered = hoveredRow === key
    return (
      <div
        key={key}
        style={{
          ...s.row,
          backgroundColor: hovered ? 'var(--bg-modifier-hover)' : 'transparent',
          borderRadius: hovered ? 8 : 0,
        }}
        onMouseEnter={() => setHoveredRow(key)}
        onMouseLeave={() => setHoveredRow(null)}
      >
        <Avatar username={req.username} size={32} />
        <div style={s.rowInfo}>
          <span style={s.rowName}>{req.username}</span>
          <span style={s.rowSub}>Incoming Friend Request</span>
        </div>
        <div style={s.rowActions}>
          <button
            type="button"
            style={{
              ...s.iconBtn(),
              color: hoveredBtn === `acc-${key}` ? 'var(--text-success)' : undefined,
              backgroundColor: hoveredBtn === `acc-${key}` ? 'var(--bg-modifier-selected)' : undefined,
            }}
            title="Accept"
            onClick={() => onAcceptRequest(req.id)}
            onMouseEnter={() => setHoveredBtn(`acc-${key}`)}
            onMouseLeave={() => setHoveredBtn(null)}
          >
            <CheckIcon />
          </button>
          <button
            type="button"
            style={{
              ...s.iconBtn(),
              color: hoveredBtn === `dec-${key}` ? 'var(--text-danger)' : undefined,
              backgroundColor: hoveredBtn === `dec-${key}` ? 'var(--bg-modifier-selected)' : undefined,
            }}
            title="Decline"
            onClick={() => onDeclineRequest(req.id)}
            onMouseEnter={() => setHoveredBtn(`dec-${key}`)}
            onMouseLeave={() => setHoveredBtn(null)}
          >
            <CloseIcon />
          </button>
        </div>
      </div>
    )
  }

  function renderOutgoingRow(req: OutgoingFriendRequestItem) {
    const key = `out-${req.id}`
    const hovered = hoveredRow === key
    return (
      <div
        key={key}
        style={{
          ...s.row,
          backgroundColor: hovered ? 'var(--bg-modifier-hover)' : 'transparent',
          borderRadius: hovered ? 8 : 0,
        }}
        onMouseEnter={() => setHoveredRow(key)}
        onMouseLeave={() => setHoveredRow(null)}
      >
        <Avatar username={req.username} size={32} />
        <div style={s.rowInfo}>
          <span style={s.rowName}>{req.username}</span>
          <span style={s.rowSub}>Outgoing Friend Request</span>
        </div>
        <div style={s.rowActions}>
          <button
            type="button"
            style={{
              ...s.iconBtn(),
              color: hoveredBtn === `can-${key}` ? 'var(--text-danger)' : undefined,
              backgroundColor: hoveredBtn === `can-${key}` ? 'var(--bg-modifier-selected)' : undefined,
            }}
            title="Cancel"
            onClick={() => onCancelOutgoingRequest(req.id)}
            onMouseEnter={() => setHoveredBtn(`can-${key}`)}
            onMouseLeave={() => setHoveredBtn(null)}
          >
            <CloseIcon />
          </button>
        </div>
      </div>
    )
  }

  function renderEmpty(title: string, desc: string) {
    return (
      <div style={s.empty}>
        <div style={s.emptyTitle}>{title}</div>
        <div style={s.emptyDesc}>{desc}</div>
      </div>
    )
  }

  /* ---- Tab content ---- */

  function renderOnlineTab() {
    return (
      <>
        <div style={s.sectionHeader}>ONLINE — {onlineFriends.length}</div>
        {onlineFriends.length === 0
          ? renderEmpty('No one is online', "It's quiet right now… but not for long.")
          : onlineFriends.map(renderFriendRow)}
      </>
    )
  }

  function renderAllTab() {
    return (
      <>
        <div style={s.sectionHeader}>ALL FRIENDS — {filteredFriends.length}</div>
        {filteredFriends.length === 0
          ? renderEmpty('No friends found', searchQuery ? 'No friends match your search.' : "You haven't added any friends yet. Click Add Friend to get started!")
          : filteredFriends.map(renderFriendRow)}
      </>
    )
  }

  function renderGuildInviteRow(invite: GuildInviteItem) {
    const key = `gi-${invite.id}`
    const hovered = hoveredRow === key
    return (
      <div
        key={key}
        style={{
          ...s.row,
          backgroundColor: hovered ? 'var(--bg-modifier-hover)' : 'transparent',
          borderRadius: hovered ? 8 : 0,
        }}
        onMouseEnter={() => setHoveredRow(key)}
        onMouseLeave={() => setHoveredRow(null)}
      >
        <Avatar username={invite.inviterName} size={32} />
        <div style={s.rowInfo}>
          <span style={s.rowName}>Server invite from {invite.inviterName}</span>
          <span style={s.rowSub}>Server Invitation</span>
        </div>
        <div style={s.rowActions}>
          <button
            type="button"
            style={{
              ...s.iconBtn(),
              color: hoveredBtn === `acc-${key}` ? 'var(--text-success)' : undefined,
              backgroundColor: hoveredBtn === `acc-${key}` ? 'var(--bg-modifier-selected)' : undefined,
            }}
            title="Accept"
            onClick={() => onAcceptGuildInvite?.(invite.id)}
            onMouseEnter={() => setHoveredBtn(`acc-${key}`)}
            onMouseLeave={() => setHoveredBtn(null)}
          >
            <CheckIcon />
          </button>
          <button
            type="button"
            style={{
              ...s.iconBtn(),
              color: hoveredBtn === `dec-${key}` ? 'var(--text-danger)' : undefined,
              backgroundColor: hoveredBtn === `dec-${key}` ? 'var(--bg-modifier-selected)' : undefined,
            }}
            title="Decline"
            onClick={() => onDeclineGuildInvite?.(invite.id)}
            onMouseEnter={() => setHoveredBtn(`dec-${key}`)}
            onMouseLeave={() => setHoveredBtn(null)}
          >
            <CloseIcon />
          </button>
        </div>
      </div>
    )
  }

  function renderPendingTab() {
    const hasGuildInvites = (guildInvites?.length ?? 0) > 0
    const hasAny = filteredIncoming.length > 0 || filteredOutgoing.length > 0 || hasGuildInvites
    return (
      <>
        {hasGuildInvites && (
          <>
            <div style={s.sectionHeader}>SERVER INVITES — {guildInvites!.length}</div>
            {guildInvites!.map(renderGuildInviteRow)}
          </>
        )}
        {filteredIncoming.length > 0 && (
          <>
            <div style={s.sectionHeader}>INCOMING — {filteredIncoming.length}</div>
            {filteredIncoming.map(renderIncomingRow)}
          </>
        )}
        {filteredOutgoing.length > 0 && (
          <>
            <div style={s.sectionHeader}>OUTGOING — {filteredOutgoing.length}</div>
            {filteredOutgoing.map(renderOutgoingRow)}
          </>
        )}
        {!hasAny && renderEmpty('No pending requests', "You don't have any pending friend requests right now.")}
      </>
    )
  }

  function renderAddFriendTab() {
    return (
      <div style={s.addSection}>
        <div style={s.addTitle}>Add Friend</div>
        <div style={s.addDesc}>You can add friends with their username.</div>
        <form onSubmit={handleSendRequest}>
          <div
            style={{
              ...s.addInputRow,
              borderColor: addFocused ? 'var(--accent-primary)' : 'var(--border-subtle)',
            }}
          >
            <input
              style={s.addInput}
              value={requestUsername}
              onChange={(e) => {
                onRequestUsernameChange(e.target.value)
                setFeedbackMsg(null)
              }}
              onFocus={() => setAddFocused(true)}
              onBlur={() => setAddFocused(false)}
              placeholder="You can add friends with their username."
              aria-label="Friend username"
            />
            <button
              type="submit"
              disabled={!requestUsername.trim()}
              style={s.addBtn(!requestUsername.trim())}
            >
              Send Friend Request
            </button>
          </div>
          {feedbackMsg && <div style={s.feedback(feedbackMsg.ok)}>{feedbackMsg.text}</div>}
        </form>
      </div>
    )
  }

  /* ---- Main render ---- */

  const showSearch = activeTab !== 'add'

  return (
    <aside
      className={className ?? ''}
      style={s.root}
      aria-label="Friends"
    >
      <style>{hoverStyles}</style>
      {/* ---- Tab bar ---- */}
      <div style={s.toolbar}>
        <span style={s.toolbarTitle}>
          {/* Friends icon */}
          <Users width={24} height={24} />
          Friends
        </span>
        <div style={s.divider} />

        {(['online', 'all', 'pending'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            className={activeTab === tab ? 'frp-tab-active' : 'frp-tab'}
            style={s.tab(activeTab === tab)}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'online' && 'Online'}
            {tab === 'all' && 'All'}
            {tab === 'pending' && (
              <>
                Pending
                {pendingCount > 0 && <span style={s.tabBadge}>{pendingCount}</span>}
              </>
            )}
          </button>
        ))}

        <button
          type="button"
          className={activeTab === 'add' ? 'frp-add-btn-active' : 'frp-add-btn'}
          style={s.addFriendTab(activeTab === 'add')}
          onClick={() => setActiveTab('add')}
        >
          Add Friend
        </button>
      </div>

      {/* ---- Add Friend form (rendered at top when that tab is active) ---- */}
      {activeTab === 'add' && renderAddFriendTab()}

      {/* ---- Search bar ---- */}
      {showSearch && (
        <div style={s.searchWrap}>
          <div style={{ position: 'relative' }}>
            <span style={s.searchIconPos}>
              <SearchIcon />
            </span>
            <input
              style={{
                ...s.searchInput,
                boxShadow: searchFocused ? '0 0 0 2px var(--accent-primary, #5865f2)' : 'none',
              }}
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              aria-label="Search friends"
            />
          </div>
        </div>
      )}

      {/* ---- List content ---- */}
      <div style={s.listArea}>
        {activeTab === 'online' && renderOnlineTab()}
        {activeTab === 'all' && renderAllTab()}
        {activeTab === 'pending' && renderPendingTab()}
        {activeTab === 'add' &&
          renderEmpty('Wumpus is waiting…', 'You can add friends above to start chatting!')}
      </div>
    </aside>
  )
}