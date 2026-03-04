import React, { type FormEvent, useEffect, useRef, useState, useMemo, useCallback, type CSSProperties } from 'react'
import { Phone, Trash2, Pencil, Check, X } from 'lucide-react'
import { ReactionBar, QuickReactBar, type ReactionBarItem } from './ReactionBar'
import { getAvatarColor, getInitial } from '../lib/avatarUtils'

export interface ChatMessageItem {
  id: string | number
  authorName: string
  content: string
  timestamp: string
  authorId?: string | number
  profileColor?: string
}

export interface ChatViewPaneProps {
  channelName?: string
  messages: ChatMessageItem[]
  composerValue: string
  onComposerChange: (value: string) => void
  onSend: (message: string) => void
  getReactionsForMessage?: (messageId: ChatMessageItem['id']) => ReadonlyArray<ReactionBarItem>
  onToggleReaction?: (messageId: ChatMessageItem['id'], emoji: string) => void
  currentUserId?: string | number
  composerPlaceholder?: string
  getAvatarUrl?: (authorId: string) => string | undefined
  className?: string
  callActive?: boolean
  onViewProfile?: (user: { displayName: string; username: string }, x: number, y: number) => void
  onDeleteMessage?: (messageId: ChatMessageItem['id']) => void
  onEditMessage?: (messageId: ChatMessageItem['id'], newContent: string) => void
  isDm?: boolean
  avatarUrl?: string
  profileColor?: string
}



/* ── styles object ── */
const S: Record<string, CSSProperties> = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minWidth: 0,
    minHeight: 0,
    overflow: 'hidden',
  },
  header: {
    height: 48,
    minHeight: 48,
    padding: '0 16px',
    display: 'flex',
    alignItems: 'center',
    borderBottom: '1px solid var(--border-subtle)',
    background: 'var(--bg-panel)',
    fontWeight: 600,
    fontSize: 16,
    color: 'var(--text-primary)',
    zIndex: 1,
    boxSizing: 'border-box',
  },
  hashIcon: {
    color: 'var(--text-muted)',
    marginRight: 6,
    fontSize: 20,
    fontWeight: 700,
  },
  messageList: {
    flex: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    padding: '0 0 8px 0',
    margin: 0,
    listStyle: 'none',
    minHeight: 0,
  },
  messageGrouped: {
    padding: '2px 48px 2px 72px',
    position: 'relative',
    transition: 'background-color 0.1s',
    cursor: 'default',
  },
  messageFirst: {
    padding: '16px 48px 2px 72px',
    marginTop: 0,
    position: 'relative',
    transition: 'background-color 0.1s',
    cursor: 'default',
  },
  avatar: {
    position: 'absolute',
    left: 16,
    top: 16,
    width: 40,
    height: 40,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontWeight: 600,
    fontSize: 16,
    userSelect: 'none',
    flexShrink: 0,
  },
  metaRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 8,
    lineHeight: '1.375rem',
  },
  authorName: {
    fontWeight: 600,
    fontSize: '0.9375rem',
    cursor: 'pointer',
  },
  timestamp: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    fontWeight: 400,
    marginLeft: 4,
  },
  timestampInline: {
    position: 'absolute',
    left: 0,
    width: 72,
    textAlign: 'center',
    fontSize: '0.6875rem',
    color: 'transparent',
    lineHeight: '1.375rem',
    userSelect: 'none',
  },
  content: {
    margin: 0,
    padding: 0,
    fontSize: '0.9375rem',
    lineHeight: '1.375rem',
    color: 'var(--text-primary)',
    wordWrap: 'break-word',
    whiteSpace: 'pre-wrap',
  },
  composerWrap: {
    padding: '0 16px 24px 16px',
    flexShrink: 0,
    boxSizing: 'border-box',
  },
  composerBox: {
    display: 'flex',
    alignItems: 'center',
    background: 'var(--bg-input)',
    borderRadius: 8,
    padding: '0 16px',
    minHeight: 44,
    boxSizing: 'border-box',
  },
  composerInput: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: 'var(--text-primary)',
    fontSize: '0.9375rem',
    padding: '11px 0',
    lineHeight: '1.375rem',
  },
  sendBtn: {
    marginLeft: 8,
    background: 'none',
    border: 'none',
    color: 'var(--accent-primary)',
    fontWeight: 600,
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: 4,
    fontSize: '0.875rem',
    opacity: 1,
    transition: 'opacity 0.15s, background 0.15s',
  },
}

// Pre-computed row style variants to avoid per-render object allocation
const S_messageGroupedHover: CSSProperties = { ...S.messageGrouped, backgroundColor: 'var(--bg-hover)' }
const S_messageFirstHover: CSSProperties = { ...S.messageFirst, backgroundColor: 'var(--bg-hover)' }
const S_timestampInlineVisible: CSSProperties = { ...S.timestampInline, color: 'var(--text-muted)' }

