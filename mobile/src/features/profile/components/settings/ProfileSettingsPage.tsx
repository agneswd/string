import React, { useEffect, useState } from 'react'
import { X } from 'lucide-react-native'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'

import { avatarBytesToUri } from '../../../../shared/lib/avatarUtils'
import { Avatar } from '../../../../shared/ui/Avatar'
import { Colors } from '../../../../shared/theme/colors'
import type { OwnProfile } from '../../types'
import {
  LayoutModePicker,
  SettingsSidebar,
  SettingsSlider,
  SettingsToggle,
  type LayoutMode,
  type SettingsSection,
} from './ProfileSettingsControls'

interface ProfileSettingsPageProps {
  visible: boolean
  profile: OwnProfile
  initialSection: SettingsSection
  onClose: () => void
  onSignOut?: () => void
}

export function ProfileSettingsPage({
  visible,
  profile,
  initialSection,
  onClose,
  onSignOut,
}: ProfileSettingsPageProps) {
  const [activeSection, setActiveSection] = useState<SettingsSection>(initialSection)
  const [uiSoundLevel, setUiSoundLevel] = useState(50)
  const [callSoundLevel, setCallSoundLevel] = useState(50)
  const [dmAlertSoundLevel, setDmAlertSoundLevel] = useState(51)
  const [friendAlertSoundLevel, setFriendAlertSoundLevel] = useState(50)
  const [voiceDefaultVolume, setVoiceDefaultVolume] = useState(50)
  const [friendStatusNotificationsEnabled, setFriendStatusNotificationsEnabled] = useState(false)
  const [dmMessageNotificationsEnabled, setDmMessageNotificationsEnabled] = useState(false)
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('string')

  useEffect(() => {
    if (visible) {
      setActiveSection(initialSection)
    }
  }, [initialSection, visible])

  if (!visible) {
    return null
  }

  return (
    <View style={styles.overlay}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
        <Pressable style={styles.closeButton} onPress={onClose}>
          <X color={Colors.textPrimary} size={22} strokeWidth={2} />
        </Pressable>
      </View>

      <View style={styles.body}>
        <SettingsSidebar activeSection={activeSection} onSelectSection={setActiveSection} />

        <ScrollView style={styles.panel} contentContainerStyle={styles.panelContent} showsVerticalScrollIndicator={false}>
          {activeSection === 'general' ? (
            <>
              <View style={styles.introBlock}>
                <Text style={styles.sectionTitle}>General settings</Text>
                <Text style={styles.sectionBody}>Application preferences, notifications, and layout.</Text>
              </View>

              <View style={styles.formBlock}>
                <View style={styles.infoBlock}>
                  <Text style={styles.label}>UI SOUND LEVEL</Text>
                  <Text style={styles.infoText}>Sound preferences are now managed from the dedicated Sound section.</Text>
                </View>

                <SettingsToggle
                  label="Friend online/offline notifications"
                  value={friendStatusNotificationsEnabled}
                  onChange={setFriendStatusNotificationsEnabled}
                />
                <SettingsToggle
                  label="DM message notifications"
                  value={dmMessageNotificationsEnabled}
                  onChange={setDmMessageNotificationsEnabled}
                />

                <View style={styles.infoBlock}>
                  <Text style={styles.label}>Layout</Text>
                  <LayoutModePicker value={layoutMode} onChange={setLayoutMode} />
                </View>
              </View>
            </>
          ) : activeSection === 'sound' ? (
            <>
              <View style={styles.introBlock}>
                <Text style={styles.sectionTitle}>Sound</Text>
                <Text style={styles.sectionBody}>Tune interface sounds, alerts, and default voice playback levels.</Text>
              </View>

              <View style={styles.formBlock}>
                <SettingsSlider label="UI sounds" value={uiSoundLevel} onChange={setUiSoundLevel} />
                <SettingsSlider label="Call sounds" value={callSoundLevel} onChange={setCallSoundLevel} />
                <SettingsSlider label="DM alerts" value={dmAlertSoundLevel} onChange={setDmAlertSoundLevel} />
                <SettingsSlider label="Friend alerts" value={friendAlertSoundLevel} onChange={setFriendAlertSoundLevel} />
                <SettingsSlider label="Voice default" value={voiceDefaultVolume} onChange={setVoiceDefaultVolume} />
              </View>
            </>
          ) : (
            <>
              <View style={styles.introBlock}>
                <Text style={styles.sectionTitle}>Account</Text>
                <Text style={styles.sectionBody}>Your current identity, linked email, and session controls.</Text>
              </View>

              <View style={styles.formBlock}>
                <View style={styles.identityRow}>
                  <Avatar
                    name={profile.displayName || profile.username}
                    seed={profile.id || profile.username}
                    uri={avatarBytesToUri(profile.avatarBytes)}
                    size={46}
                    backgroundColor={profile.profileColor ?? undefined}
                  />
                  <View style={styles.identityCopy}>
                    <Text style={styles.identityName}>{profile.displayName}</Text>
                    <Text style={styles.identityUsername}>@{profile.username}</Text>
                  </View>
                </View>

                {profile.email ? (
                  <View style={styles.accountBlock}>
                    <Text style={styles.label}>Email</Text>
                    <Text style={styles.accountValue}>{profile.email}</Text>
                  </View>
                ) : null}

                <View style={styles.accountBlock}>
                  <Pressable style={styles.signOutButton} onPress={onSignOut}>
                    <Text style={styles.signOutText}>Sign out</Text>
                  </Pressable>
                </View>
              </View>
            </>
          )}
        </ScrollView>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.bgPrimary,
    borderLeftWidth: 1,
    borderLeftColor: Colors.borderSubtle,
    zIndex: 20,
  },
  header: {
    minHeight: 58,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgSecondary,
  },
  body: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  panel: {
    flex: 1,
  },
  panelContent: {
    gap: 18,
    paddingBottom: 32,
  },
  introBlock: {
    gap: 4,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  sectionBody: {
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  formBlock: {
    gap: 18,
  },
  infoBlock: {
    gap: 8,
  },
  infoText: {
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  label: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
  },
  identityCopy: {
    flex: 1,
    minWidth: 0,
  },
  identityName: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  identityUsername: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  accountBlock: {
    gap: 8,
    paddingTop: 2,
  },
  accountValue: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  signOutButton: {
    minHeight: 34,
    borderWidth: 1,
    borderColor: Colors.accentRed,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutText: {
    color: Colors.accentRed,
    fontSize: 14,
    letterSpacing: 1,
  },
})
