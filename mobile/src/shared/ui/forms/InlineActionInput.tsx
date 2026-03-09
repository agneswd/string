import React, { useRef, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  type ReturnKeyTypeOptions,
  View,
} from 'react-native'

import { Colors } from '../../theme/colors'

interface InlineActionInputProps {
  value: string
  placeholder: string
  actionLabel: string
  onChangeText: (value: string) => void
  onAction: () => void
  disabled?: boolean
  busy?: boolean
  error?: string | null
  multiline?: boolean
  maxLength?: number
  editable?: boolean
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters'
  autoCorrect?: boolean
  returnKeyType?: ReturnKeyTypeOptions
  onSubmitEditing?: () => void
  blurOnSubmit?: boolean
  keepFocusOnAction?: boolean
}

export function InlineActionInput({
  value,
  placeholder,
  actionLabel,
  onChangeText,
  onAction,
  disabled = false,
  busy = false,
  error = null,
  multiline = false,
  maxLength,
  editable = true,
  autoCapitalize = 'sentences',
  autoCorrect = true,
  returnKeyType,
  onSubmitEditing,
  blurOnSubmit = false,
  keepFocusOnAction = false,
}: InlineActionInputProps) {
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<TextInput | null>(null)
  const actionDisabled = disabled || busy

  function handleActionPress() {
    onAction()

    if (keepFocusOnAction && editable && !busy) {
      requestAnimationFrame(() => {
        inputRef.current?.focus()
      })
    }
  }

  return (
    <View style={styles.root}>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={[styles.shell, focused && styles.shellFocused, !editable && styles.shellDisabled]}>
        <TextInput
          ref={inputRef}
          style={[styles.input, multiline && styles.inputMultiline]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.textMuted}
          multiline={multiline}
          maxLength={maxLength}
          editable={editable && !busy}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          returnKeyType={returnKeyType}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onSubmitEditing={onSubmitEditing}
          blurOnSubmit={blurOnSubmit}
        />

        <Pressable
          style={({ pressed }) => [
            styles.actionButton,
            pressed && !actionDisabled && styles.actionButtonPressed,
            actionDisabled && styles.actionButtonDisabled,
          ]}
          onPress={handleActionPress}
          disabled={actionDisabled}
        >
          {busy
            ? <ActivityIndicator size="small" color={Colors.accentBlue} />
            : <Text style={styles.actionLabel}>{actionLabel}</Text>}
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    gap: 8,
  },
  shell: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 40,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    borderRadius: 3,
    backgroundColor: Colors.bgInput,
    paddingLeft: 12,
    paddingRight: 10,
  },
  shellFocused: {
    borderColor: Colors.accentBlue,
  },
  shellDisabled: {
    opacity: 0.72,
  },
  input: {
    flex: 1,
    minHeight: 38,
    color: Colors.textPrimary,
    fontSize: 14,
    paddingVertical: 7,
    paddingRight: 8,
    includeFontPadding: false,
  },
  inputMultiline: {
    maxHeight: 128,
    textAlignVertical: 'top',
  },
  actionButton: {
    alignSelf: 'stretch',
    minWidth: 56,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  actionButtonPressed: {
    opacity: 0.72,
  },
  actionButtonDisabled: {
    opacity: 0.4,
  },
  actionLabel: {
    color: Colors.accentBlue,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  errorText: {
    color: Colors.accentRed,
    fontSize: 12,
  },
})