export const ChatViewPane = React.memo(function ChatViewPane({
  channelName,
  messages,
  composerValue,
  onComposerChange,
  onSend,
  getReactionsForMessage,
  onToggleReaction,
  currentUserId,
  composerPlaceholder,
  getAvatarUrl,
  className,
  callActive,
  onViewProfile,
  onDeleteMessage,
  onEditMessage,
  isDm,
  avatarUrl,
  profileColor,
}: ChatViewPaneProps) {
  const listRef = useRef<HTMLUListElement>(null)
  const bottomRef = useRef<HTMLLIElement>(null)
  const [hoveredId, setHoveredId] = useState<string | number | null>(null)

  /* auto-scroll to bottom when new messages arrive */
  const prevLenRef = useRef(messages.length)
  useEffect(() => {
    if (messages.length !== prevLenRef.current) {
      prevLenRef.current = messages.length
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages.length])

  const handleSubmit = useCallback((event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const msg = composerValue.trim()
    if (!msg) return
    onSend(msg)
  }, [composerValue, onSend])

  const displayName = channelName ?? 'general'

  const shouldRenderReactions = getReactionsForMessage !== undefined || onToggleReaction !== undefined

  /* ── Pre-compute message grouping to avoid per-render work ── */
  const messageRows = useMemo(() => {
    return messages.map((message, idx) => {
      const prev = idx > 0 ? messages[idx - 1] : null
      const isGrouped = prev !== null && prev.authorId === message.authorId
      return (
        <ChatMessageRow
          key={String(message.id)}
          message={message}
          isGrouped={isGrouped}
          isOwnMessage={currentUserId !== undefined && String(message.authorId) === String(currentUserId)}
          hoveredId={hoveredId}
          onHover={setHoveredId}
          getReactionsForMessage={getReactionsForMessage}
          onToggleReaction={onToggleReaction}
          shouldRenderReactions={shouldRenderReactions}
          onViewProfile={onViewProfile}
          getAvatarUrl={getAvatarUrl}
          onDeleteMessage={onDeleteMessage}
          onEditMessage={onEditMessage}
        />
      )
    })
  }, [messages, currentUserId, hoveredId, getReactionsForMessage, onToggleReaction, shouldRenderReactions, onViewProfile, getAvatarUrl, onDeleteMessage, onEditMessage])

  const sendBtnStyle = useMemo<CSSProperties>(() => ({
    ...S.sendBtn,
    opacity: composerValue.trim() ? 1 : 0.4,
    cursor: composerValue.trim() ? 'pointer' : 'not-allowed',
  }), [composerValue])

    return (
    <section
      className={['tw-chat-view', className ?? ''].filter(Boolean).join(' ')}
      style={S.root}
      aria-label="Chat"
    >
      {/* ── Fixed header ── */}
      <header style={S.header}>
        {isDm ? (
          <>
            <div style={{
              width: 24, height: 24, borderRadius: '50%',
              backgroundColor: profileColor || '#5865f2',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 12, fontWeight: 600, marginRight: 8, flexShrink: 0,
              overflow: 'hidden',
            }}>
              {avatarUrl ? (
                <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                (displayName || '?')[0].toUpperCase()
              )}
            </div>
            <span>{displayName}</span>
          </>
        ) : (
          <>
            <span style={S.hashIcon}>#</span>
            <span>{displayName}</span>
          </>
        )}
      </header>

      {/* ── Call active banner ── */}
      {callActive && (
        <div style={{
          padding: '10px 16px', background: '#248046', color: '#fff',
          display: 'flex', alignItems: 'center', gap: 8, fontSize: 14,
          fontWeight: 500,
        }}>
          <Phone style={{ width: 18, height: 18 }} />
          Voice call in progress
        </div>
      )}

      {/* ── Scrollable messages ── */}
      <ul
        ref={listRef}
        style={S.messageList}
        aria-live="polite"
      >
        <li style={{ flex: 1 }} role="presentation" aria-hidden="true" />
        {messageRows}
        <li ref={bottomRef} role="presentation" aria-hidden="true" />
      </ul>

      {/* ── Composer ── */}
      <form style={S.composerWrap} onSubmit={handleSubmit}>
        <div className="chat-composer-box" style={S.composerBox}>
          <input
            style={S.composerInput}
            value={composerValue}
            onChange={(e) => onComposerChange(e.target.value)}
            placeholder={composerPlaceholder ?? `Message #${displayName}`}
            aria-label="Message composer"
          />
          <button
            type="submit"
            disabled={!composerValue.trim()}
            style={sendBtnStyle}
          >
            Send
          </button>
        </div>
      </form>
    </section>
  )
})

/* ── Extracted message row component ── */
interface ChatMessageRowProps {
  message: ChatMessageItem
  isGrouped: boolean
  isOwnMessage: boolean
  hoveredId: string | number | null
  onHover: (id: string | number | null) => void
  getReactionsForMessage?: (messageId: ChatMessageItem['id']) => ReadonlyArray<ReactionBarItem>
  onToggleReaction?: (messageId: ChatMessageItem['id'], emoji: string) => void
  shouldRenderReactions: boolean
  onViewProfile?: (user: { displayName: string; username: string }, x: number, y: number) => void
  getAvatarUrl?: (authorId: string) => string | undefined
  onDeleteMessage?: (messageId: ChatMessageItem['id']) => void
  onEditMessage?: (messageId: ChatMessageItem['id'], newContent: string) => void
}

const actionBtnStyle: CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: 'var(--text-muted)',
  cursor: 'pointer',
  padding: 4,
  borderRadius: 4,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

const ChatMessageRow = React.memo(function ChatMessageRow({
  message,
  isGrouped,
  isOwnMessage,
  hoveredId,
  onHover,
  getReactionsForMessage,
  onToggleReaction,
  shouldRenderReactions,
  onViewProfile,
  getAvatarUrl,
  onDeleteMessage,
  onEditMessage,
}: ChatMessageRowProps) {
  const hovered = hoveredId === message.id
  const hashColor = getAvatarColor(message.authorName)
  const color = message.profileColor || hashColor
  const reactions = getReactionsForMessage?.(message.id) ?? []
  const avatarUrl = message.authorId ? getAvatarUrl?.(String(message.authorId)) : undefined
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState('')

  const rowStyle = hovered
    ? (isGrouped ? S_messageGroupedHover : S_messageFirstHover)
    : (isGrouped ? S.messageGrouped : S.messageFirst)

  const avatarStyle = useMemo<CSSProperties>(() => ({ ...S.avatar, backgroundColor: color }), [color])
  const authorStyle = useMemo<CSSProperties>(() => ({ ...S.authorName, color }), [color])

  const handleToggle = useCallback((emoji: string) => {
    onToggleReaction?.(message.id, emoji)
  }, [onToggleReaction, message.id])

  const handleAvatarContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    onViewProfile?.({ displayName: message.authorName, username: message.authorName }, e.clientX, e.clientY)
  }, [onViewProfile, message.authorName])

  return (
    <li
      style={rowStyle}
      onMouseEnter={() => onHover(message.id)}
      onMouseLeave={() => onHover(null)}
      data-own={isOwnMessage || undefined}
    >
      {isGrouped && (
        <span
          style={hovered ? S_timestampInlineVisible : S.timestampInline}
          aria-hidden
        >
          {message.timestamp}
        </span>
      )}

      {!isGrouped && (
        <>
          <div style={avatarStyle} onContextMenu={handleAvatarContextMenu}>
            {avatarUrl ? (
              <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              getInitial(message.authorName)
            )}
          </div>
          <div style={S.metaRow}>
            <span style={authorStyle} onContextMenu={handleAvatarContextMenu}>{message.authorName}</span>
            <time style={S.timestamp}>{message.timestamp}</time>
          </div>
        </>
      )}

      {isEditing ? (
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <input
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            autoFocus
            style={{
              flex: 1,
              background: 'var(--bg-input)',
              border: '1px solid var(--accent-primary)',
              borderRadius: 4,
              color: 'var(--text-primary)',
              padding: '4px 8px',
              fontSize: '0.9375rem',
              outline: 'none',
            }}
            onKeyDown={e => {
              if (e.key === 'Enter' && editValue.trim()) {
                onEditMessage?.(message.id, editValue.trim())
                setIsEditing(false)
              }
              if (e.key === 'Escape') setIsEditing(false)
            }}
          />
          <button type="button" onClick={() => { if (editValue.trim()) { onEditMessage?.(message.id, editValue.trim()); setIsEditing(false) } }} style={actionBtnStyle} title="Save" aria-label="Save edit">
            <Check size={16} />
          </button>
          <button type="button" onClick={() => setIsEditing(false)} style={actionBtnStyle} title="Cancel" aria-label="Cancel edit">
            <X size={16} />
          </button>
        </div>
      ) : (
        <p style={S.content}>{message.content}</p>
      )}

      {hovered && (onDeleteMessage || onEditMessage) && !isEditing && (
        <div style={{
          position: 'absolute',
          top: -8,
          right: 16,
          display: 'flex',
          gap: 2,
          background: 'var(--bg-panel, #2b2d31)',
          borderRadius: 4,
          border: '1px solid var(--border-subtle)',
          padding: 2,
          zIndex: 5,
        }}>
          {isOwnMessage && onEditMessage && (
            <button type="button" onClick={() => { setEditValue(message.content); setIsEditing(true) }} style={actionBtnStyle} title="Edit" aria-label="Edit message">
              <Pencil size={16} />
            </button>
          )}
          {isOwnMessage && onDeleteMessage && (
            <button type="button" onClick={() => onDeleteMessage(message.id)} style={{...actionBtnStyle, color: '#ed4245'}} title="Delete" aria-label="Delete message">
              <Trash2 size={16} />
            </button>
          )}
        </div>
      )}

      {shouldRenderReactions && hovered && onToggleReaction && !isEditing && (
        <QuickReactBar
          onToggleReaction={handleToggle}
          disabled={!onToggleReaction}
        />
      )}

      {shouldRenderReactions && reactions.length > 0 ? (
        <ReactionBar
          reactions={reactions}
          onToggleReaction={handleToggle}
          disabled={!onToggleReaction}
        />
      ) : null}
    </li>
  )
})
