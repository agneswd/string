/**
 * channel-list/styles.ts
 *
 * Slim resolver — imports mode-specific sheets from sub-modules and
 * re-exports everything so existing consumers keep working unchanged.
 *
 * `COLORS` / `S`          — string-mode (editorial, theme.md compliant).
 * `CLASSIC_COLORS` / `SC` — classic-mode (Discord-like).
 * `resolveS(mode)`        — select the right sheet at runtime.
 * `resolveColors(mode)`   — select the right palette at runtime.
 */

export { CLASSIC_COLORS, SC } from './styles-classic'
export { COLORS, S } from './styles-string'
import { CLASSIC_COLORS, SC } from './styles-classic'
import { COLORS, S } from './styles-string'

export type LayoutMode = 'classic' | 'string'

export function resolveS(mode: LayoutMode): typeof S | typeof SC {
  return mode === 'string' ? S : SC
}

export function resolveColors(mode: LayoutMode): typeof COLORS | typeof CLASSIC_COLORS {
  return mode === 'string' ? COLORS : CLASSIC_COLORS
}
