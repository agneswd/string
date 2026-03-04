import React, { useCallback, useRef, useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { Mic, MicOff, Headphones, HeadphoneOff, PhoneOff, Monitor, Maximize } from 'lucide-react'

/* ── Types ── */

export interface CallUser {
  name: string
  avatarUrl?: string
  isMuted?: boolean
  isDeafened?: boolean
}

export interface DmCallOverlayProps {
  localUser: CallUser
  remoteUser: CallUser
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

/* ── Styles ── */

const splitRoot: CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  minHeight: 0,
  overflow: 'hidden',
}

const callArea: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  background: '#1e1f22',
  overflow: 'hidden',
  flexShrink: 0,
}

const callAreaFull: CSSProperties = {
  ...callArea,
  flex: 1,
}

const chatSection: CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  minWidth: 0,
  minHeight: 0,
}

const participantsGrid: CSSProperties = {
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  padding: '12px 16px',
  minHeight: 0,
}

const participantCard: CSSProperties = {
  flex: '1 1 0',
  maxWidth: 420,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#2b2d31',
  borderRadius: 8,
  overflow: 'hidden',
  position: 'relative',
  minHeight: 0,
  height: '100%',
  gap: 4,
}

const avatarLarge: CSSProperties = {
  width: 64,
  height: 64,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#1e1f22',
  overflow: 'hidden',
  flexShrink: 0,
}

const avatarCircle = (speaking: boolean): CSSProperties => ({
  width: 64,
  height: 64,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#1e1f22',
  overflow: 'hidden',
  flexShrink: 0,
  border: speaking ? '3px solid #43b581' : '3px solid transparent',
  boxShadow: speaking ? '0 0 8px rgba(67, 181, 129, 0.5)' : 'none',
  transition: 'border-color 0.2s, box-shadow 0.2s',
})

const avatarImg: CSSProperties = {
  width: '100%',
  height: '100%',
  borderRadius: '50%',
  objectFit: 'cover',
}

const avatarText: CSSProperties = {
  fontSize: 24,
  fontWeight: 700,
  color: '#f0f1f5',
  userSelect: 'none',
}

const nameBadge: CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: '#f0f1f5',
  marginTop: 8,
  textAlign: 'center',
  padding: '0 8px',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  maxWidth: '100%',
}

const nameOverScreenShare: CSSProperties = {
  position: 'absolute',
  bottom: 8,
  left: 8,
  fontSize: 12,
  fontWeight: 600,
  color: '#fff',
  background: 'rgba(0,0,0,0.6)',
  padding: '2px 8px',
  borderRadius: 4,
}

const controlsRow: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  padding: '8px 16px 12px',
  flexShrink: 0,
}

const controlBtn = (active: boolean, isHangUp = false): CSSProperties => ({
  width: 36,
  height: 36,
  borderRadius: '50%',
  border: 'none',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
  color: '#fff',
  background: isHangUp ? '#ed4245' : active ? '#ed4245' : '#4e5058',
  transition: 'filter 0.15s, background 0.15s',
})

const dragHandle: CSSProperties = {
  height: 6,
  cursor: 'row-resize',
  background: '#2b2d31',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  borderTop: '1px solid #3f4147',
  borderBottom: '1px solid #3f4147',
}

const dragBar: CSSProperties = {
  width: 40,
  height: 3,
  borderRadius: 2,
  background: '#4e5058',
}

const callingPulse: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 16,
  flex: 1,
}

const callingText: CSSProperties = {
  fontSize: 18,
  fontWeight: 600,
  color: '#b5bac1',
}

const screenVideo: CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'contain',
  borderRadius: 6,
}

/* ── SVG Icons ── */
const MicIcon = () => <Mic style={{ width: 18, height: 18 }} />
const MicMutedIcon = () => <MicOff size={18} />
const HeadphoneIcon = () => <Headphones size={18} />
const HeadphoneMutedIcon = () => <HeadphoneOff size={18} />
const ScreenShareIcon = () => <Monitor style={{ width: 18, height: 18 }} />
const PhoneDownIcon = () => <PhoneOff style={{ width: 18, height: 18 }} />
const FullscreenIcon = () => <Maximize style={{ width: 16, height: 16 }} />

/* ── Screen share video ── */
const ScreenShareView = React.memo(function ScreenShareView({ stream }: { stream: MediaStream }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  useEffect(() => {
    if (videoRef.current && videoRef.current.srcObject !== stream) {
      videoRef.current.srcObject = stream
    }
  }, [stream])
  return <video ref={videoRef} autoPlay playsInline style={screenVideo} />
})

/* ── Participant card ── */
const ParticipantCard = React.memo(function ParticipantCard({
  user,
  speaking,
  screenStream,
  onScreenShareClick,
}: {
  user: CallUser
  speaking: boolean
  screenStream?: MediaStream | null
  onScreenShareClick?: () => void
}) {
  return (
    <div style={participantCard}>
      {screenStream ? (
        <div style={{ width: '100%', height: '100%', cursor: onScreenShareClick ? 'pointer' : 'default', position: 'relative' }} onClick={onScreenShareClick}>
          <ScreenShareView stream={screenStream} />
          <span style={nameOverScreenShare}>{user.name}</span>
        </div>
      ) : (
        <>
          <div style={avatarCircle(speaking)}>
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} style={avatarImg} />
            ) : (
              <span style={avatarText}>{user.name.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <span style={nameBadge}>{user.name}</span>
        </>
      )}
    </div>
  )
})

