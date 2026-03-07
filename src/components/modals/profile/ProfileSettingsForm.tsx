import { ProfileAvatarSection } from './ProfileAvatarSection'
import { ProfileColorSection } from './ProfileColorSection'
import { ProfileStatusSection } from './ProfileStatusSection'
import {
  S_charCount,
  S_input,
  S_label,
  S_saveBtn,
  S_saveBtnDisabled,
  S_section,
  S_textarea,
} from './styles'
import { getStatusColor } from './constants'
import type { ProfileSettingsFormController } from './useProfileSettingsForm'

export interface ProfileSettingsFormProps {
  controller: ProfileSettingsFormController
  submitLabel?: string
}

export function ProfileSettingsForm({
  controller,
  submitLabel = 'Save Changes',
}: ProfileSettingsFormProps) {
  return (
    <div style={S_section}>
      <ProfileAvatarSection
        avatarPreview={controller.avatarPreview}
        name={controller.name}
        profileColor={controller.profileColor}
        statusColor={getStatusColor(controller.editStatus)}
        avatarError={controller.avatarError}
        onUploadClick={() => controller.fileInputRef.current?.click()}
        onResetClick={controller.handleAvatarReset}
        canReset={Boolean(controller.avatarPreview)}
      />

      <div>
        <div style={S_label}>USERNAME</div>
        <input
          type="text"
          value={controller.editUsername}
          onChange={(event) => controller.setEditUsername(event.target.value.slice(0, 32))}
          placeholder="Username"
          maxLength={32}
          onFocus={() => controller.setFocusedField('username')}
          onBlur={() => controller.setFocusedField(null)}
          style={{
            ...S_input,
            boxShadow: controller.focusedField === 'username' ? '0 0 0 1px var(--border-focus)' : 'none',
            transition: 'box-shadow 0.15s ease',
          }}
        />
        <div style={S_charCount}>{controller.editUsername.length}/32</div>
      </div>

      <div>
        <div style={S_label}>DISPLAY NAME</div>
        <input
          type="text"
          value={controller.editDisplayName}
          onChange={(event) => controller.setEditDisplayName(event.target.value.slice(0, 64))}
          placeholder="Display Name"
          maxLength={64}
          onFocus={() => controller.setFocusedField('displayName')}
          onBlur={() => controller.setFocusedField(null)}
          style={{
            ...S_input,
            boxShadow: controller.focusedField === 'displayName' ? '0 0 0 1px var(--border-focus)' : 'none',
            transition: 'box-shadow 0.15s ease',
          }}
        />
        <div style={S_charCount}>{controller.editDisplayName.length}/64</div>
      </div>

      <div>
        <div style={S_label}>BIO</div>
        <textarea
          value={controller.editBio}
          onChange={(event) => controller.setEditBio(event.target.value.slice(0, 500))}
          placeholder="Tell us about yourself..."
          maxLength={500}
          onFocus={() => controller.setFocusedField('bio')}
          onBlur={() => controller.setFocusedField(null)}
          style={{
            ...S_textarea,
            boxShadow: controller.focusedField === 'bio' ? '0 0 0 1px var(--border-focus)' : 'none',
            transition: 'box-shadow 0.15s ease',
          }}
        />
        <div style={S_charCount}>{controller.editBio.length}/500</div>
      </div>

      <ProfileColorSection profileColor={controller.profileColor} onChange={controller.setProfileColor} />
      <ProfileStatusSection editStatus={controller.editStatus} onChange={controller.setEditStatus} />

      <button
        type="button"
        onClick={() => void controller.handleSave()}
        disabled={controller.saving || !controller.hasChanges}
        style={controller.hasChanges && !controller.saving ? S_saveBtn : S_saveBtnDisabled}
        className="string-outline-button"
      >
        {controller.saving ? 'Saving...' : submitLabel}
      </button>

      <input
        ref={controller.fileInputRef}
        type="file"
        accept="image/*"
        onChange={(event) => void controller.handleAvatarUpload(event)}
        style={{ display: 'none' }}
      />
    </div>
  )
}
