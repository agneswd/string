// Muted status colors — match the editorial dark theme (theme.md)
export const STATUS_OPTIONS = [
  { tag: 'Online',       label: 'Online',              color: '#4a8a6a' },
  { tag: 'DoNotDisturb', label: 'Do Not Disturb',      color: '#8a4040' },
  { tag: 'Offline',      label: 'Appear as Offline',   color: '#5c6470' },
] as const

export function getStatusTag(status: unknown): string {
  if (!status) return 'Online'
  if (typeof status === 'string') return status
  if (typeof status === 'object' && status !== null) {
    const s = status as Record<string, unknown>
    if (typeof s.tag === 'string') return s.tag
    const keys = Object.keys(s)
    if (keys.length > 0) return keys[0]
  }
  return 'Online'
}

export function getStatusColor(tag: string): string {
  return STATUS_OPTIONS.find((s) => s.tag === tag)?.color ?? '#4a8a6a'
}

/**
 * Muted editorial palette — tones drawn from theme.md language-tag accent tints.
 * Avoids bright/saturated Discord-style swatches.
 */
export const PROFILE_COLORS = [
  '#3870a0', '#389878', '#9a8428', '#a05a38',
  '#a04030', '#5048a0', '#3880a0', '#708840',
  '#983840', '#5870a0', '#a06038', '#5c6470',
] as const
