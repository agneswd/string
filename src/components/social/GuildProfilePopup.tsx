import React from 'react'

import { getAvatarColor } from '../../lib/avatarUtils'
import type { LayoutMode } from '../../constants/theme'

export interface GuildPopupInfo {
  name: string
  bio?: string | null
  avatarUrl?: string
  ownerName?: string
}

export interface GuildProfilePopupProps {
  guild: GuildPopupInfo
  onClose: () => void
  layoutMode?: LayoutMode
}

export function GuildProfilePopup({ guild, onClose, layoutMode = 'classic' }: GuildProfilePopupProps) {
  const isString = layoutMode === 'string'
  const accent = getAvatarColor(guild.name)

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.55)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        style={{ width: 320, background: 'var(--bg-panel)', border: '1px solid var(--border-subtle)', borderRadius: isString ? 'var(--radius-sm)' : 'var(--radius-lg)', overflow: 'hidden' }}
      >
        <div style={{ height: isString ? 4 : 72, background: accent }} />
        <div style={{ padding: 16 }}>
          {guild.avatarUrl ? (
            <img src={guild.avatarUrl} alt="" style={{ width: 56, height: 56, borderRadius: isString ? 'var(--radius-sm)' : 12, objectFit: 'cover', marginTop: isString ? 0 : -44, border: '3px solid var(--bg-panel)' }} />
          ) : (
            <div style={{ width: 56, height: 56, borderRadius: isString ? 'var(--radius-sm)' : 12, background: accent, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 20, marginTop: isString ? 0 : -44, border: '3px solid var(--bg-panel)' }}>
              {guild.name.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div style={{ marginTop: 12, color: 'var(--text-header-primary)', fontSize: isString ? 16 : 20, fontWeight: 700 }}>{guild.name}</div>
          {guild.ownerName && <div style={{ marginTop: 4, color: 'var(--text-muted)', fontSize: isString ? 11 : 13 }}>Owner: {guild.ownerName}</div>}
          <div style={{ marginTop: 12, background: 'var(--bg-hover)', border: '1px solid var(--border-subtle)', borderRadius: isString ? 'var(--radius-sm)' : 'var(--radius-md)', padding: 12, color: 'var(--text-secondary)', lineHeight: 1.5, minHeight: 64 }}>
            {guild.bio?.trim() || 'No server bio yet.'}
          </div>
        </div>
      </div>
    </div>
  )
}
