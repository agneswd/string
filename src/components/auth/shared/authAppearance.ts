import { SignIn, SignUp } from '@clerk/react'
import type { ComponentProps } from 'react'

type ClerkSignInAppearance = NonNullable<ComponentProps<typeof SignIn>['appearance']>
type ClerkSignUpAppearance = NonNullable<ComponentProps<typeof SignUp>['appearance']>

const sharedElements = {
  cardBox: {
    width: '100%',
    maxWidth: '340px',
    margin: '0 auto',
    boxShadow: 'none',
    border: 'none',
    background: 'transparent',
    padding: 0,
  },
  header: {
    display: 'none',
  },
  headerTitle: {
    display: 'none',
  },
  headerSubtitle: {
    display: 'none',
  },
  socialButtonsBlockButton: {
    minHeight: '44px',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-sm)',
    backgroundColor: 'var(--bg-input)',
    color: 'var(--text-primary)',
    boxShadow: 'none',
    justifyContent: 'center',
    padding: '0',
  },
  socialButtonsBlockButtonText: {
    display: 'none',
  },
  socialButtonsBlockButton__google: {
    display: 'none',
  },
  socialButtonsBlockButtonArrow: {
    color: 'var(--text-secondary)',
  },
  dividerLine: {
    backgroundColor: 'var(--border-subtle)',
  },
  dividerText: {
    color: 'var(--text-muted)',
    fontSize: '12px',
  },
  formFieldLabel: {
    color: 'var(--text-secondary)',
    fontSize: '10px',
    fontWeight: 500,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
  },
  formFieldInput: {
    minHeight: '38px',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-sm)',
    backgroundColor: 'var(--bg-input)',
    color: 'var(--text-primary)',
    boxShadow: 'none',
  },
  formFieldInputShowPasswordButton: {
    color: 'var(--text-secondary)',
  },
  formButtonPrimary: {
    width: '100%',
    minHeight: '36px',
    border: '1px solid var(--accent-primary)',
    borderRadius: 'var(--radius-sm)',
    backgroundColor: 'var(--accent-primary)',
    color: 'var(--bg-deepest)',
    boxShadow: 'none',
  },
  formButtonReset: {
    color: 'var(--accent-primary)',
  },
  footerAction: {
    display: 'none',
  },
  footer: {
    display: 'none',
  },
  footerActionText: {
    display: 'none',
  },
  footerActionLink: {
    display: 'none',
  },
  identityPreviewText: {
    color: 'var(--text-secondary)',
  },
  formResendCodeLink: {
    color: 'var(--accent-primary)',
  },
  alert: {
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-sm)',
  },
} satisfies Record<string, Record<string, string | number>>

const sharedVariables = {
  colorPrimary: 'var(--accent-primary)',
  colorText: 'var(--text-primary)',
  colorTextSecondary: 'var(--text-secondary)',
  colorBackground: 'var(--bg-panel)',
  colorInputBackground: 'var(--bg-input)',
  colorInputText: 'var(--text-primary)',
  colorNeutral: 'var(--border-subtle)',
  colorDanger: 'var(--text-danger)',
  borderRadius: 'var(--radius-sm)',
  fontFamily: 'var(--font-sans)',
  fontFamilyButtons: 'var(--font-mono)',
} satisfies Record<string, string>

export const signInAppearance = {
  variables: sharedVariables,
  elements: sharedElements,
} satisfies ClerkSignInAppearance

export const signUpAppearance = {
  variables: sharedVariables,
  elements: sharedElements,
} satisfies ClerkSignUpAppearance