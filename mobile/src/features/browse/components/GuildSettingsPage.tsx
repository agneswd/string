import { Buffer } from 'buffer'
import React, { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'

import { avatarBytesToUri } from '../../../shared/lib/avatarUtils'
import { Avatar } from '../../../shared/ui/Avatar'
import { Colors } from '../../../shared/theme/colors'
import type { Guild } from '../types'

interface InvitableFriend {
  id: string
  displayName: string
  username: string
  avatarUri?: string
  profileColor?: string | null
  identity: unknown
}

interface GuildSettingsPageProps {
  guild: Guild
  invitableFriends: InvitableFriend[]
  onClose: () => void
  onSave?: (params: { name?: string | null; bio?: string | null; avatarBytes?: Uint8Array | null }) => Promise<void>
  onInviteMember?: (identity: unknown) => Promise<void>
  onLeaveGuild?: () => Promise<void>
  onDeleteGuild?: () => Promise<void>
}

export function GuildSettingsPage({
  guild,
  invitableFriends,
  onClose,
  onSave,
  onInviteMember,
  onLeaveGuild,
  onDeleteGuild,
}: GuildSettingsPageProps) {
  const [name, setName] = useState(guild.name)
  const [bio, setBio] = useState(guild.description ?? '')
  const [avatarBytes, setAvatarBytes] = useState<Uint8Array | null>(guild.avatarBytes ?? null)
  const [avatarPreviewUri, setAvatarPreviewUri] = useState<string | undefined>(guild.avatarUri)
  const [inviteQuery, setInviteQuery] = useState('')
  const [saving, setSaving] = useState(false)
  const [actionBusy, setActionBusy] = useState<'invite' | 'leave' | 'delete' | 'copy' | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setName(guild.name)
    setBio(guild.description ?? '')
    setAvatarBytes(guild.avatarBytes ?? null)
    setAvatarPreviewUri(guild.avatarUri)
    setInviteQuery('')
    setSaving(false)
    setActionBusy(null)
    setError(null)
  }, [guild.avatarBytes, guild.avatarUri, guild.description, guild.id, guild.name])

  const hasChanges = useMemo(() => (
    name !== guild.name
    || bio !== (guild.description ?? '')
    || avatarBytes !== (guild.avatarBytes ?? null)
  ), [avatarBytes, bio, guild.avatarBytes, guild.description, guild.name, name])

  const filteredFriends = useMemo(() => {
    const normalizedQuery = inviteQuery.trim().toLowerCase()
    if (!normalizedQuery) {
      return invitableFriends
    }

    return invitableFriends.filter((friend) => (
      friend.displayName.toLowerCase().includes(normalizedQuery)
      || friend.username.toLowerCase().includes(normalizedQuery)
    ))
  }, [invitableFriends, inviteQuery])

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
      setAvatarBytes(new Uint8Array(Buffer.from(asset.base64, 'base64')))
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

  function handleRemoveAvatar() {
    setAvatarBytes(null)
    setAvatarPreviewUri(undefined)
  }

  async function handleSave() {
    if (!onSave || saving || !name.trim()) {
      return
    }

    setSaving(true)
    setError(null)

    try {
      await onSave({
        name: name.trim(),
        bio,
        avatarBytes,
      })
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Could not save loom settings.')
    } finally {
      setSaving(false)
    }
  }

  async function handleCopyGuildId() {
    setActionBusy('copy')
    setError(null)

    try {
      Alert.alert('Loom ID', guild.id)
    } finally {
      setActionBusy(null)
    }
  }

  function confirmLeaveGuild() {
    if (!onLeaveGuild) {
      return
    }

    Alert.alert('Leave Loom', 'Are you sure you want to leave this Loom?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave Loom',
        style: 'destructive',
        onPress: () => {
          setActionBusy('leave')
          setError(null)
          void onLeaveGuild()
            .then(() => onClose())
            .catch((nextError) => {
              setError(nextError instanceof Error ? nextError.message : 'Could not leave this loom.')
            })
            .finally(() => setActionBusy(null))
        },
      },
    ])
  }

  function confirmDeleteGuild() {
    if (!onDeleteGuild) {
      return
    }

    Alert.alert('Delete Loom', 'Delete this Loom permanently? This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete Loom',
        style: 'destructive',
        onPress: () => {
          setActionBusy('delete')
          setError(null)
          void onDeleteGuild()
            .then(() => onClose())
            .catch((nextError) => {
              setError(nextError instanceof Error ? nextError.message : 'Could not delete this loom.')
            })
            .finally(() => setActionBusy(null))
        },
      },
    ])
  }

  async function handleInvite(identity: unknown) {
    if (!onInviteMember) {
      return
    }

    setActionBusy('invite')
    setError(null)
    try {
      await onInviteMember(identity)
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Could not send that invite.')
    } finally {
      setActionBusy(null)
    }
  }

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable onPress={onClose} style={styles.headerButton}>
          <Text style={styles.headerButtonText}>Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Loom Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <Avatar
            name={guild.name}
            uri={avatarPreviewUri ?? avatarBytesToUri(avatarBytes) ?? undefined}
            size={64}
          />
          <View style={styles.heroTextWrap}>
            <Text style={styles.heroTitle}>{guild.name}</Text>
            {guild.ownerName ? <Text style={styles.heroSubtitle}>Owner: {guild.ownerName}</Text> : null}
            <Text style={styles.heroBody}>{guild.description?.trim() || 'No server bio yet.'}</Text>
          </View>
        </View>

        {guild.isOwner ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Loom Settings</Text>

            <Text style={styles.label}>Loom Avatar</Text>
            <View style={styles.avatarActionRow}>
              <Avatar
                name={name.trim() || guild.name}
                uri={avatarPreviewUri ?? avatarBytesToUri(avatarBytes) ?? undefined}
                size={56}
              />
              <View style={styles.avatarActionButtons}>
                <Pressable style={styles.secondaryButton} onPress={() => { void handleUploadAvatar() }}>
                  <Text style={styles.secondaryLabel}>Upload Avatar</Text>
                </Pressable>
                <Pressable style={styles.secondaryButton} onPress={handleRemoveAvatar}>
                  <Text style={styles.secondaryLabel}>Remove Avatar</Text>
                </Pressable>
              </View>
            </View>

            <Text style={styles.label}>Loom Name</Text>
            <TextInput
              value={name}
              onChangeText={(value) => setName(value.slice(0, 100))}
              style={styles.input}
              placeholder="My Loom"
              placeholderTextColor={Colors.textDisabled}
              editable={!saving}
            />

            <Text style={styles.label}>Loom Bio</Text>
            <TextInput
              value={bio}
              onChangeText={(value) => setBio(value.slice(0, 240))}
              style={[styles.input, styles.textarea]}
              placeholder="Tell people what this loom is for"
              placeholderTextColor={Colors.textDisabled}
              multiline={true}
              textAlignVertical="top"
              editable={!saving}
            />

            <Pressable
              style={[styles.primaryButton, (!hasChanges || !name.trim() || saving) && styles.buttonDisabled]}
              onPress={() => { void handleSave() }}
              disabled={!hasChanges || !name.trim() || saving}
            >
              {saving ? <ActivityIndicator color={Colors.textPrimary} size="small" /> : <Text style={styles.primaryLabel}>Save Changes</Text>}
            </Pressable>
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Invite People</Text>
          <TextInput
            value={inviteQuery}
            onChangeText={setInviteQuery}
            style={styles.input}
            placeholder="Search friends..."
            placeholderTextColor={Colors.textDisabled}
          />

          <View style={styles.inviteList}>
            {filteredFriends.map((friend) => (
              <View key={friend.id} style={styles.inviteRow}>
                <View style={styles.inviteIdentityWrap}>
                  <Avatar name={friend.displayName || friend.username} uri={friend.avatarUri} size={36} backgroundColor={friend.profileColor ?? undefined} />
                  <View style={styles.inviteTextWrap}>
                    <Text style={styles.inviteName}>{friend.displayName || friend.username}</Text>
                    <Text style={styles.inviteUsername}>@{friend.username}</Text>
                  </View>
                </View>
                <Pressable
                  style={[styles.secondaryButton, actionBusy === 'invite' && styles.buttonDisabled]}
                  onPress={() => { void handleInvite(friend.identity) }}
                  disabled={actionBusy === 'invite' || !onInviteMember}
                >
                  <Text style={styles.secondaryLabel}>Invite</Text>
                </Pressable>
              </View>
            ))}

            {filteredFriends.length === 0 ? <Text style={styles.emptyText}>No matching friends available to invite.</Text> : null}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Actions</Text>
          <ActionRow title="View Loom Info" body="See the Loom bio, owner, and avatar summary above." />
          <ActionButton title="Copy Loom ID" onPress={() => { void handleCopyGuildId() }} disabled={actionBusy !== null} />
          <ActionButton title="Leave Loom" onPress={confirmLeaveGuild} disabled={actionBusy !== null || !onLeaveGuild} danger />
          {guild.isOwner ? (
            <ActionButton title="Delete Loom" onPress={confirmDeleteGuild} disabled={actionBusy !== null || !onDeleteGuild} danger />
          ) : null}
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </ScrollView>
    </View>
  )
}

