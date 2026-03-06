import type { ReactNode } from 'react'

type ClassValue = string | undefined | null | false

const cx = (...values: ClassValue[]) => values.filter(Boolean).join(' ')

/**
 * WorkspaceShell — the default layout for String.
 *
 * Structural differences from the classic (Discord-style) `AppShell`:
 *  - Narrower server rail (56px, no explicit right border — bg diff provides separation)
 *  - Narrower channel/member sidebars (220px)
 *  - Lower top-nav chrome (2.75rem / 44px, no bottom border — bg diff only)
 *  - Input area uses box-shadow separator instead of a top border
 *  - Overall: calmer silhouette, more like a generic workspace product
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
        backgroundColor: 'var(--bg-app)',
        color: 'var(--text-primary)',
        fontFamily: 'var(--font-sans)',
      }}
    >
      {/* Server rail — narrower, no right border (bg shift creates visual separation) */}
      <aside
        className={cx('workspace-shell__servers', serverColumnClassName)}
        style={{
          width: '56px',
          flexShrink: 0,
          backgroundColor: 'var(--bg-deepest)',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '0.5rem 0',
          gap: '0.25rem',
        }}
      >
        {serverColumn}
      </aside>

      {/* Channel sidebar — slightly narrower, unified with sidebar bg */}
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
              padding: '0.625rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
            }}
          >
            {sidebarBottom}
          </div>
        )}
      </div>

      {/* Main content pane */}
      <main
        className={cx('workspace-shell__main', mainClassName)}
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--bg-panel)',
          position: 'relative',
        }}
      >
        {/* Flat, minimal top navigation — lower chrome height, no bottom border */}
        <header
          className={cx('workspace-shell__top-nav', topNavClassName)}
          style={{
            height: '2.75rem',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            padding: '0 0.875rem',
            backgroundColor: 'var(--bg-panel)',
            zIndex: 10,
            boxShadow: '0 1px 0 0 var(--border-subtle)',
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
