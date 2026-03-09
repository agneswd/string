import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'

import { Colors } from '../../../shared/theme/colors'

export type FriendsTabKey = 'online' | 'all' | 'pending'

const TAB_LABELS: Array<{ key: FriendsTabKey; label: string }> = [
  { key: 'online', label: 'Online' },
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
]

interface FriendsTabBarProps {
  activeTab: FriendsTabKey
  isAddViewActive?: boolean
  pendingCount: number
  onSelectTab: (tab: FriendsTabKey) => void
  onPressAddFriend?: () => void
}

export function FriendsTabBar({
  activeTab,
  isAddViewActive = false,
  pendingCount,
  onSelectTab,
  onPressAddFriend,
}: FriendsTabBarProps) {
  return (
    <View style={styles.root}>
      <View style={styles.tabsRow}>
        <View style={styles.tabsGroup}>
          {TAB_LABELS.map((tab) => {
            const isActive = tab.key === activeTab
            return (
              <Pressable
                key={tab.key}
                style={[styles.tabButton, isActive && styles.tabButtonActive]}
                onPress={() => onSelectTab(tab.key)}
              >
                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{tab.label}</Text>
                {tab.key === 'pending' && pendingCount > 0 ? (
                  <Text style={styles.pendingCount}>{pendingCount}</Text>
                ) : null}
              </Pressable>
            )
          })}
        </View>

        <View style={styles.spacer} />

        <Pressable style={[styles.addFriendButton, isAddViewActive && styles.addFriendButtonActive]} onPress={onPressAddFriend}>
          <Text style={[styles.addFriendLabel, isAddViewActive && styles.addFriendLabelActive]}>Add Friend</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 10,
    backgroundColor: Colors.bgPrimary,
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tabsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tabButton: {
    minHeight: 28,
    paddingHorizontal: 10,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  tabButtonActive: {
    backgroundColor: Colors.bgSecondary,
  },
  tabLabel: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  pendingCount: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  spacer: {
    width: 1,
    height: 18,
    backgroundColor: Colors.borderSubtle,
    marginLeft: 4,
    marginRight: 6,
  },
  addFriendButton: {
    minHeight: 30,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.textPrimary,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 0,
  },
  addFriendButtonActive: {
    backgroundColor: Colors.bgSecondary,
  },
  addFriendLabel: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '500',
  },
  addFriendLabelActive: {
    fontWeight: '700',
  },
})
