import React, { useCallback, useMemo, useRef, useState } from 'react'
import { FolderPlus, Hash, Pencil, Trash2 } from 'lucide-react'
import { VoiceUserContextMenu } from '../voice/VoiceUserContextMenu'
import { VoiceUserRow } from './channel-list/VoiceUserRow'
import { UserControlPanel } from './channel-list/UserControlPanel'
import { ChevronIcon, AddBtn, ChannelBtn } from './channel-list/ChannelBtn'
import { resolveS } from './channel-list/styles'
import { groupByCategory } from './channel-list/utils'
import { ContextMenu } from '../ui/ContextMenu'

// Re-export all public types so existing imports keep working
export type {
  ChannelKind,
  ChannelListItem,
  UserPanelInfo,
  VoiceChannelUser,
  ChannelListPaneProps,
  CategoryGroup,
  LayoutMode,
} from './channel-list/types'

import type {
  ChannelListItem,
  ChannelLayoutUpdateItem,
  ChannelListPaneProps,
} from './channel-list/types'

function compareChannelItems(left: ChannelListItem, right: ChannelListItem) {
  const leftPosition = left.position ?? 0
  const rightPosition = right.position ?? 0

  if (leftPosition !== rightPosition) {
    return leftPosition - rightPosition
  }

  const leftId = String(left.id)
  const rightId = String(right.id)
  return leftId.localeCompare(rightId)
}

/* ── Inject mode-scoped hover styles once ── */
if (typeof document !== 'undefined' && !document.getElementById('clp-hover-styles')) {
  const style = document.createElement('style')
  style.id = 'clp-hover-styles'
  style.textContent = [
    /* Classic-mode hover (Discord-like) */
    '.clp-classic-mode .clp-header:hover { background-color: rgba(79,84,92,0.24) !important; }',
    '.clp-classic-mode .clp-add-btn:hover { color: #dbdee1 !important; }',
    '.clp-classic-mode .clp-control-btn:hover { background-color: rgba(79,84,92,0.32) !important; }',
    /* String-mode hover (editorial) */
    '.clp-string-mode .clp-header:hover { background-color: var(--bg-hover) !important; }',
    '.clp-string-mode .clp-add-btn:hover { color: var(--text-interactive-hover) !important; }',
    '.clp-string-mode .clp-control-btn:hover { background-color: var(--bg-hover) !important; }',
  ].join('\n')
  document.head.appendChild(style)
}

/* ── Main component ── */

