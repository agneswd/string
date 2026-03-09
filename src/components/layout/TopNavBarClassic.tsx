import { Phone, Users } from 'lucide-react'
import type { TopNavBarVariantProps } from './TopNavBar'

export function TopNavBarClassic({
  isDmMode,
  isHomeView,
  dmName,
  guildName,
  selectedDmChannel,
  currentVoiceState,
  outgoingCall,
  dmCallActive,
  selectedDmChannelId,
  onCancelOutgoingCall,
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
    <div className="flex w-full items-center justify-between gap-3 px-2">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          minWidth: 0,
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            height: 22,
            padding: '0 7px',
            borderRadius: 2,
            border: '1px solid var(--border-subtle)',
            backgroundColor: 'transparent',
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--accent-primary)',
            whiteSpace: 'nowrap',
            userSelect: 'none',
          }}
        >
          {badgeLabel}
        </span>

        {!isHomeView && !showSingleContextLabel && (
          <>
            <span style={{ color: 'var(--border-subtle)', fontSize: 12, userSelect: 'none' }}>/</span>
            <strong
              style={{
                minWidth: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                color: 'var(--text-primary)',
              }}
            >
              {channelLabel}
            </strong>
          </>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 'auto' }}>
        {isDmMode && outgoingCall && !currentVoiceState && (
          <button
            type="button"
            onClick={onCancelOutgoingCall}
            title="Calling"
            style={{
              background: 'rgba(59,165,93,0.15)',
              border: 'none',
              borderRadius: 6,
              padding: '4px 8px',
              color: '#3ba55d',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 12,
              fontWeight: 600,
              whiteSpace: 'nowrap',
              cursor: 'pointer',
            }}
          >
            <Phone style={{ width: 16, height: 16 }} />
            Calling…
          </button>
        )}
        {isDmMode && selectedDmChannel && !currentVoiceState && !outgoingCall && (
          <button
            onClick={() => onInitiateDmCall(selectedDmChannelId!)}
            title={dmCallActive ? 'Rejoin Call' : 'Start Voice Call'}
            style={{
              background: dmCallActive ? 'rgba(59,165,93,0.15)' : 'transparent',
              border: 'none',
              borderRadius: 4,
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
              background: showMemberList ? 'var(--accent-subtle)' : 'transparent',
              border: 'none',
              borderRadius: 6,
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
