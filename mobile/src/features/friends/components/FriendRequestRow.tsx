import React from 'react'
import { ActivityIndicator, View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Avatar } from '../../../shared/ui/Avatar'
import { Pill } from '../../../shared/ui/Pill'
import { Colors } from '../../../shared/theme/colors'
import type { FriendRequest } from '../types'

function formatAge(sentAt: number) {
  const elapsedMinutes = Math.max(1, Math.round((Date.now() - sentAt) / 60_000))

  if (elapsedMinutes >= 60) {
    const hours = Math.round(elapsedMinutes / 60)
    return `${hours}h ago`
  }

  return `${elapsedMinutes}m ago`
}

interface FriendRequestRowProps {
  request: FriendRequest
  onAccept?: () => void
  onDecline?: () => void
  onCancel?: () => void
  busy?: boolean
}

/**
 * Pending friend request row.
 * Incoming requests show Accept / Decline actions.
 * Outgoing requests show a Cancel action.
 * React Native-safe.
 */
export function FriendRequestRow({
  request,
  onAccept,
  onDecline,
  onCancel,
  busy = false,
}: FriendRequestRowProps) {
  const isIncoming = request.direction === 'incoming'
  const ageLabel = formatAge(request.sentAt)
  const acceptDisabled = busy || !onAccept
  const declineDisabled = busy || !onDecline
  const cancelDisabled = busy || !onCancel

  return (
    <View style={styles.row}>
      <Avatar
        name={request.fromName}
        seed={request.fromUsername}
        size={44}
        uri={request.avatarUri}
        backgroundColor={request.profileColor ?? undefined}
      />

      <View style={styles.content}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {request.fromName}
          </Text>
          <Pill label={ageLabel} variant="default" />
        </View>
        <Text style={styles.meta}>@{request.fromUsername}</Text>
        <Text style={styles.meta}>
          {isIncoming ? 'Wants to be your friend' : 'Request sent'}
        </Text>

        {isIncoming ? (
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.acceptBtn, acceptDisabled && styles.actionBtnDisabled]}
              onPress={onAccept}
              activeOpacity={acceptDisabled ? 1 : 0.7}
              disabled={acceptDisabled}
            >
              {busy ? <ActivityIndicator size="small" color={Colors.accentGreen} /> : <Text style={styles.acceptText}>Accept</Text>}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.declineBtn, declineDisabled && styles.actionBtnDisabled]}
              onPress={onDecline}
              activeOpacity={declineDisabled ? 1 : 0.7}
              disabled={declineDisabled}
            >
              <Text style={styles.declineText}>Decline</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.actionBtn, styles.cancelBtn, cancelDisabled && styles.actionBtnDisabled]}
            onPress={onCancel}
            activeOpacity={cancelDisabled ? 1 : 0.7}
            disabled={cancelDisabled}
          >
            {busy ? <ActivityIndicator size="small" color={Colors.textMuted} /> : <Text style={styles.cancelText}>Cancel</Text>}
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  name: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  meta: {
    color: Colors.textSecondary,
    fontSize: 11,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  actionBtn: {
    borderRadius: 3,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 84,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnDisabled: {
    opacity: 0.55,
  },
  acceptBtn: {
    borderColor: Colors.accentGreen,
  },
  acceptText: {
    color: Colors.accentGreen,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  declineBtn: {
    borderColor: Colors.borderSubtle,
  },
  declineText: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cancelBtn: {
    borderColor: Colors.borderSubtle,
    alignSelf: 'flex-start',
  },
  cancelText: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
})
