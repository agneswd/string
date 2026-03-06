import React from 'react'
import { Check } from 'lucide-react'
import { PROFILE_COLORS } from './constants'
import { S_label } from './styles'

interface ProfileColorSectionProps {
  profileColor: string
  onChange: (color: string) => void
}

export const ProfileColorSection = React.memo(function ProfileColorSection({
  profileColor,
  onChange,
}: ProfileColorSectionProps) {
  return (
    <div>
      <div style={S_label}>PROFILE COLOR</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {PROFILE_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            style={{
              width: 24,
              height: 24,
              borderRadius: '3px',
              border: profileColor === c ? '2px solid var(--accent-primary)' : '2px solid transparent',
              backgroundColor: c,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
              outline: 'none',
            }}
            aria-label={`Select color ${c}`}
          >
            {profileColor === c && <Check size={14} color="#fff" strokeWidth={2} />}
          </button>
        ))}
      </div>
    </div>
  )
})
