import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

import Login from '../../src/pages/Login.jsx'
import { supabase } from '../../src/supabase'

describe('Login page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.location.hash = ''
  })

  it('renders form fields and register link', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    )

    expect(screen.getByTestId('email-input')).toBeInTheDocument()
    expect(screen.getByTestId('password-input')).toBeInTheDocument()
    expect(screen.getByTestId('login-btn')).toBeInTheDocument()
    expect(screen.getByTestId('register-link')).toBeInTheDocument()
  })

  it('calls supabase.auth.signInWithPassword and redirects on success', async () => {
    const mockSignIn = vi.fn(async () => ({ error: null }))
    supabase.auth.signInWithPassword = mockSignIn

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    )

    await userEvent.type(screen.getByTestId('email-input'), 'me@example.com')
    await userEvent.type(screen.getByTestId('password-input'), 'secret')
    await userEvent.click(screen.getByTestId('login-btn'))

    await waitFor(() => expect(mockSignIn).toHaveBeenCalledWith({ email: 'me@example.com', password: 'secret' }))
    await waitFor(() => expect(window.location.hash).toBe('#/'))
  })

  it('shows error message when auth fails', async () => {
    const mockSignIn = vi.fn(async () => ({ error: { message: 'Invalid credentials' } }))
    supabase.auth.signInWithPassword = mockSignIn

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    )

    await userEvent.type(screen.getByTestId('email-input'), 'me@example.com')
    await userEvent.type(screen.getByTestId('password-input'), 'bad')
    await userEvent.click(screen.getByTestId('login-btn'))

    expect(await screen.findByTestId('auth-error')).toHaveTextContent('Invalid credentials')
    expect(mockSignIn).toHaveBeenCalled()
    expect(window.location.hash).toBe('')
  })
})
