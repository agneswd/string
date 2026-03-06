import type { ReactNode } from 'react'

type ClassValue = string | undefined | null | false

const cx = (...values: ClassValue[]) => values.filter(Boolean).join(' ')

/**
 * WorkspaceShell — default layout for String in workspace mode.
 *
 * Structurally distinct from the classic Discord-style AppShell:
 *  - Wide workspace rail (200px) with text-labelled rows, not icon stack
 *  - Narrower channel/member sidebars (220px)
 *  - Taller product-bar top nav (3rem) — room for breadcrumb-style context
 *  - Main content area rendered as an inset card (border-radius, inner margin)
 *  - No explicit rail border — background step provides visual separation
 */
export interface WorkspaceShellProps {
  serverColumn: ReactNode
  channelColumn: ReactNode
  topNav: ReactNode
  messageArea: ReactNode
  inputArea: ReactNode
  memberColumn?: ReactNode
  showMemberList?: boolean
  sidebarBottom?: ReactNode
  className?: string
  serverColumnClassName?: string
  channelColumnClassName?: string
  mainClassName?: string
  topNavClassName?: string
  messageAreaClassName?: string
  inputAreaClassName?: string
  memberColumnClassName?: string
}

export function WorkspaceShell({
  serverColumn,
  channelColumn,
  topNav,
  messageArea,
  inputArea,
  memberColumn,
  showMemberList = true,
  sidebarBottom,
  className,
  serverColumnClassName,
  channelColumnClassName,
  mainClassName,
  topNavClassName,
  messageAreaClassName,
  inputAreaClassName,
  memberColumnClassName,
}: WorkspaceShellProps) {
  return (
    <div
      className={cx('workspace-shell', className)}
      style={{
        display: 'flex',
        flexDirection: 'row',
        height: '100%',
        width: '100%',
        minHeight: 0,
        overflow: 'hidden',
        backgroundColor: 'var(--bg-deepest)',
        color: 'var(--text-primary)',
        fontFamily: 'var(--font-sans)',
      }}
    >
      {/* Workspace rail — wide sidebar, text-label rows, no icon-stack */}
      <aside
        className={cx('workspace-shell__servers', serverColumnClassName)}
        style={{
          width: '200px',
          flexShrink: 0,
          backgroundColor: 'var(--bg-deepest)',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          /* hide scrollbar */
          scrollbarWidth: 'none',
        }}
      >
        {serverColumn}
      </aside>

      {/* Channel sidebar */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '220px',
          minWidth: '220px',
          backgroundColor: 'var(--bg-sidebar-light)',
          flexShrink: 0,
        }}
      >
        <aside
          className={cx('workspace-shell__channels', channelColumnClassName)}
          style={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {channelColumn}
        </aside>

        {sidebarBottom && (
          <div
            style={{
              flexShrink: 0,
              backgroundColor: 'var(--bg-deepest)',
              padding: '0.875rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              borderTop: '1px solid var(--border-subtle)',
            }}
          >
            {sidebarBottom}
          </div>
        )}
      </div>

      {/* Main content — inset card look: small margin + rounded top corners */}
      <main
        className={cx('workspace-shell__main', mainClassName)}
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--bg-panel)',
          position: 'relative',
          margin: '6px 6px 0 4px',
          borderRadius: '8px 8px 0 0',
          overflow: 'hidden',
        }}
      >
        {/* Product-bar top nav — taller, breadcrumb-friendly */}
        <header
          className={cx('workspace-shell__top-nav', topNavClassName)}
          style={{
            height: '3rem',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            padding: '0 1rem',
            backgroundColor: 'var(--bg-panel)',
            zIndex: 10,
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          {topNav}
        </header>

        <section
          className={cx('workspace-shell__messages', messageAreaClassName)}
          style={{
            flex: 1,
            minHeight: 0,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {messageArea}
        </section>

        {inputArea && (
          <section
            className={cx('workspace-shell__input', inputAreaClassName)}
            style={{
              flexShrink: 0,
              padding: '0.75rem',
              backgroundColor: 'var(--bg-panel)',
              boxShadow: '0 -1px 0 0 var(--border-subtle)',
            }}
          >
            {inputArea}
          </section>
        )}
      </main>

      {/* Optional member list */}
      {memberColumn && showMemberList && (
        <aside
          className={cx('workspace-shell__members', memberColumnClassName)}
          style={{
            width: '220px',
            flexShrink: 0,
            backgroundColor: 'var(--bg-sidebar-light)',
            borderLeft: '1px solid var(--border-subtle)',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {memberColumn}
        </aside>
      )}
    </div>
  )
}

