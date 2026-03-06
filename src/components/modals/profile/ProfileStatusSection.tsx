import React from 'react'
import { STATUS_OPTIONS } from './constants'
import { S_label, S_statusBtn, S_statusBtnActive } from './styles'

interface ProfileStatusSectionProps {
  editStatus: string
  onChange: (tag: string) => void
}

export const ProfileStatusSection = React.memo(function ProfileStatusSection({
  editStatus,
  onChange,
}: ProfileStatusSectionProps) {
  return (
    <div>
      <div style={S_label}>STATUS</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.tag}
            type="button"
            onClick={() => onChange(opt.tag)}
            style={editStatus === opt.tag ? S_statusBtnActive : S_statusBtn}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                backgroundColor: opt.color,
                flexShrink: 0,
              }}
            />
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
})
