import { StyleSheet } from 'react-native'

import { Colors } from '../../../shared/theme'

export const authScreenStyles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
    gap: 32,
  },
  header: {
    gap: 8,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 30,
    fontWeight: '700',
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: 16,
  },
  emailHighlight: {
    color: Colors.accentBlue,
    fontWeight: '600',
  },
  form: {
    gap: 16,
  },
  field: {
    gap: 6,
  },
  label: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    backgroundColor: Colors.bgInput,
    borderWidth: 1,
    borderColor: Colors.borderDefault,
    borderRadius: 10,
    color: Colors.textPrimary,
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  codeInput: {
    fontSize: 24,
    letterSpacing: 6,
    textAlign: 'center',
  },
  errorText: {
    color: Colors.accentRed,
    fontSize: 14,
    lineHeight: 20,
  },
  primaryButton: {
    backgroundColor: Colors.accentBlue,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  footerText: {
    color: Colors.textSecondary,
    fontSize: 15,
  },
  switchLink: {
    color: Colors.accentBlue,
    fontSize: 15,
    fontWeight: '600',
  },
})
