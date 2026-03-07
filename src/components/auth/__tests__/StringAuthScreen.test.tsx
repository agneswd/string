import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'

import { StringAuthScreen } from '../screen/StringAuthScreen'

vi.mock('@clerk/react', () => ({
  SignIn: () => <div data-testid="clerk-sign-in">clerk sign in</div>,
  SignUp: () => <div data-testid="clerk-sign-up">clerk sign up</div>,
}))

describe('StringAuthScreen', () => {
  it('renders Clerk sign-in by default', () => {
    render(<StringAuthScreen />)

    expect(screen.getByText(/sign in to string/i)).toBeTruthy()
    expect(screen.getByTestId('clerk-sign-in')).toBeTruthy()
  })

  it('switches to Clerk sign-up when the auth mode changes', () => {
    render(<StringAuthScreen />)

    fireEvent.click(screen.getByRole('button', { name: /create account instead/i }))

    expect(screen.getByText(/create your string account/i)).toBeTruthy()
    expect(screen.getByTestId('clerk-sign-up')).toBeTruthy()
  })
})
