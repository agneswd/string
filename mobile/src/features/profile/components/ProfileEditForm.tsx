import React, { useState, useCallback } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { Colors } from '../../../shared/theme/colors'
import type { OwnProfile, ProfileEditValues } from '../types'

interface ProfileEditFormProps {
  profile: OwnProfile
  onSave: (values: ProfileEditValues) => Promise<void>
  onCancel: () => void
}

/**
 * Inline profile-edit form for the "You" pane.
 * Mirrors the web ProfileSettingsForm fields (display name, username, bio).
 * React Native-safe.
 */
export function ProfileEditForm({ profile, onSave, onCancel }: ProfileEditFormProps) {
  const [displayName, setDisplayName] = useState(profile.displayName)
  const [username, setUsername] = useState(profile.username)
  const [bio, setBio] = useState(profile.statusMessage ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = useCallback(async () => {
    setSaving(true)
    setError(null)
    try {
      await onSave({
        displayName: displayName.trim(),
        username: username.trim(),
        bio: bio.trim(),
      })
      onCancel()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }, [displayName, username, bio, onSave, onCancel])

  return (
    <View style={styles.form}>
      <FieldBlock label="DISPLAY NAME" charMax={64} len={displayName.length}>
        <TextInput
          style={styles.input}
          value={displayName}
          onChangeText={(t) => setDisplayName(t.slice(0, 64))}
          placeholder="Display Name"
          placeholderTextColor={Colors.textDisabled}
          maxLength={64}
          autoCorrect={false}
        />
      </FieldBlock>

      <FieldBlock label="USERNAME" charMax={32} len={username.length}>
        <TextInput
          style={styles.input}
          value={username}
          onChangeText={(t) =>
            setUsername(t.slice(0, 32).toLowerCase().replace(/[^a-z0-9_.\-]/g, ''))
          }
          placeholder="username"
          placeholderTextColor={Colors.textDisabled}
          maxLength={32}
          autoCorrect={false}
          autoCapitalize="none"
        />
      </FieldBlock>

      <FieldBlock label="BIO" charMax={200} len={bio.length}>
        <TextInput
          style={[styles.input, styles.textarea]}
          value={bio}
          onChangeText={(t) => setBio(t.slice(0, 200))}
          placeholder="Tell people a little about yourself…"
          placeholderTextColor={Colors.textDisabled}
          multiline
          numberOfLines={3}
          maxLength={200}
          autoCorrect={false}
        />
      </FieldBlock>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} activeOpacity={0.7}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={() => {
            if (!saving) void handleSave()
          }}
          activeOpacity={0.7}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color={Colors.bgPrimary} />
          ) : (
            <Text style={styles.saveBtnText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  )
}

function FieldBlock({
  label,
  charMax,
  len,
  children,
}: {
  label: string
  charMax: number
  len: number
  children: React.ReactNode
}) {
  return (
    <View style={styles.fieldBlock}>
      <View style={styles.fieldHeader}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <Text style={styles.charCount}>
          {len}/{charMax}
        </Text>
      </View>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  form: {
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  fieldBlock: {
    gap: 4,
  },
  fieldHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fieldLabel: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  charCount: {
    color: Colors.textDisabled,
    fontSize: 10,
  },
  input: {
    backgroundColor: Colors.bgInput,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    borderRadius: 3,
    color: Colors.textPrimary,
    fontSize: 13,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  textarea: {
    minHeight: 72,
    textAlignVertical: 'top',
    paddingTop: 8,
  },
  errorText: {
    color: Colors.accentRed,
    fontSize: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    borderRadius: 3,
    paddingVertical: 10,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  saveBtn: {
    flex: 1,
    backgroundColor: Colors.accentBlue,
    borderRadius: 3,
    paddingVertical: 10,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveBtnText: {
    color: Colors.bgPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
})
