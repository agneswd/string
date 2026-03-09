import { ScrollView, StyleSheet, Text, View } from 'react-native'

import { Colors } from '../../../shared/theme'
import { Pill } from '../../../shared/ui'
import { getShellDetailPreview, type ShellActiveDetail } from '../presentation'
import { ShellHeroCard } from './ShellHeroCard'

interface ShellDetailScreenProps {
  title: string
  subtitle: string
  eyebrow: string
  detail: Exclude<ShellActiveDetail, null>
}

export function ShellDetailScreen({ title, subtitle, eyebrow, detail }: ShellDetailScreenProps) {
  const preview = getShellDetailPreview(detail)

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <ShellHeroCard
        eyebrow={preview.hero.eyebrow}
        title={preview.hero.title}
        description={preview.hero.description}
        badges={preview.badges}
        stats={preview.hero.stats}
      >
        <View style={styles.heroFooter}>
          <Text style={styles.heroFooterTitle}>{eyebrow}</Text>
          <Text style={styles.heroFooterBody}>{title} · {subtitle}</Text>
        </View>
      </ShellHeroCard>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Detail snapshot</Text>
        {preview.stats.map((stat) => (
          <View key={`${stat.label}-${stat.value}`} style={styles.statRow}>
            <Text style={styles.statLabel}>{stat.label}</Text>
            <Text style={styles.statValue}>{stat.value}</Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Activity snapshot</Text>
        {preview.activity.map((item) => (
          <View key={item.title} style={styles.activityRow}>
            <View style={styles.activityContent}>
              <Text style={styles.activityTitle}>{item.title}</Text>
              <Text style={styles.cardBody}>{item.body}</Text>
            </View>
            <Pill label={item.meta} variant="default" />
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Next step</Text>
        {preview.nextSteps.map((step) => (
          <View key={step} style={styles.nextStepRow}>
            <View style={styles.nextStepBullet} />
            <Text style={styles.cardBody}>{step}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  content: {
    padding: 16,
    gap: 14,
  },
  heroFooter: {
    gap: 4,
    padding: 14,
    borderRadius: 18,
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  heroFooterTitle: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  heroFooterBody: {
    color: Colors.textPrimary,
    fontSize: 14,
    lineHeight: 21,
  },
  card: {
    gap: 8,
    padding: 18,
    borderRadius: 20,
    backgroundColor: Colors.bgSecondary,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  cardTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  cardBody: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingTop: 6,
  },
  statLabel: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  statValue: {
    flex: 1,
    textAlign: 'right',
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingTop: 8,
  },
  activityContent: {
    flex: 1,
    gap: 4,
  },
  activityTitle: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  nextStepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingTop: 8,
  },
  nextStepBullet: {
    width: 8,
    height: 8,
    borderRadius: 999,
    marginTop: 7,
    backgroundColor: Colors.accentBlue,
  },
})