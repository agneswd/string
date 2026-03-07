/**
 * String-mode (editorial, theme.md compliant) palette and style sheet.
 */

export const COLORS = {
  bg: 'var(--bg-sidebar-light)',
  bgHeader: 'var(--bg-sidebar-light)',
  bgHeaderBorder: 'var(--border-subtle)',
  bgHover: 'var(--bg-hover)',
  bgSelected: 'var(--bg-active)',
  bgUserPanel: 'var(--bg-sidebar-dark)',
  textCategory: 'var(--text-muted)',
  textChannel: 'var(--text-channels-default)',
  textChannelHover: 'var(--text-interactive-hover)',
  textChannelActive: 'var(--text-interactive-active)',
  textGuildName: 'var(--text-header-primary)',
  textUserName: 'var(--text-primary)',
  textUserStatus: 'var(--text-muted)',
  badgeBg: 'var(--text-danger)',
  badgeText: '#ffffff',
  iconMuted: 'var(--text-danger)',
  iconDefault: 'var(--text-interactive-normal)',
} as const

export const S = {
  root: {
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100%',
    minHeight: 0,
    width: 240,
    minWidth: 240,
    maxWidth: 240,
    backgroundColor: COLORS.bg,
    color: COLORS.textChannel,
    fontFamily: 'var(--font-sans, "gg sans", "Noto Sans", "Helvetica Neue", Helvetica, Arial, sans-serif)',
    userSelect: 'none' as const,
  },

  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
    padding: '0 12px 0 16px',
    flexShrink: 0,
    borderBottom: `1px solid ${COLORS.bgHeaderBorder}`,
    backgroundColor: COLORS.bgHeader,
    cursor: 'pointer',
    transition: 'background-color 0.15s',
  },

  /* Mono label for guild name — editorial, compact, structured */
  headerName: {
    fontFamily: 'var(--font-mono)',
    fontSize: 13,
    fontWeight: 500,
    letterSpacing: '0.02em',
    color: COLORS.textGuildName,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
    lineHeight: '20px',
  },

  scrollArea: {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto' as const,
    overflowX: 'hidden' as const,
    padding: '0 8px 8px',
  },

  categoryHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    padding: '16px 0 4px 2px',
    cursor: 'pointer',
    userSelect: 'none' as const,
  },

  /* Mono label — section heading per theme.md */
  categoryLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
    color: COLORS.textCategory,
    lineHeight: '16px',
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },

  categoryChevron: {
    width: 12,
    height: 12,
    flexShrink: 0,
    color: COLORS.textCategory,
    transition: 'transform 0.15s ease',
  },

  channelBtn: (isActive: boolean) =>
    ({
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      width: 'calc(100% - 12px)',
      maxWidth: 'calc(100% - 12px)',
      padding: '5px 8px',
      marginTop: 1,
      marginLeft: 6,
      marginRight: 6,
      /* Square corners per theme.md */
      borderRadius: 'var(--radius-sm)',
      border: 'none',
      background: isActive ? COLORS.bgSelected : 'transparent',
      color: isActive ? COLORS.textChannelActive : COLORS.textChannel,
      fontSize: 14,
      fontWeight: isActive ? 500 : 400,
      lineHeight: '20px',
      cursor: 'pointer',
      textAlign: 'left' as const,
      boxSizing: 'border-box' as const,
      fontFamily: 'inherit',
      transition: 'background-color 0.1s, color 0.1s',
    }),

  channelPrefix: {
    flexShrink: 0,
    width: 18,
    textAlign: 'center' as const,
    fontSize: 15,
    lineHeight: '20px',
    opacity: 0.55,
  },

  channelName: {
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },

  /* Square badge — no pill radius per theme.md */
  badge: {
    flexShrink: 0,
    backgroundColor: COLORS.badgeBg,
    color: COLORS.badgeText,
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    fontWeight: 600,
    lineHeight: '16px',
    padding: '0 4px',
    borderRadius: 'var(--radius-sm)',
    minWidth: 16,
    textAlign: 'center' as const,
  },

  userPanel: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px',
    flexShrink: 0,
    backgroundColor: COLORS.bgUserPanel,
    borderTop: `1px solid ${COLORS.bgHeaderBorder}`,
    minHeight: 52,
  },

  avatar: {
    width: 30,
    height: 30,
    borderRadius: '50%',
    backgroundColor: 'var(--accent-primary)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    /* Mono font for initials — treated as label */
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    fontWeight: 600,
    flexShrink: 0,
    overflow: 'hidden',
  },

  userInfo: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column' as const,
  },

  userName: {
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    fontWeight: 500,
    color: COLORS.textUserName,
    lineHeight: '16px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },

  userStatus: {
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    color: COLORS.textUserStatus,
    lineHeight: '14px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },

  controlBtn: (active: boolean) =>
    ({
      width: 28,
      height: 28,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: 'none',
      borderRadius: 'var(--radius-sm)',
      background: 'transparent',
      color: active ? COLORS.iconMuted : COLORS.iconDefault,
      cursor: 'pointer',
      padding: 0,
      flexShrink: 0,
      transition: 'background-color 0.1s',
    }),

  /* Square add-channel button — not a pill/circle */
  addBtn: {
    width: 20,
    height: 20,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    background: 'transparent',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    padding: 0,
    transition: 'color 0.15s',
    lineHeight: 1,
    flexShrink: 0,
  },
} as const
