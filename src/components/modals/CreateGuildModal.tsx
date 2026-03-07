import { useState } from 'react'
import { Modal } from './Modal'
import { S_formCol, S_labelCol, S_labelSpan, S_input, S_stringOutlineButton, S_stringOutlineButtonDisabled } from '../../constants/appStyles'

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
    <Modal isOpen={isOpen} onClose={onClose} title="Create a Loom">
      <form onSubmit={async (e) => { e.preventDefault(); if (isSubmitting) return; setIsSubmitting(true); try { await onSubmit(); onClose(); } finally { setIsSubmitting(false); } }} style={{ ...S_formCol, minWidth: 0, width: '100%' }}>
        <label style={S_labelCol}>
          <span style={S_labelSpan}>LOOM NAME</span>
          <input value={guildName} onChange={e => onGuildNameChange(e.target.value)} placeholder="Enter Loom name" style={{ ...S_input, width: '100%', boxSizing: 'border-box' }} />
        </label>
        <button type="submit" disabled={!guildName.trim() || isSubmitting} style={guildName.trim() && !isSubmitting ? S_stringOutlineButton : S_stringOutlineButtonDisabled} className="string-outline-button">
          {isSubmitting ? 'Creating…' : 'Create Loom'}
        </button>
      </form>
    </Modal>
  )
}
