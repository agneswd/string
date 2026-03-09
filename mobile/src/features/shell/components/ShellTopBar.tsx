import { ChevronLeft, Phone, Users } from 'lucide-react-native'
import { Pressable, StyleSheet, Text, View } from 'react-native'

import { Colors } from '../../../shared/theme'

interface ShellTopBarProps {
  title: string
  badgeLabel?: string
  eyebrow?: string
  subtitle?: string
  canGoBack?: boolean
  onBack?: () => void
  onCallAction?: () => void
  onRightAction?: () => void
}

export function ShellTopBar({
  title,
  badgeLabel,
  eyebrow,
  subtitle,
  canGoBack = false,
  onBack,
  onCallAction,
  onRightAction,
}: ShellTopBarProps) {
  return (
    <View style={styles.root}>
      <View style={styles.leadingRow}>
        {canGoBack ? (
          <Pressable onPress={onBack} style={styles.backButton}>
            <ChevronLeft color={Colors.textPrimary} size={18} strokeWidth={2.25} />
            <Text style={styles.backButtonText}>Back</Text>
          </Pressable>
        ) : null}

        <View style={styles.titleBlock}>
          <View style={styles.titleRow}>
            {badgeLabel ? (
              <View style={styles.titleBadge}>
                <Text style={styles.titleBadgeText} numberOfLines={1}>{badgeLabel}</Text>
              </View>
            ) : null}
            {!badgeLabel && eyebrow ? (
              <View style={styles.eyebrowPill}>
                <Text style={styles.eyebrowText} numberOfLines={1}>{eyebrow}</Text>
              </View>
            ) : null}
            <Text style={styles.title} numberOfLines={1}>{title}</Text>
          </View>
          {subtitle ? <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
        </View>
      </View>

      <View style={styles.trailingRow}>
        {onCallAction !== undefined ? (
          <Pressable style={styles.iconButton} onPress={onCallAction}>
            <Phone color={Colors.textMuted} size={15} strokeWidth={2} />
          </Pressable>
        ) : null}
        {onRightAction ? (
          <Pressable style={styles.iconButton} onPress={onRightAction}>
            <Users color={Colors.textMuted} size={16} strokeWidth={2} />
          </Pressable>
        ) : null}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 2,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
    backgroundColor: Colors.bgPrimary,
  },
  leadingRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  backButton: {
    minWidth: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.bgSecondary,
    borderWidth: 1,
    borderColor: Colors.borderDefault,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 2,
  },
  backButtonText: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  titleBlock: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  titleBadge: {
    borderWidth: 1,
    borderColor: Colors.borderDefault,
    borderRadius: 2,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'transparent',
    maxWidth: 140,
  },
  titleBadgeText: {
    color: Colors.textPrimary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  eyebrowPill: {
    borderWidth: 1,
    borderColor: Colors.borderDefault,
    borderRadius: 2,
    paddingHorizontal: 7,
    paddingVertical: 3,
    backgroundColor: 'transparent',
    maxWidth: 132,
  },
  eyebrowText: {
    color: Colors.accentBlue,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '500',
    flexShrink: 1,
  },
  subtitle: {
    color: Colors.textDisabled,
    fontSize: 10,
    lineHeight: 14,
  },
  trailingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.borderDefault,
    backgroundColor: Colors.bgSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
