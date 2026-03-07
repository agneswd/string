import type { CSSProperties } from 'react'
import { useEffect, useState } from 'react'
import { useClerk, useUser } from '@clerk/react'

import { Modal } from './Modal'
import { S_formCol, S_labelCol, S_labelSpan, S_stringOutlineButton } from '../../constants/appStyles'
import { LAYOUT_MODES, type LayoutMode } from '../../constants/theme'
import { getAvatarColor, getInitial } from '../../lib/avatarUtils'
import './SettingsModal.css'

export interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  initialSection?: 'general' | 'sound' | 'account'
  uiSoundLevel: number
  onUiSoundLevelChange: (level: number) => void
  callSoundLevel: number
  onCallSoundLevelChange: (level: number) => void
  dmAlertSoundLevel: number
  onDmAlertSoundLevelChange: (level: number) => void
  friendAlertSoundLevel: number
  onFriendAlertSoundLevelChange: (level: number) => void
  voiceDefaultVolume: number
  onVoiceDefaultVolumeChange: (level: number) => void
  friendStatusNotificationsEnabled: boolean
  onFriendStatusNotificationsChange: (enabled: boolean) => void
  dmMessageNotificationsEnabled: boolean
  onDmMessageNotificationsChange: (enabled: boolean) => void
  /** Currently-active layout mode */
  layoutMode: LayoutMode
  /** Called when the user picks a different layout */
  onLayoutModeChange: (mode: LayoutMode) => void
  username?: string | null
  displayName?: string | null
  avatarUrl?: string | null
  profileColor?: string | null
}

type SettingsSection = 'general' | 'sound' | 'account'

const S_row: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '12px',
}

const S_slider = (value: number): CSSProperties => ({
  width: '100%',
  accentColor: 'var(--accent-primary)',
  appearance: 'none',
  height: '6px',
  borderRadius: 'var(--radius-sm)',
  background: `linear-gradient(90deg, var(--accent-primary) 0%, var(--accent-primary) ${value}%, var(--bg-input) ${value}%, var(--bg-input) 100%)`,
})

const S_switchTrack = (checked: boolean): CSSProperties => ({
  width: '40px',
  height: '24px',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--border-subtle)',
  background: checked ? 'var(--accent-primary)' : 'var(--bg-input)',
  display: 'inline-flex',
  alignItems: 'center',
  padding: '2px',
  cursor: 'pointer',
  transition: 'background 0.18s ease, border-color 0.18s ease',
  flexShrink: 0,
})

const S_switchThumb = (checked: boolean): CSSProperties => ({
  width: '18px',
  height: '18px',
  borderRadius: 'var(--radius-sm)',
  background: checked ? 'var(--bg-deepest)' : 'var(--text-muted)',
  transform: checked ? 'translateX(16px)' : 'translateX(0)',
  transition: 'transform 0.18s ease, background 0.18s ease',
  boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
})

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

const S_shell: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '18px',
  width: 'min(720px, calc(100vw - 32px))',
  minWidth: 0,
}

const S_nav: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  paddingRight: '18px',
  borderRight: '1px solid var(--border-subtle)',
  flex: '0 0 160px',
}

const S_navButton = (active: boolean): CSSProperties => ({
  ...S_stringOutlineButton,
  justifyContent: 'flex-start',
  color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
  borderColor: active ? 'var(--accent-primary)' : 'var(--border-subtle)',
  background: active ? 'var(--bg-active)' : 'transparent',
})

const S_panel: CSSProperties = {
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  flex: '1 1 280px',
}

const S_sectionTitle: CSSProperties = {
  margin: 0,
  fontSize: '14px',
  fontWeight: 600,
  color: 'var(--text-primary)',
}

const S_sectionBody: CSSProperties = {
  margin: 0,
  fontSize: '12px',
  lineHeight: 1.6,
  color: 'var(--text-secondary)',
}

const S_profileRow: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '12px 0',
  borderBottom: '1px solid var(--border-subtle)',
  marginBottom: '4px',
}

const S_identityBlock: CSSProperties = {
  minWidth: 0,
  flex: 1,
}

const S_displayName: CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: '14px',
  fontWeight: 600,
  color: 'var(--text-primary)',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}

const S_username: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '11px',
  color: 'var(--text-muted)',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}

