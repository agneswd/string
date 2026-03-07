import { useState, useCallback, useEffect, useMemo, memo, type CSSProperties } from 'react'
import { Plus, UserPlus, LogOut, Clipboard, Trash2, LineSquiggle, Info, Settings, Phone } from 'lucide-react'
import {
  CTX_BG,
  CTX_SEPARATOR,
  ContextMenuItem,
  getInitials,
  ServerIcon,
  type ServerListPaneVariantProps,
} from './ServerListPane.shared'

const BG = 'var(--bg-sidebar-dark)'
const ICON_BG_ACTIVE = 'var(--accent-primary)'
const ICON_BG_HOVER = 'var(--accent-primary)'
const ADD_GREEN = 'var(--text-success)'
const SEPARATOR = 'var(--border-subtle)'

const rootStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  width: '100%',
  height: '100%',
  minHeight: 0,
  backgroundColor: BG,
  paddingTop: 12,
  paddingBottom: 12,
  boxSizing: 'border-box',
  overflowX: 'hidden',
  overflowY: 'auto',
  scrollbarWidth: 'none',
}

const separatorStyle: CSSProperties = {
  width: 32,
  height: 2,
  borderRadius: 1,
  backgroundColor: SEPARATOR,
  margin: '2px 0',
  flexShrink: 0,
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

const homeWrapStyle: CSSProperties = { width: '100%' }
const addServerWrapStyle: CSSProperties = { paddingBottom: 4, width: '100%' }

export const ServerListPaneClassic = memo(function ServerListPaneClassic({
  guilds,
  dmQuickEntries = [],
  selectedDmChannelId,
  onSelectDmChannel,
  selectedGuildId,
  onSelectGuild,
  onHomeClick,
  isHomeSelected,
  onAddServer,
  onLeaveGuild,
  onDeleteGuild,
  onInviteToGuild,
  onViewGuildInfo,
  onOpenGuildSettings,
  ownedGuildIds,
  onReorder,
  className,
}: ServerListPaneVariantProps) {
  const homeSelected = isHomeSelected ?? selectedGuildId === undefined
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const [dropPosition, setDropPosition] = useState<'above' | 'below' | null>(null)
  const [contextMenu, setContextMenu] = useState<{ guildId: string | number; x: number; y: number } | null>(null)

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
      aria-label="Looms"
    >
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

      {dmQuickEntries.length > 0 && (
        <div style={{ ...homeWrapStyle, display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8, marginBottom: 8 }}>
          {dmQuickEntries.map((entry) => (
            <div key={entry.channelId}>
              <ServerIcon
                label={entry.label}
                isSelected={selectedDmChannelId === entry.channelId}
                hasUnread={Boolean(entry.unreadCount)}
                unreadCount={entry.unreadCount}
                iconUrl={entry.avatarUrl}
                onClick={() => onSelectDmChannel?.(entry.channelId)}
                statusBadge={entry.hasActiveCall ? (
                  <span
                    style={{
                      position: 'absolute',
                      top: -1,
                      right: -1,
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      backgroundColor: 'var(--status-online)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: `3px solid ${BG}`,
                      boxSizing: 'border-box',
                      pointerEvents: 'none',
                    }}
                  >
                    <Phone width={9} height={9} />
                  </span>
                ) : undefined}
              >
                {getInitials(entry.label) || '#'}
              </ServerIcon>
            </div>
          ))}
        </div>
      )}

      <div style={{ ...separatorStyle, margin: '8px 0' }} />

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
                position: 'relative',
                width: '100%',
                borderTop: isDragOver && dropPosition === 'above' ? '2px solid var(--accent-primary)' : '2px solid transparent',
                borderBottom: isDragOver && dropPosition === 'below' ? '2px solid var(--accent-primary)' : '2px solid transparent',
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

      <div style={{ ...separatorStyle, margin: '8px 0' }} />

      <div style={addServerWrapStyle}>
        <ServerIcon
          label="Add a Loom"
          isSelected={false}
          bgHover={ADD_GREEN}
          onClick={onAddServer}
        >
          <Plus width={24} height={24} aria-hidden />
        </ServerIcon>
      </div>

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
            label="View Loom Info"
            icon={<Info width={16} height={16} />}
            onClick={() => {
              onViewGuildInfo?.(contextMenu.guildId)
              closeContextMenu()
            }}
          />
          {ownedGuildIds?.has(contextMenu.guildId) && (
            <ContextMenuItem
              label="Loom Settings"
              icon={<Settings width={16} height={16} />}
              onClick={() => {
                onOpenGuildSettings?.(contextMenu.guildId)
                closeContextMenu()
              }}
            />
          )}
          <div style={{ height: 1, backgroundColor: CTX_SEPARATOR, margin: '4px 0' }} />
          <ContextMenuItem
            label="Invite People"
            icon={<UserPlus width={16} height={16} />}
            onClick={() => {
              onInviteToGuild?.(contextMenu.guildId)
              closeContextMenu()
            }}
          />
          <div style={{ height: 1, backgroundColor: CTX_SEPARATOR, margin: '4px 0' }} />
          <ContextMenuItem
            label="Leave Loom"
            danger
            icon={<LogOut width={16} height={16} />}
            onClick={() => {
              onLeaveGuild?.(contextMenu.guildId)
              closeContextMenu()
            }}
          />
          <ContextMenuItem
            label="Copy Loom ID"
            icon={<Clipboard width={16} height={16} />}
            onClick={() => {
              navigator.clipboard.writeText(String(contextMenu.guildId))
              closeContextMenu()
            }}
          />
          {ownedGuildIds?.has(contextMenu.guildId) && (
            <>
              <div style={{ height: 1, backgroundColor: CTX_SEPARATOR, margin: '4px 0' }} />
              <ContextMenuItem
                label="Delete Loom"
                danger
                icon={<Trash2 width={16} height={16} />}
                onClick={() => {
                  onDeleteGuild?.(contextMenu.guildId)
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
