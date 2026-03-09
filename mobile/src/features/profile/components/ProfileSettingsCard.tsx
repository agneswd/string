import { Buffer } from 'buffer'
import React, { useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'

import { Avatar } from '../../../shared/ui/Avatar'
import { Colors } from '../../../shared/theme/colors'
import { avatarBytesToUri } from '../../../shared/lib/avatarUtils'
import { PROFILE_COLORS } from '../constants'
import { StatusPicker, type StatusTag } from './StatusPicker'
import type { OwnProfile, ProfileEditValues } from '../types'

interface ProfileSettingsCardProps {
  profile: OwnProfile
  onSave?: (values: ProfileEditValues) => Promise<void>
  onSetStatus?: (statusTag: StatusTag) => Promise<void>
}

export function ProfileSettingsCard({ profile, onSave, onSetStatus }: ProfileSettingsCardProps) {
  const [username, setUsername] = useState(profile.username)
  const [displayName, setDisplayName] = useState(profile.displayName)
  const [bio, setBio] = useState(profile.statusMessage ?? '')
  const [profileColor, setProfileColor] = useState(profile.profileColor ?? PROFILE_COLORS[0])
  const [status, setStatus] = useState<StatusTag>(toStatusTag(profile.status))
  const [avatarBytes, setAvatarBytes] = useState<Uint8Array | null | undefined>(profile.avatarBytes)
  const [avatarPreviewUri, setAvatarPreviewUri] = useState<string | undefined>(avatarBytesToUri(profile.avatarBytes))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hasChanges = useMemo(() => (
    username !== profile.username
    || displayName !== profile.displayName
    || bio !== (profile.statusMessage ?? '')
    || profileColor !== (profile.profileColor ?? PROFILE_COLORS[0])
    || status !== toStatusTag(profile.status)
    || avatarBytes !== profile.avatarBytes
  ), [avatarBytes, bio, displayName, profile, profileColor, status, username])

  async function handleUploadAvatar() {
    setError(null)

    let imagePickerModule: typeof import('expo-image-picker')
    try {
      imagePickerModule = await import('expo-image-picker')
    } catch {
      setError('Image upload is not available in this emulator build yet. Rebuild the app after syncing native Expo modules.')
      return
    }

    const result = await imagePickerModule.launchImageLibraryAsync({
      allowsEditing: true,
      mediaTypes: imagePickerModule.MediaTypeOptions.Images,
      quality: 0.8,
      base64: true,
      selectionLimit: 1,
    })

    if (result.canceled) {
      return
    }

    const asset = result.assets[0]
    if (!asset) {
      return
    }

    setAvatarPreviewUri(asset.uri)

    if (asset.base64) {
      const nextBytes = new Uint8Array(Buffer.from(asset.base64, 'base64'))
      setAvatarBytes(nextBytes)
      return
    }

    try {
      const response = await fetch(asset.uri)
      const buffer = await response.arrayBuffer()
      setAvatarBytes(new Uint8Array(buffer))
    } catch {
      setError('Could not read the selected avatar image.')
    }
  }

  function handleResetAvatar() {
    setAvatarBytes(null)
    setAvatarPreviewUri(undefined)
  }

  async function handleSave() {
    if (!onSave && !onSetStatus) {
      return
    }

    setSaving(true)
    setError(null)

    try {
      if (onSave) {
        await onSave({
          username,
          displayName,
          bio,
          avatarBytes: avatarBytes ?? null,
          profileColor,
        })
      }

      if (onSetStatus && status !== toStatusTag(profile.status)) {
        await onSetStatus(status)
      }
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Could not save your profile settings.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <View style={styles.card}>
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Avatar</Text>
        <View style={styles.avatarRow}>
          <Avatar
            name={displayName || username}
            seed={profile.id || username}
            uri={avatarPreviewUri}
            size={64}
            backgroundColor={profileColor}
          />
          <View style={styles.avatarButtons}>
            <Pressable style={styles.secondaryButton} onPress={() => void handleUploadAvatar()}>
              <Text style={styles.secondaryButtonText}>Upload Avatar</Text>
            </Pressable>
            <Pressable style={styles.resetButton} onPress={handleResetAvatar}>
              <Text style={styles.secondaryButtonText}>Reset</Text>
            </Pressable>
            <Text style={styles.helpText}>Max 100 KB, image only</Text>
          </View>
        </View>
      </View>

      <Field
        label="Username"
        value={username}
        count={`${username.length}/32`}
        onChangeText={(nextValue) => setUsername(nextValue.slice(0, 32).toLowerCase().replace(/[^a-z0-9_.-]/g, ''))}
      />
      <Field
        label="Display Name"
        value={displayName}
        count={`${displayName.length}/64`}
        onChangeText={(nextValue) => setDisplayName(nextValue.slice(0, 64))}
      />
      <Field
        label="Bio"
        value={bio}
        count={`${bio.length}/500`}
        onChangeText={(nextValue) => setBio(nextValue.slice(0, 500))}
        multiline={true}
      />

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Profile Color</Text>
        <View style={styles.swatchRow}>
          {PROFILE_COLORS.map((color) => {
            const selected = color === profileColor
            return (
              <Pressable
                key={color}
                onPress={() => setProfileColor(color)}
                style={[styles.swatch, { backgroundColor: color }, selected && styles.swatchSelected]}
              >
                {selected ? <Text style={styles.swatchCheck}>✓</Text> : null}
              </Pressable>
            )
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Status</Text>
        <View style={styles.statusWrap}>
          <StatusPicker currentStatus={profile.status} selectedTag={status} onSelect={setStatus} />
        </View>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Pressable
        style={[styles.saveButton, (!hasChanges || saving) && styles.saveButtonDisabled]}
        onPress={() => void handleSave()}
        disabled={!hasChanges || saving}
      >
        {saving ? <ActivityIndicator size="small" color={Colors.textMuted} /> : <Text style={styles.saveButtonText}>Save profile</Text>}
      </Pressable>
    </View>
  )
}

function Field({
  label,
  value,
  count,
  onChangeText,
  multiline = false,
}: {
  label: string
  value: string
  count: string
  onChangeText: (value: string) => void
  multiline?: boolean
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.textarea]}
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        numberOfLines={multiline ? 5 : 1}
        placeholderTextColor={Colors.textDisabled}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
      <Text style={styles.count}>{count}</Text>
    </View>
  )
}

function toStatusTag(status: OwnProfile['status']): StatusTag {
  if (status === 'online') return 'Online'
  if (status === 'dnd') return 'DoNotDisturb'
  return 'Offline'
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginTop: 14,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    backgroundColor: Colors.bgSecondary,
    gap: 12,
  },
  section: {
    gap: 6,
  },
  sectionLabel: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  avatarButtons: {
    flex: 1,
    gap: 8,
  },
  secondaryButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    height: 30,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    borderRadius: 2,
    justifyContent: 'center',
  },
  resetButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    height: 30,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    borderRadius: 2,
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '500',
  },
  helpText: {
    color: Colors.textDisabled,
    fontSize: 11,
  },
  input: {
    minHeight: 42,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    borderRadius: 2,
    backgroundColor: Colors.bgInput,
    paddingHorizontal: 12,
    color: Colors.textPrimary,
    fontSize: 14,
  },
  textarea: {
    minHeight: 108,
    paddingTop: 12,
    paddingBottom: 12,
  },
  count: {
    color: Colors.textDisabled,
    fontSize: 11,
    textAlign: 'right',
  },
  swatchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  swatch: {
    width: 28,
    height: 28,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchSelected: {
    borderColor: Colors.textPrimary,
  },
  swatchCheck: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  statusWrap: {
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    borderRadius: 2,
    overflow: 'hidden',
  },
  errorText: {
    color: Colors.accentRed,
    fontSize: 12,
  },
  saveButton: {
    height: 34,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: Colors.textMuted,
    fontSize: 14,
    letterSpacing: 1,
  },
})