const S_infoRow: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '3px',
}

const S_infoValue: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '12px',
  color: 'var(--text-secondary)',
  wordBreak: 'break-all',
}

const S_section: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
}

const S_divider: CSSProperties = {
  borderTop: '1px solid var(--border-subtle)',
  paddingTop: '16px',
  marginTop: '4px',
}

const S_signOutButton: CSSProperties = {
  ...S_stringOutlineButton,
  borderColor: 'var(--text-danger)',
  color: 'var(--text-danger)',
  width: '100%',
  justifyContent: 'center',
}

const S_layoutOption = (active: boolean): CSSProperties => ({
  ...S_stringOutlineButton,
  flex: 1,
  color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
  borderColor: active ? 'var(--text-primary)' : 'var(--border-subtle)',
  background: active ? 'var(--bg-active)' : 'transparent',
  transition: 'border-color 0.15s, background 0.15s, color 0.15s',
})

const LAYOUT_LABELS: Record<LayoutMode, string> = {
  string: 'String',
  classic: 'Classic',
}

const SECTION_LABELS: Record<SettingsSection, string> = {
  general: 'General',
  sound: 'Sound',
  account: 'Account',
}

const LAYOUT_OPTION_ORDER: LayoutMode[] = ['string', 'classic']

function SettingsSwitch({
  checked,
  onChange,
  ariaLabel,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  ariaLabel: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={() => onChange(!checked)}
      style={S_switchTrack(checked)}
    >
      <span style={S_switchThumb(checked)} />
    </button>
  )
}

function SettingsSlider({
  label,
  value,
  onChange,
  ariaLabel,
}: {
  label: string
  value: number
  onChange: (value: number) => void
  ariaLabel: string
}) {
  return (
    <label style={S_labelCol}>
      <span style={S_labelSpan}>{label}</span>
      <div style={S_row}>
        <input
          className="settings-modal__slider"
          type="range"
          min={0}
          max={100}
          step={1}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          style={S_slider(value)}
          aria-label={ariaLabel}
        />
        <span style={S_valueText}>{value}%</span>
      </div>
    </label>
  )
}

