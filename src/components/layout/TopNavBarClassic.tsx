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
  showMemberList,
  onToggleMemberList,
  onInitiateDmCall,
  channelName,
}: TopNavBarVariantProps) {
  const title = isHomeView
    ? 'String'
    : isDmMode
      ? (dmName ?? 'Direct Messages')
      : channelName
        ? `# ${channelName}`
        : (guildName ?? 'String')

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
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
          }}
        >
          Shell
        </span>
        <strong
          style={{
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {title}
        </strong>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 'auto' }}>
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
