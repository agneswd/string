import { useMemo, memo } from 'react'
import { MemberListPane, type MemberListItem, type MemberListPaneProps, type MemberLayoutMode } from '../guild/MemberListPane'
import { avatarBytesToUrl, getAvatarColor, getInitial } from '../../lib/avatarUtils'

export interface MemberColumnProps {
  isDmMode: boolean
  guildName?: string
  friends: Array<{
    id: string
    username: string
    displayName: string
    status: string
  }>
  memberListItems: MemberListItem[]
  getAvatarUrl: (id: string) => string | undefined
  usersByIdentity: Map<string, any>
  onViewProfile: MemberListPaneProps['onViewProfile']
  localUserId?: string
  /** Controls visual treatment passed through to MemberListPane. Defaults to 'classic'. */
  layoutMode?: MemberLayoutMode
}

export const MemberColumn = memo(function MemberColumn({
  isDmMode,
  guildName,
  friends,
  memberListItems,
  getAvatarUrl,
  usersByIdentity,
  onViewProfile,
  localUserId,
  layoutMode,
}: MemberColumnProps) {
  const title = isDmMode
    ? 'Friends'
    : guildName
      ? `${guildName} members`
      : 'Members'

  const members: MemberListItem[] = useMemo(
    () =>
      isDmMode
        ? friends.map((friend) => ({
            id: friend.id,
            username: friend.username,
            displayName: friend.displayName,
            status: friend.status,
            avatarUrl: getAvatarUrl(friend.id),
            profileColor: (usersByIdentity.get(friend.id) as any)?.profileColor ?? undefined,
          }))
        : memberListItems,
    [isDmMode, friends, memberListItems, getAvatarUrl, usersByIdentity],
  )

  const dmProfile = useMemo(() => {
    if (!isDmMode || friends.length === 0) {
      return null
    }

    const friend = friends[0]
    const fullUser = usersByIdentity.get(friend.id) as {
      profileColor?: string
      bio?: string | null
      avatarBytes?: Uint8Array | null
    } | undefined

    return {
      id: friend.id,
      username: friend.username,
      displayName: friend.displayName,
      status: friend.status,
      bio: fullUser?.bio?.trim() || null,
      profileColor: fullUser?.profileColor ?? undefined,
      avatarUrl: getAvatarUrl(friend.id) ?? avatarBytesToUrl(fullUser?.avatarBytes),
    }
  }, [isDmMode, friends, usersByIdentity, getAvatarUrl])

  if (dmProfile) {
    const isString = layoutMode === 'string'
    const statusLabel = dmProfile.status || 'offline'
    const statusColor = statusLabel === 'online'
      ? 'var(--status-online)'
      : statusLabel === 'idle'
        ? 'var(--status-idle)'
        : statusLabel === 'dnd'
          ? 'var(--status-dnd)'
          : 'var(--status-offline)'

    return (
      <aside
        aria-label="Direct message profile"
        style={{
          height: '100%',
          minHeight: 0,
          background: isString ? 'var(--bg-sidebar-light)' : '#2b2d31',
          borderLeft: isString ? '1px solid var(--border-subtle)' : '1px solid #1e1f22',
          padding: isString ? '16px' : '20px 16px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          gap: isString ? 14 : 16,
        }}
      >
        <div
          style={{
            fontFamily: isString ? 'var(--font-mono)' : 'inherit',
            fontSize: isString ? 11 : 12,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: isString ? '0.08em' : '0.04em',
            color: isString ? 'var(--text-muted)' : '#949ba4',
          }}
        >
          Profile
        </div>

        <div
          style={{
            border: isString ? '1px solid var(--border-subtle)' : '1px solid #1e1f22',
            borderRadius: isString ? 2 : 8,
            background: isString ? 'var(--bg-panel)' : '#232428',
            padding: isString ? '14px' : '16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: 12,
          }}
        >
          <div style={{ position: 'relative' }}>
            {dmProfile.avatarUrl ? (
              <img
                src={dmProfile.avatarUrl}
                alt=""
                style={{
                  width: 72,
                  height: 72,
                  objectFit: 'cover',
                  borderRadius: isString ? 'var(--radius-sm)' : '50%',
                  display: 'block',
                }}
              />
            ) : (
              <div
                aria-hidden="true"
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: isString ? 'var(--radius-sm)' : '50%',
                  background: dmProfile.profileColor || getAvatarColor(dmProfile.displayName || dmProfile.username),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: 28,
                  fontWeight: 700,
                }}
              >
                {getInitial(dmProfile.displayName || dmProfile.username)}
              </div>
            )}
            <div
              aria-label={statusLabel}
              style={{
                position: 'absolute',
                right: -3,
                bottom: -3,
                width: 12,
                height: 12,
                borderRadius: '50%',
                border: `2px solid ${isString ? 'var(--bg-panel)' : '#232428'}`,
                background: statusColor,
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ minWidth: 0, width: '100%' }}>
            <div
              style={{
                color: isString ? 'var(--text-primary)' : '#f2f3f5',
                fontSize: isString ? 16 : 18,
                fontWeight: 600,
                lineHeight: 1.25,
                wordBreak: 'break-word',
              }}
            >
              {dmProfile.displayName}
            </div>
            <div
              style={{
                marginTop: 4,
                color: isString ? 'var(--text-muted)' : '#b5bac1',
                fontFamily: isString ? 'var(--font-mono)' : 'inherit',
                fontSize: isString ? 11 : 13,
                lineHeight: 1.3,
                wordBreak: 'break-word',
              }}
            >
              @{dmProfile.username}
            </div>
          </div>

          <div
            style={{
              width: '100%',
              borderTop: isString ? '1px solid var(--border-subtle)' : '1px solid #3f4147',
              paddingTop: 12,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: isString ? 'var(--font-mono)' : 'inherit',
                  fontSize: isString ? 10 : 11,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: isString ? '0.08em' : '0.04em',
                  color: isString ? 'var(--text-muted)' : '#949ba4',
                  marginBottom: 4,
                }}
              >
                Status
              </div>
              <div style={{ color: isString ? 'var(--text-primary)' : '#dbdee1', fontSize: isString ? 13 : 14 }}>
                {statusLabel}
              </div>
            </div>

            <div>
              <div
                style={{
                  fontFamily: isString ? 'var(--font-mono)' : 'inherit',
                  fontSize: isString ? 10 : 11,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: isString ? '0.08em' : '0.04em',
                  color: isString ? 'var(--text-muted)' : '#949ba4',
                  marginBottom: 4,
                }}
              >
                Bio
              </div>
              <div style={{ color: isString ? 'var(--text-primary)' : '#dbdee1', fontSize: isString ? 13 : 14, lineHeight: 1.5 }}>
                {dmProfile.bio || 'No bio set.'}
              </div>
            </div>
          </div>
        </div>
      </aside>
    )
  }

  return (
    <MemberListPane
      title={title}
      members={members}
      onViewProfile={onViewProfile}
      localUserId={localUserId}
      layoutMode={layoutMode}
    />
  )
})
