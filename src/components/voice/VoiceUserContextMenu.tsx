import React, { useEffect, useRef } from 'react'
import { Monitor, Volume2, VolumeX } from 'lucide-react'

export interface VoiceUserContextMenuProps {
  x: number
  y: number
  userName: string
  isStreaming?: boolean
  isLocallyMuted: boolean
  volume: number
  onViewScreenShare?: () => void
  onVolumeChange: (volume: number) => void
  onToggleLocalMute: () => void
  onClose: () => void
}

export const VoiceUserContextMenu: React.FC<VoiceUserContextMenuProps> = ({
  x,
  y,
  userName,
  isStreaming,
  isLocallyMuted,
  volume,
  onViewScreenShare,
  onVolumeChange,
  onToggleLocalMute,
  onClose,
}) => {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [onClose])

  // Adjust position to keep menu in viewport
  const style: React.CSSProperties = {
    position: 'fixed',
    top: y,
    left: x,
    zIndex: 10000,
    background: '#18191c',
    borderRadius: '4px',
    padding: '6px 0',
    minWidth: '180px',
    boxShadow: '0 8px 16px rgba(0,0,0,0.24)',
    border: '1px solid #2f3136',
  }

  const itemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    color: '#dcddde',
    fontSize: '14px',
    cursor: 'pointer',
    background: 'transparent',
    border: 'none',
    width: '100%',
    textAlign: 'left',
  }

  const itemHover = (e: React.MouseEvent<HTMLButtonElement>) => {
    ;(e.currentTarget as HTMLButtonElement).style.background = '#4752c4'
    ;(e.currentTarget as HTMLButtonElement).style.color = '#fff'
  }

  const itemUnhover = (e: React.MouseEvent<HTMLButtonElement>) => {
    ;(e.currentTarget as HTMLButtonElement).style.background = 'transparent'
    ;(e.currentTarget as HTMLButtonElement).style.color = '#dcddde'
  }

  return (
    <div ref={ref} style={style}>
      <div style={{ padding: '4px 12px 8px', color: '#96989d', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase' }}>
        {userName}
      </div>
      {isStreaming && onViewScreenShare && (
        <button
          style={itemStyle}
          onMouseEnter={itemHover}
          onMouseLeave={itemUnhover}
          onClick={() => { onViewScreenShare(); onClose(); }}
        >
          <Monitor style={{ width: 16, height: 16 }} />
          View Screen Share
        </button>
      )}
      <button
        style={itemStyle}
        onMouseEnter={itemHover}
        onMouseLeave={itemUnhover}
        onClick={() => { onToggleLocalMute(); onClose(); }}
      >
        {isLocallyMuted ? (
          <>
            <Volume2 style={{ width: 16, height: 16 }} />
            Unmute User
          </>
        ) : (
          <>
            <VolumeX style={{ width: 16, height: 16 }} />
            Mute User
          </>
        )}
      </button>

      <div style={{ padding: '8px 12px 4px', color: '#96989d', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        Volume {volume}%
      </div>
      <div style={{ padding: '0 12px 8px' }}>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={volume}
          onChange={(event) => onVolumeChange(Number(event.target.value))}
          aria-label={`${userName} volume`}
          style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
        />
      </div>
    </div>
  )
}
