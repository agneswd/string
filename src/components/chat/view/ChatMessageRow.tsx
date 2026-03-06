/**
 * ChatMessageRow — renders a single grouped or first-in-thread chat message.
 * Extracted from ChatViewPane to keep file size under 500 LOC.
 */

import React, { useState, useMemo, useCallback, type CSSProperties } from 'react'
import { Trash2, Pencil, Check, X, Copy } from 'lucide-react'
import { ReactionBar, QuickReactBar, type ReactionBarItem } from '../ReactionBar'
import { getAvatarColor, getInitial } from '../../../lib/avatarUtils'
import { ContextMenu, type ContextMenuItem } from '../../ui/ContextMenu'
import type { ChatMessageItem } from '../types'
import type { LayoutMode } from '../../../constants/theme'

// ── Types ────────────────────────────────────────────────────────────────────

export interface ChatMessageRowProps {
  message: ChatMessageItem
  isGrouped: boolean
  isOwnMessage: boolean
  getReactionsForMessage?: (messageId: ChatMessageItem['id']) => ReadonlyArray<ReactionBarItem>
  onToggleReaction?: (messageId: ChatMessageItem['id'], emoji: string) => void
  shouldRenderReactions: boolean
  onViewProfile?: (user: { displayName: string; username: string }, x: number, y: number) => void
  getAvatarUrl?: (authorId: string) => string | undefined
  onDeleteMessage?: (messageId: ChatMessageItem['id']) => void
  onEditMessage?: (messageId: ChatMessageItem['id'], newContent: string) => void
  layoutMode?: LayoutMode
}

// ── Static styles ────────────────────────────────────────────────────────────

const S_row: Record<string, CSSProperties> = {
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
  systemRow: {
    padding: '8px 16px',
    display: 'flex',
    justifyContent: 'center',
  },
  systemTag: {
    color: 'var(--text-secondary)',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
    fontSize: '0.625rem',
  },
  systemTimestamp: {
    color: 'var(--text-muted)',
    opacity: 0.8,
    fontSize: '0.6875rem',
  },
}

// Pre-computed hover variants
const S_messageGroupedHover: CSSProperties = {
  ...S_row.messageGrouped,
  backgroundColor: 'var(--bg-hover)',
}
const S_messageFirstHover: CSSProperties = {
  ...S_row.messageFirst,
  backgroundColor: 'var(--bg-hover)',
}
const S_timestampInlineVisible: CSSProperties = {
  ...S_row.timestampInline,
  color: 'var(--text-muted)',
}

const actionBtnBase: CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: 'var(--text-muted)',
  cursor: 'pointer',
  padding: 4,
  borderRadius: 3,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

// ── Component ────────────────────────────────────────────────────────────────

