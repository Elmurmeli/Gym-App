import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

import Register from '../../src/pages/Register.jsx'
import { supabase } from '../../src/supabase'

describe('Register page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.location.hash = ''
  })

  it('renders form fields and register button', () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    )

    expect(screen.getByTestId('email-input')).toBeInTheDocument()
    expect(screen.getByTestId('password-input')).toBeInTheDocument()
    expect(screen.getByTestId('register-btn')).toBeInTheDocument()
  })

  it('calls supabase.auth.signUp and shows success message then redirects', async () => {
    const mockSignUp = vi.fn(async () => ({ error: null }))
    supabase.auth.signUp = mockSignUp

    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    )

    await userEvent.type(screen.getByTestId('email-input'), 'new@example.com')
    await userEvent.type(screen.getByTestId('password-input'), 'secret')
    await userEvent.click(screen.getByTestId('register-btn'))

    expect(mockSignUp).toHaveBeenCalled()
    expect(await screen.findByText(/Registration successful/i)).toBeInTheDocument()
  })

  it('shows error message when signup fails', async () => {
    const mockSignUp = vi.fn(async () => ({ error: { message: 'Already exists' } }))
    supabase.auth.signUp = mockSignUp

    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    )

    await userEvent.type(screen.getByTestId('email-input'), 'new@example.com')
    await userEvent.type(screen.getByTestId('password-input'), 'secret')
    await userEvent.click(screen.getByTestId('register-btn'))

    expect(await screen.findByText(/Already exists/i)).toBeInTheDocument()
    expect(mockSignUp).toHaveBeenCalled()
  })
})
