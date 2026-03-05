import { useState } from 'react'
import { Modal } from './Modal'
import { S_formCol, S_labelCol, S_labelSpan, S_input } from '../../constants/appStyles'

export interface CreateGuildModalProps {
  isOpen: boolean
  onClose: () => void
  guildName: string
  onGuildNameChange: (name: string) => void
  onSubmit: () => void | Promise<void>
}

export function CreateGuildModal({ isOpen, onClose, guildName, onGuildNameChange, onSubmit }: CreateGuildModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create a Server">
      <form onSubmit={async (e) => { e.preventDefault(); if (isSubmitting) return; setIsSubmitting(true); try { await onSubmit(); onClose(); } finally { setIsSubmitting(false); } }} style={S_formCol}>
        <label style={S_labelCol}>
          <span style={S_labelSpan}>SERVER NAME</span>
          <input value={guildName} onChange={e => onGuildNameChange(e.target.value)} placeholder="Enter server name" style={S_input} />
        </label>
        <button type="submit" disabled={!guildName.trim() || isSubmitting} style={{ padding: '10px 16px', borderRadius: '4px', border: 'none', backgroundColor: 'var(--accent-primary, #5865f2)', color: '#fff', fontWeight: 600, cursor: guildName.trim() && !isSubmitting ? 'pointer' : 'not-allowed', opacity: guildName.trim() && !isSubmitting ? 1 : 0.5 }}>
          {isSubmitting ? 'Creating…' : 'Create Server'}
        </button>
      </form>
    </Modal>
  )
}
