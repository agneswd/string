import React, { useRef, useEffect } from 'react'
import {
  avatarCircle,
  avatarImg,
  avatarInitial,
  nameBadge,
  nameOverScreenShare,
  participantCard,
  screenVideo,
} from './callTheme'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CallUser {
  name: string
  avatarUrl?: string
  isMuted?: boolean
  isDeafened?: boolean
}

// ── Screen-share video element ────────────────────────────────────────────────

const ScreenShareView = React.memo(function ScreenShareView({ stream }: { stream: MediaStream }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  useEffect(() => {
    if (videoRef.current && videoRef.current.srcObject !== stream) {
      videoRef.current.srcObject = stream
    }
  }, [stream])
  return <video ref={videoRef} autoPlay playsInline style={screenVideo} />
})

// ── Participant card ──────────────────────────────────────────────────────────

export const ParticipantCard = React.memo(function ParticipantCard({
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
        <div
          style={{
            width: '100%',
            height: '100%',
            cursor: onScreenShareClick ? 'pointer' : 'default',
            position: 'relative',
          }}
          onClick={onScreenShareClick}
        >
          <ScreenShareView stream={screenStream} />
          <span style={nameOverScreenShare}>{user.name}</span>
        </div>
      ) : (
        <>
          <div style={avatarCircle(speaking)}>
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} style={avatarImg} />
            ) : (
              <span style={avatarInitial}>{user.name.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <span style={nameBadge}>{user.name}</span>
        </>
      )}
    </div>
  )
})
