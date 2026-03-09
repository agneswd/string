import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useSpacetime } from '../../core/spacetime'
import { avatarBytesToUri } from '../../shared/lib/avatarUtils'
import { Colors } from '../../shared/theme/colors'
import { Avatar } from '../../shared/ui/Avatar'
import { EmptyState } from '../../shared/ui/EmptyState'
import { InlineActionInput } from '../../shared/ui/forms/InlineActionInput'

interface ChannelChatScreenProps {
  channelId: string
  channelName: string
  guildName: string
}

export function ChannelChatScreen({ channelId, channelName, guildName }: ChannelChatScreenProps) {
  const insets = useSafeAreaInsets()
  const {
    data,
    guildMessages,
    identity,
    selectGuildChannel,
    selectedGuildChannelId,
    sendGuildMessage,
  } = useSpacetime()
  const [draft, setDraft] = useState('')
  const [sendError, setSendError] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [keyboardHeight, setKeyboardHeight] = useState(0)
  const listRef = useRef<FlatList<(typeof items)[number]> | null>(null)

  useEffect(() => {
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

  useEffect(() => {
    selectGuildChannel(channelId)
    return () => {
      selectGuildChannel(null)
    }
  }, [channelId, selectGuildChannel])

  const usersByIdentity = useMemo(
    () => new Map(data.users.map((user) => [identityToString(user.identity), user])),
    [data.users],
  )

  const items = useMemo(() => {
    return guildMessages.map((message) => {
      const authorId = identityToString(message.authorIdentity)
      const author = usersByIdentity.get(authorId)
      return {
        id: toIdKey(message.messageId),
        authorId,
        authorName: author?.displayName ?? author?.username ?? 'Member',
        authorSeed: author?.username ?? authorId,
        avatarUri: avatarBytesToUri(author?.avatarBytes),
        profileColor: author?.profileColor ?? null,
        text: message.content,
        sentAt: timestampToLabel(message.sentAt),
        isOwn: authorId === identity,
      }
    })
  }, [guildMessages, identity, usersByIdentity])

  const isLoading = selectedGuildChannelId !== channelId && items.length === 0

  async function handleSend() {
    const content = draft.trim()
    if (!content || isSending) {
      return
    }

    setIsSending(true)
    setSendError(null)

    try {
      await sendGuildMessage({ channelId, content, replyTo: null })
      setDraft('')
    } catch (error) {
      setSendError(error instanceof Error ? error.message : 'Could not send the message.')
    } finally {
      setIsSending(false)
    }
  }

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={Colors.accentBlue} />
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
    >
      <FlatList
        ref={listRef}
        data={items}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={items.length === 0 ? styles.emptyList : styles.listContent}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Avatar
              name={item.authorName}
              seed={item.authorSeed}
              size={40}
              uri={item.avatarUri}
              backgroundColor={item.profileColor ?? undefined}
            />
            <View style={styles.rowBody}>
              <View style={styles.rowMeta}>
                <Text style={[styles.author, item.profileColor ? { color: item.profileColor } : null]}>{item.authorName}</Text>
                <Text style={styles.timestamp}>{item.sentAt}</Text>
              </View>
              <Text style={styles.messageText}>{item.text}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            title="No messages yet"
            body={`Say hello in #${channelName} inside ${guildName} to start the conversation.`}
          />
        }
      />

      <View style={[styles.composerWrap, Platform.OS === 'android' && keyboardHeight > 0 ? { paddingBottom: keyboardHeight + 14 } : null]}>
        <InlineActionInput
          value={draft}
          onChangeText={setDraft}
          placeholder={`Message #${channelName}`}
          actionLabel="Send"
          onAction={() => { void handleSend() }}
          disabled={!draft.trim() || isSending}
          busy={isSending}
          error={sendError}
          maxLength={2000}
          returnKeyType="send"
          onSubmitEditing={() => { void handleSend() }}
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
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgPrimary,
  },
  listContent: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 18,
  },
  emptyList: {
    flexGrow: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  rowBody: {
    flex: 1,
    gap: 4,
  },
  rowMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  author: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  timestamp: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  messageText: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 22,
  },
  composerWrap: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 14,
  },
})

function toIdKey(value: unknown): string {
  if (typeof value === 'bigint') {
    return value.toString()
  }

  return String(value)
}

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

function timestampToLabel(value: unknown): string {
  if (typeof value === 'object' && value !== null) {
    const withToDate = value as { toDate?: () => Date }
    const maybeDate = withToDate.toDate?.()
    if (maybeDate instanceof Date) {
      return maybeDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  }

  const parsed = new Date(String(value))
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return 'now'
}
