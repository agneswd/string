import { type FormEvent, useState, useMemo, useCallback } from 'react'
import { Users, Search } from 'lucide-react'
import { useLayoutMode } from '../../hooks/useLayoutMode'
import { buildPanelStyles, buildHoverCSS } from './friends/FriendsStyles'
import { FriendRow, IncomingRow, OutgoingRow, GuildInviteRow, EmptyState } from './friends/PanelRows'

// Re-export types for backward compatibility
export type {
  FriendRequestItemId,
  FriendUserId,
  IncomingFriendRequestItem,
  OutgoingFriendRequestItem,
  FriendListItem,
  GuildInviteItem,
  FriendRequestPanelProps,
  Tab,
} from './friends/types'

import type { FriendRequestPanelProps, Tab } from './friends/types'

export function FriendRequestPanel({
  layoutMode: layoutModeProp,
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
  const { layoutMode: hookLayoutMode } = useLayoutMode()
  const layoutMode = layoutModeProp ?? hookLayoutMode
  const s = useMemo(() => buildPanelStyles(layoutMode), [layoutMode])
  const hoverCSS = useMemo(() => buildHoverCSS(layoutMode), [layoutMode])

  const [activeTab, setActiveTab] = useState<Tab>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null)
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; ok: boolean } | null>(null)
  const [addFocused, setAddFocused] = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)

  const pendingCount = incomingRequests.length + outgoingRequests.length + (guildInvites?.length ?? 0)

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
  const onlineFriends = useMemo(
    () => filteredFriends.filter((f) => {
      const st = f.status?.toLowerCase()
      return st === 'online' || st === 'idle' || st === 'away' || st === 'do not disturb' || st === 'dnd'
    }),
    [filteredFriends],
  )

  const handleSendRequest = useCallback((event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const username = requestUsername.trim()
    if (!username) return
    onSendRequest(username)
    setFeedbackMsg({ text: `Friend request sent to ${username}.`, ok: true })
  }, [requestUsername, onSendRequest])

  const rowProps = { styles: s, layoutMode, hoveredRow, hoveredBtn, setHoveredRow, setHoveredBtn }

  // ── Tab content renderers ─────────────────────────────────────────────────

  function renderOnlineTab() {
    const isString = layoutMode === 'string'
    return (
      <>
        <div style={s.sectionHeader}>{isString ? `online — ${onlineFriends.length}` : `ONLINE — ${onlineFriends.length}`}</div>
        {onlineFriends.length === 0
          ? <EmptyState title={isString ? 'no one online' : 'No One Online'} desc="It's quiet right now." styles={s} />
          : onlineFriends.map((f) => (
              <FriendRow key={`f-${f.id}`} friend={f} {...rowProps} onStartDm={onStartDm} onRemoveFriend={onRemoveFriend} />
            ))}
      </>
    )
  }

  function renderAllTab() {
    const isString = layoutMode === 'string'
    return (
      <>
        <div style={s.sectionHeader}>{isString ? `all friends — ${filteredFriends.length}` : `ALL FRIENDS — ${filteredFriends.length}`}</div>
        {filteredFriends.length === 0
          ? <EmptyState
              title={isString ? 'no friends found' : 'No Friends Found'}
              desc={searchQuery ? 'No friends match your search.' : "You haven't added any friends yet."}
              styles={s}
            />
          : filteredFriends.map((f) => (
              <FriendRow key={`f-${f.id}`} friend={f} {...rowProps} onStartDm={onStartDm} onRemoveFriend={onRemoveFriend} />
            ))}
      </>
    )
  }

  function renderPendingTab() {
    const isString = layoutMode === 'string'
    const hasGuildInvites = (guildInvites?.length ?? 0) > 0
    const hasAny = filteredIncoming.length > 0 || filteredOutgoing.length > 0 || hasGuildInvites
    return (
      <>
        {hasGuildInvites && (
          <>
            <div style={s.sectionHeader}>{isString ? `server invites — ${guildInvites!.length}` : `SERVER INVITES — ${guildInvites!.length}`}</div>
            {guildInvites!.map((inv) => (
              <GuildInviteRow key={`gi-${inv.id}`} invite={inv} {...rowProps} onAccept={onAcceptGuildInvite} onDecline={onDeclineGuildInvite} />
            ))}
          </>
        )}
        {filteredIncoming.length > 0 && (
          <>
            <div style={s.sectionHeader}>{isString ? `incoming — ${filteredIncoming.length}` : `INCOMING — ${filteredIncoming.length}`}</div>
            {filteredIncoming.map((r) => (
              <IncomingRow key={`in-${r.id}`} req={r} {...rowProps} onAccept={onAcceptRequest} onDecline={onDeclineRequest} />
            ))}
          </>
        )}
        {filteredOutgoing.length > 0 && (
          <>
            <div style={s.sectionHeader}>{isString ? `outgoing — ${filteredOutgoing.length}` : `OUTGOING — ${filteredOutgoing.length}`}</div>
            {filteredOutgoing.map((r) => (
              <OutgoingRow key={`out-${r.id}`} req={r} {...rowProps} onCancel={onCancelOutgoingRequest} />
            ))}
          </>
        )}
        {!hasAny && <EmptyState title={layoutMode === 'string' ? 'no pending requests' : 'No Pending Requests'} desc="You have no pending friend requests." styles={s} />}
      </>
    )
  }

  function renderAddFriendTab() {
    const isString = layoutMode === 'string'
    return (
      <div style={s.addSection}>
        <div style={s.addTitle}>{isString ? 'add friend' : 'Add Friend'}</div>
        <div style={s.addDesc}>You can add friends with their username.</div>
        <form onSubmit={handleSendRequest}>
          <div style={s.addInputRow(addFocused)}>
            <input
              style={s.addInput}
              value={requestUsername}
              onChange={(e) => {
                onRequestUsernameChange(e.target.value)
                setFeedbackMsg(null)
              }}
              onFocus={() => setAddFocused(true)}
              onBlur={() => setAddFocused(false)}
              placeholder="Username"
              aria-label="Friend username"
            />
            <button
              type="submit"
              disabled={!requestUsername.trim()}
              style={s.addBtn(!requestUsername.trim())}
            >
              Send Request
            </button>
          </div>
          {feedbackMsg && <div style={s.feedback(feedbackMsg.ok)}>{feedbackMsg.text}</div>}
        </form>
      </div>
    )
  }

  // ── Main render ───────────────────────────────────────────────────────────

  const showSearch = activeTab !== 'add'

  return (
    <aside className={className ?? ''} style={s.root} aria-label="Friends">
      <style>{hoverCSS}</style>

      {/* Tab bar */}
      <div style={s.toolbar}>
        <span style={s.toolbarTitle}>
          <Users width={layoutMode === 'string' ? 16 : 24} height={layoutMode === 'string' ? 16 : 24} aria-hidden="true" />
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

      {/* Add friend form */}
      {activeTab === 'add' && renderAddFriendTab()}

      {/* Search bar */}
      {showSearch && (
        <div style={s.searchWrap}>
          <div style={{ position: 'relative' }}>
            <span style={s.searchIconPos}>
              <Search width={16} height={16} style={{ opacity: 0.4 }} />
            </span>
            <input
              style={searchFocused ? s.searchInputFocused : s.searchInput}
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

      {/* List */}
      <div style={s.listArea}>
        {activeTab === 'online' && renderOnlineTab()}
        {activeTab === 'all' && renderAllTab()}
        {activeTab === 'pending' && renderPendingTab()}
      </div>
    </aside>
  )
}
