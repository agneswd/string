import React, { useRef, useEffect } from 'react'
import type { LayoutMode } from '../../../constants/theme'
import {
  nameBadge,
  nameOverScreenShare,
  participantCard,
  screenVideo,
} from './callTheme'
import { CallAvatar } from './CallAvatar'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CallUser {
  name: string
  avatarUrl?: string
  profileColor?: string
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
  layoutMode = 'classic',
}: {
  user: CallUser
  speaking: boolean
  screenStream?: MediaStream | null
  onScreenShareClick?: () => void
  layoutMode?: LayoutMode
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
          <CallAvatar
            name={user.name}
            avatarUrl={user.avatarUrl}
            profileColor={user.profileColor}
            speaking={speaking}
            layoutMode={layoutMode}
          />
          <span style={nameBadge}>{user.name}</span>
        </>
      )}
    </div>
  )
})
