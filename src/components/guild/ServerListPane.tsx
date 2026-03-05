import { useState, useCallback, useEffect, useMemo, memo, type CSSProperties } from 'react'
import { Plus, UserPlus, LogOut, Clipboard, Trash2, LineSquiggle } from 'lucide-react'

export type GuildId = string | number

export interface GuildListItem {
  id: GuildId
  name: string
  unreadCount?: number
  iconUrl?: string
}

export interface ServerListPaneProps {
  guilds: GuildListItem[]
  selectedGuildId?: GuildId
  onSelectGuild?: (guildId: GuildId) => void
  /** Called when the Home / DM button at the top is clicked */
  onHomeClick?: () => void
  /** Whether the home/DM view is currently active (no guild selected) */
  isHomeSelected?: boolean
  /** Called when the "Add Server" button is clicked */
  onAddServer?: () => void
  /** Called when "Leave Server" is clicked in context menu */
  onLeaveGuild?: (guildId: GuildId) => void
  /** Called when "Invite People" is clicked in context menu */
  onInviteToGuild?: (guildId: GuildId) => void
  /** Called when "Delete Server" is clicked in context menu */
  onDeleteGuild?: (guildId: GuildId) => void
  /** Set of guild IDs that the current user owns */
  ownedGuildIds?: Set<GuildId>
  /** Called when guild list is reordered via drag-and-drop */
  onReorder?: (newOrder: string[]) => void
  className?: string
}

/* ── colour tokens ─────────────────────────────────────── */
const BG = '#1e1f22'
const ICON_BG = '#313338'
const ICON_BG_HOVER = '#5865f2'
const ICON_BG_ACTIVE = '#5865f2'
const HOME_GREEN = '#3ba55d'
const PILL_COLOR = '#fff'
const TEXT_MUTED = '#96989d'
const TEXT_WHITE = '#fff'
const ADD_GREEN = '#3ba55d'
const SEPARATOR = '#35363c'
const BADGE_RED = '#ed4245'

/* ── reusable inline-style helpers ─────────────────────── */
const rootStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  width: '100%',
  height: '100%',
  minHeight: 0,
  backgroundColor: BG,
  paddingTop: 0,
  paddingBottom: 12,
  boxSizing: 'border-box',
  overflowX: 'hidden',
  overflowY: 'auto',
  /* hide scrollbar but keep scrolling */
  scrollbarWidth: 'none',
}

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

