import React, { useEffect, useState } from 'react'
import { X } from 'lucide-react-native'
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
          <View style={styles.headerRow}>
            <Text style={styles.title}>Create a Loom</Text>
            <Pressable style={styles.closeButton} onPress={onClose} disabled={submitting}>
              <X color={Colors.textPrimary} size={20} strokeWidth={2.1} />
            </Pressable>
          </View>

          <View style={styles.headerDivider} />

          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Loom Name</Text>
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

          <Pressable
            style={[styles.primaryButton, (!name.trim() || submitting) && styles.buttonDisabled]}
            onPress={() => {
              if (name.trim()) {
                void onSubmit(name.trim())
              }
            }}
            disabled={!name.trim() || submitting}
          >
            <Text style={styles.primaryLabel}>{submitting ? 'Creating Loom…' : 'Create Loom'}</Text>
          </Pressable>
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
    paddingHorizontal: 12,
  },
  dialog: {
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    borderRadius: 10,
    backgroundColor: Colors.bgPrimary,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    width: 44,
    height: 40,
    borderRadius: 4,
    backgroundColor: Colors.bgSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.borderSubtle,
  },
  fieldWrap: {
    gap: 6,
  },
  label: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  input: {
    height: 36,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    borderRadius: 0,
    backgroundColor: Colors.bgInput,
    paddingHorizontal: 10,
    color: Colors.textPrimary,
    fontSize: 14,
  },
  errorText: {
    color: Colors.accentRed,
    fontSize: 12,
    lineHeight: 18,
  },
  primaryButton: {
    width: '100%',
    height: 32,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    backgroundColor: Colors.bgPrimary,
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  primaryLabel: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 2,
    textTransform: 'none',
  },
})
