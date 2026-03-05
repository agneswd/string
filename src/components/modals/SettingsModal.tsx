import type { CSSProperties } from 'react'
import { Modal } from './Modal'
import { S_formCol, S_labelCol, S_labelSpan } from '../../constants/appStyles'

export interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  uiSoundLevel: number
  onUiSoundLevelChange: (level: number) => void
  friendStatusNotificationsEnabled: boolean
  onFriendStatusNotificationsChange: (enabled: boolean) => void
  dmMessageNotificationsEnabled: boolean
  onDmMessageNotificationsChange: (enabled: boolean) => void
}

const S_row: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '12px',
}

const S_slider: CSSProperties = {
  width: '100%',
  accentColor: 'var(--accent-primary, #5865f2)',
}

const S_toggle: CSSProperties = {
  width: '16px',
  height: '16px',
  accentColor: 'var(--accent-primary, #5865f2)',
  cursor: 'pointer',
}

const S_valueText: CSSProperties = {
  fontSize: '12px',
  color: 'var(--text-secondary)',
  minWidth: '40px',
  textAlign: 'right',
}

export function SettingsModal({
  isOpen,
  onClose,
  uiSoundLevel,
  onUiSoundLevelChange,
  friendStatusNotificationsEnabled,
  onFriendStatusNotificationsChange,
  dmMessageNotificationsEnabled,
  onDmMessageNotificationsChange,
}: SettingsModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings">
      <div style={S_formCol}>
        <label style={S_labelCol}>
          <span style={S_labelSpan}>UI SOUND LEVEL</span>
          <div style={S_row}>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={uiSoundLevel}
              onChange={(e) => onUiSoundLevelChange(Number(e.target.value))}
              style={S_slider}
              aria-label="UI sound level"
            />
            <span style={S_valueText}>{uiSoundLevel}%</span>
          </div>
        </label>

        <label style={S_row}>
          <span style={S_labelSpan}>FRIEND ONLINE/OFFLINE NOTIFICATIONS</span>
          <input
            type="checkbox"
            checked={friendStatusNotificationsEnabled}
            onChange={(e) => onFriendStatusNotificationsChange(e.target.checked)}
            style={S_toggle}
            aria-label="Friend online/offline notifications"
          />
        </label>

        <label style={S_row}>
          <span style={S_labelSpan}>DM MESSAGE NOTIFICATIONS</span>
          <input
            type="checkbox"
            checked={dmMessageNotificationsEnabled}
            onChange={(e) => onDmMessageNotificationsChange(e.target.checked)}
            style={S_toggle}
            aria-label="DM message notifications"
          />
        </label>
      </div>
    </Modal>
  )
}
