/**
 * Persistent settings storage helpers.
 * Reads/writes to localStorage with safe fallbacks.
 */

export const UI_SOUND_LEVEL_STORAGE_KEY = 'string.settings.uiSoundLevel'
export const FRIEND_STATUS_NOTIFICATIONS_STORAGE_KEY = 'string.settings.friendStatusNotificationsEnabled'
export const DM_MESSAGE_NOTIFICATIONS_STORAGE_KEY = 'string.settings.dmMessageNotificationsEnabled'

export function readUiSoundLevel(): number {
  try {
    const raw = window.localStorage.getItem(UI_SOUND_LEVEL_STORAGE_KEY)
    if (raw === null) return 50
    const parsed = Number(raw)
    if (!Number.isFinite(parsed)) return 50
    if (parsed < 0) return 0
    if (parsed > 100) return 100
    return Math.round(parsed)
  } catch {
    return 50
  }
}

export function readBooleanSetting(key: string, fallback: boolean): boolean {
  try {
    const raw = window.localStorage.getItem(key)
    if (raw === null) return fallback
    return raw === 'true'
  } catch {
    return fallback
  }
}
