import { Phone, Users } from 'lucide-react'
import type { TopNavBarVariantProps } from './TopNavBar'

export function TopNavBarClassic({
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
}: TopNavBarVariantProps) {
  return (
    <div className="flex w-full items-center justify-between gap-3 px-2">
      <strong>{isDmMode ? (dmName ?? 'Direct Messages') : guildName ?? 'String'}</strong>
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
        <button
          onClick={onToggleMemberList}
          title={showMemberList ? 'Hide Member List' : 'Show Member List'}
          style={{
            background: showMemberList ? 'rgba(88, 101, 242, 0.15)' : 'transparent',
            border: 'none',
            borderRadius: 4,
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
    </div>
  )
}