function ActionRow({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.actionRowStatic}>
      <Text style={styles.actionTitle}>{title}</Text>
      <Text style={styles.actionBody}>{body}</Text>
    </View>
  )
}

function ActionButton({
  title,
  onPress,
  disabled,
  danger = false,
}: {
  title: string
  onPress: () => void
  disabled?: boolean
  danger?: boolean
}) {
  return (
    <Pressable
      style={[styles.actionButton, danger && styles.actionButtonDanger, disabled && styles.buttonDisabled]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[styles.actionTitle, danger && styles.actionTitleDanger]}>{title}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  header: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
    backgroundColor: Colors.bgPrimary,
  },
  headerButton: {
    minWidth: 52,
    height: 32,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  headerButtonText: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 52,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 14,
    gap: 12,
  },
  heroCard: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    borderRadius: 3,
    backgroundColor: Colors.bgSecondary,
  },
  heroTextWrap: {
    flex: 1,
    gap: 4,
  },
  heroTitle: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
  },
  heroSubtitle: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  heroBody: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  card: {
    gap: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    borderRadius: 3,
    backgroundColor: Colors.bgSecondary,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  label: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  avatarActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarActionButtons: {
    flex: 1,
    gap: 8,
  },
  input: {
    minHeight: 42,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    borderRadius: 2,
    backgroundColor: Colors.bgInput,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: Colors.textPrimary,
    fontSize: 14,
  },
  textarea: {
    minHeight: 96,
  },
  primaryButton: {
    minHeight: 36,
    borderWidth: 1,
    borderColor: Colors.textPrimary,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgPrimary,
  },
  primaryLabel: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  secondaryButton: {
    minHeight: 34,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    borderRadius: 2,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgPrimary,
  },
  secondaryLabel: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '500',
  },
  inviteList: {
    gap: 10,
  },
  inviteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  inviteIdentityWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  inviteTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  inviteName: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  inviteUsername: {
    color: Colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  emptyText: {
    color: Colors.textDisabled,
    fontSize: 12,
  },
  actionRowStatic: {
    gap: 4,
    paddingVertical: 4,
  },
  actionButton: {
    minHeight: 40,
    borderTopWidth: 1,
    borderTopColor: Colors.borderSubtle,
    justifyContent: 'center',
    paddingVertical: 8,
  },
  actionButtonDanger: {
    borderTopColor: Colors.borderSubtle,
  },
  actionTitle: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  actionTitleDanger: {
    color: Colors.accentRed,
  },
  actionBody: {
    color: Colors.textMuted,
    fontSize: 12,
    lineHeight: 17,
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  errorText: {
    color: Colors.accentRed,
    fontSize: 12,
    lineHeight: 18,
  },
})