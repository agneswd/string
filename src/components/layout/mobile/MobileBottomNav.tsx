import type { CSSProperties } from 'react'
import { LayoutGrid, MessagesSquare, UserRound } from 'lucide-react'

export type MobileBottomTab = 'browse' | 'friends' | 'you' | null

export interface MobileBottomNavProps {
  activeTab: MobileBottomTab
  onBrowse: () => void
  onFriends: () => void
  onYou: () => void
}

const S_root: CSSProperties = {
  minHeight: '72px',
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  backgroundColor: 'var(--bg-panel)',
  padding: '6px 8px calc(12px + env(safe-area-inset-bottom, 0px))',
  boxSizing: 'border-box',
  flexShrink: 0,
  position: 'sticky',
  bottom: 0,
  zIndex: 5,
}

function NavButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      style={{
        border: 'none',
        background: 'transparent',
        color: active ? 'var(--accent-primary)' : 'var(--text-muted)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        fontSize: 11,
        fontWeight: active ? 600 : 500,
        cursor: 'pointer',
        borderRadius: 10,
      }}
    >
      {children}
      <span>{label}</span>
    </button>
  )
}

export function MobileBottomNav({
  activeTab,
  onBrowse,
  onFriends,
  onYou,
}: MobileBottomNavProps) {
  return (
    <nav aria-label="Mobile navigation" style={S_root}>
      <NavButton label="Browse" active={activeTab === 'browse'} onClick={onBrowse}>
        <LayoutGrid size={18} />
      </NavButton>
      <NavButton label="Friends" active={activeTab === 'friends'} onClick={onFriends}>
        <MessagesSquare size={18} />
      </NavButton>
      <NavButton label="You" active={activeTab === 'you'} onClick={onYou}>
        <UserRound size={18} />
      </NavButton>
    </nav>
  )
}
