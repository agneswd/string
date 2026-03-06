import { useState, useCallback, useEffect, useMemo, memo, type MouseEvent, type ReactNode } from 'react'
import { UserPlus, LogOut, Clipboard, Trash2, LineSquiggle } from 'lucide-react'
import {
  ContextMenuItem,
  getInitials,
  type GuildId,
  type ServerListPaneVariantProps,
} from './ServerListPane.shared'

const WS_ROW_H = 36

function StringRow({
  label,
  isSelected,
  hasUnread,
  unreadCount,
  iconUrl,
  initials,
  isHome,
  onClick,
  onContextMenu,
  children,
}: {
  label: string
  isSelected: boolean
  hasUnread?: boolean
  unreadCount?: number
  iconUrl?: string
  initials?: string
  isHome?: boolean
  onClick?: () => void
  onContextMenu?: (e: MouseEvent<HTMLButtonElement>) => void
  children?: ReactNode
}) {
  const [hovered, setHovered] = useState(false)

  const bg = isSelected
    ? 'var(--bg-active)'
    : hovered
    ? 'var(--bg-hover)'
    : 'transparent'

  return (
    <button
      type="button"
      onClick={onClick}
      onContextMenu={onContextMenu}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-label={label}
      aria-pressed={isSelected}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        width: '100%',
        height: WS_ROW_H,
        padding: '0 8px 0 10px',
        border: 'none',
        borderLeft: isSelected ? '3px solid var(--accent-primary)' : '3px solid transparent',
        borderRadius: '0 6px 6px 0',
        backgroundColor: bg,
        cursor: 'pointer',
        textAlign: 'left',
        boxSizing: 'border-box',
        transition: 'background-color 0.1s ease',
        flexShrink: 0,
        position: 'relative',
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 6,
          backgroundColor: isHome
            ? 'var(--accent-primary)'
            : isSelected
            ? 'var(--accent-subtle, rgba(192,122,79,0.25))'
            : 'var(--bg-sidebar-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          overflow: 'hidden',
          ...(iconUrl
            ? { backgroundImage: `url(${iconUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
            : {}),
        }}
      >
        {!iconUrl && (
          <span style={{ color: isHome ? '#fff' : isSelected ? 'var(--accent-primary)' : 'var(--text-muted)', fontSize: 12, fontWeight: 700 }}>
            {children ?? initials ?? '#'}
          </span>
        )}
      </div>

      <span
        style={{
          flex: 1,
          minWidth: 0,
          fontFamily: 'var(--font-mono)',
          fontSize: 13,
          fontWeight: isSelected ? 600 : 400,
          color: isSelected ? 'var(--text-primary)' : hovered ? 'var(--text-normal)' : 'var(--text-secondary)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          lineHeight: 1.3,
        }}
      >
        {label}
      </span>

      {!!unreadCount && unreadCount > 0 && (
        <span
          style={{
            minWidth: 16,
            height: 16,
            padding: '0 4px',
            borderRadius: 8,
            backgroundColor: 'var(--status-dnd)',
            color: 'var(--text-primary)',
            fontSize: 11,
            fontWeight: 700,
            lineHeight: '16px',
            textAlign: 'center',
            flexShrink: 0,
          }}
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
      {hasUnread && !unreadCount && (
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: 'var(--text-muted)',
            flexShrink: 0,
          }}
        />
      )}
    </button>
  )
}

export const ServerListPaneString = memo(function ServerListPaneString({
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
}: ServerListPaneVariantProps) {
  const homeSelected = isHomeSelected ?? selectedGuildId === undefined
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const [dropPosition, setDropPosition] = useState<'above' | 'below' | null>(null)
  const [contextMenu, setContextMenu] = useState<{ guildId: GuildId; x: number; y: number } | null>(null)

  const closeContextMenu = useCallback(() => setContextMenu(null), [])

  useEffect(() => {
    if (!contextMenu) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeContextMenu() }
    const onClickOut = () => closeContextMenu()
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onClickOut)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onClickOut)
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
      aria-label="Workspaces"
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        minHeight: 0,
        backgroundColor: 'var(--bg-deepest)',
        overflowX: 'hidden',
        overflowY: 'auto',
        scrollbarWidth: 'none',
        boxSizing: 'border-box',
        paddingBottom: 12,
      }}
    >
      <div
        style={{
          padding: '16px 12px 6px',
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
          userSelect: 'none',
        }}
      >
        Workspaces
      </div>

      <div style={{ padding: '0 6px 0 0' }}>
        <StringRow
          label="Direct Messages"
          isSelected={homeSelected}
          isHome
          onClick={onHomeClick}
        >
          <LineSquiggle size={14} />
        </StringRow>
      </div>

      <div
        style={{
          height: 1,
          backgroundColor: 'var(--border-subtle)',
          margin: '6px 12px',
          flexShrink: 0,
        }}
      />

      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          scrollbarWidth: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          padding: '0 6px 0 0',
        }}
      >
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
                setDropPosition(e.clientY < rect.top + rect.height / 2 ? 'above' : 'below')
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
                const adjustedToIdx =
                  dropPosition === 'below'
                    ? fromIdx < toIdx ? toIdx : toIdx + 1
                    : fromIdx < toIdx ? toIdx - 1 : toIdx
                newOrder.splice(adjustedToIdx, 0, fromId)
                onReorder?.(newOrder)
                setDraggedId(null)
                setDragOverId(null)
                setDropPosition(null)
              }}
              style={{
                opacity: isDragging ? 0.4 : 1,
                transition: 'opacity 0.15s ease',
                borderTop: isDragOver && dropPosition === 'above' ? '2px solid var(--accent-primary)' : '2px solid transparent',
                borderBottom: isDragOver && dropPosition === 'below' ? '2px solid var(--accent-primary)' : '2px solid transparent',
              }}
            >
              <StringRow
                label={guild.name}
                isSelected={guild.isSelected}
                hasUnread={!!guild.unreadCount && guild.unreadCount > 0}
                unreadCount={guild.unreadCount}
                iconUrl={guild.iconUrl}
                initials={guild.initials || '#'}
                onClick={() => onSelectGuild?.(guild.id)}
                onContextMenu={(e) => {
                  e.preventDefault()
                  setContextMenu({ guildId: guild.id, x: e.clientX, y: e.clientY })
                }}
              />
            </div>
          )
        })}
      </div>

      <div
        style={{
          height: 1,
          backgroundColor: 'var(--border-subtle)',
          margin: '6px 12px',
          flexShrink: 0,
        }}
      />

      <div style={{ padding: '0 6px 0 0' }}>
        <StringRow
          label="Add Workspace"
          isSelected={false}
          initials="+"
          onClick={onAddServer}
        />
      </div>

      {contextMenu && (
        <div
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            top: contextMenu.y,
            left: contextMenu.x,
            zIndex: 9999,
            backgroundColor: '#111214',
            borderRadius: 8,
            padding: '6px 8px',
            minWidth: 188,
            boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
          }}
          role="menu"
        >
          <ContextMenuItem
            label="Invite People"
            icon={<UserPlus width={16} height={16} />}
            onClick={() => { onInviteToGuild?.(contextMenu.guildId); closeContextMenu() }}
          />
          <div style={{ height: 1, backgroundColor: '#2e2f34', margin: '4px 0' }} />
          <ContextMenuItem
            label="Leave Server"
            danger
            icon={<LogOut width={16} height={16} />}
            onClick={() => { onLeaveGuild?.(contextMenu.guildId); closeContextMenu() }}
          />
          <ContextMenuItem
            label="Copy Server ID"
            icon={<Clipboard width={16} height={16} />}
            onClick={() => { navigator.clipboard.writeText(String(contextMenu.guildId)); closeContextMenu() }}
          />
          {ownedGuildIds?.has(contextMenu.guildId) && (
            <>
              <div style={{ height: 1, backgroundColor: '#2e2f34', margin: '4px 0' }} />
              <ContextMenuItem
                label="Delete Server"
                danger
                icon={<Trash2 width={16} height={16} />}
                onClick={() => { onDeleteGuild?.(contextMenu.guildId); setContextMenu(null) }}
              />
            </>
          )}
        </div>
      )}
    </nav>
  )
})
