/**
 * ChatViewPane — scrollable message list + composer.
 *
 * string mode (default): minimal, flat, theme.md-compliant surfaces.
 * classic mode:          preserved original Discord-flavoured styling.
 *
 * Message row logic is extracted to ./view/ChatMessageRow to keep this
 * file under 500 LOC.
 */

import React, { type FormEvent, useEffect, useRef, useMemo, useCallback, useState, type CSSProperties } from 'react'
import { ChevronDown, Phone } from 'lucide-react'
import { type ReactionBarItem } from './ReactionBar'
import { ChatMessageRow } from './view/ChatMessageRow'
import type { LayoutMode } from '../../constants/theme'

// Re-export the shared type so consumers can still import from this file
export type { ChatMessageItem } from './types'

export interface ChatViewPaneProps {
  channelName?: string
  showHeader?: boolean
  messages: import('./types').ChatMessageItem[]
  composerValue: string
  onComposerChange: (value: string) => void
  onSend: (message: string) => void
  getReactionsForMessage?: (messageId: import('./types').ChatMessageItem['id']) => ReadonlyArray<ReactionBarItem>
  onToggleReaction?: (messageId: import('./types').ChatMessageItem['id'], emoji: string) => void
  currentUserId?: string | number
  composerPlaceholder?: string
  getAvatarUrl?: (authorId: string) => string | undefined
  className?: string
  callActive?: boolean
  onViewProfile?: (user: { displayName: string; username: string }, x: number, y: number) => void
  onDeleteMessage?: (messageId: import('./types').ChatMessageItem['id']) => void
  onEditMessage?: (messageId: import('./types').ChatMessageItem['id'], newContent: string) => void
  isDm?: boolean
  avatarUrl?: string
  profileColor?: string
  layoutMode?: LayoutMode
}

// ── Static styles (shared across modes) ─────────────────────────────────────

const S: Record<string, CSSProperties> = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minWidth: 0,
    minHeight: 0,
    overflow: 'hidden',
    position: 'relative',
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
    padding: '0 0 16px 0',
    margin: 0,
    listStyle: 'none',
    minHeight: 0,
  },
  composerWrap: {
    padding: '12px 16px 24px 16px',
    flexShrink: 0,
    boxSizing: 'border-box',
    position: 'relative',
    zIndex: 2,
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
  jumpToLatestButton: {
    position: 'absolute',
    right: 16,
    bottom: 84,
    width: 40,
    height: 40,
    padding: 0,
    borderRadius: 2,
    border: '1px solid var(--border-subtle)',
    background: 'var(--bg-panel)',
    color: 'var(--text-primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    zIndex: 50,
    boxSizing: 'border-box',
    overflow: 'visible',
    boxShadow: '0 4px 12px rgba(0,0,0,0.28)',
  },
}

// ── Main component ────────────────────────────────────────────────────────────

