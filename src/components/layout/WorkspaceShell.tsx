import type { ReactNode } from 'react'
import { MobileDrawer } from './mobile/MobileDrawer'

type ClassValue = string | undefined | null | false

const cx = (...values: ClassValue[]) => values.filter(Boolean).join(' ')

/**
 * WorkspaceShell — the slot-based shell used for String mode.
 *
 * Current layout contract:
 *  - Fixed 208px server rail
 *  - Fixed 232px channel column, with optional footer content below it
 *  - Flexible main column with a 3.25rem top nav, message region, and optional input tray
 *  - Optional 232px member column controlled by `memberColumn` + `showMemberList`
 *  - Flush split-pane surfaces with subtle divider borders between shell regions
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
  isMobile?: boolean
  mobileServerColumnOpen?: boolean
  mobileChannelColumnOpen?: boolean
  mobileMemberColumnOpen?: boolean
  onCloseMobilePanels?: () => void
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
  isMobile = false,
  mobileServerColumnOpen = false,
  mobileChannelColumnOpen = false,
  mobileMemberColumnOpen = false,
  onCloseMobilePanels,
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
      {/* Server rail — fixed-width left column for String-mode navigation */}
      {!isMobile && (
        <>
          <aside
            className={cx('workspace-shell__servers', serverColumnClassName)}
            style={{
              width: '208px',
              flexShrink: 0,
              backgroundColor: 'var(--bg-deepest)',
              borderRight: '1px solid var(--border-subtle)',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              padding: 0,
              scrollbarWidth: 'none',
            }}
          >
            {serverColumn}
          </aside>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              width: '232px',
              minWidth: '232px',
              backgroundColor: 'var(--bg-sidebar-light)',
              borderRight: '1px solid var(--border-subtle)',
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
                  backgroundColor: 'var(--bg-sidebar-light)',
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
        </>
      )}

      {/* Main region — shared top nav above content and optional member pane */}
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
          className={cx('workspace-shell__top-nav', topNavClassName)}
          style={{
            height: '3.25rem',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            padding: '0 1rem',
            backgroundColor: 'var(--bg-app)',
            zIndex: 10,
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          {topNav}
        </header>

        <div style={{ flex: 1, minHeight: 0, display: 'flex', overflow: 'hidden' }}>
          <main
            className={cx('workspace-shell__main', mainClassName)}
            style={{
              flex: 1,
              minWidth: 0,
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: 'var(--bg-panel)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
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
                  borderTop: '1px solid var(--border-subtle)',
                }}
              >
                {inputArea}
              </section>
            )}
          </main>

          {memberColumn && showMemberList && !isMobile && (
            <aside
              className={cx('workspace-shell__members', memberColumnClassName)}
              style={{
                width: '232px',
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
            width="320px"
            ariaLabel="Looms"
            onClose={onCloseMobilePanels}
          >
            <div style={{ height: '100%', backgroundColor: 'var(--bg-deepest)', borderRight: '1px solid var(--border-subtle)', overflowY: 'auto' }}>
              {serverColumn}
            </div>
          </MobileDrawer>

          <MobileDrawer
            isOpen={mobileChannelColumnOpen}
            side="left"
            width="340px"
            ariaLabel="Navigation"
            onClose={onCloseMobilePanels}
          >
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-sidebar-light)', borderRight: '1px solid var(--border-subtle)' }}>
              <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
                {channelColumn}
              </div>
              {sidebarBottom && (
                <div style={{ flexShrink: 0, borderTop: '1px solid var(--border-subtle)', padding: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {sidebarBottom}
                </div>
              )}
            </div>
          </MobileDrawer>

          <MobileDrawer
            isOpen={mobileMemberColumnOpen && Boolean(memberColumn) && showMemberList}
            side="right"
            width="340px"
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

