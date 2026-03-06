import { Phone, Users, Hash, MessageSquare } from 'lucide-react'

export interface TopNavBarProps {
  isDmMode: boolean
  dmName?: string
  guildName?: string
  selectedDmChannel: boolean
  currentVoiceState: boolean
  outgoingCall: boolean
  dmCallActive: boolean
  selectedDmChannelId?: string
  showMemberList: boolean
  onToggleMemberList: () => void
  onInitiateDmCall: (channelId: string) => void
  /** Controls the visual style — workspace shows a breadcrumb product bar */
  layoutMode?: 'workspace' | 'classic'
  /** Name of the active channel (for workspace breadcrumb) */
  channelName?: string
}

export function TopNavBar({
  isDmMode,
  dmName,
  guildName,
  selectedDmChannel,
  currentVoiceState,
  outgoingCall,
  dmCallActive,
  selectedDmChannelId,
  showMemberList,
  onToggleMemberList,
  onInitiateDmCall,
  layoutMode = 'classic',
  channelName,
}: TopNavBarProps) {
  const isWorkspace = layoutMode === 'workspace'

  const actions = (
    <div style={{ display: 'flex', alignItems: 'center', gap: isWorkspace ? 8 : 12, marginLeft: 'auto' }}>
      {isDmMode && selectedDmChannel && !currentVoiceState && !outgoingCall && (
        <button
          onClick={() => onInitiateDmCall(selectedDmChannelId!)}
          title={dmCallActive ? 'Rejoin Call' : 'Start Voice Call'}
          style={{
            background: dmCallActive ? 'rgba(59,165,93,0.15)' : 'transparent',
            border: 'none',
            borderRadius: isWorkspace ? 6 : 4,
            padding: '4px 6px',
            cursor: 'pointer',
            color: dmCallActive ? '#3ba55d' : 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <Phone style={{ width: 18, height: 18 }} />
          {dmCallActive && <span style={{ fontSize: 12, fontWeight: 600 }}>Rejoin</span>}
        </button>
      )}
      <button
        onClick={onToggleMemberList}
        title={showMemberList ? 'Hide Member List' : 'Show Member List'}
        style={{
          background: showMemberList
            ? isWorkspace
              ? 'var(--bg-active)'
              : 'rgba(88, 101, 242, 0.15)'
            : 'transparent',
          border: 'none',
          borderRadius: isWorkspace ? 6 : 4,
          padding: '4px 6px',
          cursor: 'pointer',
          color: showMemberList ? 'var(--text-normal)' : 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Users style={{ width: 18, height: 18 }} />
      </button>
    </div>
  )

  if (isWorkspace) {
    // Workspace: breadcrumb-style nav bar
    const contextLabel = isDmMode ? (dmName ?? 'Direct Messages') : (guildName ?? 'String')
    const channelLabel = channelName ?? (isDmMode ? dmName : null)

    return (
      <div
        className="flex w-full items-center gap-2"
        style={{ height: '100%', padding: '0 4px' }}
      >
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
          <span
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: 'var(--text-muted)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {contextLabel}
          </span>
          {channelLabel && (
            <>
              <span style={{ color: 'var(--border-subtle)', fontSize: 14, userSelect: 'none' }}>/</span>
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 14,
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {isDmMode
                  ? <MessageSquare style={{ width: 14, height: 14, flexShrink: 0, color: 'var(--text-muted)' }} />
                  : <Hash style={{ width: 14, height: 14, flexShrink: 0, color: 'var(--text-muted)' }} />
                }
                {channelLabel}
              </span>
            </>
          )}
          {!channelLabel && (
            <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>
              {contextLabel}
            </span>
          )}
        </div>
        {actions}
      </div>
    )
  }

  // Classic mode
  return (
    <div className="flex w-full items-center justify-between gap-3 px-2">
      <strong>{isDmMode ? (dmName ?? 'Direct Messages') : guildName ?? 'String'}</strong>
      {actions}
    </div>
  )
}

