import { useState } from 'react'
import { Modal } from './Modal'
import { S_input, S_inviteAvatar, S_stringOutlineButton } from '../../constants/appStyles'

export interface InviteFriendsModalProps {
  isOpen: boolean
  onClose: () => void
  friends: Array<{ id: string | number; displayName: string; username: string; identity?: unknown }>
  onInviteFriend: (friendIdentity: unknown) => void
}

export function InviteFriendsModal({ isOpen, onClose, friends, onInviteFriend }: InviteFriendsModalProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const handleClose = () => {
    onClose()
    setSearchQuery('')
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Invite Friends">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search friends..."
          style={S_input}
        />
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {friends.filter(f => !searchQuery || f.displayName.toLowerCase().includes(searchQuery.toLowerCase()) || f.username.toLowerCase().includes(searchQuery.toLowerCase())).map(friend => (
            <div key={String(friend.id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={S_inviteAvatar}>
                  {(friend.displayName || friend.username || '?')[0].toUpperCase()}
                </div>
                <span style={{ color: 'var(--text-primary)' }}>{friend.displayName || friend.username}</span>
              </div>
              <button
                onClick={() => { if (friend.identity) { onInviteFriend(friend.identity); } }}
                style={{ ...S_stringOutlineButton, minHeight: 30, padding: '5px 12px' }}
                className="string-outline-button"
              >
                Invite
              </button>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  )
}
