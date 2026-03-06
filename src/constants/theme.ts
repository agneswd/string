/**
 * String Design Tokens
 *
 * Minimal dark editorial theme with warm sand accent.
 * Source of truth: theme.md
 *
 * ## Source-of-truth contract
 * `CSS_VAR_TOKENS` (exported below) is the SINGLE canonical source of token
 * values. It drives both:
 *   - The typed JS constants used by components and tests.
 *   - The expected CSS custom-property values declared in `index.css`.
 *
 * If you change a value here, update the matching CSS variable in index.css.
 * The `theme.test.ts` parity test will catch any divergence.
 *
 * Components should prefer CSS variables at runtime (e.g. `var(--accent-primary)`)
 * and use these JS exports for typed checks and unit tests.
 */

// ── Palette ────────────────────────────────────────────────────────────────

export const THEME_TOKENS = {
  font: {
    sans: "'Inter', 'Helvetica Neue', Arial, sans-serif",
    mono: "'SFMono-Regular', Consolas, 'Liberation Mono', monospace",
  },

  bg: {
    /** Darkest — server list rail, base page background */
    deepest: '#111111',
    /** App-wide background */
    app: '#111111',
    /** Sidebar dark */
    sidebar: '#1a1a1a',
    /** Panel / content area */
    panel: '#1a1a1a',
    /** Input fields */
    input: '#111111',
    /** Hover overlay */
    hover: '#1e1e1e',
    /** Active / selected overlay */
    active: '#242424',
  },

  text: {
    primary: '#d4d0cb',
    secondary: '#9e9a94',
    muted: '#6b6860',
    normal: '#d4d0cb',
    success: '#4ade80',
    danger: '#f87171',
  },

  accent: {
    /** Warm sand — the primary brand colour (theme.md: #c8b8a2) */
    primary: '#c8b8a2',
    hover: '#b0a08e',
    subtle: 'rgba(200, 184, 162, 0.15)',
  },

  border: {
    subtle: '#2a2a2a',
    focus: '#c8b8a2',
  },

  radius: {
    sm: '2px',
    md: '3px',
    lg: '4px',
    full: '9999px',
  },

  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '0.75rem',
    lg: '1rem',
    xl: '1.5rem',
  },
} as const

// ── CSS Variable Token Map (parity contract) ─────────────────────────────

/**
 * Maps each CSS custom property name to its canonical value.
 * This object is the authoritative source for the `:root` block in index.css.
 * The `theme.test.ts` parity test reads index.css and asserts every entry
 * here appears verbatim in that file, preventing silent drift.
 */
export const CSS_VAR_TOKENS = {
  // Typography
  '--font-sans':            "'Inter', 'Helvetica Neue', Arial, sans-serif",
  '--font-mono':            "'SFMono-Regular', Consolas, 'Liberation Mono', monospace",
  // Surfaces
  '--bg-deepest':            '#111111',
  '--bg-app':                '#111111',
  '--bg-sidebar-dark':       '#111111',
  '--bg-sidebar-light':      '#1a1a1a',
  '--bg-panel':              '#1a1a1a',
  '--bg-input':              '#111111',
  '--bg-hover':              '#1e1e1e',
  '--bg-active':             '#242424',
  '--bg-primary':            '#111111',
  '--bg-accent':             '#c8b8a2',
  '--bg-modifier-hover':     'rgba(255, 255, 255, 0.03)',
  '--bg-modifier-selected':  'rgba(255, 255, 255, 0.06)',
  '--bg-danger':             '#3a1515',
  '--bg-danger-hover':       'rgba(200, 80, 80, 0.10)',
  // Text
  '--text-primary':             '#d4d0cb',
  '--text-secondary':           '#9e9a94',
  '--text-muted':               '#6b6860',
  '--text-normal':              '#d4d0cb',
  '--text-channels-default':    '#6b6860',
  '--text-interactive-normal':  '#9e9a94',
  '--text-interactive-hover':   '#d4d0cb',
  '--text-interactive-active':  '#d4d0cb',
  '--text-header-primary':      '#d4d0cb',
  '--text-success':             '#4ade80',
  '--text-danger':              '#f87171',
  // Accent — warm sand (#c8b8a2, per theme.md)
  '--accent-primary': '#c8b8a2',
  '--accent-hover':   '#b0a08e',
  '--accent-subtle':  'rgba(200, 184, 162, 0.15)',
  '--brand-primary':       '#c8b8a2',
  '--brand-primary-hover': '#b0a08e',
  // Borders
  '--border-subtle':  '#2a2a2a',
  '--border-focus':   '#c8b8a2',
  '--border-success': 'rgba(74, 222, 128, 0.15)',
  // Success subtle surface
  '--bg-success-subtle': 'rgba(74, 222, 128, 0.06)',
  // Status indicator dots
  '--status-online':  '#23a55a',
  '--status-idle':    '#f0b232',
  '--status-dnd':     '#f23f43',
  '--status-offline': '#80848e',
  // Radius — square/near-square per theme.md
  '--radius-sm':   '2px',
  '--radius-md':   '3px',
  '--radius-lg':   '4px',
  '--radius-full': '9999px',
} as const

export type CssVarToken = keyof typeof CSS_VAR_TOKENS

// ── Layout Modes ───────────────────────────────────────────────────────────

/** Available layout modes.
 * - `string`    — calmer String shell with narrower chrome (default for new users)
 * - `classic`   — Discord-style sidebar layout (server rail + channel list + main panel)
 */
export const LAYOUT_MODES = ['classic', 'string'] as const

export type LayoutMode = (typeof LAYOUT_MODES)[number]
