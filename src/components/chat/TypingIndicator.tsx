import type { CSSProperties } from 'react'

export interface TypingIndicatorUser {
  id: string
  label: string
  avatarUrl?: string
}

export interface TypingIndicatorProps {
  users: TypingIndicatorUser[]
}

function buildTypingText(users: TypingIndicatorUser[]): string {
  if (users.length === 0) {
    return ''
  }

  if (users.length === 1) {
    return `${users[0].label} is typing…`
  }

  if (users.length === 2) {
    return `${users[0].label} and ${users[1].label} are typing…`
  }

  return `${users[0].label}, ${users[1].label}, and ${users.length - 2} others are typing…`
}

export function TypingIndicator({ users }: TypingIndicatorProps) {
  if (users.length === 0) {
    return null
  }

  const primaryUser = users[0]
  const text = buildTypingText(users)

  return (
    <div aria-label="Typing indicator" style={S_root}>
      {primaryUser.avatarUrl ? (
        <img src={primaryUser.avatarUrl} alt="" style={S_avatar} />
      ) : (
        <div aria-hidden="true" style={S_avatarFallback}>
          {primaryUser.label.slice(0, 1).toUpperCase()}
        </div>
      )}
      <span style={S_text}>{text}</span>
    </div>
  )
}

const S_root: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '0 16px 4px',
  minHeight: 24,
  color: 'var(--text-muted)',
  fontSize: 13,
}

const S_avatar: CSSProperties = {
  width: 18,
  height: 18,
  borderRadius: '50%',
  objectFit: 'cover',
  display: 'block',
  flexShrink: 0,
}

const S_avatarFallback: CSSProperties = {
  width: 18,
  height: 18,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'var(--accent-primary)',
  color: '#fff',
  fontSize: 10,
  fontWeight: 700,
  flexShrink: 0,
}

const S_text: CSSProperties = {
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}