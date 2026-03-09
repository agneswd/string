import React, { useCallback, useState, useEffect, type CSSProperties, type ReactNode } from 'react'
import { Mic, MicOff, Headphones, HeadphoneOff, PhoneOff, Monitor, Maximize } from 'lucide-react'
import type { LayoutMode } from '../../constants/theme'
import {
  T,
  callSurface,
  participantsGrid,
  controlsRow,
  controlBtn,
} from './call/callTheme'
import { CallAvatar } from './call/CallAvatar'
import { ParticipantCard } from './call/ParticipantCard'
import { useResizable } from './call/useResizable'

// ── Types ─── (re-export CallUser so consumers keep the same import path) ─────
export type { CallUser } from './call/ParticipantCard'
import type { CallUser } from './call/ParticipantCard'

export interface DmCallOverlayProps {
  layoutMode?: LayoutMode
  localUser: CallUser
  remoteUser: CallUser
  hideScreenShare?: boolean
  onMute: () => void
  onDeafen: () => void
  onScreenShare: () => void
  onHangUp: () => void
  isMuted: boolean
  isDeafened: boolean
  isScreenSharing: boolean
  isLocalSpeaking?: boolean
  isRemoteSpeaking?: boolean
  remoteScreenStream?: MediaStream | null
  onViewScreenShareFullscreen?: () => void
  callState?: 'calling' | 'connected'
  chatPanel?: ReactNode
}

// ── Layout shells ─────────────────────────────────────────────────────────────

const splitRoot: CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  minHeight: 0,
  overflow: 'hidden',
}

const callAreaFull: CSSProperties = {
  ...callSurface,
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
}

const chatSection: CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  minWidth: 0,
  minHeight: 0,
}

const dragHandle: CSSProperties = {
  height: 5,
  cursor: 'row-resize',
  background: T.bg,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  borderTop: `1px solid ${T.border}`,
  borderBottom: `1px solid ${T.border}`,
}

const dragBar: CSSProperties = {
  width: 32,
  height: 2,
  borderRadius: 1,
  background: T.border,
}

const callingWrap: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 16,
  flex: 1,
}

const callingLabel: CSSProperties = {
  fontSize: 13,
  fontFamily: 'var(--font-mono, "SFMono-Regular", Consolas, monospace)',
  letterSpacing: '0.04em',
  color: T.textMuted,
}

// ── Component ─────────────────────────────────────────────────────────────────

export const DmCallOverlay = React.memo(function DmCallOverlay({
  layoutMode = 'classic',
  localUser,
  remoteUser,
  hideScreenShare = false,
  onMute,
  onDeafen,
  onScreenShare,
  onHangUp,
  isMuted,
  isDeafened,
  isScreenSharing,
  isLocalSpeaking = false,
  isRemoteSpeaking = false,
  remoteScreenStream,
  onViewScreenShareFullscreen,
  callState = 'connected',
  chatPanel,
}: DmCallOverlayProps) {
  const onBtnEnter = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.filter = 'brightness(1.15)'
  }, [])
  const onBtnLeave = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.filter = ''
  }, [])

  const { height, onMouseDown, containerRef } = useResizable(280, 200, 0.7)

  // Subtle opacity pulse for "calling" state — no glow, no shadow
  const [pulseVis, setPulseVis] = useState(true)
  useEffect(() => {
    if (callState !== 'calling') return
    const id = setInterval(() => setPulseVis(v => !v), 900)
    return () => clearInterval(id)
  }, [callState])

  // ── Calling state ──────────────────────────────────────────────────────────
  if (callState === 'calling') {
    return (
      <div
        style={{ ...callAreaFull, alignItems: 'center', justifyContent: 'center', padding: 24 }}
        aria-label="Calling..."
      >
        <div style={callingWrap}>
          <CallAvatar
            name={remoteUser.name}
            avatarUrl={remoteUser.avatarUrl}
            profileColor={remoteUser.profileColor}
            speaking={true}
            layoutMode={layoutMode}
            size={80}
            style={{
              opacity: pulseVis ? 1 : 0.45,
              transition: 'opacity 0.9s ease',
            }}
          />
          <span style={callingLabel}>calling {remoteUser.name}…</span>
          <button
            type="button"
            style={{ ...controlBtn(false, true), width: 36, height: 36 }}
            onClick={onHangUp}
            onMouseEnter={onBtnEnter}
            onMouseLeave={onBtnLeave}
            aria-label="Cancel call"
            title="Cancel"
          >
            <PhoneOff size={16} />
          </button>
        </div>
      </div>
    )
  }

  // ── Connected call ─────────────────────────────────────────────────────────
  const callContent = (
    <>
      <div style={participantsGrid}>
        <ParticipantCard user={localUser} speaking={isLocalSpeaking} layoutMode={layoutMode} />
        <ParticipantCard
          user={remoteUser}
          speaking={isRemoteSpeaking}
          screenStream={remoteScreenStream}
          onScreenShareClick={onViewScreenShareFullscreen}
          layoutMode={layoutMode}
        />
      </div>

      <div style={controlsRow}>
        <button
          type="button"
          style={controlBtn(isMuted)}
          onClick={onMute}
          onMouseEnter={onBtnEnter}
          onMouseLeave={onBtnLeave}
          title={isMuted ? 'Unmute' : 'Mute'}
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
        </button>
        <button
          type="button"
          style={controlBtn(isDeafened)}
          onClick={onDeafen}
          onMouseEnter={onBtnEnter}
          onMouseLeave={onBtnLeave}
          title={isDeafened ? 'Undeafen' : 'Deafen'}
          aria-label={isDeafened ? 'Undeafen' : 'Deafen'}
        >
          {isDeafened ? <HeadphoneOff size={16} /> : <Headphones size={16} />}
        </button>
        {!hideScreenShare && (
          <button
            type="button"
            style={controlBtn(isScreenSharing)}
            onClick={onScreenShare}
            onMouseEnter={onBtnEnter}
            onMouseLeave={onBtnLeave}
            title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
            aria-label={isScreenSharing ? 'Stop sharing' : 'Share screen'}
          >
            <Monitor size={16} />
          </button>
        )}
        <button
          type="button"
          style={controlBtn(false, true)}
          onClick={onHangUp}
          onMouseEnter={onBtnEnter}
          onMouseLeave={onBtnLeave}
          title="Hang up"
          aria-label="Hang up"
        >
          <PhoneOff size={16} />
        </button>
        {onViewScreenShareFullscreen && remoteScreenStream && (
          <button
            type="button"
            style={controlBtn(false)}
            onClick={onViewScreenShareFullscreen}
            onMouseEnter={onBtnEnter}
            onMouseLeave={onBtnLeave}
            title="Expand screen share"
            aria-label="Expand screen share"
          >
            <Maximize size={14} />
          </button>
        )}
      </div>
    </>
  )

  if (chatPanel) {
    return (
      <div style={splitRoot} ref={containerRef}>
        <div style={{ ...callSurface, height, display: 'flex', flexDirection: 'column' }}>
          {callContent}
        </div>
        <div style={dragHandle} onMouseDown={onMouseDown}>
          <div style={dragBar} />
        </div>
        <div style={chatSection}>{chatPanel}</div>
      </div>
    )
  }

  return <div style={callAreaFull}>{callContent}</div>
})