/* ── Resizable drag hook ── */
function useResizable(initialHeight: number, minH: number, maxRatio: number) {
  const [height, setHeight] = useState(initialHeight)
  const dragging = useRef(false)
  const startY = useRef(0)
  const startH = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    dragging.current = true
    startY.current = e.clientY
    startH.current = height
    document.body.style.cursor = 'row-resize'
    document.body.style.userSelect = 'none'
  }, [height])

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!dragging.current) return
      const parentH = containerRef.current?.parentElement?.clientHeight ?? 800
      const maxH = parentH * maxRatio
      const delta = e.clientY - startY.current
      setHeight(Math.max(minH, Math.min(maxH, startH.current + delta)))
    }
    const onMouseUp = () => {
      dragging.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [minH, maxRatio])

  return { height, onMouseDown, containerRef }
}

/* ── Component ── */
export const DmCallOverlay = React.memo(function DmCallOverlay({
  localUser,
  remoteUser,
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
  const handleHover = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.filter = 'brightness(1.2)'
  }, [])
  const handleLeave = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.filter = 'none'
  }, [])

  const { height, onMouseDown, containerRef } = useResizable(280, 200, 0.7)

  // Pulse animation for "calling" state
  const [pulse, setPulse] = useState(true)
  useEffect(() => {
    if (callState !== 'calling') return
    const id = setInterval(() => setPulse(p => !p), 800)
    return () => clearInterval(id)
  }, [callState])

  // ── "Calling..." state
  if (callState === 'calling') {
    return (
      <div style={{ ...callAreaFull, flex: 1, alignItems: 'center', justifyContent: 'center', display: 'flex', flexDirection: 'column', padding: '24px' }} aria-label="Calling...">
        <div style={callingPulse}>
          <div style={{
            ...avatarLarge,
            width: 96,
            height: 96,
            border: '3px solid #43b581',
            borderRadius: '50%',
            boxShadow: pulse ? '0 0 0 8px rgba(67, 181, 129, 0.3)' : '0 0 0 0 rgba(67, 181, 129, 0)',
            transition: 'box-shadow 0.8s ease',
          }}>
            {remoteUser.avatarUrl ? (
              <img src={remoteUser.avatarUrl} alt={remoteUser.name} style={avatarImg} />
            ) : (
              <span style={{ ...avatarText, fontSize: 36 }}>{remoteUser.name.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <span style={callingText}>Calling {remoteUser.name}...</span>
          <button
            type="button"
            style={{ ...controlBtn(false, true), width: 44, height: 44, marginTop: 8 }}
            onClick={onHangUp}
            onMouseEnter={handleHover}
            onMouseLeave={handleLeave}
            aria-label="Cancel call"
            title="Cancel"
          >
            <PhoneDownIcon />
          </button>
        </div>
      </div>
    )
  }

  // ── Connected call
  const callContent = (
    <>
      {/* Participant cards */}
      <div style={participantsGrid}>
        <ParticipantCard
          user={localUser}
          speaking={isLocalSpeaking && !isMuted}
        />
        <ParticipantCard
          user={remoteUser}
          speaking={isRemoteSpeaking}
          screenStream={remoteScreenStream}
          onScreenShareClick={onViewScreenShareFullscreen}
        />
      </div>

      {/* Controls */}
      <div style={controlsRow}>
        <button type="button" style={controlBtn(isMuted)} onClick={onMute} onMouseEnter={handleHover} onMouseLeave={handleLeave} title={isMuted ? 'Unmute' : 'Mute'}>
          {isMuted ? <MicMutedIcon /> : <MicIcon />}
        </button>
        <button type="button" style={controlBtn(isDeafened)} onClick={onDeafen} onMouseEnter={handleHover} onMouseLeave={handleLeave} title={isDeafened ? 'Undeafen' : 'Deafen'}>
          {isDeafened ? <HeadphoneMutedIcon /> : <HeadphoneIcon />}
        </button>
        <button type="button" style={controlBtn(isScreenSharing)} onClick={onScreenShare} onMouseEnter={handleHover} onMouseLeave={handleLeave} title={isScreenSharing ? 'Stop Sharing' : 'Share Screen'}>
          <ScreenShareIcon />
        </button>
        <button type="button" style={controlBtn(false, true)} onClick={onHangUp} onMouseEnter={handleHover} onMouseLeave={handleLeave} title="Hang Up">
          <PhoneDownIcon />
        </button>
        {onViewScreenShareFullscreen && remoteScreenStream && (
          <button type="button" style={{ ...controlBtn(false), background: '#2b2d31' }} onClick={onViewScreenShareFullscreen} onMouseEnter={handleHover} onMouseLeave={handleLeave} title="Fullscreen">
            <FullscreenIcon />
          </button>
        )}
      </div>
    </>
  )

  if (chatPanel) {
    return (
      <div style={splitRoot} ref={containerRef}>
        <div style={{ ...callArea, height }}>
          {callContent}
        </div>
        {/* Drag handle */}
        <div style={dragHandle} onMouseDown={onMouseDown}>
          <div style={dragBar} />
        </div>
        <div style={chatSection}>{chatPanel}</div>
      </div>
    )
  }

  return (
    <div style={{ ...callAreaFull, flex: 1 }}>
      {callContent}
    </div>
  )
})
