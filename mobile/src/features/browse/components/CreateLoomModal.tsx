import React, { useEffect, useState } from 'react'
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'

import { Colors } from '../../../shared/theme/colors'

interface CreateLoomModalProps {
  visible: boolean
  submitting?: boolean
  error?: string | null
  initialName?: string
  onClose: () => void
  onSubmit: (name: string) => void | Promise<void>
}

export function CreateLoomModal({
  visible,
  submitting = false,
  error,
  initialName = '',
  onClose,
  onSubmit,
}: CreateLoomModalProps) {
  const [name, setName] = useState(initialName)

  useEffect(() => {
    if (visible) {
      setName(initialName)
    }
  }, [initialName, visible])

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.dialog}>
          <Text style={styles.eyebrow}>Create Loom</Text>
          <Text style={styles.title}>Start a new server</Text>
          <Text style={styles.description}>
            Pick a name for the new loom. The server rail updates after creation succeeds.
          </Text>

          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Server Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={(value) => setName(value.slice(0, 48))}
              placeholder="My Loom"
              placeholderTextColor={Colors.textDisabled}
              autoFocus={true}
              editable={!submitting}
              returnKeyType="done"
              onSubmitEditing={() => {
                if (name.trim()) {
                  void onSubmit(name.trim())
                }
              }}
            />
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.actions}>
            <Pressable style={styles.secondaryButton} onPress={onClose} disabled={submitting}>
              <Text style={styles.secondaryLabel}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.primaryButton, (!name.trim() || submitting) && styles.buttonDisabled]}
              onPress={() => {
                if (name.trim()) {
                  void onSubmit(name.trim())
                }
              }}
              disabled={!name.trim() || submitting}
            >
              <Text style={styles.primaryLabel}>{submitting ? 'Creating…' : 'Create'}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  dialog: {
    width: '100%',
    maxWidth: 360,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    borderRadius: 14,
    backgroundColor: Colors.bgSecondary,
    padding: 16,
    gap: 10,
  },
  eyebrow: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
  },
  description: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  fieldWrap: {
    gap: 6,
    marginTop: 6,
  },
  label: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  input: {
    height: 42,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    borderRadius: 2,
    backgroundColor: Colors.bgInput,
    paddingHorizontal: 12,
    color: Colors.textPrimary,
    fontSize: 14,
  },
  errorText: {
    color: Colors.accentRed,
    fontSize: 12,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 6,
  },
  secondaryButton: {
    minWidth: 84,
    height: 34,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  primaryButton: {
    minWidth: 96,
    height: 34,
    borderWidth: 1,
    borderColor: Colors.textPrimary,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  secondaryLabel: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '500',
  },
  primaryLabel: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
})
