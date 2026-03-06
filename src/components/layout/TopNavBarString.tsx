import { Phone, Users, Hash, MessageSquare } from 'lucide-react'
import type { TopNavBarVariantProps } from './TopNavBar'

export function TopNavBarString({
  isDmMode,
  isHomeView,
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
  channelName,
}: TopNavBarVariantProps) {
  const contextLabel = isDmMode ? (dmName ?? 'Direct Messages') : (guildName ?? 'Workspace')
  const channelLabel = isHomeView ? null : (channelName ?? (isDmMode ? dmName : null))
  const showSingleContextLabel = !isHomeView && (channelLabel == null || channelLabel === contextLabel)

  return (
    <div
      className="flex w-full items-center gap-2"
      style={{
        height: '100%',
        padding: '0 4px',
        fontFamily: 'var(--font-mono)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            height: 28,
            padding: '0 10px',
            borderRadius: 999,
            border: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-deepest)',
            color: 'var(--accent-primary)',
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
          }}
        >
          String//
        </span>
        {!isHomeView ? (
          <>
            {showSingleContextLabel ? (
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {contextLabel}
              </span>
            ) : (
              <>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {contextLabel}
                </span>
                <span style={{ color: 'var(--border-subtle)', fontSize: 14, userSelect: 'none' }}>/</span>
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 14,
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {isDmMode ? (
                    <MessageSquare style={{ width: 14, height: 14, flexShrink: 0, color: 'var(--text-muted)' }} />
                  ) : (
                    <Hash style={{ width: 14, height: 14, flexShrink: 0, color: 'var(--text-muted)' }} />
                  )}
                  {channelLabel}
                </span>
              </>
            )}
          </>
        ) : (
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
            shell chrome
          </span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
        {isDmMode && selectedDmChannel && !currentVoiceState && !outgoingCall && (
          <button
            onClick={() => onInitiateDmCall(selectedDmChannelId!)}
            title={dmCallActive ? 'Rejoin Call' : 'Start Voice Call'}
            style={{
              background: dmCallActive ? 'rgba(59,165,93,0.15)' : 'transparent',
              border: 'none',
              borderRadius: 6,
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
        {!isHomeView && (
          <button
            onClick={onToggleMemberList}
            title={showMemberList ? 'Hide Member List' : 'Show Member List'}
            style={{
              background: showMemberList ? 'var(--bg-active)' : 'transparent',
              border: '1px solid var(--border-subtle)',
              borderRadius: 8,
              padding: '4px 6px',
              cursor: 'pointer',
              color: showMemberList ? 'var(--text-normal)' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Users style={{ width: 18, height: 18 }} />
          </button>
        )}
      </div>
    </div>
  )
}
