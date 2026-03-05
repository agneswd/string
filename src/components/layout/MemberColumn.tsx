import { useMemo, memo } from 'react'
import { MemberListPane, type MemberListItem, type MemberListPaneProps } from '../guild/MemberListPane'

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

  return (
    <MemberListPane
      title={title}
      members={members}
      onViewProfile={onViewProfile}
      localUserId={localUserId}
    />
  )
})
