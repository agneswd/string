import type { ReactNode } from 'react'
import { MobileDrawer } from './mobile/MobileDrawer'

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
  isMobile?: boolean
  mobileServerColumnOpen?: boolean
  mobileChannelColumnOpen?: boolean
  mobileMemberColumnOpen?: boolean
  onCloseMobilePanels?: () => void
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
  isMobile = false,
  mobileServerColumnOpen = false,
  mobileChannelColumnOpen = false,
  mobileMemberColumnOpen = false,
  onCloseMobilePanels,
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
      {!isMobile && (
        <>
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
              alignItems: 'stretch',
              padding: 0,
              gap: 0,
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
              minHeight: 0,
            }}
          >
            <aside
              className={cx('app-shell__channels', channelColumnClassName)}
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
              <div style={{
                flexShrink: 0,
                borderTop: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-sidebar-light)',
                padding: '0.75rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
              }}>
                {sidebarBottom}
              </div>
            )}
          </div>
        </>
      )}

      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
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
            boxShadow: '0 1px 0 rgba(0, 0, 0, 0.08)',
          }}
        >
          {topNav}
        </header>

        <div style={{ flex: 1, minHeight: 0, display: 'flex', overflow: 'hidden' }}>
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
            <section
              className={cx('app-shell__messages', messageAreaClassName)}
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

          {memberColumn && showMemberList && !isMobile && (
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
      </div>

      {isMobile && onCloseMobilePanels && (
        <>
          <MobileDrawer
            isOpen={mobileServerColumnOpen}
            side="left"
            width="72px"
            ariaLabel="Looms"
            onClose={onCloseMobilePanels}
          >
            <div style={{ height: '100%', backgroundColor: 'var(--bg-sidebar-dark)', borderRight: '1px solid var(--border-subtle)', overflowY: 'auto' }}>
              {serverColumn}
            </div>
          </MobileDrawer>

          <MobileDrawer
            isOpen={mobileChannelColumnOpen}
            side="left"
            width="320px"
            ariaLabel="Navigation"
            onClose={onCloseMobilePanels}
          >
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-sidebar-light)', borderRight: '1px solid var(--border-subtle)' }}>
              <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
                {channelColumn}
              </div>
              {sidebarBottom && (
                <div style={{ flexShrink: 0, borderTop: '1px solid var(--border-subtle)', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {sidebarBottom}
                </div>
              )}
            </div>
          </MobileDrawer>

          <MobileDrawer
            isOpen={mobileMemberColumnOpen && Boolean(memberColumn) && showMemberList}
            side="right"
            width="320px"
            ariaLabel="Members"
            onClose={onCloseMobilePanels}
          >
            <div style={{ height: '100%', backgroundColor: 'var(--bg-sidebar-light)', borderLeft: '1px solid var(--border-subtle)', overflowY: 'auto' }}>
              {memberColumn}
            </div>
          </MobileDrawer>
        </>
      )}
    </div>
  )
}
