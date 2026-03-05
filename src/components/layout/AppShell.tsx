import type { ReactNode } from 'react'

type ClassValue = string | undefined | null | false

const cx = (...values: ClassValue[]) => values.filter(Boolean).join(' ')

export interface AppShellProps {
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

export function AppShell({
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
}: AppShellProps) {
  return (
    <div
      className={cx('app-shell-inner', className)}
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
      <aside
        className={cx('app-shell__servers', serverColumnClassName)}
        style={{
          width: '72px',
          flexShrink: 0,
          backgroundColor: 'var(--bg-sidebar-dark)',
          borderRight: '1px solid var(--border-subtle)',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '0.5rem 0',
          gap: '0.5rem',
        }}
      >
        {serverColumn}
      </aside>

      <div 
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '240px',
          minWidth: '240px',
          backgroundColor: 'var(--bg-sidebar-light)',
          borderRight: '1px solid var(--border-subtle)',
          flexShrink: 0,
        }}
      >
        <aside
          className={cx('app-shell__channels', channelColumnClassName)}
          style={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden', // Let child handle scrolling via flex-1
          }}
        >
          {channelColumn}
        </aside>
        
        {sidebarBottom && (
          <div style={{
            flexShrink: 0,
            borderTop: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-sidebar-dark)',
            padding: '0.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}>
             {sidebarBottom}
          </div>
        )}
      </div>

      <main
        className={cx('app-shell__main', mainClassName)}
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--bg-panel)',
          position: 'relative',
        }}
      >
        <header
          className={cx('app-shell__top-nav', topNavClassName)}
          style={{
            height: '3.5rem',
            flexShrink: 0,
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 1rem',
            backgroundColor: 'var(--bg-panel)',
            zIndex: 10,
          }}
        >
          {topNav}
        </header>

        <section
          className={cx('app-shell__messages', messageAreaClassName)}
          style={{
            flex: 1,
            minHeight: 0,
            overflow: 'hidden', // Let child control overflow
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {messageArea}
        </section>

        {inputArea && (
          <section className={cx('app-shell__input', inputAreaClassName)} style={{
            flexShrink: 0,
            padding: '1rem',
            backgroundColor: 'var(--bg-panel)',
            borderTop: '1px solid var(--border-subtle)',
          }}>
             {inputArea}
          </section>
        )}
      </main>

      {memberColumn && showMemberList && (
        <aside
          className={cx('app-shell__members', memberColumnClassName)}
          style={{
            width: '240px',
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
