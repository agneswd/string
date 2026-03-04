import React from 'react'

export interface ScreenShareStatusProps {
  isLocalSharing: boolean
  remoteSharersCount: number
  onStartSharing?: () => void
  onStopSharing?: () => void
  className?: string
}

export const ScreenShareStatus = React.memo(function ScreenShareStatus({
  isLocalSharing,
  remoteSharersCount,
  onStartSharing,
  onStopSharing,
  className,
}: ScreenShareStatusProps) {
  const remoteLabel =
    remoteSharersCount === 1 ? '1 person is sharing' : `${remoteSharersCount} people are sharing`

  return (
    <section className={`tw-pane tw-screen-share-status mt-2 pt-2 border-t border-[var(--border-subtle)] ${className ?? ''}`.trim()} aria-label="Screen sharing">
      <div className="flex items-center justify-between text-xs mb-2">
        <span className={isLocalSharing ? 'text-[var(--text-success)] font-bold' : 'text-[var(--text-muted)]'}>
          {isLocalSharing ? 'Sharing' : 'Not Sharing'}
        </span>
        <span className="text-[var(--text-muted)] tabular-nums">
          {remoteSharersCount} remote
        </span>
      </div>

      <button 
        type="button" 
        onClick={isLocalSharing ? onStopSharing : onStartSharing}
        className={`w-full py-1.5 text-xs font-bold rounded flex items-center justify-center transition-colors ${isLocalSharing ? 'bg-[var(--bg-danger)] text-white hover:bg-opacity-90' : 'bg-[var(--bg-modifier-selected)] text-[var(--text-normal)] hover:bg-[var(--bg-modifier-hover)]'}`}
      >
        {isLocalSharing ? 'Stop Stream' : 'Share Screen'}
      </button>
    </section>
  )
})