export function SettingsModal({
  isOpen,
  onClose,
  initialSection = 'general',
  uiSoundLevel,
  onUiSoundLevelChange,
  callSoundLevel,
  onCallSoundLevelChange,
  dmAlertSoundLevel,
  onDmAlertSoundLevelChange,
  friendAlertSoundLevel,
  onFriendAlertSoundLevelChange,
  voiceDefaultVolume,
  onVoiceDefaultVolumeChange,
  friendStatusNotificationsEnabled,
  onFriendStatusNotificationsChange,
  dmMessageNotificationsEnabled,
  onDmMessageNotificationsChange,
  layoutMode,
  onLayoutModeChange,
  username,
  displayName,
  avatarUrl,
  profileColor,
}: SettingsModalProps) {
  const { user } = useUser()
  const { signOut } = useClerk()
  const [activeSection, setActiveSection] = useState<SettingsSection>(initialSection)

  useEffect(() => {
    if (isOpen) {
      setActiveSection(initialSection)
    }
  }, [initialSection, isOpen])

  const resolvedDisplayName = displayName ?? user?.fullName ?? username ?? '?'
  const resolvedUsername = username ?? user?.username ?? null
  const email = user?.primaryEmailAddress?.emailAddress ?? null
  const resolvedAvatarUrl = avatarUrl ?? null

  const handleSignOut = async () => {
    onClose()
    await signOut()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Settings">
      <div style={S_shell}>
        <nav style={S_nav} aria-label="Settings categories">
          {(['general', 'sound', 'account'] as SettingsSection[]).map((section) => (
            <button
              key={section}
              type="button"
              style={S_navButton(activeSection === section)}
              onClick={() => setActiveSection(section)}
              aria-pressed={activeSection === section}
            >
              {SECTION_LABELS[section]}
            </button>
          ))}
        </nav>

        <div style={S_panel}>
          {activeSection === 'general' ? (
            <>
              <div>
                <h3 style={S_sectionTitle}>General settings</h3>
                <p style={S_sectionBody}>Application preferences, notifications, and layout.</p>
              </div>

              <div style={S_formCol}>
                <label style={S_labelCol}>
                  <span style={S_labelSpan}>UI SOUND LEVEL</span>
                  <p style={S_sectionBody}>Sound preferences are now managed from the dedicated Sound section.</p>
                </label>

                <label style={S_row}>
                  <span style={S_labelSpan}>FRIEND ONLINE/OFFLINE NOTIFICATIONS</span>
                  <SettingsSwitch
                    checked={friendStatusNotificationsEnabled}
                    onChange={onFriendStatusNotificationsChange}
                    aria-label="Friend online/offline notifications"
                  />
                </label>

                <label style={S_row}>
                  <span style={S_labelSpan}>DM MESSAGE NOTIFICATIONS</span>
                  <SettingsSwitch
                    checked={dmMessageNotificationsEnabled}
                    onChange={onDmMessageNotificationsChange}
                    aria-label="DM message notifications"
                  />
                </label>

                <div style={S_labelCol}>
                  <span style={S_labelSpan}>LAYOUT</span>
                  <div style={S_layoutGroup} role="radiogroup" aria-label="Layout mode">
                    {LAYOUT_OPTION_ORDER.map((mode) => (
                      <button
                        key={mode}
                        role="radio"
                        aria-checked={layoutMode === mode}
                        aria-label={LAYOUT_LABELS[mode]}
                        style={S_layoutOption(layoutMode === mode)}
                        onClick={() => onLayoutModeChange(mode)}
                        className="string-outline-button"
                      >
                        {LAYOUT_LABELS[mode]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : activeSection === 'sound' ? (
            <>
              <div>
                <h3 style={S_sectionTitle}>Sound</h3>
                <p style={S_sectionBody}>Tune interface sounds, alerts, and default voice playback levels.</p>
              </div>

              <div style={S_formCol}>
                <SettingsSlider
                  label="UI SOUNDS"
                  value={uiSoundLevel}
                  onChange={onUiSoundLevelChange}
                  ariaLabel="UI sound level"
                />
                <SettingsSlider
                  label="CALL SOUNDS"
                  value={callSoundLevel}
                  onChange={onCallSoundLevelChange}
                  ariaLabel="Call sound level"
                />
                <SettingsSlider
                  label="DM ALERTS"
                  value={dmAlertSoundLevel}
                  onChange={onDmAlertSoundLevelChange}
                  ariaLabel="DM alert sound level"
                />
                <SettingsSlider
                  label="FRIEND ALERTS"
                  value={friendAlertSoundLevel}
                  onChange={onFriendAlertSoundLevelChange}
                  ariaLabel="Friend alert sound level"
                />
                <SettingsSlider
                  label="VOICE DEFAULT"
                  value={voiceDefaultVolume}
                  onChange={onVoiceDefaultVolumeChange}
                  ariaLabel="Default voice volume"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <h3 style={S_sectionTitle}>Account</h3>
                <p style={S_sectionBody}>Your current identity, linked email, and session controls.</p>
              </div>

              <div style={S_formCol}>
                <div style={S_profileRow}>
                  <div style={{ flexShrink: 0 }}>
                    {resolvedAvatarUrl ? (
                      <img
                        src={resolvedAvatarUrl}
                        alt=""
                        style={{ width: 44, height: 44, borderRadius: '3px', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{
                        width: 44,
                        height: 44,
                        borderRadius: '3px',
                        backgroundColor: profileColor ?? getAvatarColor(resolvedDisplayName),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontSize: '18px',
                        fontWeight: 700,
                      }}>
                        {getInitial(resolvedDisplayName)}
                      </div>
                    )}
                  </div>
                  <div style={S_identityBlock}>
                    <div style={S_displayName}>{resolvedDisplayName}</div>
                    {resolvedUsername && <div style={S_username}>@{resolvedUsername}</div>}
                  </div>
                </div>

                {email && (
                  <div style={S_section}>
                    <span style={S_labelSpan}>Email</span>
                    <div style={S_infoRow}>
                      <span style={S_infoValue}>{email}</span>
                    </div>
                  </div>
                )}

                <div style={{ ...S_section, ...S_divider }}>
                  <button
                    style={S_signOutButton}
                    className="string-outline-button"
                    onClick={() => { void handleSignOut() }}
                    type="button"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </Modal>
  )
}
