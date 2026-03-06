import { useState } from 'react'
import { Volume2 } from 'lucide-react'
import { Modal } from './Modal'
import { S_formCol, S_labelCol, S_labelSpan, S_input, S_stringOutlineButton, S_stringOutlineButtonDisabled } from '../../constants/appStyles'

export interface CreateChannelModalProps {
  isOpen: boolean
  onClose: () => void
  channelName: string
  onChannelNameChange: (name: string) => void
  channelType: 'Text' | 'Voice'
  onChannelTypeChange: (type: 'Text' | 'Voice') => void
  onSubmit: () => void | Promise<void>
}

export function CreateChannelModal({ isOpen, onClose, channelName, onChannelNameChange, channelType, onChannelTypeChange, onSubmit }: CreateChannelModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Channel">
      <form onSubmit={async (e) => { e.preventDefault(); if (isSubmitting) return; setIsSubmitting(true); try { await onSubmit(); onClose(); } finally { setIsSubmitting(false); } }} style={S_formCol}>
        <label style={S_labelCol}>
          <span style={S_labelSpan}>CHANNEL TYPE</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" onClick={() => onChannelTypeChange('Text')} style={{ flex: 1, padding: '10px', borderRadius: '4px', border: channelType === 'Text' ? '2px solid var(--accent-primary, #5865f2)' : '2px solid transparent', backgroundColor: 'var(--bg-input, #1e1f22)', color: 'var(--text-primary)', cursor: 'pointer' }}>
              # Text
            </button>
            <button type="button" onClick={() => onChannelTypeChange('Voice')} style={{ flex: 1, padding: '10px', borderRadius: '4px', border: channelType === 'Voice' ? '2px solid var(--accent-primary, #5865f2)' : '2px solid transparent', backgroundColor: 'var(--bg-input, #1e1f22)', color: 'var(--text-primary)', cursor: 'pointer' }}>
              <Volume2 style={{ width: 16, height: 16, display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} />
              Voice
            </button>
          </div>
        </label>
        <label style={S_labelCol}>
          <span style={S_labelSpan}>CHANNEL NAME</span>
          <input value={channelName} onChange={e => onChannelNameChange(e.target.value)} placeholder="new-channel" style={S_input} />
        </label>
        <button type="submit" disabled={!channelName.trim() || isSubmitting} style={channelName.trim() && !isSubmitting ? S_stringOutlineButton : S_stringOutlineButtonDisabled} className="string-outline-button">
          {isSubmitting ? 'Creating…' : 'Create Channel'}
        </button>
      </form>
    </Modal>
  )
}
