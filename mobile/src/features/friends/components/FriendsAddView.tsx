import React from 'react'
import { StyleSheet, Text, View } from 'react-native'

import { Colors } from '../../../shared/theme/colors'
import { InlineActionInput } from '../../../shared/ui/forms/InlineActionInput'

interface FriendsAddViewProps {
  username: string
  busy: boolean
  error: string | null
  onChangeUsername: (value: string) => void
  onSubmit: () => void
}

export function FriendsAddView({
  username,
  busy,
  error,
  onChangeUsername,
  onSubmit,
}: FriendsAddViewProps) {
  return (
    <View style={styles.root}>
      <View style={styles.copyBlock}>
        <Text style={styles.title}>Add Friend</Text>
        <Text style={styles.description}>You can add friends with their username.</Text>
      </View>

      <InlineActionInput
        value={username}
        onChangeText={onChangeUsername}
        placeholder="Username"
        actionLabel="Send Request"
        onAction={onSubmit}
        disabled={!username.trim() || busy}
        busy={busy}
        error={error}
        editable={!busy}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="send"
        onSubmitEditing={onSubmit}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: 14,
    paddingTop: 16,
    gap: 14,
  },
  copyBlock: {
    gap: 4,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
  },
  description: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
})
