import type { ReactNode } from 'react'

type ClassValue = string | undefined | null | false

const cx = (...values: ClassValue[]) => values.filter(Boolean).join(' ')

export interface DiscordShellProps {
  serverColumn: ReactNode
  channelColumn: ReactNode
  topNav: ReactNode
  messageArea: ReactNode
  inputArea: ReactNode
  memberColumn?: ReactNode
  showMemberList?: boolean
  className?: string
  serverColumnClassName?: string
  channelColumnClassName?: string
  mainClassName?: string
  topNavClassName?: string
  messageAreaClassName?: string
  inputAreaClassName?: string
  memberColumnClassName?: string
}

export function DiscordShell({
  serverColumn,
  channelColumn,
  topNav,
  messageArea,
  inputArea,
  memberColumn,
  showMemberList = true,
  className,
  serverColumnClassName,
  channelColumnClassName,
  mainClassName,
  topNavClassName,
  messageAreaClassName,
  inputAreaClassName,
  memberColumnClassName,
}: DiscordShellProps) {
  return (
    <div
      className={cx(
        'discord-shell tw-discord-shell flex h-full min-h-0 w-full overflow-hidden',
        className,
      )}
    >
      <aside
        className={cx(
          'discord-shell__servers tw-server-list w-[72px] min-w-[72px] max-w-[72px] shrink-0',
          serverColumnClassName,
        )}
      >
        {serverColumn}
      </aside>

      <aside
        className={cx(
          'discord-shell__channels tw-channel-list w-[240px] min-w-[240px] max-w-[240px] shrink-0',
          channelColumnClassName,
        )}
      >
        {channelColumn}
      </aside>

      <main
        className={cx(
          'discord-shell__main tw-chat-view flex min-w-0 flex-1 flex-col',
          mainClassName,
        )}
      >
        <header
          className={cx(
            'discord-shell__top-nav tw-pane-header shrink-0',
            topNavClassName,
          )}
        >
          {topNav}
        </header>

        <section
          className={cx(
            'discord-shell__messages tw-message-list min-h-0 flex-1 overflow-y-auto',
            messageAreaClassName,
          )}
        >
          {messageArea}
        </section>

        <footer
          className={cx(
            'discord-shell__input tw-composer shrink-0',
            inputAreaClassName,
          )}
        >
          {inputArea}
        </footer>
      </main>

      <aside
        className={cx(
          'discord-shell__members tw-shell-members hidden w-[240px] min-w-[240px] max-w-[240px] shrink-0 lg:flex',
          memberColumnClassName,
        )}
        style={showMemberList ? undefined : { display: 'none' }}
      >
        {memberColumn}
      </aside>
    </div>
  )
}
