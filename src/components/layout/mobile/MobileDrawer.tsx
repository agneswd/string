import { useRef, type CSSProperties, type ReactNode, type TouchEvent } from 'react'

export interface MobileDrawerProps {
  isOpen: boolean
  side: 'left' | 'right'
  width: string
  ariaLabel: string
  onClose: () => void
  children: ReactNode
}

const S_backdrop: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0, 0, 0, 0.55)',
  border: 'none',
  padding: 0,
  margin: 0,
  zIndex: 40,
}

export function MobileDrawer({
  isOpen,
  side,
  width,
  ariaLabel,
  onClose,
  children,
}: MobileDrawerProps) {
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)

  if (!isOpen) {
    return null
  }

  const handleTouchStart = (event: TouchEvent<HTMLElement>) => {
    const touch = event.changedTouches[0]
    if (!touch) {
      return
    }

    touchStartRef.current = { x: touch.clientX, y: touch.clientY }
  }

  const handleTouchEnd = (event: TouchEvent<HTMLElement>) => {
    const start = touchStartRef.current
    const touch = event.changedTouches[0]
    touchStartRef.current = null

    if (!start || !touch) {
      return
    }

    const deltaX = touch.clientX - start.x
    const deltaY = touch.clientY - start.y

    if (Math.abs(deltaX) <= Math.abs(deltaY) || Math.abs(deltaX) < 48) {
      return
    }

    if (side === 'right' && deltaX > 0) {
      onClose()
    }

    if (side === 'left' && deltaX < 0) {
      onClose()
    }
  }

  return (
    <>
      <button type="button" aria-label="Close navigation drawer" style={S_backdrop} onClick={onClose} />
      <aside
        aria-label={ariaLabel}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          position: 'fixed',
          top: 0,
          bottom: 0,
          [side]: 0,
          width,
          maxWidth: '85vw',
          zIndex: 41,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: side === 'left'
            ? '6px 0 24px rgba(0, 0, 0, 0.35)'
            : '-6px 0 24px rgba(0, 0, 0, 0.35)',
        }}
      >
        {children}
      </aside>
    </>
  )
}