export const ChatMessageRow = React.memo(function ChatMessageRow({
  message,
  isGrouped,
  isOwnMessage,
  getReactionsForMessage,
  onToggleReaction,
  shouldRenderReactions,
  onViewProfile,
  getAvatarUrl,
  onDeleteMessage,
  onEditMessage,
  layoutMode = 'string',
}: ChatMessageRowProps) {
  const [hovered, setHovered] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState('')
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number } | null>(
    null,
  )

  const isString = layoutMode === 'string'

  const hashColor = getAvatarColor(message.authorName)
  const color = message.profileColor || hashColor
  const reactions = useMemo(
    () => getReactionsForMessage?.(message.id) ?? [],
    [getReactionsForMessage, message.id],
  )
  const avatarUrl = message.authorId ? getAvatarUrl?.(String(message.authorId)) : undefined
  const canEditOrDelete = isOwnMessage && message.canEditDelete !== false

  const rowStyle = hovered
    ? isGrouped
      ? S_messageGroupedHover
      : S_messageFirstHover
    : isGrouped
      ? S_row.messageGrouped
      : S_row.messageFirst

  const avatarStyle = useMemo<CSSProperties>(
    () => ({ ...S_row.avatar, backgroundColor: color, borderRadius: isString ? '4px' : '50%' }),
    [color, isString],
  )
  const authorStyle = useMemo<CSSProperties>(() => ({ ...S_row.authorName, color }), [color])

  const handleToggle = useCallback(
    (emoji: string) => {
      onToggleReaction?.(message.id, emoji)
    },
    [onToggleReaction, message.id],
  )

  const handleAvatarContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      onViewProfile?.(
        { displayName: message.authorName, username: message.authorName },
        e.clientX,
        e.clientY,
      )
    },
    [onViewProfile, message.authorName],
  )

  const handleMessageContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setContextMenuPosition({ x: e.clientX, y: e.clientY })
  }, [])

  const handleCopyMessage = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) return
    void navigator.clipboard.writeText(message.content)
  }, [message.content])

  const contextItems = useMemo<ContextMenuItem[]>(
    () => [
      {
        label: 'Edit',
        icon: <Pencil size={16} />,
        disabled: !canEditOrDelete || !onEditMessage,
        onClick: () => {
          if (!canEditOrDelete) return
          setEditValue(message.content)
          setIsEditing(true)
        },
      },
      {
        label: 'Copy',
        icon: <Copy size={16} />,
        onClick: handleCopyMessage,
      },
      {
        label: 'Delete',
        icon: <Trash2 size={16} />,
        danger: true,
        disabled: !canEditOrDelete || !onDeleteMessage,
        onClick: () => {
          if (!canEditOrDelete || !onDeleteMessage) return
          onDeleteMessage(message.id)
        },
      },
    ],
    [canEditOrDelete, onEditMessage, onDeleteMessage, message.content, message.id, handleCopyMessage],
  )

  // ── System row ────────────────────────────────────────────────────────────

  if (message.isSystem) {
    const systemPillStyle: CSSProperties = isString
      ? {
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          background: 'var(--bg-hover)',
          border: '1px solid var(--border-subtle)',
          color: 'var(--text-muted)',
          borderRadius: 2,
          padding: '3px 10px',
          fontSize: '0.75rem',
          lineHeight: 1.2,
        }
      : {
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          background: 'var(--bg-input)',
          border: '1px solid var(--border-subtle)',
          color: 'var(--text-muted)',
          borderRadius: 999,
          padding: '4px 10px',
          fontSize: '0.75rem',
          lineHeight: 1.2,
        }

    const isCallNotification = message.authorName === 'Call'
    const systemRowStyle: CSSProperties = isCallNotification
      ? { ...S_row.systemRow, justifyContent: 'flex-start' }
      : S_row.systemRow

    return (
      <li style={systemRowStyle}>
        <span style={systemPillStyle}>
          <span style={S_row.systemTag}>{message.authorName}</span>
          <span>{message.content}</span>
          <span style={S_row.systemTimestamp}>{message.timestamp}</span>
        </span>
      </li>
    )
  }

  // ── Regular row ───────────────────────────────────────────────────────────

  const actionBarStyle: CSSProperties = {
    position: 'absolute',
    top: -8,
    right: 16,
    display: 'flex',
    gap: 2,
    background: 'var(--bg-panel)',
    borderRadius: isString ? 3 : 4,
    border: '1px solid var(--border-subtle)',
    padding: 2,
    zIndex: 5,
  }

  const editInputStyle: CSSProperties = {
    flex: 1,
    background: 'var(--bg-input)',
    border: '1px solid var(--accent-primary)',
    borderRadius: isString ? 2 : 4,
    color: 'var(--text-primary)',
    padding: '4px 8px',
    fontSize: '0.9375rem',
    outline: 'none',
  }

  return (
    <li
      style={rowStyle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onContextMenu={handleMessageContextMenu}
      data-own={isOwnMessage || undefined}
    >
      {isGrouped && (
        <span
          style={hovered ? S_timestampInlineVisible : S_row.timestampInline}
          aria-hidden
        >
          {message.timestamp}
        </span>
      )}

      {!isGrouped && (
        <>
          <div style={avatarStyle} onContextMenu={handleAvatarContextMenu}>
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt=""
                style={{ width: '100%', height: '100%', borderRadius: isString ? '4px' : '50%', objectFit: 'cover' }}
              />
            ) : (
              getInitial(message.authorName)
            )}
          </div>
          <div style={S_row.metaRow}>
            <span style={authorStyle} onContextMenu={handleAvatarContextMenu}>
              {message.authorName}
            </span>
            <time style={S_row.timestamp}>{message.timestamp}</time>
          </div>
        </>
      )}

      {isEditing ? (
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            autoFocus
            style={editInputStyle}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && editValue.trim()) {
                onEditMessage?.(message.id, editValue.trim())
                setIsEditing(false)
              }
              if (e.key === 'Escape') setIsEditing(false)
            }}
          />
          <button
            type="button"
            onClick={() => {
              if (editValue.trim()) {
                onEditMessage?.(message.id, editValue.trim())
                setIsEditing(false)
              }
            }}
            style={actionBtnBase}
            title="Save"
            aria-label="Save edit"
          >
            <Check size={16} />
          </button>
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            style={actionBtnBase}
            title="Cancel"
            aria-label="Cancel edit"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <p style={S_row.content}>{message.content}</p>
      )}

      {hovered && (onDeleteMessage || onEditMessage) && !isEditing && isOwnMessage && (
        <div style={actionBarStyle}>
          {canEditOrDelete && onEditMessage && (
            <button
              type="button"
              onClick={() => {
                setEditValue(message.content)
                setIsEditing(true)
              }}
              style={actionBtnBase}
              title="Edit"
              aria-label="Edit message"
            >
              <Pencil size={16} />
            </button>
          )}
          {canEditOrDelete && onDeleteMessage && (
            <button
              type="button"
              onClick={() => onDeleteMessage(message.id)}
              style={{ ...actionBtnBase, color: 'var(--text-danger)' }}
              title="Delete"
              aria-label="Delete message"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      )}

      {shouldRenderReactions && hovered && onToggleReaction && !isEditing && (
        <QuickReactBar
          onToggleReaction={handleToggle}
          disabled={!onToggleReaction}
          layoutMode={layoutMode}
        />
      )}

      {shouldRenderReactions && reactions.length > 0 && (
        <ReactionBar
          reactions={reactions}
          onToggleReaction={handleToggle}
          disabled={!onToggleReaction}
          layoutMode={layoutMode}
        />
      )}

      {contextMenuPosition && (
        <ContextMenu
          x={contextMenuPosition.x}
          y={contextMenuPosition.y}
          items={contextItems}
          onClose={() => setContextMenuPosition(null)}
        />
      )}
    </li>
  )
})
