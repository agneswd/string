import { memo, useState } from 'react'

interface DmNavButtonProps {
  label: string
  icon?: React.ReactNode
  active?: boolean
  onClick?: () => void
}

const makeStyle = (active: boolean, hovered: boolean): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10,
  padding: '7px 14px',
  margin: '1px 6px',
  borderRadius: 2,
  border: `1px solid ${active ? 'var(--text-primary)' : 'var(--border-subtle)'}`,
  cursor: 'pointer',
  width: 'calc(100% - 12px)',
  minWidth: 'calc(100% - 12px)',
  textAlign: 'center' as const,
  fontSize: 13,
  fontWeight: 500,
  fontFamily: 'var(--font-mono)',
  letterSpacing: '0.04em',
  background: active ? 'var(--bg-active)' : hovered ? 'var(--bg-hover)' : 'transparent',
  color: active
    ? 'var(--text-primary)'
    : hovered
      ? 'var(--text-primary)'
      : 'var(--text-primary)',
  transition: 'background .12s, color .12s, border-color .12s',
})

export const DmNavButton = memo(function DmNavButton({
  label,
  icon,
  active = false,
  onClick,
}: DmNavButtonProps) {
  const [hovered, setHovered] = useState(false)

  return (
    <button
      type="button"
      style={makeStyle(active, hovered)}
      className="string-outline-button"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
      aria-label={label}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
})
