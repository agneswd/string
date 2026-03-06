/**
 * Emoji picking infrastructure: data constants, EmojiPicker overlay, QuickReactBar.
 * Supports layoutMode gating: 'string' uses design tokens; 'classic' keeps
 * the original Discord-flavoured palette.
 */

import React, { useState, useRef, useEffect } from 'react'
import { Smile } from 'lucide-react'
import emojiData from '@emoji-mart/data'
import type { LayoutMode } from '../../../constants/theme'

// ── Data ────────────────────────────────────────────────────────────────────

export const QUICK_EMOJIS = ['❤️', '👍', '😹'] as const

type EmojiMartRecord = {
  categories: Array<{ id: string; emojis: string[] }>
  emojis: Record<string, { id: string; name: string; keywords?: string[]; skins: Array<{ native: string }> }>
}

type EmojiEntry = {
  id: string
  native: string
  name: string
  keywords: string[]
}

const CATEGORY_LABELS: Record<string, string> = {
  people: 'Smileys',
  nature: 'Animals',
  foods: 'Food',
  activity: 'Activity',
  places: 'Places',
  objects: 'Objects',
  symbols: 'Symbols',
  flags: 'Flags',
}

const EMOJI_DATASET = emojiData as EmojiMartRecord

export const EMOJI_CATEGORIES: { name: string; emojis: EmojiEntry[] }[] = EMOJI_DATASET.categories
  .map((category) => ({
    name: CATEGORY_LABELS[category.id] ?? category.id.replace(/(^|_)(\w)/g, (_m, _p, ch: string) => ` ${ch.toUpperCase()}`).trim(),
    emojis: category.emojis
      .map((emojiId) => {
        const meta = EMOJI_DATASET.emojis[emojiId]
        const native = meta?.skins?.[0]?.native
        if (!meta || !native) return null
        return {
          id: meta.id,
          native,
          name: meta.name,
          keywords: meta.keywords ?? [],
        }
      })
      .filter((emoji): emoji is EmojiEntry => emoji !== null),
  }))
  .filter((category) => category.emojis.length > 0)

// ── EmojiPicker ──────────────────────────────────────────────────────────────

