import { useState, type CSSProperties, type MouseEvent, type ReactNode } from 'react'

export type GuildId = string | number

export interface GuildListItem {
  id: GuildId
  name: string
  unreadCount?: number
  iconUrl?: string
}

export interface ServerListPaneVariantProps {
  guilds: GuildListItem[]
  selectedGuildId?: GuildId
  onSelectGuild?: (guildId: GuildId) => void
  onHomeClick?: () => void
  isHomeSelected?: boolean
  onAddServer?: () => void
  onLeaveGuild?: (guildId: GuildId) => void
  onInviteToGuild?: (guildId: GuildId) => void
  onDeleteGuild?: (guildId: GuildId) => void
  ownedGuildIds?: Set<GuildId>
  onReorder?: (newOrder: string[]) => void
  className?: string
}

export const CTX_BG = '#111214'
export const CTX_HOVER = '#5865f2'
export const CTX_DANGER = '#ed4245'
export const CTX_TEXT = '#dbdee1'
export const CTX_SEPARATOR = '#2e2f34'

export function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function ContextMenuItem({
  label,
  icon,
  danger,
  onClick,
}: {
  label: string
  icon?: ReactNode
  danger?: boolean
  onClick?: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const color = danger ? CTX_DANGER : CTX_TEXT
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        width: '100%',
        padding: '6px 8px',
        border: 'none',
        borderRadius: 4,
        backgroundColor: hovered ? (danger ? CTX_DANGER : CTX_HOVER) : 'transparent',
        color: hovered ? '#fff' : color,
        fontSize: 14,
        fontWeight: 500,
        cursor: 'pointer',
        textAlign: 'left',
        lineHeight: '18px',
        boxSizing: 'border-box',
      }}
    >
      {icon && <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>{icon}</span>}
      {label}
    </button>
  )
}

const TEXT_WHITE = '#fff'
const TEXT_MUTED = '#96989d'

function Tooltip({ text, visible }: { text: string; visible: boolean }) {
  if (!visible) return null
  return (
    <div
      style={{
        position: 'absolute',
        left: 'calc(100% + 12px)',
        top: '50%',
        transform: 'translateY(-50%)',
        backgroundColor: '#18191c',
        color: TEXT_WHITE,
        fontSize: 14,
        fontWeight: 600,
        padding: '8px 12px',
        borderRadius: 6,
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
        zIndex: 1000,
        boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
      }}
      role="tooltip"
    >
      <div
        style={{
          position: 'absolute',
          left: -4,
          top: '50%',
          transform: 'translateY(-50%) rotate(45deg)',
          width: 8,
          height: 8,
          backgroundColor: '#18191c',
        }}
      />
      {text}
    </div>
  )
}

const ICON_BG = '#313338'
const ICON_BG_HOVER = '#5865f2'
const ICON_BG_ACTIVE = '#5865f2'
const PILL_COLOR = '#fff'
const BADGE_RED = '#ed4245'
const BG = '#1e1f22'

const iconWrapStyle: CSSProperties = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
  height: 48,
  marginBottom: 0,
}

const pillBase: CSSProperties = {
  position: 'absolute',
  left: 0,
  width: 4,
  borderRadius: '0 4px 4px 0',
  backgroundColor: PILL_COLOR,
  transition: 'height 0.15s ease, opacity 0.15s ease',
}

const iconBtnBase: CSSProperties = {
  position: 'relative',
  width: 48,
  height: 48,
  border: 'none',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 18,
  fontWeight: 600,
  color: TEXT_MUTED,
  transition: 'border-radius 0.15s ease, background-color 0.15s ease, color 0.15s ease',
  overflow: 'hidden',
  flexShrink: 0,
}

const badgeStyle: CSSProperties = {
  position: 'absolute',
  bottom: -2,
  right: -2,
  minWidth: 16,
  height: 16,
  padding: '0 4px',
  borderRadius: 8,
  backgroundColor: BADGE_RED,
  color: TEXT_WHITE,
  fontSize: 11,
  fontWeight: 700,
  lineHeight: '16px',
  textAlign: 'center',
  border: `3px solid ${BG}`,
  boxSizing: 'content-box',
  pointerEvents: 'none',
}

export function ServerIcon({
  label,
  isSelected,
  hasUnread,
  unreadCount,
  iconUrl,
  bgActive,
  bgHover,
  children,
  onClick,
  onContextMenu,
}: {
  label: string
  isSelected: boolean
  hasUnread?: boolean
  unreadCount?: number
  iconUrl?: string
  bgActive?: string
  bgHover?: string
  children?: ReactNode
  onClick?: () => void
  onContextMenu?: (e: MouseEvent<HTMLDivElement>) => void
}) {
  const [hovered, setHovered] = useState(false)
  const activeBg = bgActive ?? ICON_BG_ACTIVE
  const hoverBg = bgHover ?? ICON_BG_HOVER

  const pillHeight = isSelected ? 40 : hovered ? 20 : hasUnread ? 8 : 0
  const pillOpacity = isSelected || hovered || hasUnread ? 1 : 0

  const borderRadius = isSelected || hovered ? 16 : 24
  const bg = isSelected ? activeBg : hovered ? hoverBg : ICON_BG
  const color = isSelected || hovered ? TEXT_WHITE : TEXT_MUTED

  return (
    <div
      style={iconWrapStyle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onContextMenu={onContextMenu}
    >
      <span
        style={{
          ...pillBase,
          height: pillHeight,
          opacity: pillOpacity,
        }}
        aria-hidden
      />

      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        aria-pressed={isSelected}
        style={{
          ...iconBtnBase,
          borderRadius,
          backgroundColor: bg,
          color,
          ...(iconUrl
            ? {
                backgroundImage: `url(${iconUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }
            : {}),
        }}
      >
        {!iconUrl && children}
      </button>

      {!!unreadCount && unreadCount > 0 && (
        <span style={badgeStyle}>{unreadCount > 99 ? '99+' : unreadCount}</span>
      )}

      <Tooltip text={label} visible={hovered} />
    </div>
  )
}
