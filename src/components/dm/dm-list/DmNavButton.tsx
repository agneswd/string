import { memo, useState } from 'react'

interface DmNavButtonProps {
  label: string
  icon: React.ReactNode
  active?: boolean
  onClick?: () => void
}

const makeStyle = (active: boolean, hovered: boolean): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '6px 10px',
  margin: '1px 6px',
  borderRadius: 2,
  border: 'none',
  cursor: 'pointer',
  width: 'calc(100% - 12px)',
  textAlign: 'left' as const,
  fontSize: 14,
  fontWeight: active ? 600 : 500,
  fontFamily: 'var(--font-sans)',
  background: active ? 'var(--bg-active)' : hovered ? 'var(--bg-hover)' : 'transparent',
  color: active
    ? 'var(--text-interactive-active)'
    : hovered
      ? 'var(--text-interactive-hover)'
      : 'var(--text-channels-default)',
  transition: 'background .12s, color .12s',
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