export const EmojiPicker: React.FC<{
  onSelect: (emoji: string) => void
  onClose: () => void
  layoutMode?: LayoutMode
}> = ({ onSelect, onClose, layoutMode = 'string' }) => {
  const ref = useRef<HTMLDivElement>(null)
  const [search, setSearch] = useState('')
  const isString = layoutMode === 'string'

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [onClose])

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        bottom: '100%',
        right: 0,
        marginBottom: 4,
        width: 320,
        maxHeight: 360,
        background: isString ? 'var(--bg-panel)' : '#2b2d31',
        border: isString ? '1px solid var(--border-subtle)' : '1px solid #1e1f22',
        borderRadius: isString ? 3 : 8,
        boxShadow: isString ? 'none' : '0 8px 16px rgba(0,0,0,0.24)',
        zIndex: 1000,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ padding: '8px 8px 4px' }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search emoji…"
          autoFocus
          style={{
            width: '100%',
            padding: '6px 8px',
            background: isString ? 'var(--bg-input)' : '#1e1f22',
            border: isString ? '1px solid var(--border-subtle)' : '1px solid #3f4147',
            borderRadius: isString ? 2 : 4,
            color: isString ? 'var(--text-primary)' : '#dbdee1',
            fontSize: 13,
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>

      <div style={{ overflowY: 'auto', padding: '4px 8px 8px', flex: 1 }}>
        {EMOJI_CATEGORIES.map((cat) => {
          const q = search.trim().toLowerCase()
          const filtered = q
            ? cat.emojis.filter((emoji) => {
                const haystack = [emoji.id, emoji.name, ...emoji.keywords]
                  .join(' ')
                  .replaceAll('_', ' ')
                  .toLowerCase()
                return haystack.includes(q)
              })
            : cat.emojis
          if (filtered.length === 0) return null
          return (
            <div key={cat.name}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: isString ? 'var(--text-muted)' : '#949ba4',
                  textTransform: 'uppercase',
                  padding: '8px 4px 4px',
                  letterSpacing: isString ? '0.06em' : '0.02em',
                  fontFamily: isString ? 'var(--font-mono)' : undefined,
                }}
              >
                {cat.name}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                {filtered.map((emoji) => (
                  <button
                    key={emoji.id}
                    onClick={() => {
                      onSelect(emoji.native)
                      onClose()
                    }}
                    style={{
                      width: 32,
                      height: 32,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 20,
                      background: 'transparent',
                      border: 'none',
                      borderRadius: isString ? 2 : 4,
                      cursor: 'pointer',
                      padding: 0,
                    }}
                    onMouseEnter={(e) => {
                      ;(e.currentTarget as HTMLElement).style.background = isString
                        ? 'var(--bg-hover)'
                        : '#3f4147'
                    }}
                    onMouseLeave={(e) => {
                      ;(e.currentTarget as HTMLElement).style.background = 'transparent'
                    }}
                    title={emoji.native}
                    aria-label={emoji.name}
                  >
                    {emoji.native}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── QuickReactBar ─────────────────────────────────────────────────────────────

export const QuickReactBar: React.FC<{
  onToggleReaction: (emoji: string) => void
  disabled?: boolean
  layoutMode?: LayoutMode
  showQuickReacts?: boolean
  trailingContent?: React.ReactNode
  onPickerVisibilityChange?: (open: boolean) => void
}> = React.memo(({ onToggleReaction, disabled, layoutMode = 'string', showQuickReacts = true, trailingContent, onPickerVisibilityChange }) => {
  const [showPicker, setShowPicker] = useState(false)
  const isString = layoutMode === 'string'

  useEffect(() => {
    onPickerVisibilityChange?.(showPicker)
  }, [showPicker, onPickerVisibilityChange])

  return (
    <div
      style={{
        position: 'absolute',
        top: -16,
        right: 8,
        display: 'flex',
        gap: 2,
        background: isString ? 'var(--bg-panel)' : '#2b2d31',
        border: isString ? '1px solid var(--border-subtle)' : '1px solid #1e1f22',
        borderRadius: isString ? 3 : 4,
        padding: '2px 4px',
        zIndex: 10,
      }}
    >
      {showQuickReacts && (
        <>
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => onToggleReaction(emoji)}
              disabled={disabled}
              style={{
                width: 28,
                height: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
                background: 'transparent',
                border: 'none',
                borderRadius: isString ? 2 : 4,
                cursor: disabled ? 'default' : 'pointer',
                opacity: disabled ? 0.5 : 1,
                padding: 0,
              }}
              onMouseEnter={(e) => {
                if (!disabled)
                  ;(e.currentTarget as HTMLElement).style.background = isString
                    ? 'var(--bg-hover)'
                    : '#3f4147'
              }}
              onMouseLeave={(e) => {
                ;(e.currentTarget as HTMLElement).style.background = 'transparent'
              }}
              title={`React with ${emoji}`}
            >
              {emoji}
            </button>
          ))}

          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowPicker(!showPicker)}
              disabled={disabled}
              style={{
                width: 28,
                height: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
                background: 'transparent',
                border: 'none',
                borderRadius: isString ? 2 : 4,
                cursor: disabled ? 'default' : 'pointer',
                opacity: disabled ? 0.5 : 1,
                color: isString ? 'var(--text-muted)' : '#b5bac1',
                padding: 0,
              }}
              onMouseEnter={(e) => {
                if (!disabled)
                  ;(e.currentTarget as HTMLElement).style.background = isString
                    ? 'var(--bg-hover)'
                    : '#3f4147'
              }}
              onMouseLeave={(e) => {
                ;(e.currentTarget as HTMLElement).style.background = 'transparent'
              }}
              title="More reactions"
              aria-label="More reactions"
              aria-expanded={showPicker}
            >
              <Smile size={16} />
            </button>
            {showPicker && (
              <EmojiPicker
                onSelect={onToggleReaction}
                onClose={() => setShowPicker(false)}
                layoutMode={layoutMode}
              />
            )}
          </div>
        </>
      )}

      {trailingContent && (
        <>
          {showQuickReacts && (
            <div
              aria-hidden="true"
              style={{
                width: 1,
                alignSelf: 'stretch',
                background: isString ? 'var(--border-subtle)' : '#3f4147',
                margin: '2px 2px 2px 4px',
              }}
            />
          )}
          <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            {trailingContent}
          </div>
        </>
      )}
    </div>
  )
})
