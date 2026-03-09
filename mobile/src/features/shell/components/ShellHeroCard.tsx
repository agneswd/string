import type { ReactNode } from 'react'
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native'

import { Colors } from '../../../shared/theme'
import { Pill } from '../../../shared/ui'
import type { PillVariant } from '../../../shared/ui'
import type { ShellStat } from '../presentation'

interface HeroBadge {
  label: string
  variant?: PillVariant
}

interface ShellHeroCardProps {
  eyebrow: string
  title: string
  description: string
  badges?: HeroBadge[]
  stats?: ShellStat[]
  children?: ReactNode
  style?: StyleProp<ViewStyle>
}

export function ShellHeroCard({
  eyebrow,
  title,
  description,
  badges = [],
  stats = [],
  children,
  style,
}: ShellHeroCardProps) {
  return (
    <View style={[styles.card, style]}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>

      {badges.length > 0 ? (
        <View style={styles.badgeRow}>
          {badges.map((badge) => (
            <Pill key={badge.label} label={badge.label} variant={badge.variant ?? 'default'} />
          ))}
        </View>
      ) : null}

      {stats.length > 0 ? (
        <View style={styles.statsGrid}>
          {stats.map((stat) => (
            <View key={`${stat.label}-${stat.value}`} style={styles.statCard}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    gap: 12,
    padding: 14,
    borderRadius: 4,
    backgroundColor: Colors.bgSecondary,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  header: {
    gap: 6,
  },
  eyebrow: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },
  description: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statCard: {
    minWidth: 92,
    flexGrow: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 3,
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    gap: 2,
  },
  statValue: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  statLabel: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
})
