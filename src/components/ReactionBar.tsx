import React, { useState, useCallback, useRef, useEffect } from 'react'
import { Smile } from 'lucide-react'

// ── Preset emojis ──
const QUICK_EMOJIS = ['❤️', '👍', '😹'] as const

// ── Full emoji categories for the picker ──
const EMOJI_CATEGORIES: { name: string; emojis: string[] }[] = [
  {
    name: 'Smileys',
    emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '🥲', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🫡', '🤐', '🤨', '😐', '😑', '😶', '🫥', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤯', '😳', '🥺', '😢', '😭', '😤', '😡', '🤬', '😈', '👿', '💀', '☠️', '💩', '🤡', '👹', '👺', '👻', '👽', '🤖', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾'],
  },
  {
    name: 'Gestures',
    emojis: ['👋', '🤚', '🖐️', '✋', '🖖', '🫱', '🫲', '🫳', '🫴', '👌', '🤌', '🤏', '✌️', '🤞', '🫰', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '🫵', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '🫶', '👐', '🤲', '🤝', '🙏', '💪', '🦾'],
  },
  {
    name: 'Hearts',
    emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❤️‍🔥', '❤️‍🩹', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟'],
  },
  {
    name: 'Objects',
    emojis: ['⭐', '🌟', '✨', '💫', '🔥', '💯', '🎉', '🎊', '🏆', '🥇', '🎵', '🎶', '💡', '📌', '🚀', '💎', '🔔', '📣', '💬', '👀', '🧠', '🫂'],
  },
  {
    name: 'Food',
    emojis: ['🍕', '🍔', '🍟', '🌭', '🍿', '🧁', '🍩', '🍪', '🎂', '🍰', '🍫', '🍬', '🍭', '☕', '🍺', '🍻', '🥂', '🍷'],
  },
  {
    name: 'Animals',
    emojis: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🦄', '🐝', '🐛', '🦋', '🐌', '🐙', '🦑'],
  },
  {
    name: 'Flags',
    emojis: ['🏁', '🚩', '🎌', '🏴', '🏳️', '🏳️‍🌈', '🏳️‍⚧️', '🏴‍☠️'],
  },
]

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
}

// ── Emoji Picker ──
const EmojiPicker: React.FC<{
  onSelect: (emoji: string) => void
  onClose: () => void
}> = ({ onSelect, onClose }) => {
  const ref = useRef<HTMLDivElement>(null)
  const [search, setSearch] = useState('')

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
    <div ref={ref} style={{
      position: 'absolute',
      bottom: '100%',
      right: 0,
      marginBottom: 4,
      width: 320,
      maxHeight: 360,
      background: '#2b2d31',
      border: '1px solid #1e1f22',
      borderRadius: 8,
      boxShadow: '0 8px 16px rgba(0,0,0,0.24)',
      zIndex: 1000,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{ padding: '8px 8px 4px' }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search emoji..."
          autoFocus
          style={{
            width: '100%',
            padding: '6px 8px',
            background: '#1e1f22',
            border: '1px solid #3f4147',
            borderRadius: 4,
            color: '#dbdee1',
            fontSize: 13,
            outline: 'none',
          }}
        />
      </div>
      <div style={{ overflowY: 'auto', padding: '4px 8px 8px', flex: 1 }}>
        {EMOJI_CATEGORIES.map((cat) => {
          const filtered = search
            ? cat.emojis.filter((e) => e.includes(search))
            : cat.emojis
          if (filtered.length === 0) return null
          return (
            <div key={cat.name}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#949ba4', textTransform: 'uppercase', padding: '8px 4px 4px', letterSpacing: '0.02em' }}>
                {cat.name}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                {filtered.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => { onSelect(emoji); onClose() }}
                    style={{
                      width: 32,
                      height: 32,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 20,
                      background: 'transparent',
                      border: 'none',
                      borderRadius: 4,
                      cursor: 'pointer',
                      padding: 0,
                    }}
                    onMouseEnter={(e) => { (e.target as HTMLElement).style.background = '#3f4147' }}
                    onMouseLeave={(e) => { (e.target as HTMLElement).style.background = 'transparent' }}
                    title={emoji}
                  >
                    {emoji}
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

// ── Quick React Toolbar (shown on hover) ──
export const QuickReactBar: React.FC<{
  onToggleReaction: (emoji: string) => void
  disabled?: boolean
}> = React.memo(({ onToggleReaction, disabled }) => {
  const [showPicker, setShowPicker] = useState(false)

  return (
    <div style={{
      position: 'absolute',
      top: -16,
      right: 8,
      display: 'flex',
      gap: 2,
      background: '#2b2d31',
      border: '1px solid #1e1f22',
      borderRadius: 4,
      padding: '2px 4px',
      zIndex: 10,
    }}>
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
            borderRadius: 4,
            cursor: disabled ? 'default' : 'pointer',
            opacity: disabled ? 0.5 : 1,
            padding: 0,
          }}
          onMouseEnter={(e) => { if (!disabled) (e.target as HTMLElement).style.background = '#3f4147' }}
          onMouseLeave={(e) => { (e.target as HTMLElement).style.background = 'transparent' }}
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
            borderRadius: 4,
            cursor: disabled ? 'default' : 'pointer',
            opacity: disabled ? 0.5 : 1,
            color: '#b5bac1',
            padding: 0,
          }}
          onMouseEnter={(e) => { if (!disabled) (e.target as HTMLElement).style.background = '#3f4147' }}
          onMouseLeave={(e) => { (e.target as HTMLElement).style.background = 'transparent' }}
          title="More reactions"
        >
          <Smile size={16} />
        </button>
        {showPicker && (
          <EmojiPicker
            onSelect={onToggleReaction}
            onClose={() => setShowPicker(false)}
          />
        )}
      </div>
    </div>
  )
})

// ── Reaction Display (existing reactions under message) ──
export const ReactionBar = React.memo(function ReactionBar({
  reactions,
  onToggleReaction,
  className,
  disabled,
}: ReactionBarProps) {
  if (reactions.length === 0) return null

  return (
    <div className={`tw-reaction-bar ${className ?? ''}`.trim()} aria-label="Message reactions">
      <ul className="tw-reaction-list" aria-label="Reaction list" style={{ display: 'flex', flexWrap: 'wrap', gap: 4, listStyle: 'none', padding: 0, margin: '4px 0 0' }}>
        {reactions.map((reaction) => {
          const isActive = Boolean(reaction.isActive)

          return (
            <li key={reaction.emoji}>
              <button
                type="button"
                className={`tw-reaction-chip ${isActive ? 'is-active' : ''}`.trim()}
                onClick={() => onToggleReaction(reaction.emoji)}
                aria-pressed={isActive}
                disabled={disabled}
                style={{
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
                }}
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
