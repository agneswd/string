import { useCallback, useState } from 'react'
import { LAYOUT_MODES, type LayoutMode } from '../constants/theme'

const STORAGE_KEY = 'string.settings.layoutMode'

function readLayoutMode(): LayoutMode {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw !== null && (LAYOUT_MODES as readonly string[]).includes(raw)) {
      return raw as LayoutMode
    }
    if (raw !== null) {
      window.localStorage.removeItem(STORAGE_KEY)
    }
  } catch {
    // localStorage unavailable
  }
  return 'string'
}

/**
 * Provides the current layout mode and a setter that persists the choice to
 * localStorage. Defaults to `'string'` for fresh users; existing persisted
 * values are honoured when they match the current layout set.
 */
export function useLayoutMode() {
  const [layoutMode, setLayoutModeState] = useState<LayoutMode>(readLayoutMode)

  const setLayoutMode = useCallback((mode: LayoutMode) => {
    setLayoutModeState(mode)
    try {
      window.localStorage.setItem(STORAGE_KEY, mode)
    } catch {
      // localStorage unavailable
    }
  }, [])

  return { layoutMode, setLayoutMode }
}