const separatorStyle: CSSProperties = {
  width: 32,
  height: 2,
  borderRadius: 1,
  backgroundColor: SEPARATOR,
  margin: '2px 0',
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

const scrollRegionStyle: CSSProperties = {
  flex: 1,
  width: '100%',
  minHeight: 0,
  overflowY: 'auto',
  overflowX: 'hidden',
  scrollbarWidth: 'none',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 8,
  paddingTop: 4,
  paddingBottom: 4,
}

const homeWrapStyle: CSSProperties = { paddingTop: 12, width: '100%' }
const addServerWrapStyle: CSSProperties = { paddingBottom: 4, width: '100%' }

/* ── pure helper ─────────────────────────────────────── */
function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

/* ── Tooltip component (appears to the right) ──────────── */
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
      {/* arrow */}
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

/* ── ServerIcon button ─────────────────────────────────── */
function ServerIcon({
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
  children?: React.ReactNode
  onClick?: () => void
  onContextMenu?: (e: React.MouseEvent) => void
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
      {/* pill indicator */}
      <span
        style={{
          ...pillBase,
          height: pillHeight,
          opacity: pillOpacity,
        }}
        aria-hidden
      />

      {/* icon button */}
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

      {/* unread badge */}
      {!!unreadCount && unreadCount > 0 && (
        <span style={badgeStyle}>{unreadCount > 99 ? '99+' : unreadCount}</span>
      )}

      {/* tooltip */}
      <Tooltip text={label} visible={hovered} />
    </div>
  )
}

/* ── ContextMenuItem ───────────────────────────────────── */
function ContextMenuItem({
  label,
  icon,
  danger,
  onClick,
}: {
  label: string
  icon?: React.ReactNode
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

/* ── Main Component ────────────────────────────────────── */
/* ── Context menu tokens ───────────────────────────────── */
const CTX_BG = '#111214'
const CTX_HOVER = '#5865f2'
const CTX_DANGER = '#ed4245'
const CTX_TEXT = '#dbdee1'
const CTX_SEPARATOR = '#2e2f34'

export const ServerListPane = memo(function ServerListPane({
  guilds,
  selectedGuildId,
  onSelectGuild,
  onHomeClick,
  isHomeSelected,
  onAddServer,
  onLeaveGuild,
  onDeleteGuild,
  onInviteToGuild,
  ownedGuildIds,
  onReorder,
  className,
}: ServerListPaneProps) {
  const homeSelected = isHomeSelected ?? selectedGuildId === undefined

  /* ── drag-and-drop state ─────────────────────────────── */
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const [dropPosition, setDropPosition] = useState<'above' | 'below' | null>(null)

  /* ── context menu state ──────────────────────────────── */
  const [contextMenu, setContextMenu] = useState<{ guildId: GuildId; x: number; y: number } | null>(null)

  const closeContextMenu = useCallback(() => setContextMenu(null), [])

  useEffect(() => {
    if (!contextMenu) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeContextMenu() }
    const onClick = () => closeContextMenu()
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onClick)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onClick)
    }
  }, [contextMenu, closeContextMenu])

  const guildItems = useMemo(
    () =>
      guilds.map((guild) => ({
        ...guild,
        initials: getInitials(guild.name),
        isSelected: String(guild.id) === String(selectedGuildId),
      })),
    [guilds, selectedGuildId],
  )

  return (
    <nav
      className={className}
      style={rootStyle}
      aria-label="Servers"
    >
      {/* ── Home / DM button ─────────────────────────── */}
      <div style={homeWrapStyle}>
        <ServerIcon
          label="Direct Messages"
          isSelected={homeSelected}
          bgActive={ICON_BG_ACTIVE}
          bgHover={ICON_BG_HOVER}
          onClick={onHomeClick}
        >
          <LineSquiggle size={32} />
        </ServerIcon>
      </div>

      {/* ── separator ────────────────────────────────── */}
      <div style={{ ...separatorStyle, margin: '8px 0' }} />

      {/* ── server list (scrollable region) ──────────── */}
      <div style={scrollRegionStyle}>
        {guildItems.map((guild) => {
          const guildIdStr = String(guild.id)
          const isDragging = draggedId === guildIdStr
          const isDragOver = dragOverId === guildIdStr && draggedId !== guildIdStr
          return (
            <div
              key={guildIdStr}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', guildIdStr)
                e.dataTransfer.effectAllowed = 'move'
                setDraggedId(guildIdStr)
              }}
              onDragEnd={() => {
                setDraggedId(null)
                setDragOverId(null)
                setDropPosition(null)
              }}
              onDragOver={(e) => {
                e.preventDefault()
                e.dataTransfer.dropEffect = 'move'
                const rect = e.currentTarget.getBoundingClientRect()
                const midY = rect.top + rect.height / 2
                setDropPosition(e.clientY < midY ? 'above' : 'below')
                setDragOverId(guildIdStr)
              }}
              onDragLeave={() => {
                setDragOverId((prev) => (prev === guildIdStr ? null : prev))
              }}
              onDrop={(e) => {
                e.preventDefault()
                const fromId = e.dataTransfer.getData('text/plain')
                if (fromId === guildIdStr) return
                const currentOrder = guildItems.map((g) => String(g.id))
                const fromIdx = currentOrder.indexOf(fromId)
                const toIdx = currentOrder.indexOf(guildIdStr)
                if (fromIdx === -1 || toIdx === -1) return
                const newOrder = [...currentOrder]
                newOrder.splice(fromIdx, 1)
                // If dropping below and the dragged item was before target,
                // toIdx might have shifted by one after removal.
                const adjustedToIdx = dropPosition === 'below'
                  ? (fromIdx < toIdx ? toIdx : toIdx + 1)
                  : (fromIdx < toIdx ? toIdx - 1 : toIdx)
                newOrder.splice(adjustedToIdx, 0, fromId)
                onReorder?.(newOrder)
                setDraggedId(null)
                setDragOverId(null)
                setDropPosition(null)
              }}
              style={{
                opacity: isDragging ? 0.4 : 1,
                transition: 'opacity 0.15s ease',
                position: 'relative' as const,
                width: '100%',
                borderTop: isDragOver && dropPosition === 'above' ? '2px solid #5865f2' : '2px solid transparent',
                borderBottom: isDragOver && dropPosition === 'below' ? '2px solid #5865f2' : '2px solid transparent',
                borderRadius: 4,
              }}
            >
              <ServerIcon
                label={guild.name}
                isSelected={guild.isSelected}
                hasUnread={!!guild.unreadCount && guild.unreadCount > 0}
                unreadCount={guild.unreadCount}
                iconUrl={guild.iconUrl}
                onClick={() => onSelectGuild?.(guild.id)}
                onContextMenu={(e) => {
                  e.preventDefault()
                  setContextMenu({ guildId: guild.id, x: e.clientX, y: e.clientY })
                }}
              >
                {guild.initials || '#'}
              </ServerIcon>
            </div>
          )
        })}
      </div>

      {/* ── separator ────────────────────────────────── */}
      <div style={{ ...separatorStyle, margin: '8px 0' }} />

      {/* ── Add Server button ────────────────────────── */}
      <div style={addServerWrapStyle}>
        <ServerIcon
          label="Add a Server"
          isSelected={false}
          bgHover={ADD_GREEN}
          onClick={onAddServer}
        >
          <Plus width={24} height={24} aria-hidden />
        </ServerIcon>
      </div>
      {/* ── context menu ─────────────────────────────── */}
      {contextMenu && (
        <div
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
            zIndex: 9999,
            backgroundColor: CTX_BG,
            borderRadius: 8,
            padding: '6px 8px',
            minWidth: 188,
            boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
            animation: 'ctxFadeIn 0.1s ease',
          }}
          role="menu"
        >
          <ContextMenuItem
            label="Invite People"
            icon={
              <UserPlus width={16} height={16} />
            }
            onClick={() => {
              onInviteToGuild?.(contextMenu.guildId)
              closeContextMenu()
            }}
          />
          <div style={{ height: 1, backgroundColor: CTX_SEPARATOR, margin: '4px 0' }} />
          <ContextMenuItem
            label="Leave Server"
            danger
            icon={
              <LogOut width={16} height={16} />
            }
            onClick={() => {
              onLeaveGuild?.(contextMenu.guildId)
              closeContextMenu()
            }}
          />
          <ContextMenuItem
            label="Copy Server ID"
            icon={
              <Clipboard width={16} height={16} />
            }
            onClick={() => {
              navigator.clipboard.writeText(String(contextMenu.guildId))
              closeContextMenu()
            }}
          />
          {ownedGuildIds?.has(contextMenu.guildId) && (
            <>
              <div style={{ height: 1, backgroundColor: CTX_SEPARATOR, margin: '4px 0' }} />
              <ContextMenuItem
                label="Delete Server"
                danger
                icon={
                  <Trash2 width={16} height={16} />
                }
                onClick={() => {
                  if (onDeleteGuild) onDeleteGuild(contextMenu.guildId)
                  setContextMenu(null)
                }}
              />
            </>
          )}
        </div>
      )}
    </nav>
  )
})
