/**
 * Persistent settings storage helpers.
 * Reads/writes to localStorage with safe fallbacks.
 */

export const UI_SOUND_LEVEL_STORAGE_KEY = 'string.settings.uiSoundLevel'
export const CALL_SOUND_LEVEL_STORAGE_KEY = 'string.settings.callSoundLevel'
export const DM_ALERT_SOUND_LEVEL_STORAGE_KEY = 'string.settings.dmAlertSoundLevel'
export const FRIEND_ALERT_SOUND_LEVEL_STORAGE_KEY = 'string.settings.friendAlertSoundLevel'
export const VOICE_DEFAULT_VOLUME_STORAGE_KEY = 'string.settings.voiceDefaultVolume'
export const VOICE_USER_VOLUMES_STORAGE_KEY = 'string.settings.voiceUserVolumes'
export const FRIEND_STATUS_NOTIFICATIONS_STORAGE_KEY = 'string.settings.friendStatusNotificationsEnabled'
export const DM_MESSAGE_NOTIFICATIONS_STORAGE_KEY = 'string.settings.dmMessageNotificationsEnabled'

export function readPercentageSetting(key: string, fallback: number): number {
  try {
    const raw = window.localStorage.getItem(key)
    if (raw === null) return fallback
    const parsed = Number(raw)
    if (!Number.isFinite(parsed)) return fallback
    if (parsed < 0) return 0
    if (parsed > 100) return 100
    return Math.round(parsed)
  } catch {
    return fallback
  }
}

export function readUiSoundLevel(): number {
  return readPercentageSetting(UI_SOUND_LEVEL_STORAGE_KEY, 50)
}

export function readNumberRecordSetting(key: string): Record<string, number> {
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, unknown>
    const next: Record<string, number> = {}
    for (const [entryKey, value] of Object.entries(parsed)) {
      const numeric = Number(value)
      if (Number.isFinite(numeric) && numeric >= 0 && numeric <= 100) {
        next[entryKey] = Math.round(numeric)
      }
    }
    return next
  } catch {
    return {}
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
