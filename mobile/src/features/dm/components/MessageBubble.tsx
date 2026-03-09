import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Colors } from '../../../shared/theme/colors'
import type { EpochMs } from '../../../shared/types/common'

interface MessageBubbleProps {
  text: string
  sentAt: EpochMs
  /** When true the bubble is right-aligned (sent by the current user). */
  isOwn: boolean
  /** Dim the bubble and show a spinner-substitute when optimistic. */
  pending?: boolean
}

function formatTime(ms: EpochMs): string {
  const d = new Date(ms)
  const h = d.getHours().toString().padStart(2, '0')
  const m = d.getMinutes().toString().padStart(2, '0')
  return `${h}:${m}`
}

/**
 * Single message bubble used in DM chat threads.
 * Own messages float right with accent background;
 * peer messages float left with elevated background.
 * React Native-safe.
 */
export function MessageBubble({ text, sentAt, isOwn, pending = false }: MessageBubbleProps) {
  return (
    <View style={[styles.wrapper, isOwn ? styles.wrapperOwn : styles.wrapperPeer]}>
      <View
        style={[
          styles.bubble,
          isOwn ? styles.bubbleOwn : styles.bubblePeer,
          pending && styles.bubblePending,
        ]}
      >
        <Text style={[styles.text, pending && styles.textPending]}>{text}</Text>
      </View>
      <Text style={[styles.timestamp, isOwn ? styles.timestampOwn : styles.timestampPeer]}>
        {formatTime(sentAt)}{pending ? ' · sending…' : ''}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    maxWidth: '78%',
    gap: 3,
    marginVertical: 2,
  },
  wrapperOwn: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  wrapperPeer: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  bubbleOwn: {
    backgroundColor: Colors.accentBlueDim,
    borderBottomRightRadius: 4,
  },
  bubblePeer: {
    backgroundColor: Colors.bgElevated,
    borderBottomLeftRadius: 4,
  },
  bubblePending: {
    opacity: 0.6,
  },
  text: {
    color: Colors.textPrimary,
    fontSize: 15,
    lineHeight: 21,
  },
  textPending: {
    color: Colors.textSecondary,
  },
  timestamp: {
    fontSize: 11,
    color: Colors.textDisabled,
  },
  timestampOwn: {
    marginRight: 4,
  },
  timestampPeer: {
    marginLeft: 4,
  },
})
