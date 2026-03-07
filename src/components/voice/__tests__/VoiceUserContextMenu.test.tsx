import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

import { VoiceUserContextMenu } from '../VoiceUserContextMenu'

describe('VoiceUserContextMenu', () => {
  it('updates a user volume from the slider', () => {
    const onVolumeChange = vi.fn()

    render(
      <VoiceUserContextMenu
        x={20}
        y={30}
        userName="Alice"
        isLocallyMuted={false}
        volume={65}
        onVolumeChange={onVolumeChange}
        onToggleLocalMute={vi.fn()}
        onClose={vi.fn()}
      />,
    )

    fireEvent.change(screen.getByRole('slider', { name: /alice volume/i }), { target: { value: '35' } })

    expect(onVolumeChange).toHaveBeenCalledWith(35)
  })
})
