/**
 * ReactionBar — displays emoji reactions beneath a message.
 * EmojiPicker and QuickReactBar live in ./reactions/EmojiPicker and are
 * re-exported here for backwards compatibility.
 */

import React from 'react'
import type { LayoutMode } from '../../constants/theme'

// Re-export emoji infrastructure so existing imports keep working
export { QuickReactBar, EmojiPicker, QUICK_EMOJIS, EMOJI_CATEGORIES } from './reactions/EmojiPicker'

// ── Types ────────────────────────────────────────────────────────────────────

export interface ReactionBarItem {
  emoji: string
  count: number
  isActive?: boolean
}

export interface ReactionBarProps {
  reactions: ReadonlyArray<ReactionBarItem>
  onToggleReaction: (emoji: string) => void
  className?: string
  disabled?: boolean
  layoutMode?: LayoutMode
}

// ── ReactionBar ───────────────────────────────────────────────────────────────

export const ReactionBar = React.memo(function ReactionBar({
  reactions,
  onToggleReaction,
  className,
  disabled,
  layoutMode = 'string',
}: ReactionBarProps) {
  if (reactions.length === 0) return null

  const isString = layoutMode === 'string'

  return (
    <div className={`tw-reaction-bar ${className ?? ''}`.trim()} aria-label="Message reactions">
      <ul
        className="tw-reaction-list"
        aria-label="Reaction list"
        style={{ display: 'flex', flexWrap: 'wrap', gap: 4, listStyle: 'none', padding: 0, margin: '4px 0 0' }}
      >
        {reactions.map((reaction) => {
          const isActive = Boolean(reaction.isActive)

          // String mode: square/near-square chip, design token colours, no Discord blue
          const chipStyle = isString
            ? {
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '2px 7px',
                borderRadius: 2,
                border: isActive
                  ? '1px solid var(--accent-primary)'
                  : '1px solid var(--border-subtle)',
                background: isActive ? 'var(--accent-subtle)' : 'var(--bg-panel)',
                color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                fontSize: 14,
                cursor: disabled ? 'default' : 'pointer',
                lineHeight: 1.4,
                transition: 'background 0.1s, border-color 0.1s',
              }
            : {
                // Classic: original Discord-flavoured pill
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '2px 8px',
                borderRadius: 12,
                border: isActive ? '1px solid #5865f2' : '1px solid #3f4147',
                background: isActive ? 'rgba(88, 101, 242, 0.15)' : '#2b2d31',
                color: isActive ? '#dee0fc' : '#b5bac1',
                fontSize: 14,
                cursor: disabled ? 'default' : 'pointer',
                lineHeight: 1.4,
              }

          return (
            <li key={reaction.emoji}>
              <button
                type="button"
                className={`tw-reaction-chip ${isActive ? 'is-active' : ''}`.trim()}
                onClick={() => onToggleReaction(reaction.emoji)}
                aria-pressed={isActive}
                disabled={disabled}
                style={chipStyle}
              >
                <span aria-hidden="true">{reaction.emoji}</span>
                <span style={{ fontSize: 12, fontWeight: 500 }}>{reaction.count}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
})


