import { LayoutGrid, MessagesSquare, UserRound } from 'lucide-react-native'
import { Pressable, StyleSheet, Text, View } from 'react-native'

import { Colors } from '../../../shared/theme'
import type { ShellTabDefinition, ShellTabKey } from '../types'

interface ShellBottomNavProps {
  tabs: ShellTabDefinition[]
  activeTab: ShellTabKey
  onSelectTab: (tab: ShellTabKey) => void
}

export function ShellBottomNav({ tabs, activeTab, onSelectTab }: ShellBottomNavProps) {
  return (
    <View style={styles.root}>
      {tabs.map((tab) => {
        const isActive = tab.key === activeTab

        return (
          <Pressable
            key={tab.key}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
            onPress={() => onSelectTab(tab.key)}
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
            ]}
          >
            <View style={styles.iconWrap}>
              {tab.key === 'browse' ? <LayoutGrid color={isActive ? Colors.accentBlue : Colors.textMuted} size={16} strokeWidth={2} /> : null}
              {tab.key === 'friends' ? <MessagesSquare color={isActive ? Colors.accentBlue : Colors.textMuted} size={16} strokeWidth={2} /> : null}
              {tab.key === 'you' ? <UserRound color={isActive ? Colors.accentBlue : Colors.textMuted} size={16} strokeWidth={2} /> : null}
            </View>
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {tab.label}
            </Text>
            {tab.badgeCount && tab.badgeCount > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{tab.badgeCount > 99 ? '99+' : tab.badgeCount}</Text>
              </View>
            ) : null}
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    minHeight: 60,
    flexDirection: 'row',
    backgroundColor: Colors.bgSecondary,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
    paddingHorizontal: 8,
    paddingTop: 4,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    borderRadius: 10,
    minHeight: 44,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  buttonPressed: {
    opacity: 0.88,
  },
  iconWrap: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '500',
  },
  labelActive: {
    color: Colors.accentBlue,
    fontWeight: '600',
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 18,
    minWidth: 18,
    height: 18,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: Colors.accentBlue,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.badgeBg,
  },
  badgeText: {
    color: Colors.badgeText,
    fontSize: 10,
    fontWeight: '800',
  },
})
