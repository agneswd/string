import React, { useState, useCallback, useMemo } from 'react'
import type { GuildId } from './ServerListPane'
import { VoiceUserContextMenu } from '../voice/VoiceUserContextMenu'
import { getAvatarColor, getInitial } from '../../lib/avatarUtils'
import { Volume2, Monitor, Mic, MicOff, HeadphoneOff, Headphones, ChevronDown, Plus, Clipboard } from 'lucide-react'

/* ── Inject hover styles once ── */
if (typeof document !== 'undefined' && !document.getElementById('channel-list-hover-styles')) {
  const style = document.createElement('style')
  style.id = 'channel-list-hover-styles'
  style.textContent = `
    .clp-header:hover { background-color: rgba(79,84,92,0.24) !important; }
    .clp-create-btn:hover { color: #dbdee1 !important; }
    .clp-control-btn:hover { background-color: rgba(79,84,92,0.32) !important; }
  `
  document.head.appendChild(style)
}

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type ChannelKind = 'text' | 'voice'

export interface ChannelListItem {
  id: GuildId
  name: string
  kind?: ChannelKind
  category?: string
  unreadCount?: number
}

export interface UserPanelInfo {
  displayName: string
  username?: string
  status?: string
  avatarUrl?: string
}

export interface VoiceChannelUser {
  identity: string
  displayName: string
  isMuted: boolean
  isDeafened: boolean
  isSpeaking?: boolean
  isStreaming?: boolean
}

export interface ChannelListPaneProps {
  guildName?: string
  channels: ChannelListItem[]
  selectedChannelId?: GuildId
  onSelectChannel?: (channelId: GuildId) => void
  /** Optional user info to render in the bottom user panel */
  userPanel?: UserPanelInfo
  onCreateChannel?: () => void
  onMuteToggle?: () => void
  onDeafenToggle?: () => void
  onViewScreenShare?: (identity: string) => void
  isMuted?: boolean
  isDeafened?: boolean
  voiceChannelUsers?: Map<string | number, VoiceChannelUser[]>
  currentVoiceChannelId?: string | number
  locallyMutedUsers?: Set<string>
  onToggleLocalMuteUser?: (identity: string) => void
  localIdentity?: string
  getAvatarUrl?: (identity: string) => string | undefined
  className?: string
}

/* ------------------------------------------------------------------ */
/*  Styles (inline – no Tailwind dependency for critical layout)       */
/* ------------------------------------------------------------------ */

const colors = {
  bg: '#2b2d31',
  bgHeader: '#2b2d31',
  bgHeaderBorder: '#1f2023',
  bgHover: 'rgba(79,84,92,0.32)',
  bgSelected: 'rgba(79,84,92,0.6)',
  bgUserPanel: '#232428',
  textCategory: '#949ba4',
  textChannel: '#949ba4',
  textChannelHover: '#dbdee1',
  textChannelActive: '#ffffff',
  textGuildName: '#ffffff',
  textUserName: '#f2f3f5',
  textUserStatus: '#949ba4',
  badgeBg: '#f23f43',
  badgeText: '#ffffff',
  iconMuted: '#f23f43',
  iconDefault: '#b5bac1',
} as const

