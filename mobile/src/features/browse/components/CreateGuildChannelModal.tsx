import React, { useEffect, useMemo, useState } from 'react'
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'

import { Colors } from '../../../shared/theme/colors'

export type CreateGuildChannelType = 'Category' | 'Text' | 'Voice'

interface ChannelCategoryOption {
  id: string
  name: string
}

interface CreateGuildChannelModalProps {
  visible: boolean
  submitting?: boolean
  error?: string | null
  availableCategories: ChannelCategoryOption[]
  onClose: () => void
  onSubmit: (params: {
    name: string
    channelType: CreateGuildChannelType
    parentCategoryId: string | null
  }) => void | Promise<void>
}

const CHANNEL_TYPES: CreateGuildChannelType[] = ['Category', 'Text', 'Voice']

export function CreateGuildChannelModal({
  visible,
  submitting = false,
  error,
  availableCategories,
  onClose,
  onSubmit,
}: CreateGuildChannelModalProps) {
  const [channelType, setChannelType] = useState<CreateGuildChannelType>('Text')
  const [name, setName] = useState('')
  const [parentCategoryId, setParentCategoryId] = useState<string | null>(null)

  useEffect(() => {
    if (!visible) {
      return
    }

    setChannelType('Text')
    setName('')
    setParentCategoryId(null)
  }, [visible])

  useEffect(() => {
    if (channelType === 'Category') {
      setParentCategoryId(null)
    }
  }, [channelType])

  const title = useMemo(() => {
    if (channelType === 'Category') {
      return 'Create Category'
    }

    return 'Create Channel'
  }, [channelType])

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
          <Text style={styles.eyebrow}>Create</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>
            Add a new category or channel to this loom directly from the mobile header.
          </Text>

          <View style={styles.group}>
            <Text style={styles.label}>Type</Text>
            <View style={styles.choiceRow}>
              {CHANNEL_TYPES.map((type) => {
                const selected = type === channelType
                return (
                  <Pressable
                    key={type}
                    style={[styles.choiceButton, selected && styles.choiceButtonActive]}
                    onPress={() => setChannelType(type)}
                    disabled={submitting}
                  >
                    <Text style={[styles.choiceLabel, selected && styles.choiceLabelActive]}>{type}</Text>
                  </Pressable>
                )
              })}
            </View>
          </View>

          <View style={styles.group}>
            <Text style={styles.label}>{channelType === 'Category' ? 'Category Name' : 'Channel Name'}</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={(value) => setName(value.slice(0, 100))}
              placeholder={channelType === 'Category' ? 'new-category' : 'new-channel'}
              placeholderTextColor={Colors.textDisabled}
              editable={!submitting}
              autoFocus={true}
              returnKeyType="done"
              onSubmitEditing={() => {
                if (name.trim()) {
                  void onSubmit({
                    name: name.trim(),
                    channelType,
                    parentCategoryId,
                  })
                }
              }}
            />
          </View>

          {channelType !== 'Category' ? (
            <View style={styles.group}>
              <Text style={styles.label}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.choiceRow}>
                <Pressable
                  style={[styles.choiceButton, !parentCategoryId && styles.choiceButtonActive]}
                  onPress={() => setParentCategoryId(null)}
                  disabled={submitting}
                >
                  <Text style={[styles.choiceLabel, !parentCategoryId && styles.choiceLabelActive]}>No Category</Text>
                </Pressable>
                {availableCategories.map((category) => {
                  const selected = parentCategoryId === category.id
                  return (
                    <Pressable
                      key={category.id}
                      style={[styles.choiceButton, selected && styles.choiceButtonActive]}
                      onPress={() => setParentCategoryId(category.id)}
                      disabled={submitting}
                    >
                      <Text style={[styles.choiceLabel, selected && styles.choiceLabelActive]}>{category.name}</Text>
                    </Pressable>
                  )
                })}
              </ScrollView>
            </View>
          ) : null}

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.actions}>
            <Pressable style={styles.secondaryButton} onPress={onClose} disabled={submitting}>
              <Text style={styles.secondaryLabel}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.primaryButton, (!name.trim() || submitting) && styles.buttonDisabled]}
              onPress={() => {
                if (name.trim()) {
                  void onSubmit({
                    name: name.trim(),
                    channelType,
                    parentCategoryId,
                  })
                }
              }}
              disabled={!name.trim() || submitting}
            >
              <Text style={styles.primaryLabel}>{submitting ? 'Creating…' : channelType === 'Category' ? 'Create Category' : 'Create Channel'}</Text>
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
    maxWidth: 380,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    borderRadius: 14,
    backgroundColor: Colors.bgSecondary,
    padding: 16,
    gap: 12,
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
  group: {
    gap: 6,
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
  choiceRow: {
    gap: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  choiceButton: {
    minHeight: 34,
    paddingHorizontal: 12,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgInput,
  },
  choiceButtonActive: {
    borderColor: Colors.accentBlue,
    backgroundColor: Colors.accentBlueDim,
  },
  choiceLabel: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '500',
  },
  choiceLabelActive: {
    color: Colors.accentBlue,
    fontWeight: '700',
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
    marginTop: 4,
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
    minWidth: 124,
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
