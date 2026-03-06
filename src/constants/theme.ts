/**
 * String Design Tokens
 *
 * Neutral dark-leaning minimalist theme with subtle warm accents.
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
  bg: {
    /** Darkest — server list rail, deep sidebars */
    deepest: '#111115',
    /** App-wide background */
    app: '#17171b',
    /** Sidebar background */
    sidebar: '#1c1c21',
    /** Panel / content area */
    panel: '#202026',
    /** Input fields */
    input: '#111115',
    /** Hover overlay */
    hover: '#26262d',
    /** Active / selected overlay */
    active: '#2e2e37',
  },

  text: {
    primary: '#f0ede8',
    secondary: '#a8a29e',
    muted: '#78716c',
    normal: '#e2ddd8',
    success: '#4ade80',
    danger: '#f87171',
  },

  accent: {
    /** Warm terracotta — the primary brand colour */
    primary: '#c07a4f',
    hover: '#a8633b',
    subtle: 'rgba(192, 122, 79, 0.15)',
  },

  border: {
    subtle: '#2c2c34',
    focus: '#c07a4f',
  },

  radius: {
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
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
  // Surfaces
  '--bg-deepest':            '#111115',
  '--bg-app':                '#17171b',
  '--bg-sidebar-dark':       '#111115',
  '--bg-sidebar-light':      '#1c1c21',
  '--bg-panel':              '#202026',
  '--bg-input':              '#111115',
  '--bg-hover':              '#26262d',
  '--bg-active':             '#2e2e37',
  '--bg-primary':            '#17171b',
  '--bg-accent':             '#c07a4f',
  '--bg-modifier-hover':     'rgba(255, 255, 255, 0.04)',
  '--bg-modifier-selected':  'rgba(255, 255, 255, 0.08)',
  '--bg-danger':             '#7f1d1d',
  // Text
  '--text-primary':             '#f0ede8',
  '--text-secondary':           '#a8a29e',
  '--text-muted':               '#78716c',
  '--text-normal':              '#e2ddd8',
  '--text-channels-default':    '#78716c',
  '--text-interactive-normal':  '#a8a29e',
  '--text-interactive-hover':   '#e2ddd8',
  '--text-interactive-active':  '#f0ede8',
  '--text-header-primary':      '#f0ede8',
  '--text-success':             '#4ade80',
  '--text-danger':              '#f87171',
  // Accent
  '--accent-primary': '#c07a4f',
  '--accent-hover':   '#a8633b',
  '--accent-subtle':  'rgba(192, 122, 79, 0.15)',
  '--brand-primary':       '#c07a4f',
  '--brand-primary-hover': '#a8633b',
  // Borders
  '--border-subtle': '#2c2c34',
  '--border-focus':  '#c07a4f',
  // Radius
  '--radius-sm':   '0.25rem',
  '--radius-md':   '0.375rem',
  '--radius-lg':   '0.5rem',
  '--radius-full': '9999px',
} as const

export type CssVarToken = keyof typeof CSS_VAR_TOKENS

// ── Layout Modes ───────────────────────────────────────────────────────────

/** Available layout modes.
 * - `workspace` — calmer workspace shell with narrower chrome (default for new users)
 * - `classic`   — Discord-style sidebar layout (server rail + channel list + main panel)
 */
export const LAYOUT_MODES = ['classic', 'workspace'] as const

export type LayoutMode = (typeof LAYOUT_MODES)[number]
