import { Crown } from 'lucide-react-native'
import { SectionList, StyleSheet, Text, View } from 'react-native'

import { Colors } from '../../../shared/theme'
import { Avatar, EmptyState, PresenceDot } from '../../../shared/ui'
import type { PresenceStatus } from '../../../shared/ui'

export interface ShellMemberItem {
  id: string
  displayName: string
  username: string
  status: PresenceStatus
  subtitle: string | null
  avatarUri?: string
  profileColor?: string | null
  isOwner?: boolean
}

interface ShellMembersPaneProps {
  title: string
  members: ShellMemberItem[]
}

export function ShellMembersPane({ title, members }: ShellMembersPaneProps) {
  const onlineMembers = members.filter((member) => member.status !== 'offline')
  const offlineMembers = members.filter((member) => member.status === 'offline')
  const sections = [
    onlineMembers.length > 0 ? { title: `Online — ${onlineMembers.length}`, data: onlineMembers } : null,
    offlineMembers.length > 0 ? { title: `Offline — ${offlineMembers.length}`, data: offlineMembers } : null,
  ].filter(Boolean) as Array<{ title: string; data: ShellMemberItem[] }>

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => item.id}
      contentContainerStyle={members.length === 0 ? styles.emptyContent : styles.listContent}
      renderSectionHeader={({ section }) => (
        <View style={styles.headerBlock}>
          <Text style={styles.headerLabel}>{section.title}</Text>
        </View>
      )}
      renderItem={({ item }) => (
        <View style={styles.row}>
          <View style={styles.avatarWrap}>
            <Avatar
              name={item.displayName}
              seed={item.id || item.username}
              size={32}
              uri={item.avatarUri}
              backgroundColor={item.profileColor ?? undefined}
            />
            <View style={styles.presenceWrap}>
              <PresenceDot status={item.status} size={10} />
            </View>
          </View>
          <View style={styles.copy}>
            <View style={styles.nameRow}>
              <Text style={[styles.name, item.profileColor ? { color: item.profileColor } : null]} numberOfLines={1}>
                {item.displayName}
              </Text>
              {item.isOwner ? <Crown size={13} color="#faa81a" fill="#faa81a" /> : null}
            </View>
            <Text style={styles.username} numberOfLines={1}>
              @{item.username}
            </Text>
            {item.subtitle ? (
              <Text style={styles.subtitle} numberOfLines={2}>
                {item.subtitle}
              </Text>
            ) : null}
          </View>
        </View>
      )}
      ListEmptyComponent={
        <EmptyState
          title="No members visible"
          body={`Members for ${title} will appear here once the live guild roster is available.`}
        />
      }
    />
  )
}

const styles = StyleSheet.create({
  listContent: {
    paddingTop: 14,
    paddingHorizontal: 16,
    paddingBottom: 18,
    gap: 10,
  },
  emptyContent: {
    flexGrow: 1,
  },
  headerBlock: {
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
    marginBottom: 10,
  },
  headerLabel: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 2,
  },
  avatarWrap: {
    position: 'relative',
  },
  presenceWrap: {
    position: 'absolute',
    right: -1,
    bottom: -1,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  name: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  username: {
    color: Colors.textSecondary,
    fontSize: 11,
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
  },
})
