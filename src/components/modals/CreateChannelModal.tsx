import { useState } from 'react'
import { Volume2 } from 'lucide-react'
import { Modal } from './Modal'
import { S_formCol, S_labelCol, S_labelSpan, S_input, S_stringOutlineButton, S_stringOutlineButtonDisabled } from '../../constants/appStyles'

export interface CreateChannelModalProps {
  isOpen: boolean
  onClose: () => void
  channelName: string
  onChannelNameChange: (name: string) => void
  channelType: 'Category' | 'Text' | 'Voice'
  onChannelTypeChange: (type: 'Category' | 'Text' | 'Voice') => void
  parentCategoryId: string
  onParentCategoryIdChange: (id: string) => void
  availableCategories: Array<{ id: string; name: string }>
  mode?: 'create' | 'edit'
  onSubmit: () => void | Promise<void>
}

export function CreateChannelModal({ isOpen, onClose, channelName, onChannelNameChange, channelType, onChannelTypeChange, parentCategoryId, onParentCategoryIdChange, availableCategories, mode = 'create', onSubmit }: CreateChannelModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isCategory = channelType === 'Category'
  const isEditing = mode === 'edit'

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? (isCategory ? 'Edit Category' : 'Edit Channel') : (isCategory ? 'Create Category' : 'Create Channel')}>
      <form onSubmit={async (e) => { e.preventDefault(); if (isSubmitting) return; setIsSubmitting(true); try { await onSubmit(); onClose(); } finally { setIsSubmitting(false); } }} style={S_formCol}>
        <label style={S_labelCol}>
          <span style={S_labelSpan}>CHANNEL TYPE</span>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button type="button" disabled={isEditing} onClick={() => onChannelTypeChange('Category')} style={{ flex: '1 1 140px', padding: '10px', borderRadius: '4px', border: channelType === 'Category' ? '2px solid var(--accent-primary, #5865f2)' : '2px solid transparent', backgroundColor: 'var(--bg-input, #1e1f22)', color: 'var(--text-primary)', cursor: isEditing ? 'not-allowed' : 'pointer', opacity: isEditing ? 0.65 : 1 }}>
              Category
            </button>
            <button type="button" disabled={isEditing} onClick={() => onChannelTypeChange('Text')} style={{ flex: '1 1 140px', padding: '10px', borderRadius: '4px', border: channelType === 'Text' ? '2px solid var(--accent-primary, #5865f2)' : '2px solid transparent', backgroundColor: 'var(--bg-input, #1e1f22)', color: 'var(--text-primary)', cursor: isEditing ? 'not-allowed' : 'pointer', opacity: isEditing ? 0.65 : 1 }}>
              # Text
            </button>
            <button type="button" disabled={isEditing} onClick={() => onChannelTypeChange('Voice')} style={{ flex: '1 1 140px', padding: '10px', borderRadius: '4px', border: channelType === 'Voice' ? '2px solid var(--accent-primary, #5865f2)' : '2px solid transparent', backgroundColor: 'var(--bg-input, #1e1f22)', color: 'var(--text-primary)', cursor: isEditing ? 'not-allowed' : 'pointer', opacity: isEditing ? 0.65 : 1 }}>
              <Volume2 style={{ width: 16, height: 16, display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} />
              Voice
            </button>
          </div>
        </label>
        <label style={S_labelCol}>
          <span style={S_labelSpan}>{isCategory ? 'CATEGORY NAME' : 'CHANNEL NAME'}</span>
          <input value={channelName} onChange={e => onChannelNameChange(e.target.value)} placeholder="new-channel" style={S_input} />
        </label>
        {!isCategory && (
          <label style={S_labelCol}>
            <span style={S_labelSpan}>CATEGORY</span>
            <select value={parentCategoryId} onChange={(event) => onParentCategoryIdChange(event.target.value)} style={S_input}>
              <option value="">No Category</option>
              {availableCategories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </label>
        )}
        <button type="submit" disabled={!channelName.trim() || isSubmitting} style={channelName.trim() && !isSubmitting ? S_stringOutlineButton : S_stringOutlineButtonDisabled} className="string-outline-button">
          {isSubmitting ? (isEditing ? 'Saving…' : 'Creating…') : (isEditing ? 'Save Changes' : (isCategory ? 'Create Category' : 'Create Channel'))}
        </button>
      </form>
    </Modal>
  )
}
