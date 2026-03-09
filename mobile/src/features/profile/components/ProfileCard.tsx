import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Avatar } from '../../../shared/ui/Avatar'
import { PresenceDot } from '../../../shared/ui/PresenceDot'
import { Colors } from '../../../shared/theme/colors'
import { avatarBytesToUri } from '../../../shared/lib/avatarUtils'
import type { OwnProfile } from '../types'

interface ProfileCardProps {
  profile: OwnProfile
}

/**
 * Hero card showing the signed-in user's avatar, name, and presence.
 * React Native-safe.
 */
export function ProfileCard({ profile }: ProfileCardProps) {
  const avatarUri = avatarBytesToUri(profile.avatarBytes)

  return (
    <View style={styles.card}>
      <View style={styles.avatarWrapper}>
        <Avatar
          name={profile.displayName}
          seed={profile.id || profile.username}
          uri={avatarUri}
          size={56}
          backgroundColor={profile.profileColor ?? undefined}
        />
        <View style={styles.presencePin}>
          <PresenceDot status={profile.status} size={18} />
        </View>
      </View>

      <View style={styles.textColumn}>
        <Text style={styles.displayName}>{profile.displayName}</Text>
        <Text style={styles.username}>@{profile.username}</Text>
        <Text style={styles.statusText}>{renderStatus(profile.status)}</Text>
      </View>
    </View>
  )
}

function renderStatus(status: OwnProfile['status']) {
  if (status === 'dnd') return 'Do Not Disturb'
  if (status === 'offline') return 'Offline'
  return 'Online'
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgSecondary,
    paddingVertical: 18,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    gap: 14,
  },
  avatarWrapper: {
    position: 'relative',
    width: 56,
    height: 56,
  },
  presencePin: {
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  textColumn: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  displayName: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  username: {
    color: Colors.textMuted,
    fontSize: 13,
  },
  statusText: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
})
