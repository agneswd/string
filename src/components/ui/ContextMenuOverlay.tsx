import React, { useMemo } from 'react'
import { User, MessageSquare } from 'lucide-react'
import { ContextMenu, type ContextMenuItem } from './ContextMenu'
import { UserProfilePopup, type ProfilePopupUser } from '../social/UserProfilePopup'
import { statusToLabel } from '../../lib/helpers'
import { identityToString } from '../../hooks/useAppData'
import type { User as UserRow } from '../../module_bindings/types'
import type { ProfilePopupState } from '../../hooks/useAppState'

export interface ContextMenuOverlayProps {
  contextMenu: { x: number; y: number; userId: string; user: ProfilePopupUser } | null
  profilePopup: ProfilePopupState
  identityString: string | null
  friends: Array<{ id: string }>
  usersByIdentity: Map<string, UserRow>
  getAvatarUrlForUser: (identityStr: string) => string | undefined
  onClose: () => void
  onCloseProfile: () => void
  onViewProfile: (userId: string) => void
  onStartDm: (userId: string) => void
}

export const ContextMenuOverlay: React.FC<ContextMenuOverlayProps> = ({
  contextMenu,
  profilePopup,
  identityString,
  friends,
  usersByIdentity,
  getAvatarUrlForUser,
  onClose,
  onCloseProfile,
  onViewProfile,
  onStartDm,
}) => {
  // Derive profile popup user data reactively from live DB state
  const profilePopupUser: ProfilePopupUser | null = useMemo(() => {
    if (!profilePopup) return null
    const found = usersByIdentity.get(profilePopup.userId)
    if (!found) return null
    const uid = identityToString(found.identity)
    return {
      displayName: found.displayName,
      username: found.username,
      bio: found.bio ?? undefined,
      status: statusToLabel(found.status),
      avatarUrl: getAvatarUrlForUser(uid),
      profileColor: found.profileColor ?? undefined,
    }
  }, [profilePopup, usersByIdentity, getAvatarUrlForUser])

  return (
    <>
      {/* Context Menu (right-click on user) */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={[
            {
              label: 'View Profile',
              icon: <User style={{ width: 16, height: 16 }} />,
              onClick: () => {
                onViewProfile(contextMenu.userId)
              },
            },
            ...(() => {
              // Show "Send Message" if the user is a friend
              const targetId = contextMenu.userId
              if (targetId && targetId !== identityString) {
                const isFriend = friends.some(f => f.id === targetId)
                if (isFriend) {
                  return [{
                    label: 'Send Message',
                    icon: <MessageSquare style={{ width: 16, height: 16 }} />,
                    onClick: () => { onStartDm(targetId) },
                  }] as ContextMenuItem[]
                }
              }
              return []
            })(),
          ]}
          onClose={onClose}
        />
      )}

      {/* User Profile Popup (centered modal) */}
      {profilePopupUser && (
        <UserProfilePopup
          user={profilePopupUser}
          onClose={onCloseProfile}
        />
      )}
    </>
  )
}
