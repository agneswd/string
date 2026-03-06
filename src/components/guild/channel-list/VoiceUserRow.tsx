import React from 'react'
import { Monitor, MicOff, HeadphoneOff } from 'lucide-react'
import { getAvatarColor, getInitial } from '../../../lib/avatarUtils'
import type { VoiceChannelUser } from './types'
import type { LayoutMode } from './styles'

interface VoiceUserRowProps {
  mode?: LayoutMode
  user: VoiceChannelUser
  isLocallyMuted: boolean
  getAvatarUrl?: (identity: string) => string | undefined
  onViewScreenShare?: (identity: string) => void
  onContextMenu?: (e: React.MouseEvent) => void
}

export const VoiceUserRow = React.memo(function VoiceUserRow({
  mode = 'classic',
  user,
  isLocallyMuted,
  getAvatarUrl,
  onViewScreenShare,
  onContextMenu,
}: VoiceUserRowProps) {
  const isStringMode = mode === 'string'
  const avatarUrl = getAvatarUrl?.(user.identity)
  const initial = getInitial(user.displayName)
  const avatarBg = avatarUrl ? 'transparent' : getAvatarColor(user.displayName)

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: isStringMode ? 6 : 8,
        padding: isStringMode ? '2px 8px 2px 40px' : '2px 8px 2px 44px',
        fontSize: isStringMode ? 13 : 12,
        color: isStringMode ? 'var(--text-channels-default)' : '#b5bac1',
        userSelect: 'none',
      }}
      onContextMenu={onContextMenu}
    >
      {/* Avatar with speaking ring */}
      <div
        style={{
          width: isStringMode ? 22 : 24,
          height: isStringMode ? 22 : 24,
          borderRadius: '50%',
          backgroundColor: avatarBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontFamily: isStringMode ? 'var(--font-mono)' : 'inherit',
          fontSize: isStringMode ? 10 : 11,
          fontWeight: isStringMode ? 600 : 700,
          flexShrink: 0,
          overflow: 'hidden',
          outline: user.isSpeaking
            ? (isStringMode ? '2px solid var(--text-success)' : '2px solid #3ba55d')
            : '2px solid transparent',
          outlineOffset: isStringMode ? 1 : 0,
          transition: 'outline-color 0.15s',
        }}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          initial
        )}
      </div>

      {/* Display name */}
      <span
        style={{
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {user.displayName}
      </span>

      {/* Streaming indicator */}
      {user.isStreaming && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onViewScreenShare?.(user.identity)
            }}
            style={{
              backgroundColor: isStringMode ? 'var(--text-danger)' : '#ed4245',
              color: '#fff',
              fontFamily: isStringMode ? 'var(--font-mono)' : 'inherit',
              fontSize: 9,
              fontWeight: 700,
              padding: '1px 4px',
              borderRadius: isStringMode ? 'var(--radius-sm)' : 4,
              textTransform: isStringMode ? 'uppercase' : 'none',
              letterSpacing: isStringMode ? '0.04em' : 'normal',
              lineHeight: '14px',
              border: 'none',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            live
          </button>
          <Monitor
            style={{ width: 12, height: 12, flexShrink: 0, opacity: 0.7 }}
            aria-label="Screen sharing"
          />
        </>
      )}

      {/* State icons */}
      {(user.isMuted || isLocallyMuted) && (
        <MicOff
          size={13}
          style={{ flexShrink: 0, color: isLocallyMuted ? (isStringMode ? 'var(--text-danger)' : '#ed4245') : 'inherit', opacity: 0.8 }}
          aria-label={isLocallyMuted ? 'Locally muted' : 'Muted'}
        />
      )}
      {user.isDeafened && (
        <HeadphoneOff
          size={13}
          style={{ flexShrink: 0, opacity: 0.8 }}
          aria-label="Deafened"
        />
      )}
    </div>
  )
})
