import type { CSSProperties } from 'react'
import { Modal } from './Modal'
import { S_formCol, S_labelCol, S_labelSpan } from '../../constants/appStyles'
import { LAYOUT_MODES, type LayoutMode } from '../../constants/theme'

export interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  uiSoundLevel: number
  onUiSoundLevelChange: (level: number) => void
  friendStatusNotificationsEnabled: boolean
  onFriendStatusNotificationsChange: (enabled: boolean) => void
  dmMessageNotificationsEnabled: boolean
  onDmMessageNotificationsChange: (enabled: boolean) => void
  /** Currently-active layout mode */
  layoutMode: LayoutMode
  /** Called when the user picks a different layout */
  onLayoutModeChange: (mode: LayoutMode) => void
}

const S_row: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '12px',
}

const S_slider: CSSProperties = {
  width: '100%',
  accentColor: 'var(--accent-primary)',
}

const S_toggle: CSSProperties = {
  width: '16px',
  height: '16px',
  accentColor: 'var(--accent-primary)',
  cursor: 'pointer',
}

const S_valueText: CSSProperties = {
  fontSize: '12px',
  color: 'var(--text-secondary)',
  minWidth: '40px',
  textAlign: 'right',
}

const S_layoutGroup: CSSProperties = {
  display: 'flex',
  gap: '8px',
}

const S_layoutOption = (active: boolean): CSSProperties => ({
  flex: 1,
  padding: '8px 12px',
  borderRadius: '6px',
  border: `1px solid ${active ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
  background: active ? 'var(--accent-subtle)' : 'transparent',
  color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
  cursor: 'pointer',
  fontWeight: active ? 600 : 400,
  fontSize: '13px',
  transition: 'border-color 0.15s, background 0.15s',
})

const LAYOUT_LABELS: Record<LayoutMode, string> = {
  workspace: 'Workspace',
  classic: 'Classic',
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
  layoutMode,
  onLayoutModeChange,
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

        <div style={S_labelCol}>
          <span style={S_labelSpan}>LAYOUT</span>
          <div style={S_layoutGroup} role="radiogroup" aria-label="Layout mode">
            {LAYOUT_MODES.map((mode) => (
              <button
                key={mode}
                role="radio"
                aria-checked={layoutMode === mode}
                aria-label={LAYOUT_LABELS[mode]}
                style={S_layoutOption(layoutMode === mode)}
                onClick={() => onLayoutModeChange(mode)}
              >
                {LAYOUT_LABELS[mode]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  )
}