const S = {
  root: {
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100%',
    minHeight: 0,
    width: 240,
    minWidth: 240,
    maxWidth: 240,
    backgroundColor: colors.bg,
    color: colors.textChannel,
    fontFamily:
      'var(--font-sans, "gg sans", "Noto Sans", "Helvetica Neue", Helvetica, Arial, sans-serif)',
    userSelect: 'none' as const,
  },

  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
    padding: '0 16px',
    flexShrink: 0,
    borderBottom: `1px solid ${colors.bgHeaderBorder}`,
    backgroundColor: colors.bgHeader,
    cursor: 'pointer',
    transition: 'background-color 0.15s',
  },

  headerName: {
    fontSize: 16,
    fontWeight: 600,
    color: colors.textGuildName,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
    lineHeight: '20px',
  },

  scrollArea: {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto' as const,
    overflowX: 'hidden' as const,
    padding: '0 8px 8px',
  },

  categoryHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    padding: '18px 0 4px 2px',
    cursor: 'pointer',
    userSelect: 'none' as const,
  },

  categoryLabel: {
    fontSize: 12,
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.02em',
    color: colors.textCategory,
    lineHeight: '16px',
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },

  categoryChevron: {
    width: 12,
    height: 12,
    flexShrink: 0,
    color: colors.textCategory,
    transition: 'transform 0.15s ease',
  },

  channelBtn: (isActive: boolean) =>
    ({
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      width: '100%',
      padding: '6px 8px',
      marginTop: 1,
      borderRadius: 4,
      border: 'none',
      background: isActive ? colors.bgSelected : 'transparent',
      color: isActive ? colors.textChannelActive : colors.textChannel,
      fontSize: 15,
      fontWeight: isActive ? 600 : 500,
      lineHeight: '20px',
      cursor: 'pointer',
      textAlign: 'left' as const,
      fontFamily: 'inherit',
      transition: 'background-color 0.1s, color 0.1s',
    }),

  channelPrefix: {
    flexShrink: 0,
    width: 20,
    textAlign: 'center' as const,
    fontSize: 18,
    lineHeight: '20px',
    opacity: 0.7,
  },

  channelName: {
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },

  badge: {
    flexShrink: 0,
    backgroundColor: colors.badgeBg,
    color: colors.badgeText,
    fontSize: 10,
    fontWeight: 700,
    lineHeight: '16px',
    padding: '0 5px',
    borderRadius: 8,
    minWidth: 16,
    textAlign: 'center' as const,
  },

  userPanel: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 8px',
    flexShrink: 0,
    backgroundColor: colors.bgUserPanel,
    borderTop: `1px solid ${colors.bgHeaderBorder}`,
    minHeight: 52,
  },

  avatar: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    backgroundColor: '#5865f2',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 14,
    fontWeight: 700,
    flexShrink: 0,
    overflow: 'hidden',
  },

  userInfo: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column' as const,
  },

  userName: {
    fontSize: 13,
    fontWeight: 600,
    color: colors.textUserName,
    lineHeight: '16px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },

  userStatus: {
    fontSize: 11,
    color: colors.textUserStatus,
    lineHeight: '14px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },

  controlBtn: (active: boolean) =>
    ({
      width: 32,
      height: 32,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: 'none',
      borderRadius: 4,
      background: 'transparent',
      color: active ? colors.iconMuted : colors.iconDefault,
      cursor: 'pointer',
      padding: 0,
      flexShrink: 0,
      transition: 'background-color 0.1s',
    }),
} as const

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

interface CategoryGroup {
  label: string
  channels: ChannelListItem[]
}

function groupByCategory(channels: ChannelListItem[]): CategoryGroup[] {
  const map = new Map<string, ChannelListItem[]>()
  const order: string[] = []

  for (const ch of channels) {
    const cat = ch.category ?? ''
    if (!map.has(cat)) {
      map.set(cat, [])
      order.push(cat)
    }
    map.get(cat)!.push(ch)
  }

  return order.map((label) => ({ label, channels: map.get(label)! }))
}

/* ------------------------------------------------------------------ */
/*  Chevron SVG                                                        */
/* ------------------------------------------------------------------ */

function ChevronIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <ChevronDown
      style={{
        ...S.categoryChevron,
        transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
      }}
      aria-hidden="true"
    />
  )
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

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
}: ChannelListPaneProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(
    () => new Set(),
  )
  const [contextMenu, setContextMenu] = React.useState<{
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

  /* ---------- render helpers ---------- */

  const renderChannel = (channel: ChannelListItem) => {
    const isActive = String(channel.id) === String(selectedChannelId)
    const isHovered = hoveredId === String(channel.id)
    const kind: ChannelKind = channel.kind ?? 'text'
    const prefix = kind === 'voice' ? null : '#'
    const isCurrentVoice =
      kind === 'voice' &&
      currentVoiceChannelId != null &&
      String(channel.id) === String(currentVoiceChannelId)

    const btnStyle: React.CSSProperties = {
      ...S.channelBtn(isActive),
      ...(isHovered && !isActive
        ? { backgroundColor: colors.bgHover, color: colors.textChannelHover }
        : {}),
      ...(isCurrentVoice
        ? {
            backgroundColor: 'rgba(59,165,93,0.15)',
            boxShadow: 'inset 2px 0 0 #3ba55d',
          }
        : {}),
    }

    const voiceUsers =
      kind === 'voice' ? voiceChannelUsers?.get(channel.id) : undefined

    return (
      <li key={String(channel.id)} style={{ listStyle: 'none' }}>
        <button
          type="button"
          style={btnStyle}
          onClick={() => onSelectChannel?.(channel.id)}
          onMouseEnter={() => setHoveredId(String(channel.id))}
          onMouseLeave={() => setHoveredId(null)}
          aria-pressed={isActive}
          title={channel.name}
        >
          <span style={S.channelPrefix}>{prefix ?? (
            <Volume2 style={{ width: 16, height: 16, flexShrink: 0 }} />
          )}</span>
          <span style={S.channelName}>{channel.name}</span>
          {!!channel.unreadCount && (
            <span style={S.badge}>{channel.unreadCount}</span>
          )}
        </button>
        {voiceUsers?.map((user) => (
          <div
            key={user.identity}
            onContextMenu={(e) => {
              e.preventDefault()
              if (user.identity === localIdentity) return
              setContextMenu({ x: e.clientX, y: e.clientY, identity: user.identity, userName: user.displayName, isStreaming: user.isStreaming })
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '2px 8px 2px 44px',
              fontSize: '13px',
              color: 'var(--text-channels-default, #949ba4)',
            }}
          >
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                backgroundColor: getAvatarUrl?.(user.identity) ? 'transparent' : getAvatarColor(user.displayName),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: '11px',
                fontWeight: 600,
                flexShrink: 0,
                overflow: 'hidden',
                border: user.isSpeaking
                  ? '2px solid #3ba55d'
                  : '2px solid transparent',
                transition: 'border-color 0.15s',
              }}
            >
              {getAvatarUrl?.(user.identity) ? (
                <img src={getAvatarUrl(user.identity)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                getInitial(user.displayName)
              )}
            </div>
            <span
              style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {user.displayName}
            </span>
            {user.isStreaming && (
              <>
                <button onClick={(e) => { e.stopPropagation(); onViewScreenShare?.(user.identity); }} style={{
                  backgroundColor: '#ed4245',
                  color: '#fff',
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: '3px',
                  marginLeft: '4px',
                  textTransform: 'uppercase',
                  lineHeight: '14px',
                  border: 'none',
                  cursor: 'pointer',
                }}>
                  LIVE
                </button>
                <Monitor
                  style={{ width: 14, height: 14, marginLeft: '2px', flexShrink: 0 }}
                  aria-label="Screen sharing"
                />
              </>
            )}
            {user.isMuted && (
              <span title="Muted" style={{ opacity: 0.8, display: 'flex', alignItems: 'center' }}>
                <MicOff size={16} />
              </span>
            )}
            {user.isDeafened && (
              <span title="Deafened" style={{ opacity: 0.8, display: 'flex', alignItems: 'center' }}>
                <HeadphoneOff size={16} />
              </span>
            )}
            {locallyMutedUsers?.has(user.identity) && (
              <span title="Locally muted" style={{ opacity: 0.9, display: 'flex', alignItems: 'center' }}>
                <MicOff size={16} color="#ed4245" />
              </span>
            )}
          </div>
        ))}
      </li>
    )
  }

  /* ---------- main render ---------- */

  return (
    <nav
      className={['tw-channel-list', className ?? ''].filter(Boolean).join(' ')}
      style={S.root}
      aria-label="Channels"
    >
      {/* ── Server header ── */}
      <header
        className="clp-header"
        style={S.header}
      >
        <span style={S.headerName}>{guildName ?? 'Guild'}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {onCreateChannel && (
            <button
              type="button"
              style={{
                width: 18,
                height: 18,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                borderRadius: '50%',
                background: 'transparent',
                color: colors.textCategory,
                fontSize: 16,
                fontWeight: 700,
                lineHeight: 1,
                cursor: 'pointer',
                padding: 0,
                transition: 'color 0.15s',
              }}
              className="clp-create-btn"
              onClick={(e) => {
                e.stopPropagation()
                onCreateChannel()
              }}
              title="Create Channel"
              aria-label="Create Channel"
            >
              <Plus style={{ width: 14, height: 14 }} aria-hidden="true" />
            </button>
          )}
          {guildName && (
            <button
              type="button"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: colors.textCategory,
                fontSize: 14,
                padding: 4,
                borderRadius: 4,
                lineHeight: 1,
                display: 'flex',
              }}
              onClick={(e) => {
                e.stopPropagation()
                void navigator.clipboard.writeText(guildName)
              }}
              title={`Copy Guild Name: ${guildName}`}
              aria-label="Copy guild name"
            >
              <Clipboard style={{ width: 14, height: 14 }} />
            </button>
          )}
        </div>
      </header>

      {/* ── Scrollable channel list ── */}
      <div style={S.scrollArea}>
        {hasCategories
          ? groups.map((group) => {
              const isCollapsed = collapsedCategories.has(group.label)
              // Uncategorised channels always show
              if (group.label === '') {
                return (
                  <ul key="__uncategorised" style={{ margin: 0, padding: 0 }}>
                    {group.channels.map(renderChannel)}
                  </ul>
                )
              }
              return (
                <div key={group.label}>
                  <div
                    style={S.categoryHeader}
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
                    aria-label={`${group.label} category`}
                  >
                    <ChevronIcon collapsed={isCollapsed} />
                    <span style={S.categoryLabel}>{group.label}</span>
                    {onCreateChannel && (
                      <button
                        type="button"
                        style={{
                          width: 16,
                          height: 16,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: 'none',
                          borderRadius: '50%',
                          background: 'transparent',
                          color: colors.textCategory,
                          fontSize: 14,
                          fontWeight: 700,
                          lineHeight: 1,
                          cursor: 'pointer',
                          padding: 0,
                          flexShrink: 0,
                          transition: 'color 0.15s',
                        }}
                        className="clp-create-btn"
                        onClick={(e) => {
                          e.stopPropagation()
                          onCreateChannel()
                        }}
                        title="Create Channel"
                        aria-label={`Create channel in ${group.label}`}
                      >
                        <Plus style={{ width: 12, height: 12 }} aria-hidden="true" />
                      </button>
                    )}
                  </div>
                  {!isCollapsed && (
                    <ul style={{ margin: 0, padding: '0 0 0 4px' }}>
                      {group.channels.map(renderChannel)}
                    </ul>
                  )}
                </div>
              )
            })
          : /* No categories – flat list */
            <ul style={{ margin: 0, padding: 0 }}>
              {channels.map(renderChannel)}
            </ul>
        }
      </div>

      {/* ── User panel ── */}
      {userPanel && (
        <div style={S.userPanel} title={userPanel.username ? `@${userPanel.username}` : undefined}>
          <div style={S.avatar}>
            {userPanel.avatarUrl ? (
              <img
                src={userPanel.avatarUrl}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              userPanel.displayName.charAt(0).toUpperCase()
            )}
          </div>
          <div style={S.userInfo}>
            <span style={S.userName}>{userPanel.displayName}</span>
            {userPanel.status && (
              <span style={S.userStatus}>{userPanel.status}</span>
            )}
          </div>
          {onMuteToggle && (
            <button
              type="button"
              className="clp-control-btn"
              style={S.controlBtn(isMuted)}
              onClick={onMuteToggle}
              title={isMuted ? 'Unmute' : 'Mute'}
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
  {isMuted ? (
                <MicOff size={20} />
              ) : (
                <Mic style={{ width: 20, height: 20 }} />
              )}
            </button>
          )}
          {onDeafenToggle && (
            <button
              type="button"
              className="clp-control-btn"
              style={S.controlBtn(isDeafened)}
              onClick={onDeafenToggle}
              title={isDeafened ? 'Undeafen' : 'Deafen'}
              aria-label={isDeafened ? 'Undeafen' : 'Deafen'}
            >
              {isDeafened ? (
                <HeadphoneOff size={20} />
              ) : (
                <Headphones size={20} />
              )}
            </button>
          )}
        </div>
      )}
      {contextMenu && (
        <VoiceUserContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          userName={contextMenu.userName}
          isStreaming={contextMenu.isStreaming}
          isLocallyMuted={locallyMutedUsers?.has(contextMenu.identity) ?? false}
          onViewScreenShare={contextMenu.isStreaming ? () => onViewScreenShare?.(contextMenu.identity) : undefined}
          onToggleLocalMute={() => onToggleLocalMuteUser?.(contextMenu.identity)}
          onClose={() => setContextMenu(null)}
        />
      )}
    </nav>
  )
}
