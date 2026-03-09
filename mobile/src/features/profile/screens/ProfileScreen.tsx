import React, { useCallback, useMemo, useState } from 'react'
import { ScrollView, View, StyleSheet, Text } from 'react-native'
import { Colors } from '../../../shared/theme/colors'
import { EmptyState } from '../../../shared/ui/EmptyState'
import { SectionHeader } from '../../../shared/ui/SectionHeader'
import { RowSeparator } from '../../../shared/ui/RowSeparator'
import { ProfileCard } from '../components/ProfileCard'
import { ProfileSettingsPage } from '../components/settings/ProfileSettingsPage'
import { SettingRow } from '../components/SettingRow'
import { QuickActionsRow } from '../components/QuickActionsRow'
import type { StatusTag } from '../components/StatusPicker'
import type { OwnProfile, ProfileEditValues, ProfileSettingItem } from '../types'
import type { SettingsSection } from '../components/settings/ProfileSettingsControls'

// Static sections — not profile-dependent
const PREFERENCES_ITEMS: ProfileSettingItem[] = [
  { id: 'notifications', label: 'Notifications', navigable: true },
  { id: 'appearance', label: 'Appearance', navigable: true },
  { id: 'language', label: 'Language', value: 'English', navigable: true },
]

const SUPPORT_ITEMS: ProfileSettingItem[] = [
  { id: 'help', label: 'Help & Support', navigable: true },
  { id: 'privacy', label: 'Privacy Policy', navigable: true },
  { id: 'terms', label: 'Terms of Service', navigable: true },
]

const DANGER_ITEMS: ProfileSettingItem[] = [
  { id: 'sign-out', label: 'Sign Out', destructive: true },
]

interface ProfileScreenProps {
  profile?: OwnProfile
  /** Called when the user confirms Sign Out. */
  onSignOut?: () => void
  /** Called when the user taps a navigable setting row (not edit-profile or sign-out). */
  onNavigate?: (id: string) => void
  /** Called when the user submits the inline profile edit form. */
  onUpdateProfile?: (values: ProfileEditValues) => Promise<void>
  /** Called when the user picks a new presence status. */
  onSetStatus?: (statusTag: StatusTag) => Promise<void>
  /** Whether the user is currently muted in their voice channel. */
  isMuted?: boolean
  /** Whether the user is currently deafened in their voice channel. */
  isDeafened?: boolean
  /** Called when the Mute quick-action is tapped. Only provided when in a voice channel. */
  onToggleMute?: () => void
  /** Called when the Deafen quick-action is tapped. Only provided when in a voice channel. */
  onToggleDeafen?: () => void
}

// ─── Local helpers ────────────────────────────────────────────────────────────

function Card({ children }: { children: React.ReactNode }) {
  return <View style={cardStyles.card}>{children}</View>
}

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgSecondary,
    marginHorizontal: 16,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    overflow: 'hidden',
  },
})

function Section({
  title,
  items,
  onPress,
}: {
  title: string
  items: ProfileSettingItem[]
  onPress?: (id: string) => void
}) {
  return (
    <View>
      <SectionHeader title={title} />
      <Card>
        {items.map((item, idx) => (
          <View key={item.id}>
            <SettingRow
              item={item}
              onPress={item.navigable || item.destructive ? () => onPress?.(item.id) : undefined}
            />
            {idx < items.length - 1 && <RowSeparator />}
          </View>
        ))}
      </Card>
    </View>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

/**
 * ProfileScreen ("You" tab)
 *
 * Comprises:
 *  • Hero profile card
 *  • Quick-action row (Edit Profile toggle, Mute/Deafen stubs)
 *  • Collapsible inline profile edit form
 *  • Four-option presence/status picker
 *  • Grouped settings sections (Account, Preferences, Support, Danger Zone)
 *
 * Navigation and profile-mutation callbacks are injected by the shell.
 * React Native-safe.
 */
export function ProfileScreen({
  profile,
  onSignOut,
  onNavigate,
  onUpdateProfile,
  onSetStatus,
  isMuted,
  isDeafened,
  onToggleMute,
  onToggleDeafen,
}: ProfileScreenProps) {
  const [settingsSection, setSettingsSection] = useState<SettingsSection>('general')
  const [settingsOpen, setSettingsOpen] = useState(false)

  const handlePress = useCallback(
    (id: string) => {
      if (id === 'sign-out') {
        onSignOut?.()
      } else {
        const nextSection = toSettingsSection(id)
        if (nextSection) {
          setSettingsSection(nextSection)
          setSettingsOpen(true)
          return
        }

        onNavigate?.(id)
      }
    },
    [onSignOut, onNavigate],
  )

  const profileHasVoiceControls = useMemo(
    () => Boolean(onToggleMute || onToggleDeafen),
    [onToggleDeafen, onToggleMute],
  )

  if (!profile) {
    return (
      <View style={styles.emptyRoot}>
        <EmptyState
          title="Profile is still syncing"
          body="Your account details will appear here as soon as the signed-in session and mobile profile snapshot finish loading."
        />
      </View>
    )
  }

  const accountItems: ProfileSettingItem[] = [
    { id: 'edit-profile', label: 'Edit Profile', navigable: false },
    { id: 'change-username', label: 'Change Username', navigable: true },
    {
      id: 'email',
      label: 'Email',
      value: profile.email ?? '—',
      navigable: false,
    },
  ]

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.root}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerBlock}>
          <Text style={styles.eyebrow}>You</Text>
          <Text style={styles.title}>Profile &amp; controls</Text>
        </View>

        <ProfileCard profile={profile} />

        <QuickActionsRow
          isMuted={isMuted}
          isDeafened={isDeafened}
          onOpenSettings={() => {
            setSettingsSection('general')
            setSettingsOpen(true)
          }}
          onToggleMute={onToggleMute}
          onToggleDeafen={onToggleDeafen}
        />

        <Section title="Account" items={accountItems} onPress={handlePress} />
        <Section title="Preferences" items={PREFERENCES_ITEMS} onPress={handlePress} />
        <Section title="Support" items={SUPPORT_ITEMS} onPress={handlePress} />
        <Section title="Danger Zone" items={DANGER_ITEMS} onPress={handlePress} />

        {profileHasVoiceControls ? <View style={styles.bottomSpacer} /> : null}
      </ScrollView>

      <ProfileSettingsPage
        visible={settingsOpen}
        profile={profile}
        initialSection={settingsSection}
        onClose={() => setSettingsOpen(false)}
        onSignOut={onSignOut}
      />
    </View>
  )
}

function toSettingsSection(id: string): SettingsSection | null {
  if (id === 'change-username' || id === 'email' || id === 'edit-profile') {
    return 'account'
  }

  if (id === 'notifications' || id === 'appearance' || id === 'language') {
    return 'general'
  }

  return null
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  emptyRoot: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  headerBlock: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 4,
  },
  eyebrow: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 32,
    fontWeight: '700',
  },
  content: {
    paddingBottom: 48,
  },
  bottomSpacer: {
    height: 12,
  },
})
