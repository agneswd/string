import React, { useCallback, useMemo, useState } from 'react'
import { Clipboard } from 'lucide-react'
import { VoiceUserContextMenu } from '../voice/VoiceUserContextMenu'
import { VoiceUserRow } from './channel-list/VoiceUserRow'
import { UserControlPanel } from './channel-list/UserControlPanel'
import { ChevronIcon, AddBtn, ChannelBtn } from './channel-list/ChannelBtn'
import { resolveS } from './channel-list/styles'
import { groupByCategory } from './channel-list/utils'

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
  ChannelListPaneProps,
} from './channel-list/types'

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
  const [contextMenu, setContextMenu] = useState<{
    x: number; y: number; identity: string; userName: string; isStreaming?: boolean
  } | null>(null)

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

  /* ── Render single channel row + voice users beneath ── */

  const renderChannel = useCallback(
    (channel: ChannelListItem) => {
      const cid = String(channel.id)
      const isActive = cid === String(selectedChannelId)
      const kind = channel.kind ?? 'text'
      const isCurrentVoice =
        kind === 'voice' && currentVoiceChannelId != null && cid === String(currentVoiceChannelId)
      const voiceUsers = kind === 'voice' ? voiceChannelUsers?.get(channel.id) : undefined

      return (
        <li key={cid} style={{ listStyle: 'none' }}>
          <ChannelBtn
            mode={layoutMode}
            id={cid}
            name={channel.name}
            kind={kind}
            isActive={isActive}
            isCurrentVoice={isCurrentVoice}
            unreadCount={channel.unreadCount}
            onSelect={() => onSelectChannel?.(channel.id)}
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
    [selectedChannelId, currentVoiceChannelId, voiceChannelUsers, locallyMutedUsers, localIdentity, getAvatarUrl, onSelectChannel, onViewScreenShare, styles, layoutMode],
  )

  /* ── Channel list — flat or categorised ── */

  const renderChannels = () => {
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
            onClick={() => toggleCategory(group.label)}
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
          {guildName && (
            <button
              type="button"
              className="clp-add-btn"
              style={{ ...styles.addBtn, width: 22, height: 22 }}
              onClick={(e) => {
                e.stopPropagation()
                void navigator.clipboard.writeText(guildName)
              }}
              title={'Copy guild name: ' + guildName}
              aria-label="Copy guild name"
            >
              <Clipboard style={{ width: 12, height: 12 }} aria-hidden="true" />
            </button>
          )}
        </div>
      </header>

      {/* Scrollable channel list */}
      <div style={styles.scrollArea}>{renderChannels()}</div>

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
    </nav>
  )
}
