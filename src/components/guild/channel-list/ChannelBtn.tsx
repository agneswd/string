/**
 * channel-list/ChannelBtn.tsx
 *
 * Focused UI primitives for the channel list:
 *   ChevronIcon  — animated collapse/expand chevron
 *   AddBtn       — generic icon action button (Plus icon)
 *   ChannelBtn   — text/voice channel row button
 */

import React, { useState } from 'react'
import { ChevronDown, Plus } from 'lucide-react'
import { resolveColors } from './styles'
import type { LayoutMode } from './styles'

/* ── ChevronIcon ── */

interface ChevronIconProps {
  collapsed: boolean
  style: React.CSSProperties
}

export function ChevronIcon({ collapsed, style }: ChevronIconProps) {
  return (
    <ChevronDown
      style={{
        ...style,
        transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
      }}
      aria-hidden="true"
    />
  )
}

/* ── AddBtn ── */

export interface AddBtnProps {
  label: string
  size?: number
  onClick: (e: React.MouseEvent) => void
  extraStyle?: React.CSSProperties
  baseStyle: React.CSSProperties
}

export function AddBtn({ label, size = 12, onClick, extraStyle, baseStyle }: AddBtnProps) {
  return (
    <button
      type="button"
      className="clp-add-btn"
      style={{ ...baseStyle, ...extraStyle }}
      onClick={onClick}
      title={label}
      aria-label={label}
    >
      <Plus style={{ width: size, height: size }} aria-hidden="true" />
    </button>
  )
}

/* ── ChannelBtn ── */

export type ChannelBtnStyles = {
  channelBtn: (isActive: boolean) => React.CSSProperties
  channelPrefix: React.CSSProperties
  channelName: React.CSSProperties
  badge: React.CSSProperties
}

export interface ChannelBtnProps {
  mode: LayoutMode
  id: string
  name: string
  kind: 'text' | 'voice'
  isActive: boolean
  isCurrentVoice: boolean
  unreadCount?: number
  onSelect: () => void
  styles: ChannelBtnStyles
}

export function ChannelBtn({
  mode,
  id,
  name,
  kind,
  isActive,
  isCurrentVoice,
  unreadCount,
  onSelect,
  styles,
}: ChannelBtnProps) {
  const [hovered, setHovered] = useState(false)
  const colors = resolveColors(mode)
  const btnStyle: React.CSSProperties = {
    ...styles.channelBtn(isActive),
    ...(!isActive && hovered ? { background: colors.bgHover, color: colors.textChannelHover } : {}),
    ...(isCurrentVoice && !isActive
      ? {
          background: mode === 'string' ? colors.bgSelected : colors.bgHover,
          boxShadow: `inset 2px 0 0 ${mode === 'string' ? 'var(--text-success)' : '#3ba55d'}`,
          color: colors.textChannelHover,
        }
      : {}),
  }

  const prefix =
    kind === 'text' ? (
      <span style={styles.channelPrefix}>#</span>
    ) : (
      <span style={{ ...styles.channelPrefix, opacity: 0.55 }}>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
        </svg>
      </span>
    )

  return (
    <button
      type="button"
      style={btnStyle}
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-pressed={isActive}
      title={name}
      data-channel-id={id}
    >
      {prefix}
      <span style={styles.channelName}>{name}</span>
      {!!unreadCount && <span style={styles.badge}>{unreadCount}</span>}
    </button>
  )
}
