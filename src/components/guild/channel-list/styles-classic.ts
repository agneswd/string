/**
 * Classic-mode (Discord-like) palette and style sheet.
 */

export const CLASSIC_COLORS = {
  bg: 'var(--bg-sidebar-light)',
  bgHeader: 'var(--bg-sidebar-light)',
  bgHeaderBorder: 'var(--border-subtle)',
  bgHover: 'var(--bg-hover)',
  bgSelected: 'var(--bg-active)',
  bgUserPanel: 'var(--bg-panel)',
  textCategory: 'var(--text-muted)',
  textChannel: 'var(--text-interactive-normal)',
  textChannelHover: 'var(--text-interactive-hover)',
  textChannelActive: 'var(--text-interactive-active)',
  textGuildName: 'var(--text-header-primary)',
  textUserName: 'var(--text-primary)',
  textUserStatus: 'var(--text-secondary)',
  badgeBg: 'var(--text-danger)',
  badgeText: 'var(--bg-deepest)',
  iconMuted: 'var(--text-danger)',
  iconDefault: 'var(--text-secondary)',
} as const

export const SC = {
  root: {
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100%',
    minHeight: 0,
    width: 240,
    minWidth: 240,
    maxWidth: 240,
    backgroundColor: CLASSIC_COLORS.bg,
    color: CLASSIC_COLORS.textChannel,
    fontFamily: 'var(--font-sans, "gg sans", "Noto Sans", "Helvetica Neue", Helvetica, Arial, sans-serif)',
    userSelect: 'none' as const,
  },

  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
    padding: '0 16px',
    flexShrink: 0,
    borderBottom: `1px solid ${CLASSIC_COLORS.bgHeaderBorder}`,
    backgroundColor: CLASSIC_COLORS.bgHeader,
    cursor: 'pointer',
    transition: 'background-color 0.15s',
  },

  headerName: {
    fontSize: 16,
    fontWeight: 600,
    color: CLASSIC_COLORS.textGuildName,
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
    padding: '18px 0 4px 2px',
    cursor: 'pointer',
    userSelect: 'none' as const,
  },

  categoryLabel: {
    fontSize: 12,
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.02em',
    color: CLASSIC_COLORS.textCategory,
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
    color: CLASSIC_COLORS.textCategory,
    transition: 'transform 0.15s ease',
  },

  channelBtn: (isActive: boolean) =>
    ({
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      width: '100%',
      padding: '6px 8px',
      marginTop: 1,
      borderRadius: 4,
      border: 'none',
      background: isActive ? CLASSIC_COLORS.bgSelected : 'transparent',
      color: isActive ? CLASSIC_COLORS.textChannelActive : CLASSIC_COLORS.textChannel,
      fontSize: 15,
      fontWeight: isActive ? 600 : 500,
      lineHeight: '20px',
      cursor: 'pointer',
      textAlign: 'left' as const,
      boxSizing: 'border-box' as const,
      fontFamily: 'inherit',
      transition: 'background-color 0.1s, color 0.1s',
    }),

  channelPrefix: {
    flexShrink: 0,
    width: 20,
    textAlign: 'center' as const,
    fontSize: 18,
    lineHeight: '20px',
    opacity: 0.7,
  },

  channelName: {
    flex: 1,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },

  badge: {
    flexShrink: 0,
    backgroundColor: CLASSIC_COLORS.badgeBg,
    color: CLASSIC_COLORS.badgeText,
    fontSize: 10,
    fontWeight: 700,
    lineHeight: '16px',
    padding: '0 4px',
    borderRadius: 4,
    minWidth: 16,
    textAlign: 'center' as const,
  },

  userPanel: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px',
    flexShrink: 0,
    backgroundColor: CLASSIC_COLORS.bgUserPanel,
    borderTop: `1px solid ${CLASSIC_COLORS.bgHeaderBorder}`,
    minHeight: 52,
  },

  avatar: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    backgroundColor: 'var(--accent-primary)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 14,
    fontWeight: 700,
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
    fontSize: 13,
    fontWeight: 600,
    color: CLASSIC_COLORS.textUserName,
    lineHeight: '16px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },

  userStatus: {
    fontSize: 11,
    color: CLASSIC_COLORS.textUserStatus,
    lineHeight: '14px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },

  controlBtn: (active: boolean) =>
    ({
      width: 32,
      height: 32,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: 'none',
      borderRadius: 4,
      background: 'transparent',
      color: active ? CLASSIC_COLORS.iconMuted : CLASSIC_COLORS.iconDefault,
      cursor: 'pointer',
      padding: 0,
      flexShrink: 0,
      transition: 'background-color 0.1s',
    }),

  /* Circular add-channel button — classic/Discord style */
  addBtn: {
    width: 18,
    height: 18,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    borderRadius: '50%',
    background: 'transparent',
    color: CLASSIC_COLORS.textCategory,
    cursor: 'pointer',
    padding: 0,
    transition: 'color 0.15s',
    lineHeight: 1,
    flexShrink: 0,
  },
} as const
