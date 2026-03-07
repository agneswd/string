export interface StoredNavigationState {
  homeViewActive: boolean
  selectedGuildId?: string
  selectedTextChannelId?: string
  selectedVoiceChannelId?: string
  selectedDmChannelId?: string
  hiddenDmChannelIds?: string[]
}

const NAVIGATION_STATE_STORAGE_KEY = 'string.navigation.state'

const DEFAULT_NAVIGATION_STATE: StoredNavigationState = {
  homeViewActive: false,
}

export function readNavigationState(): StoredNavigationState {
  try {
    const rawValue = window.localStorage.getItem(NAVIGATION_STATE_STORAGE_KEY)
    if (!rawValue) {
      return DEFAULT_NAVIGATION_STATE
    }

    const parsedValue = JSON.parse(rawValue) as Partial<StoredNavigationState>
    return {
      homeViewActive: Boolean(parsedValue.homeViewActive),
      selectedGuildId: normalizeValue(parsedValue.selectedGuildId),
      selectedTextChannelId: normalizeValue(parsedValue.selectedTextChannelId),
      selectedVoiceChannelId: normalizeValue(parsedValue.selectedVoiceChannelId),
      selectedDmChannelId: normalizeValue(parsedValue.selectedDmChannelId),
      hiddenDmChannelIds: Array.isArray(parsedValue.hiddenDmChannelIds)
        ? parsedValue.hiddenDmChannelIds.filter((value): value is string => typeof value === 'string' && value.length > 0)
        : undefined,
    }
  } catch {
    return DEFAULT_NAVIGATION_STATE
  }
}

export function writeNavigationState(partialState: Partial<StoredNavigationState>): void {
  try {
    const currentState = readNavigationState()
    const nextState: StoredNavigationState = {
      homeViewActive: hasOwn(partialState, 'homeViewActive')
        ? Boolean(partialState.homeViewActive)
        : currentState.homeViewActive,
      selectedGuildId: hasOwn(partialState, 'selectedGuildId')
        ? normalizeValue(partialState.selectedGuildId)
        : currentState.selectedGuildId,
      selectedTextChannelId: hasOwn(partialState, 'selectedTextChannelId')
        ? normalizeValue(partialState.selectedTextChannelId)
        : currentState.selectedTextChannelId,
      selectedVoiceChannelId: hasOwn(partialState, 'selectedVoiceChannelId')
        ? normalizeValue(partialState.selectedVoiceChannelId)
        : currentState.selectedVoiceChannelId,
      selectedDmChannelId: hasOwn(partialState, 'selectedDmChannelId')
        ? normalizeValue(partialState.selectedDmChannelId)
        : currentState.selectedDmChannelId,
      hiddenDmChannelIds: hasOwn(partialState, 'hiddenDmChannelIds')
        ? partialState.hiddenDmChannelIds
        : currentState.hiddenDmChannelIds,
    }

    window.localStorage.setItem(NAVIGATION_STATE_STORAGE_KEY, JSON.stringify(nextState))
  } catch {
    // ignore storage failures
  }
}

function hasOwn<Key extends keyof StoredNavigationState>(
  value: Partial<StoredNavigationState>,
  key: Key,
): boolean {
  return Object.prototype.hasOwnProperty.call(value, key)
}

function normalizeValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined
}