export const ChatViewPane = React.memo(function ChatViewPane({
  channelName,
  showHeader = true,
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
  layoutMode = 'string',
}: ChatViewPaneProps) {
  const listRef = useRef<HTMLUListElement>(null)
  const bottomRef = useRef<HTMLLIElement>(null)
  const composerInputRef = useRef<HTMLInputElement>(null)
  const [showJumpToLatest, setShowJumpToLatest] = useState(false)

  const updateJumpButtonVisibility = useCallback(() => {
    const list = listRef.current
    if (!list) {
      setShowJumpToLatest(false)
      return
    }

    const distanceFromBottom = list.scrollHeight - list.scrollTop - list.clientHeight
    setShowJumpToLatest(distanceFromBottom > 48)
  }, [])

  // Auto-scroll to bottom when new messages arrive
  const prevLastMsgId = useRef<string | number | undefined>(undefined)
  useEffect(() => {
    const msgs = messages
    const lastId = msgs?.[msgs.length - 1]?.id
    if (lastId !== prevLastMsgId.current && prevLastMsgId.current !== undefined) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
    prevLastMsgId.current = lastId
    updateJumpButtonVisibility()
  }, [messages, updateJumpButtonVisibility])

  useEffect(() => {
    const list = listRef.current
    if (!list) {
      return
    }

    updateJumpButtonVisibility()
    list.addEventListener('scroll', updateJumpButtonVisibility)

    return () => {
      list.removeEventListener('scroll', updateJumpButtonVisibility)
    }
  }, [updateJumpButtonVisibility])

  const handleJumpToLatest = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    setShowJumpToLatest(false)
  }, [])

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      const msg = composerValue.trim()
      if (!msg) return
      onSend(msg)
      requestAnimationFrame(() => {
        composerInputRef.current?.focus()
      })
    },
    [composerValue, onSend],
  )

  const displayName = channelName ?? 'general'
  const shouldRenderReactions =
    getReactionsForMessage !== undefined || onToggleReaction !== undefined

  const isString = layoutMode === 'string'

  // Mode-specific style overrides
  const composerBoxStyle = useMemo<CSSProperties>(
    () => ({
      display: 'flex',
      alignItems: 'center',
      background: 'var(--bg-input)',
      borderRadius: isString ? 3 : 10,
      padding: '0 16px',
      minHeight: 44,
      boxSizing: 'border-box' as const,
      border: '1px solid var(--border-subtle)',
      transition: 'border-color 0.15s',
      position: 'relative' as const,
      zIndex: 3,
    }),
    [isString],
  )

  const sendBtnStyle = useMemo<CSSProperties>(
    () => ({
      marginLeft: 8,
      background: 'none',
      border: 'none',
      color: 'var(--accent-primary)',
      fontWeight: 600,
      cursor: composerValue.trim() ? 'pointer' : 'not-allowed',
      padding: '4px 8px',
      borderRadius: isString ? 2 : 4,
      fontSize: '0.875rem',
      opacity: composerValue.trim() ? 1 : 0.4,
      transition: 'opacity 0.15s',
    }),
    [composerValue, isString],
  )

  // Pre-compute message rows
  const messageRows = useMemo(() => {
    return messages.map((message, idx) => {
      const prev = idx > 0 ? messages[idx - 1] : null
      const isGrouped = prev !== null && prev.authorId === message.authorId
      return (
        <ChatMessageRow
          key={String(message.id)}
          message={message}
          isGrouped={isGrouped}
          isOwnMessage={
            currentUserId !== undefined && String(message.authorId) === String(currentUserId)
          }
          getReactionsForMessage={getReactionsForMessage}
          onToggleReaction={onToggleReaction}
          shouldRenderReactions={shouldRenderReactions}
          onViewProfile={onViewProfile}
          getAvatarUrl={getAvatarUrl}
          onDeleteMessage={onDeleteMessage}
          onEditMessage={onEditMessage}
          layoutMode={layoutMode}
        />
      )
    })
  }, [
    messages,
    currentUserId,
    getReactionsForMessage,
    onToggleReaction,
    shouldRenderReactions,
    onViewProfile,
    getAvatarUrl,
    onDeleteMessage,
    onEditMessage,
    layoutMode,
  ])

  return (
    <section
      className={['tw-chat-view', className ?? ''].filter(Boolean).join(' ')}
      style={S.root}
      aria-label="Chat"
    >
      {showHeader && (
        <header style={S.header}>
          {isDm ? (
            <>
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: isString ? '3px' : '50%',
                  backgroundColor: profileColor || 'var(--accent-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 600,
                  marginRight: 8,
                  flexShrink: 0,
                  overflow: 'hidden',
                }}
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt=""
                    style={{ width: '100%', height: '100%', borderRadius: isString ? '3px' : '50%', objectFit: 'cover' }}
                  />
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
      )}

      {callActive && (
        <div
          style={{
            padding: '8px 16px',
            background: 'var(--bg-success-subtle)',
            borderBottom: '1px solid var(--border-success)',
            color: 'var(--text-success)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          <Phone style={{ width: 16, height: 16 }} />
          Voice call in progress
        </div>
      )}

      <ul ref={listRef} style={S.messageList} aria-live="polite">
        <li style={{ flex: 1 }} role="presentation" aria-hidden="true" />
        {messageRows}
        <li ref={bottomRef} role="presentation" aria-hidden="true" />
      </ul>

      {showJumpToLatest && (
        <button
          type="button"
          aria-label="Jump to latest message"
          title="Jump to latest"
          onClick={handleJumpToLatest}
          style={S.jumpToLatestButton}
        >
          <ChevronDown size={24} strokeWidth={2.5} aria-hidden="true" style={{ display: 'block' }} />
        </button>
      )}

      <form style={S.composerWrap} onSubmit={handleSubmit}>
        <div className="chat-composer-box" style={composerBoxStyle}>
          <input
            ref={composerInputRef}
            style={S.composerInput}
            value={composerValue}
            onChange={(e) => onComposerChange(e.target.value)}
            placeholder={composerPlaceholder ?? `Message #${displayName}`}
            aria-label="Message composer"
          />
          <button
            type="submit"
            disabled={!composerValue.trim()}
            onMouseDown={(event) => event.preventDefault()}
            onPointerDown={(event) => event.preventDefault()}
            style={sendBtnStyle}
          >
            Send
          </button>
        </div>
      </form>
    </section>
  )
})

