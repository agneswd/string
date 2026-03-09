import React, { useMemo, useRef, useState } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useSpacetime } from '../../core/spacetime'
import type { User } from '../../module_bindings/types'
import { Colors } from '../../shared/theme/colors'
import { InlineActionInput } from '../../shared/ui/forms/InlineActionInput'
import { ChatEmptyState } from './components/ChatEmptyState'
import { ChatTimelineRow } from './components/ChatTimelineRow'
import { useChat } from './useChat'
import type { ChatMessage, ChatScreenParams } from './types'

interface ChatScreenProps extends ChatScreenParams {
  /** Called when the user taps the back / close affordance. */
  onBack: () => void
  showHeader?: boolean
}

/**
 * ChatScreen
 *
 * Renders the message thread for a single DM conversation and an input bar.
 * Receives `onBack` so navigation coupling lives in the shell.
 * React Native-safe – no DOM APIs.
 */
export function ChatScreen({ conversationId, peerName, onBack, showHeader = true }: ChatScreenProps) {
  const { data, identity } = useSpacetime()
  const insets = useSafeAreaInsets()
  const currentUserId = identityToString(identity)
  const usersByIdentity = useMemo(
    () => new Map<string, User>(data.users.map((user) => [identityToString(user.identity), user])),
    [data.users],
  )
  const currentUser = usersByIdentity.get(currentUserId)
  const peerUser = useMemo(
    () => Array.from(usersByIdentity.values()).find((user) => user.displayName === peerName || user.username === peerName),
    [peerName, usersByIdentity],
  )

  const { messages, isLoading, error, sendMessage } = useChat(
    conversationId,
    currentUserId,
  )

  const [draft, setDraft] = useState('')
  const [keyboardHeight, setKeyboardHeight] = useState(0)
  const listRef = useRef<FlatList<ChatMessage>>(null)

  React.useEffect(() => {
    const showSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (event) => {
        setKeyboardHeight(Math.max(0, event.endCoordinates.height - insets.bottom))
      },
    )
    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardHeight(0),
    )

    return () => {
      showSubscription.remove()
      hideSubscription.remove()
      Keyboard.dismiss()
    }
  }, [insets.bottom])

  function handleSend() {
    const trimmed = draft.trim()
    if (!trimmed) return
    sendMessage(trimmed)
    setDraft('')
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50)
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
    >
      {showHeader ? (
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton} hitSlop={8}>
            <Text style={styles.backLabel}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {peerName}
          </Text>
        </View>
      ) : null}

      {/* Body */}
      {isLoading ? (
        <View style={styles.centred}>
          <ActivityIndicator color={Colors.accentBlue} />
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={
            messages.length === 0 ? styles.emptyContainer : styles.messageList
          }
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <ChatEmptyState
              peerName={peerName}
              profileColor={peerUser?.profileColor ?? null}
            />
          }
          renderItem={({ item }) => (
            <ChatTimelineRow
              message={item}
              peerName={peerName}
              currentUserId={currentUserId}
              currentUser={currentUser ? {
                id: currentUserId,
                avatarBytes: currentUser.avatarBytes,
                profileColor: currentUser.profileColor ?? null,
              } : null}
              peerUser={peerUser ? {
                id: identityToString(peerUser.identity),
                avatarBytes: peerUser.avatarBytes,
                profileColor: peerUser.profileColor ?? null,
              } : null}
            />
          )}
        />
      )}

      <View style={[styles.inputBar, Platform.OS === 'android' && keyboardHeight > 0 ? { paddingBottom: keyboardHeight + 10 } : null]}>
        <InlineActionInput
          value={draft}
          onChangeText={setDraft}
          placeholder={`Message ${peerName}`}
          actionLabel="Send"
          onAction={handleSend}
          disabled={!draft.trim()}
          error={error}
          maxLength={2000}
          returnKeyType="send"
          onSubmitEditing={handleSend}
          blurOnSubmit={false}
          keepFocusOnAction={true}
        />
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  centred: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flexGrow: 1,
  },
  // ── Header ─────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.borderSubtle,
    gap: 8,
  },
  backButton: {
    paddingRight: 4,
  },
  backLabel: {
    color: Colors.accentBlue,
    fontSize: 26,
    lineHeight: 26,
  },
  headerTitle: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  // ── Messages ────────────────────────────────────────────────────────────
  messageList: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 12,
  },
  // ── Input bar ───────────────────────────────────────────────────────────
  inputBar: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
})

function identityToString(value: unknown): string {
  if (!value) {
    return ''
  }

  if (typeof value === 'object') {
    const withToHex = value as { toHex?: () => { toString: () => string } }
    const hex = withToHex.toHex?.()
    if (hex) {
      return hex.toString()
    }
  }

  return String(value)
}
