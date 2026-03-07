import { useRef, type CSSProperties, type ReactNode, type TouchEvent } from 'react'

export interface MobileSwipeShellProps {
  navigationPane: ReactNode
  navigationFooter?: ReactNode
  contentHeader: ReactNode
  contentBody: ReactNode
  contentFooter?: ReactNode
  membersHeader?: ReactNode
  membersPane?: ReactNode
  activePane: 'navigation' | 'content' | 'members'
  onActivePaneChange: (pane: 'navigation' | 'content' | 'members') => void
  canNavigateToContent?: boolean
  canNavigateToMembers?: boolean
}

const SWIPE_THRESHOLD = 56

export function MobileSwipeShell({
  navigationPane,
  navigationFooter,
  contentHeader,
  contentBody,
  contentFooter,
  membersHeader,
  membersPane,
  activePane,
  onActivePaneChange,
  canNavigateToContent = true,
  canNavigateToMembers = false,
}: MobileSwipeShellProps) {
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)
  const ignoreSwipeRef = useRef(false)
  const hasMembersPane = Boolean(membersPane)
  const activePaneIndex = activePane === 'content' ? 1 : activePane === 'members' && hasMembersPane ? 2 : 0

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement | null
    ignoreSwipeRef.current = Boolean(target?.closest('button, input, textarea, select, a, [role="button"], [role="switch"], [role="radio"]'))

    if (ignoreSwipeRef.current) {
      touchStartRef.current = null
      return
    }

    const touch = event.changedTouches[0]
    if (!touch) {
      return
    }

    touchStartRef.current = { x: touch.clientX, y: touch.clientY }
  }

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    if (ignoreSwipeRef.current) {
      ignoreSwipeRef.current = false
      touchStartRef.current = null
      return
    }

    const start = touchStartRef.current
    const touch = event.changedTouches[0]
    touchStartRef.current = null

    if (!start || !touch) {
      return
    }

    const deltaX = touch.clientX - start.x
    const deltaY = touch.clientY - start.y

    if (Math.abs(deltaX) <= Math.abs(deltaY) || Math.abs(deltaX) < SWIPE_THRESHOLD) {
      return
    }

    if (deltaX > 0) {
      if (activePane === 'members') {
        onActivePaneChange('content')
        return
      }

      if (activePane === 'content') {
        onActivePaneChange('navigation')
      }
      return
    }

    if (activePane === 'navigation' && canNavigateToContent) {
      onActivePaneChange('content')
      return
    }

    if (activePane === 'content' && hasMembersPane && canNavigateToMembers) {
      onActivePaneChange('members')
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100dvh',
        minHeight: '100dvh',
        width: '100%',
        overflow: 'hidden',
        backgroundColor: 'var(--bg-app)',
      }}
    >
      <div
        data-testid="mobile-swipe-track"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          flex: 1,
          minHeight: 0,
          width: '100%',
          display: 'flex',
          transform: `translateX(-${activePaneIndex * 100}%)`,
          transition: 'transform 0.24s ease',
          willChange: 'transform',
          backfaceVisibility: 'hidden',
        }}
      >
        <section
          aria-label="Navigation panel"
          style={{
            flex: '0 0 100%',
            width: '100%',
            minWidth: '100%',
            maxWidth: '100%',
            minHeight: 0,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>{navigationPane}</div>
          {navigationFooter}
        </section>

        <section
          aria-label="Content panel"
          style={{
            flex: '0 0 100%',
            width: '100%',
            minWidth: '100%',
            maxWidth: '100%',
            minHeight: 0,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'var(--bg-panel)',
          }}
        >
          <header
            style={{
              ...S_header,
              paddingTop: 'max(0.5rem, env(safe-area-inset-top, 0px))',
            }}
          >
            {contentHeader}
          </header>
          <div style={S_contentBody}>{contentBody}</div>
          {contentFooter}
        </section>

        {hasMembersPane && (
          <section
            aria-label="Members panel"
            style={{
              flex: '0 0 100%',
              width: '100%',
              minWidth: '100%',
              maxWidth: '100%',
              minHeight: 0,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: 'var(--bg-sidebar-light)',
            }}
          >
            {membersHeader ? (
              <header
                style={{
                  ...S_header,
                  paddingTop: 'max(0.5rem, env(safe-area-inset-top, 0px))',
                  backgroundColor: 'var(--bg-sidebar-light)',
                }}
              >
                {membersHeader}
              </header>
            ) : null}
            <div style={S_contentBody}>{membersPane}</div>
          </section>
        )}
      </div>

    </div>
  )
}

const S_header: CSSProperties = {
  minHeight: '3.75rem',
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  padding: '0.5rem 0.75rem 0',
  borderBottom: '1px solid var(--border-subtle)',
  backgroundColor: 'var(--bg-panel)',
  boxSizing: 'border-box',
}

const S_contentBody: CSSProperties = {
  flex: 1,
  minHeight: 0,
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
}
