/**
 * Shared design-token colours.
 * Mirrors the web theme palette; edit here first, then sync to theme.md.
 * React Native-safe – values are plain strings.
 */

export const Colors = {
  // Surfaces
  bgPrimary: '#111111',
  bgSecondary: '#1A1A1A',
  bgElevated: '#151515',
  bgInput: '#111111',

  // Text
  textPrimary: '#d4d0cb',
  textSecondary: '#a19990',
  textMuted: '#6b6860',
  textDisabled: '#57534c',

  // Accent
  accentBlue: '#c8b8a2',
  accentBlueDim: '#2f2a24',
  accentGreen: '#6f8b73',
  accentRed: '#8b5a52',

  // Borders
  borderSubtle: '#2a2a2a',
  borderDefault: '#2a2a2a',

  // Mention / unread badge
  badgeBg: '#2f2a24',
  badgeText: '#c8b8a2',
} as const

export type ColorToken = keyof typeof Colors
