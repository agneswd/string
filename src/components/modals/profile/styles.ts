import type { CSSProperties } from 'react'
import { S_stringOutlineButton, S_stringOutlineButtonDisabled } from '../../../constants/appStyles'

export const S_section: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
}

export const S_label: CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: '11px',
  fontWeight: 500,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: 'var(--text-muted)',
  marginBottom: '4px',
}

export const S_input: CSSProperties = {
  padding: '8px 10px',
  borderRadius: '2px',
  border: '1px solid var(--border-subtle)',
  backgroundColor: 'var(--bg-input)',
  color: 'var(--text-primary)',
  fontSize: '13px',
  width: '100%',
  boxSizing: 'border-box',
  outline: 'none',
}

export const S_textarea: CSSProperties = {
  ...S_input,
  resize: 'vertical',
  minHeight: '80px',
  fontFamily: 'inherit',
}

export const S_avatarContainer: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '16px',
}

export const S_charCount: CSSProperties = {
  fontSize: '11px',
  fontFamily: 'var(--font-mono)',
  color: 'var(--text-muted)',
  textAlign: 'right',
  marginTop: '4px',
}

export const S_saveBtn: CSSProperties = {
  ...S_stringOutlineButton,
  alignSelf: 'stretch',
  width: '100%',
  marginTop: '8px',
}

export const S_saveBtnDisabled: CSSProperties = {
  ...S_stringOutlineButtonDisabled,
  alignSelf: 'stretch',
  width: '100%',
  marginTop: '8px',
}

export const S_statusBtn: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '7px 10px',
  borderRadius: '2px',
  border: '1px solid var(--border-subtle)',
  backgroundColor: 'var(--bg-input)',
  color: 'var(--text-primary)',
  cursor: 'pointer',
  fontSize: '13px',
  width: '100%',
  boxSizing: 'border-box',
}

export const S_statusBtnActive: CSSProperties = {
  ...S_statusBtn,
  borderColor: 'var(--accent-primary)',
}

export const S_uploadBtn: CSSProperties = {
  ...S_stringOutlineButton,
  minHeight: 30,
  padding: '5px 12px',
  fontSize: '12px',
}
