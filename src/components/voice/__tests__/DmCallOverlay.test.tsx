import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

import { DmCallOverlay } from '../DmCallOverlay'

function renderOverlay(overrides: Partial<React.ComponentProps<typeof DmCallOverlay>> = {}) {
  return render(
    <DmCallOverlay
      layoutMode="string"
      localUser={{ name: 'Me', profileColor: '#123456' }}
      remoteUser={{ name: 'Alex', avatarUrl: 'https://example.com/alex.png', profileColor: '#654321' }}
      onMute={vi.fn()}
      onDeafen={vi.fn()}
      onScreenShare={vi.fn()}
      onHangUp={vi.fn()}
      isMuted={false}
      isDeafened={false}
      isScreenSharing={false}
      isLocalSpeaking={false}
      isRemoteSpeaking={false}
      callState="connected"
      {...overrides}
    />,
  )
}

describe('DmCallOverlay', () => {
  it('uses the profile color for fallback call avatars', () => {
    renderOverlay({ remoteUser: { name: 'Alex', profileColor: '#654321' } })
    const fallback = screen.getByText('A').parentElement as HTMLElement | null
    expect(fallback).toBeTruthy()
    expect(fallback!.style.background).toBe('rgb(101, 67, 33)')
  })

  it('uses square avatar corners in string mode', () => {
    renderOverlay()
    const avatar = screen.getByAltText('Alex') as HTMLImageElement
    expect(avatar.style.borderRadius).toBe('3px')
  })

  it('shows the speaking ring for the local avatar during dm calls', () => {
    renderOverlay({ isLocalSpeaking: true })
    const avatar = screen.getByText('M').parentElement as HTMLElement | null
    expect(avatar).toBeTruthy()
    expect(avatar!.style.outline).toContain('2px solid')
  })

  it('keeps the local speaking ring visible when voice activity is detected', () => {
    renderOverlay({ isLocalSpeaking: true, isMuted: true })
    const avatar = screen.getByText('M').parentElement as HTMLElement | null
    expect(avatar).toBeTruthy()
    expect(avatar!.style.outline).toContain('2px solid')
  })

  it('hides the screenshare button for mobile dm calls', () => {
    renderOverlay({ hideScreenShare: true })
    expect(screen.queryByRole('button', { name: /share screen/i })).toBeNull()
    expect(screen.queryByRole('button', { name: /stop sharing/i })).toBeNull()
  })
})