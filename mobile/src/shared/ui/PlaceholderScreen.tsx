import { ScrollView, StyleSheet, Text, View } from 'react-native'

import { Colors } from '../theme/colors'

interface PlaceholderScreenProps {
  eyebrow: string
  title: string
  description: string
  highlights: string[]
}

export function PlaceholderScreen({
  eyebrow,
  title,
  description,
  highlights,
}: PlaceholderScreenProps) {
  return (
    <ScrollView
      contentContainerStyle={styles.content}
      style={styles.root}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.heroCard}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Planned next steps</Text>
        <View style={styles.list}>
          {highlights.map((highlight) => (
            <View key={highlight} style={styles.listItem}>
              <View style={styles.listBullet} />
              <Text style={styles.listText}>{highlight}</Text>
            </View>
          ))}
        </View>
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
    gap: 16,
  },
  heroCard: {
    gap: 12,
    padding: 20,
    borderRadius: 20,
    backgroundColor: Colors.bgSecondary,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  eyebrow: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 28,
    fontWeight: '700',
  },
  description: {
    color: Colors.textSecondary,
    fontSize: 16,
    lineHeight: 24,
  },
  section: {
    gap: 12,
    padding: 20,
    borderRadius: 20,
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  list: {
    gap: 12,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  listBullet: {
    width: 8,
    height: 8,
    marginTop: 6,
    borderRadius: 999,
    backgroundColor: Colors.accentBlue,
  },
  listText: {
    flex: 1,
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
  },
})
