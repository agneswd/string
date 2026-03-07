import type { CSSProperties } from 'react'
import type { LayoutMode } from '../../../constants/theme'

// ── Status dot helpers ──────────────────────────────────────────────────────

/** Returns the CSS var for a given status string. */
export function statusDotColor(status?: string): string {
  switch (status?.toLowerCase()) {
    case 'online': return 'var(--status-online)'
    case 'idle':
    case 'away': return 'var(--status-idle)'
    case 'do not disturb':
    case 'dnd': return 'var(--status-dnd)'
    default: return 'var(--status-offline)'
  }
}

// ── Style builders ──────────────────────────────────────────────────────────

/** Returns the full panel style map keyed by mode. */
export function buildPanelStyles(layoutMode: LayoutMode) {
  const isString = layoutMode === 'string'

  return {
    root: {
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      overflow: 'hidden',
    } satisfies CSSProperties,

    toolbar: {
      display: 'flex',
      alignItems: 'center',
      padding: '12px 16px',
      borderBottom: '1px solid var(--border-subtle)',
      gap: 8,
      flexShrink: 0,
      overflowX: 'auto',
    } satisfies CSSProperties,

    toolbarTitle: {
      fontWeight: isString ? 500 : 700,
      fontSize: isString ? 13 : 15,
      fontFamily: isString ? 'var(--font-mono)' : undefined,
      color: 'var(--text-header-primary)',
      marginRight: 8,
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      letterSpacing: isString ? '0.04em' : undefined,
      textTransform: isString ? 'uppercase' : 'none',
    } satisfies CSSProperties,

    divider: {
      width: 1,
      height: 24,
      backgroundColor: 'var(--border-subtle)',
      marginRight: 4,
      flexShrink: 0,
    } satisfies CSSProperties,

    tab: (active: boolean): CSSProperties => ({
      padding: '4px 10px',
      borderRadius: isString ? 'var(--radius-sm)' : 4,
      border: isString ? (active ? 'none' : '1px solid transparent') : 'none',
      cursor: 'pointer',
      fontSize: isString ? 12 : 14,
      fontWeight: isString ? 500 : 500,
      fontFamily: isString ? 'var(--font-mono)' : undefined,
      letterSpacing: isString ? '0.03em' : undefined,
      backgroundColor: active ? 'var(--bg-modifier-selected)' : 'transparent',
      color: active ? 'var(--text-interactive-active)' : 'var(--text-interactive-normal)',
      transition: 'background-color .15s, color .15s',
      whiteSpace: 'nowrap',
    }),

    tabBadge: {
      marginLeft: 4,
      padding: '0 4px',
      fontSize: 11,
      fontWeight: 700,
      fontFamily: isString ? 'var(--font-mono)' : undefined,
      borderRadius: isString ? 'var(--radius-sm)' : 8,
      backgroundColor: 'var(--text-danger)',
      color: '#fff',
      lineHeight: '16px',
      minWidth: 16,
      textAlign: 'center',
      display: 'inline-block',
    } satisfies CSSProperties,

    addFriendTab: (active: boolean): CSSProperties => isString
      ? {
          padding: '4px 10px',
          borderRadius: 'var(--radius-sm)',
          border: active ? '1px solid var(--border-subtle)' : '1px solid var(--accent-primary)',
          cursor: 'pointer',
          fontSize: 12,
          fontWeight: 500,
          fontFamily: 'var(--font-mono)',
          letterSpacing: '0.03em',
          backgroundColor: 'transparent',
          color: active ? 'var(--text-muted)' : 'var(--accent-primary)',
          transition: 'background-color .15s, color .15s, border-color .15s',
          whiteSpace: 'nowrap',
        }
      : {
          padding: '4px 10px',
          borderRadius: 4,
          border: 'none',
          cursor: 'pointer',
          fontSize: 14,
          fontWeight: 500,
          backgroundColor: active ? 'transparent' : 'var(--accent-primary)',
          color: active ? 'var(--text-success)' : '#fff',
          transition: 'background-color .15s, color .15s',
          whiteSpace: 'nowrap',
        },

    searchWrap: {
      padding: '8px 20px 0 30px',
      position: 'relative',
      flexShrink: 0,
    } satisfies CSSProperties,

    searchInput: {
      width: '100%',
      padding: '6px 12px 6px 32px',
      borderRadius: isString ? 'var(--radius-sm)' : 4,
      border: '1px solid var(--border-subtle)',
      backgroundColor: isString ? 'var(--bg-input)' : 'var(--bg-panel)',
      color: 'var(--text-primary)',
      fontSize: 13,
      fontFamily: isString ? 'var(--font-mono)' : undefined,
      outline: 'none',
    } satisfies CSSProperties,

    searchInputFocused: {
      width: '100%',
      padding: '6px 12px 6px 32px',
      borderRadius: isString ? 'var(--radius-sm)' : 4,
      border: `1px solid ${isString ? 'var(--border-focus)' : 'var(--accent-primary)'}`,
      backgroundColor: isString ? 'var(--bg-input)' : 'var(--bg-panel)',
      color: 'var(--text-primary)',
      fontSize: 13,
      fontFamily: isString ? 'var(--font-mono)' : undefined,
      outline: 'none',
      boxShadow: isString ? 'none' : '0 0 0 2px var(--accent-primary)',
    } satisfies CSSProperties,

    searchIconPos: {
      position: 'absolute',
      left: 10,
      top: '50%',
      transform: 'translateY(-50%)',
      pointerEvents: 'none',
    } satisfies CSSProperties,

    sectionHeader: {
      padding: '16px 30px 8px',
      fontSize: 11,
      fontWeight: isString ? 500 : 700,
      fontFamily: isString ? 'var(--font-mono)' : undefined,
      textTransform: 'uppercase',
      color: 'var(--text-muted)',
      letterSpacing: isString ? '0.08em' : '0.02em',
      flexShrink: 0,
    } satisfies CSSProperties,

    listArea: {
      flex: 1,
      overflowY: 'auto',
      paddingBottom: 20,
    } satisfies CSSProperties,

    row: {
      display: 'flex',
      alignItems: 'center',
      padding: '8px 20px 8px 30px',
      cursor: 'pointer',
      borderTop: '1px solid var(--border-subtle)',
      transition: 'background-color .1s',
      gap: 12,
    } satisfies CSSProperties,

    rowHoverBg: isString
      ? 'var(--bg-modifier-hover)'
      : 'var(--bg-modifier-hover)',

    rowHoverRadius: isString ? 0 : 8,

    rowInfo: {
      flex: 1,
      minWidth: 0,
      display: 'flex',
      flexDirection: 'column',
    } satisfies CSSProperties,

    rowName: {
      fontSize: isString ? 13 : 15,
      fontWeight: isString ? 500 : 600,
      color: 'var(--text-primary)',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    } satisfies CSSProperties,

    rowSub: {
      fontSize: isString ? 11 : 13,
      fontFamily: isString ? 'var(--font-mono)' : undefined,
      color: 'var(--text-muted)',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    } satisfies CSSProperties,

    rowActions: {
      display: 'flex',
      gap: 6,
      flexShrink: 0,
    } satisfies CSSProperties,

    iconBtn: (highlighted: boolean, danger: boolean): CSSProperties => ({
      width: isString ? 28 : 36,
      height: isString ? 28 : 36,
      borderRadius: isString ? 'var(--radius-sm)' : '50%',
      border: isString ? '1px solid var(--border-subtle)' : 'none',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: highlighted
        ? (danger ? 'var(--bg-danger-hover)' : 'var(--bg-modifier-selected)')
        : 'transparent',
      color: highlighted
        ? (danger ? 'var(--text-danger)' : 'var(--text-interactive-active)')
        : 'var(--text-interactive-normal)',
      cursor: 'pointer',
      transition: 'background-color .12s, color .12s, border-color .12s',
      padding: 0,
    }),

    empty: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '60px 20px',
      color: 'var(--text-muted)',
      textAlign: 'center',
      gap: 8,
    } satisfies CSSProperties,

    emptyTitle: {
      fontSize: isString ? 13 : 16,
      fontWeight: isString ? 500 : 600,
      fontFamily: isString ? 'var(--font-mono)' : undefined,
      color: 'var(--text-secondary)',
    } satisfies CSSProperties,

    emptyDesc: {
      fontSize: isString ? 12 : 14,
      color: 'var(--text-muted)',
      maxWidth: 400,
    } satisfies CSSProperties,

    addSection: {
      padding: '20px 30px',
      borderBottom: '1px solid var(--border-subtle)',
      flexShrink: 0,
    } satisfies CSSProperties,

    addTitle: {
      fontSize: isString ? 11 : 15,
      fontWeight: isString ? 500 : 700,
      fontFamily: isString ? 'var(--font-mono)' : undefined,
      color: isString ? 'var(--text-muted)' : 'var(--text-header-primary)',
      textTransform: 'uppercase',
      letterSpacing: isString ? '0.08em' : undefined,
      marginBottom: 8,
    } satisfies CSSProperties,

    addDesc: {
      fontSize: isString ? 12 : 14,
      color: 'var(--text-secondary)',
      marginBottom: 16,
    } satisfies CSSProperties,

    addInputRow: (focused: boolean): CSSProperties => ({
      display: 'flex',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 8,
      backgroundColor: 'var(--bg-input)',
      borderRadius: isString ? 'var(--radius-sm)' : 8,
      padding: '8px 12px',
      border: focused
        ? '1px solid var(--border-focus)'
        : '1px solid var(--border-subtle)',
      transition: 'border-color .15s',
    }),

    addInput: {
      flex: '1 1 180px',
      minWidth: 0,
      border: 'none',
      backgroundColor: 'transparent',
      color: 'var(--text-primary)',
      fontSize: isString ? 13 : 15,
      fontFamily: isString ? 'var(--font-mono)' : undefined,
      outline: 'none',
      padding: '8px 0',
    } satisfies CSSProperties,

    addBtn: (disabled: boolean): CSSProperties => ({
      padding: isString ? '6px 14px' : '8px 20px',
      borderRadius: isString ? 'var(--radius-sm)' : 4,
      border: isString ? '1px solid var(--border-subtle)' : 'none',
      backgroundColor: isString
        ? (disabled ? 'transparent' : 'var(--bg-active)')
        : 'var(--accent-primary)',
      color: isString
        ? (disabled ? 'var(--text-muted)' : 'var(--text-primary)')
        : '#fff',
      fontSize: isString ? 12 : 13,
      fontWeight: 500,
      fontFamily: isString ? 'var(--font-mono)' : undefined,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
      transition: 'opacity .15s, background-color .15s',
      whiteSpace: 'nowrap',
      flexShrink: 0,
      maxWidth: '100%',
    }),

    statusDot: (color: string): CSSProperties => ({
      width: 10,
      height: 10,
      borderRadius: '50%',
      backgroundColor: color,
      border: '2px solid var(--bg-primary)',
      position: 'absolute',
      bottom: -1,
      right: -1,
    }),

    avatarWrap: {
      position: 'relative',
      flexShrink: 0,
    } satisfies CSSProperties,

    feedback: (success: boolean): CSSProperties => ({
      fontSize: 12,
      fontWeight: 500,
      fontFamily: isString ? 'var(--font-mono)' : undefined,
      marginTop: 8,
      color: success ? 'var(--text-success)' : 'var(--text-danger)',
    }),
  }
}

/** Hover-effect CSS injected via <style> tag for performance. */
export function buildHoverCSS(layoutMode: LayoutMode): string {
  const isString = layoutMode === 'string'
  if (isString) {
    return `
      .frp-tab:hover { background-color: var(--bg-modifier-hover); color: var(--text-interactive-hover) !important; }
      .frp-tab-active:hover { background-color: var(--bg-modifier-selected); color: var(--text-interactive-active) !important; }
      .frp-add-btn:hover { background-color: var(--bg-hover) !important; }
      .frp-add-btn-active:hover { color: var(--text-muted) !important; }
    `
  }
  return `
    .frp-tab:hover { background-color: var(--bg-modifier-hover); color: var(--text-interactive-hover) !important; }
    .frp-tab-active:hover { background-color: var(--bg-modifier-selected); color: var(--text-interactive-active) !important; }
    .frp-add-btn:hover { opacity: 0.85; }
    .frp-add-btn-active:hover { opacity: 1; }
  `
}

export type PanelStyles = ReturnType<typeof buildPanelStyles>
