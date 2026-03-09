import React, { useState } from 'react'
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
} from 'react-native'
import { Colors } from '../../../shared/theme/colors'

interface MessageInputBarProps {
  /** Placeholder text shown in the empty input. */
  placeholder?: string
  /** Called when the user submits a non-empty message. */
  onSend: (text: string) => void
  /** Disable input and send button while a message is in-flight. */
  disabled?: boolean
}

/**
 * Sticky bottom input bar for DM chat threads.
 * Clears itself after a successful send.
 * React Native-safe.
 */
export function MessageInputBar({
  placeholder = 'Message…',
  onSend,
  disabled = false,
}: MessageInputBarProps) {
  const [text, setText] = useState('')

  function handleSend() {
    const trimmed = text.trim()
    if (!trimmed) return
    onSend(trimmed)
    setText('')
  }

  const canSend = text.trim().length > 0 && !disabled

  return (
    <View style={styles.bar}>
      <TextInput
        style={styles.input}
        value={text}
        onChangeText={setText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textDisabled}
        multiline
        maxLength={2000}
        editable={!disabled}
        onSubmitEditing={Platform.OS !== 'web' ? undefined : handleSend}
        blurOnSubmit={false}
      />
      <TouchableOpacity
        style={[styles.sendBtn, !canSend && styles.sendBtnDisabled]}
        onPress={handleSend}
        disabled={!canSend}
        activeOpacity={0.7}
      >
        <Text style={styles.sendIcon}>↑</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: Colors.bgSecondary,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.borderSubtle,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.bgInput,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    color: Colors.textPrimary,
    fontSize: 15,
    maxHeight: 120,
    lineHeight: 20,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.accentBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: Colors.bgElevated,
  },
  sendIcon: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
})
