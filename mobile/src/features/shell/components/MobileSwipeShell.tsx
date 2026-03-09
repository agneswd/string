import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  Animated,
  Easing,
  PanResponder,
  StyleSheet,
  View,
  type GestureResponderEvent,
  type LayoutChangeEvent,
  type PanResponderGestureState,
} from 'react-native'

import { Colors } from '../../../shared/theme'
import type { MobilePane } from '../mobileShellState'

export interface MobileSwipeShellProps {
  navigationPane: ReactNode
  navigationFooter?: ReactNode
  contentHeader: ReactNode
  contentBody: ReactNode
  contentFooter?: ReactNode
  membersHeader?: ReactNode
  membersPane?: ReactNode
  activePane: MobilePane
  onActivePaneChange: (pane: MobilePane) => void
  canNavigateToContent?: boolean
  canNavigateToMembers?: boolean
}

const SWIPE_THRESHOLD = 56

export function MobileSwipeShell({
  navigationPane,
  navigationFooter,
  contentHeader,
  contentBody,
  contentFooter,
  membersHeader,
  membersPane,
  activePane,
  onActivePaneChange,
  canNavigateToContent = true,
  canNavigateToMembers = false,
}: MobileSwipeShellProps) {
  const [layoutWidth, setLayoutWidth] = useState(0)
  const translateX = useRef(new Animated.Value(0)).current
  const hasMembersPane = Boolean(membersPane)
  const paneCount = hasMembersPane ? 3 : 2
  const activePaneIndex = activePane === 'content' ? 1 : activePane === 'members' && hasMembersPane ? 2 : 0

  const snapToActivePane = useMemo(
    () => (animated = true) => {
      const nextValue = -activePaneIndex * layoutWidth
      if (!layoutWidth) {
        translateX.setValue(0)
        return
      }

      if (!animated) {
        translateX.setValue(nextValue)
        return
      }

      Animated.timing(translateX, {
        toValue: nextValue,
        duration: 240,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start()
    },
    [activePaneIndex, layoutWidth, translateX],
  )

  useEffect(() => {
    snapToActivePane(true)
  }, [snapToActivePane])

  function handleLayout(event: LayoutChangeEvent) {
    const nextWidth = event.nativeEvent.layout.width
    if (!nextWidth || nextWidth === layoutWidth) {
      return
    }

    setLayoutWidth(nextWidth)
  }

  function resolveNextPane(deltaX: number): MobilePane {
    if (deltaX > SWIPE_THRESHOLD) {
      if (activePane === 'members') {
        return 'content'
      }

      if (activePane === 'content') {
        return 'navigation'
      }

      return activePane
    }

    if (deltaX < -SWIPE_THRESHOLD) {
      if (activePane === 'navigation' && canNavigateToContent) {
        return 'content'
      }

      if (activePane === 'content' && hasMembersPane && canNavigateToMembers) {
        return 'members'
      }
    }

    return activePane
  }

  const panResponder = useMemo(
    () => PanResponder.create({
      onMoveShouldSetPanResponder: (_event, gestureState) => {
        if (!layoutWidth) {
          return false
        }

        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 12
      },
      onPanResponderMove: () => {},
      onPanResponderRelease: (_event: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        const nextPane = resolveNextPane(gestureState.dx)
        if (nextPane !== activePane) {
          onActivePaneChange(nextPane)
          return
        }

        snapToActivePane(true)
      },
      onPanResponderTerminate: () => {
        snapToActivePane(true)
      },
    }),
    [activePane, activePaneIndex, canNavigateToContent, canNavigateToMembers, hasMembersPane, layoutWidth, onActivePaneChange, paneCount, snapToActivePane, translateX],
  )

  return (
    <View style={styles.root} onLayout={handleLayout}>
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.track,
          {
            width: layoutWidth ? layoutWidth * paneCount : undefined,
            transform: [{ translateX }],
          },
        ]}
      >
        <View style={[styles.section, layoutWidth ? { width: layoutWidth } : null]}>
          <View style={styles.sectionBody}>{navigationPane}</View>
          {navigationFooter}
        </View>

        <View style={[styles.section, styles.contentSection, layoutWidth ? { width: layoutWidth } : null]}>
          <View style={styles.header}>{contentHeader}</View>
          <View style={styles.sectionBody}>{contentBody}</View>
          {contentFooter}
        </View>

        {hasMembersPane ? (
          <View style={[styles.section, styles.membersSection, layoutWidth ? { width: layoutWidth } : null]}>
            {membersHeader ? <View style={[styles.header, styles.membersHeader]}>{membersHeader}</View> : null}
            <View style={styles.sectionBody}>{membersPane}</View>
          </View>
        ) : null}
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: Colors.bgPrimary,
  },
  track: {
    flex: 1,
    flexDirection: 'row',
  },
  section: {
    flex: 1,
    minHeight: 0,
    backgroundColor: Colors.bgPrimary,
  },
  contentSection: {
    backgroundColor: Colors.bgPrimary,
  },
  membersSection: {
    backgroundColor: Colors.bgPrimary,
  },
  header: {
    minHeight: 0,
    justifyContent: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderSubtle,
    backgroundColor: Colors.bgPrimary,
  },
  membersHeader: {
    backgroundColor: Colors.bgPrimary,
  },
  sectionBody: {
    flex: 1,
    minHeight: 0,
  },
})
