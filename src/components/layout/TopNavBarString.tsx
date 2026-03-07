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
  const contextLabel = isDmMode ? (dmName ?? 'Direct Messages') : (guildName ?? 'Loom')
  const channelLabel = isHomeView ? null : (channelName ?? (isDmMode ? dmName : null))
  const showSingleContextLabel = !isHomeView && (channelLabel == null || channelLabel === contextLabel)
  const badgeLabel = isHomeView ? 'home' : contextLabel

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
        {/* String identity mark — flat, thin-bordered, square */}
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            height: 22,
            padding: '0 7px',
            borderRadius: 2,
            border: '1px solid var(--border-subtle)',
            backgroundColor: 'transparent',
            color: 'var(--accent-primary)',
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            userSelect: 'none',
          }}
        >
          {badgeLabel}
        </span>

        {/* Breadcrumb context */}
        {!isHomeView ? (
          <>
            {!showSingleContextLabel && (
              <>
                <span style={{ color: 'var(--border-subtle)', fontSize: 12, userSelect: 'none' }}>/</span>
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: 13,
                    fontWeight: 500,
                    color: 'var(--text-primary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {isDmMode ? (
                    <MessageSquare style={{ width: 13, height: 13, flexShrink: 0, color: 'var(--text-muted)' }} />
                  ) : (
                    <Hash style={{ width: 13, height: 13, flexShrink: 0, color: 'var(--text-muted)' }} />
                  )}
                  {channelLabel}
                </span>
              </>
            )}
          </>
        ) : null}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
        {isDmMode && selectedDmChannel && !currentVoiceState && !outgoingCall && (
          <button
            onClick={() => onInitiateDmCall(selectedDmChannelId!)}
            title={dmCallActive ? 'Rejoin Call' : 'Start Voice Call'}
            style={{
              background: dmCallActive ? 'var(--bg-success-subtle)' : 'transparent',
              border: '1px solid var(--border-subtle)',
              borderRadius: 2,
              padding: '3px 6px',
              cursor: 'pointer',
              color: dmCallActive ? 'var(--status-online)' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Phone style={{ width: 14, height: 14 }} />
            {dmCallActive && (
              <span style={{ fontSize: 11, fontWeight: 500, fontFamily: 'var(--font-mono)' }}>
                rejoin
              </span>
            )}
          </button>
        )}
        {!isHomeView && (
          <button
            onClick={onToggleMemberList}
            title={showMemberList ? 'Hide Member List' : 'Show Member List'}
            style={{
              background: showMemberList ? 'var(--bg-active)' : 'transparent',
              border: '1px solid var(--border-subtle)',
              borderRadius: 2,
              padding: '3px 6px',
              cursor: 'pointer',
              color: showMemberList ? 'var(--text-primary)' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Users style={{ width: 14, height: 14 }} />
          </button>
        )}
      </div>
    </div>
  )
}