export function ChannelListPane({
  guildName,
  channels,
  selectedChannelId,
  onSelectChannel,
  onCreateChannel,
  onCreateCategory,
  onEditChannel,
  onDeleteChannel,
  onSaveLayout,
  userPanel,
  onMuteToggle,
  onDeafenToggle,
  onViewScreenShare,
  isMuted = false,
  isDeafened = false,
  voiceChannelUsers,
  currentVoiceChannelId,
  locallyMutedUsers,
  onToggleLocalMuteUser,
  localIdentity,
  getAvatarUrl,
  className,
  layoutMode = 'classic',
}: ChannelListPaneProps) {
  const styles = resolveS(layoutMode)
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(() => new Set())
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const [dropPosition, setDropPosition] = useState<'above' | 'below' | null>(null)
  const [contextMenu, setContextMenu] = useState<{
    x: number; y: number; identity: string; userName: string; isStreaming?: boolean
  } | null>(null)
  const [channelMenu, setChannelMenu] = useState<{
    x: number
    y: number
    item?: ChannelListItem
  } | null>(null)
  const suppressPointerActionUntilRef = useRef(0)

  const usesStructuredCategories = useMemo(
    () => channels.some((channel) => channel.kind === 'category' || channel.parentCategoryId != null),
    [channels],
  )

  const orderedChannels = useMemo(
    () => [...channels].sort(compareChannelItems),
    [channels],
  )

  const rootItems = useMemo(
    () => orderedChannels.filter((channel) => channel.parentCategoryId == null).sort(compareChannelItems),
    [orderedChannels],
  )

  const childItemsByCategory = useMemo(() => {
    const next = new Map<string, ChannelListItem[]>()
    for (const channel of orderedChannels) {
      if (channel.parentCategoryId == null) {
        continue
      }
      const key = String(channel.parentCategoryId)
      const bucket = next.get(key)
      if (bucket) {
        bucket.push(channel)
      } else {
        next.set(key, [channel])
      }
    }

    for (const bucket of next.values()) {
      bucket.sort(compareChannelItems)
    }

    return next
  }, [orderedChannels])

  const toggleCategory = useCallback((cat: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }, [])

  const groups = useMemo(() => groupByCategory(channels), [channels])
  const hasCategories = groups.some((g) => g.label !== '')

  const buildLayout = useCallback((nextRootOrder: string[], nextChildOrder: Map<string, string[]>): ChannelLayoutUpdateItem[] => {
    const byId = new Map(orderedChannels.map((channel) => [String(channel.id), channel]))
    const layout: ChannelLayoutUpdateItem[] = []

    nextRootOrder.forEach((id, index) => {
      if (!byId.has(id)) return
      layout.push({ channelId: id, categoryId: null, position: index })
    })

    for (const [categoryId, childIds] of nextChildOrder.entries()) {
      childIds.forEach((id, index) => {
        if (!byId.has(id)) return
        layout.push({ channelId: id, categoryId, position: index })
      })
    }

    return layout
  }, [orderedChannels])

  const clearDragState = useCallback(() => {
    suppressPointerActionUntilRef.current = Date.now() + 200
    setDraggedId(null)
    setDragOverId(null)
    setDropPosition(null)
  }, [])

  const shouldSuppressPointerAction = useCallback(
    () => Date.now() < suppressPointerActionUntilRef.current,
    [],
  )

  const resolveDropPosition = useCallback((event: React.DragEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    return event.clientY < rect.top + rect.height / 2 ? 'above' as const : 'below' as const
  }, [])

  const moveItem = useCallback((draggedItemId: string, destinationCategoryId: string | null, targetIndex: number) => {
    if (!onSaveLayout) {
      return
    }

    const draggedItem = orderedChannels.find((channel) => String(channel.id) === draggedItemId)
    if (!draggedItem) {
      return
    }

    if (draggedItem.kind === 'category' && destinationCategoryId !== null) {
      return
    }

    const nextRootOrder = rootItems.map((item) => String(item.id)).filter((id) => id !== draggedItemId)
    const nextChildOrder = new Map(
      Array.from(childItemsByCategory.entries()).map(([categoryId, items]) => [
        categoryId,
        items.map((item) => String(item.id)).filter((id) => id !== draggedItemId),
      ]),
    )

    if (destinationCategoryId === null) {
      const insertIndex = Math.max(0, Math.min(targetIndex, nextRootOrder.length))
      nextRootOrder.splice(insertIndex, 0, draggedItemId)
    } else {
      const existing = nextChildOrder.get(destinationCategoryId) ?? []
      const insertIndex = Math.max(0, Math.min(targetIndex, existing.length))
      existing.splice(insertIndex, 0, draggedItemId)
      nextChildOrder.set(destinationCategoryId, existing)
    }

    onSaveLayout(buildLayout(nextRootOrder, nextChildOrder))
  }, [buildLayout, childItemsByCategory, onSaveLayout, orderedChannels, rootItems])

  const moveIntoCategory = useCallback((draggedItemId: string, categoryId: string) => {
    const childChannels = childItemsByCategory.get(categoryId) ?? []
    moveItem(draggedItemId, categoryId, childChannels.length)
  }, [childItemsByCategory, moveItem])

  /* ── Render single channel row + voice users beneath ── */

  const renderChannel = useCallback(
    (channel: ChannelListItem) => {
      const cid = String(channel.id)
      const isActive = cid === String(selectedChannelId)
      const kind = channel.kind ?? 'text'
      const isCurrentVoice =
        kind === 'voice' && currentVoiceChannelId != null && cid === String(currentVoiceChannelId)
      const voiceUsers = kind === 'voice' ? voiceChannelUsers?.get(channel.id) : undefined
      const handleSelect = () => {
        if (shouldSuppressPointerAction()) {
          return
        }
        onSelectChannel?.(channel.id)
      }

      return (
        <li
          key={cid}
          style={{ listStyle: 'none', opacity: draggedId === cid ? 0.45 : 1, borderTop: dragOverId === cid && dropPosition === 'above' ? '2px solid var(--accent-primary)' : '2px solid transparent', borderBottom: dragOverId === cid && dropPosition === 'below' ? '2px solid var(--accent-primary)' : '2px solid transparent' }}
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData('text/plain', cid)
            e.dataTransfer.effectAllowed = 'move'
            setDraggedId(cid)
          }}
          onDragEnd={clearDragState}
          onDragOver={(e) => {
            e.preventDefault()
            e.stopPropagation()
            if (!onSaveLayout) return
            const nextDropPosition = resolveDropPosition(e)
            setDragOverId(cid)
            setDropPosition(nextDropPosition)
          }}
          onDrop={(e) => {
            e.preventDefault()
            e.stopPropagation()
            if (!onSaveLayout) return
            const sourceId = e.dataTransfer.getData('text/plain')
            if (!sourceId || sourceId === cid) return
            const nextDropPosition = resolveDropPosition(e)
            const siblings = channel.parentCategoryId == null
              ? rootItems.map((item) => String(item.id))
              : (childItemsByCategory.get(String(channel.parentCategoryId)) ?? []).map((item) => String(item.id))
            const targetIndex = siblings.indexOf(cid) + (nextDropPosition === 'below' ? 1 : 0)
            moveItem(sourceId, channel.parentCategoryId == null ? null : String(channel.parentCategoryId), targetIndex)
            clearDragState()
          }}
          onContextMenu={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setChannelMenu({ x: e.clientX, y: e.clientY, item: channel })
          }}
        >
          <ChannelBtn
            mode={layoutMode}
            id={cid}
            name={channel.name}
            kind={kind}
            isActive={isActive}
            isCurrentVoice={isCurrentVoice}
            unreadCount={channel.unreadCount}
            onSelect={handleSelect}
            styles={styles}
          />
          {voiceUsers?.map((user) => (
            <VoiceUserRow
              key={user.identity}
              mode={layoutMode}
              user={user}
              isLocallyMuted={locallyMutedUsers?.has(user.identity) ?? false}
              getAvatarUrl={getAvatarUrl}
              onViewScreenShare={onViewScreenShare}
              onContextMenu={
                user.identity === localIdentity
                  ? undefined
                  : (e) => {
                      e.preventDefault()
                      setContextMenu({
                        x: e.clientX,
                        y: e.clientY,
                        identity: user.identity,
                        userName: user.displayName,
                        isStreaming: user.isStreaming,
                      })
                    }
              }
            />
          ))}
        </li>
      )
    },
    [selectedChannelId, currentVoiceChannelId, voiceChannelUsers, locallyMutedUsers, localIdentity, getAvatarUrl, onSelectChannel, onViewScreenShare, styles, layoutMode, draggedId, dragOverId, dropPosition, onSaveLayout, orderedChannels, rootItems, childItemsByCategory, moveItem, moveIntoCategory, clearDragState, resolveDropPosition, shouldSuppressPointerAction],
  )

  /* ── Channel list — flat or categorised ── */

  const renderChannels = () => {
    if (usesStructuredCategories) {
      return (
        <div onContextMenu={(e) => {
          e.preventDefault()
          setChannelMenu({ x: e.clientX, y: e.clientY })
        }}>
          <ul
            style={{ margin: 0, padding: 0 }}
            onDragOver={(e) => {
              if (!onSaveLayout) return
              if (e.target !== e.currentTarget) return
              e.preventDefault()
              e.stopPropagation()
              setDragOverId('__root__')
              setDropPosition(null)
            }}
            onDrop={(e) => {
              if (!onSaveLayout) return
              if (e.target !== e.currentTarget) return
              e.preventDefault()
              e.stopPropagation()
              const sourceId = e.dataTransfer.getData('text/plain')
              if (!sourceId) return
              moveItem(sourceId, null, rootItems.length)
              clearDragState()
            }}
          >
            {rootItems.map((item) => {
              if (item.kind === 'category') {
                const categoryId = String(item.id)
                const isCollapsed = collapsedCategories.has(categoryId)
                const childChannels = childItemsByCategory.get(categoryId) ?? []
                return (
                  <li
                    key={categoryId}
                    style={{ listStyle: 'none' }}
                  >
                    <div
                      style={{
                        ...styles.categoryHeader,
                        opacity: draggedId === categoryId ? 0.45 : 1,
                        borderTop: dragOverId === categoryId && dropPosition === 'above' ? '2px solid var(--accent-primary)' : '2px solid transparent',
                        borderBottom: dragOverId === categoryId && dropPosition === 'below' ? '2px solid var(--accent-primary)' : '2px solid transparent',
                      }}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', categoryId)
                        e.dataTransfer.effectAllowed = 'move'
                        setDraggedId(categoryId)
                      }}
                      onDragEnd={clearDragState}
                      onDragOver={(e) => {
                        if (!onSaveLayout) return
                        e.preventDefault()
                        e.stopPropagation()
                        const nextDropPosition = resolveDropPosition(e)
                        setDragOverId(categoryId)
                        setDropPosition(nextDropPosition)
                      }}
                      onDrop={(e) => {
                        if (!onSaveLayout) return
                        e.preventDefault()
                        e.stopPropagation()
                        const sourceId = e.dataTransfer.getData('text/plain')
                        if (!sourceId || sourceId === categoryId) return
                        const draggedItem = orderedChannels.find((entry) => String(entry.id) === sourceId)
                        if (draggedItem && draggedItem.kind !== 'category') {
                          moveIntoCategory(sourceId, categoryId)
                          clearDragState()
                          return
                        }
                        const nextDropPosition = resolveDropPosition(e)
                        const targetIndex = rootItems.findIndex((entry) => String(entry.id) === categoryId) + (nextDropPosition === 'below' ? 1 : 0)
                        moveItem(sourceId, null, targetIndex)
                        clearDragState()
                      }}
                      onClick={() => {
                        if (shouldSuppressPointerAction()) {
                          return
                        }
                        toggleCategory(categoryId)
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setChannelMenu({ x: e.clientX, y: e.clientY, item })
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          toggleCategory(categoryId)
                        }
                      }}
                      aria-expanded={!isCollapsed}
                      aria-label={item.name + ' category'}
                    >
                      <ChevronIcon collapsed={isCollapsed} style={styles.categoryChevron} />
                      <span style={styles.categoryLabel}>{item.name}</span>
                      {onCreateChannel && (
                        <AddBtn
                          label={'Create channel in ' + item.name}
                          size={11}
                          onClick={(e) => {
                            e.stopPropagation()
                            onCreateChannel?.(item.id)
                          }}
                          baseStyle={styles.addBtn}
                        />
                      )}
                    </div>
                    {!isCollapsed && (
                      <ul
                        style={{ margin: 0, padding: '0 0 0 2px' }}
                        onDragOver={(e) => {
                          if (!onSaveLayout) return
                          e.preventDefault()
                          e.stopPropagation()
                          setDragOverId(categoryId + ':children')
                        }}
                        onDrop={(e) => {
                          if (!onSaveLayout) return
                          e.preventDefault()
                          e.stopPropagation()
                          const sourceId = e.dataTransfer.getData('text/plain')
                          if (!sourceId) return
                          moveIntoCategory(sourceId, categoryId)
                          clearDragState()
                        }}
                      >
                        {childChannels.map(renderChannel)}
                      </ul>
                    )}
                  </li>
                )
              }

              return renderChannel(item)
            })}
          </ul>
        </div>
      )
    }

    if (!hasCategories) {
      return <ul style={{ margin: 0, padding: 0 }}>{channels.map(renderChannel)}</ul>
    }

    return groups.map((group) => {
      if (group.label === '') {
        return (
          <ul key="__uncategorised" style={{ margin: 0, padding: 0 }}>
            {group.channels.map(renderChannel)}
          </ul>
        )
      }

      const isCollapsed = collapsedCategories.has(group.label)
      return (
        <div key={group.label}>
          <div
            style={styles.categoryHeader}
            onClick={() => {
              if (shouldSuppressPointerAction()) {
                return
              }
              toggleCategory(group.label)
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                toggleCategory(group.label)
              }
            }}
            aria-expanded={!isCollapsed}
            aria-label={group.label + ' category'}
          >
            <ChevronIcon collapsed={isCollapsed} style={styles.categoryChevron} />
            <span style={styles.categoryLabel}>{group.label}</span>
            {onCreateChannel && (
              <AddBtn
                label={'Create channel in ' + group.label}
                size={11}
                onClick={(e) => { e.stopPropagation(); onCreateChannel() }}
                baseStyle={styles.addBtn}
              />
            )}
          </div>
          {!isCollapsed && (
            <ul style={{ margin: 0, padding: '0 0 0 2px' }}>
              {group.channels.map(renderChannel)}
            </ul>
          )}
        </div>
      )
    })
  }

  /* ── Output ── */

  return (
    <nav
      className={['tw-channel-list', `clp-${layoutMode}-mode`, className ?? ''].filter(Boolean).join(' ')}
      style={styles.root}
      aria-label="Channels"
    >
      {/* Guild / server header */}
      <header className="clp-header" style={styles.header}>
        <span style={styles.headerName}>{guildName ?? 'Guild'}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {onCreateChannel && (
            <AddBtn
              label="Create Channel"
              size={13}
              onClick={(e) => { e.stopPropagation(); onCreateChannel() }}
              baseStyle={styles.addBtn}
            />
          )}
        </div>
      </header>

      {/* Scrollable channel list */}
      <div
        style={styles.scrollArea}
        onContextMenu={(e) => {
          e.preventDefault()
          if (e.target !== e.currentTarget) {
            return
          }
          setChannelMenu({ x: e.clientX, y: e.clientY })
        }}
        onDragLeave={(e) => {
          if (e.currentTarget.contains(e.relatedTarget as Node | null)) {
            return
          }
          setDragOverId(null)
          setDropPosition(null)
        }}
      >
        {renderChannels()}
      </div>

      {/* Bottom user control panel */}
      {userPanel && (
        <UserControlPanel
          userPanel={userPanel}
          isMuted={isMuted}
          isDeafened={isDeafened}
          onMuteToggle={onMuteToggle}
          onDeafenToggle={onDeafenToggle}
          mode={layoutMode}
        />
      )}

      {/* Voice user context menu */}
      {contextMenu && (
        <VoiceUserContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          userName={contextMenu.userName}
          isStreaming={contextMenu.isStreaming}
          isLocallyMuted={locallyMutedUsers?.has(contextMenu.identity) ?? false}
          onViewScreenShare={
            contextMenu.isStreaming ? () => onViewScreenShare?.(contextMenu.identity) : undefined
          }
          onToggleLocalMute={() => onToggleLocalMuteUser?.(contextMenu.identity)}
          onClose={() => setContextMenu(null)}
        />
      )}

      {channelMenu && (
        <ContextMenu
          x={channelMenu.x}
          y={channelMenu.y}
          items={channelMenu.item
            ? [
                ...(channelMenu.item.kind === 'category' && onCreateChannel
                  ? [{ label: 'Create Channel', icon: <Hash style={{ width: 16, height: 16 }} />, onClick: () => onCreateChannel(channelMenu.item!.id) }]
                  : []),
                ...(onEditChannel
                  ? [{ label: channelMenu.item.kind === 'category' ? 'Edit Category' : 'Edit Channel', icon: <Pencil style={{ width: 16, height: 16 }} />, onClick: () => onEditChannel(channelMenu.item!.id) }]
                  : []),
                ...(onDeleteChannel
                  ? [{ label: channelMenu.item.kind === 'category' ? 'Delete Category' : 'Delete Channel', icon: <Trash2 style={{ width: 16, height: 16 }} />, onClick: () => onDeleteChannel(channelMenu.item!.id), danger: true }]
                  : []),
              ]
            : [
                ...(onCreateCategory ? [{ label: 'Create Category', icon: <FolderPlus style={{ width: 16, height: 16 }} />, onClick: () => onCreateCategory() }] : []),
                ...(onCreateChannel ? [{ label: 'Create Channel', icon: <Hash style={{ width: 16, height: 16 }} />, onClick: () => onCreateChannel() }] : []),
              ]}
          onClose={() => setChannelMenu(null)}
        />
      )}
    </nav>
  )
}
