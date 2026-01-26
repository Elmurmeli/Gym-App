import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

import NavBar from '../../src/components/NavBar.jsx'
import { supabase } from '../../src/supabase'


describe('NavBar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.location.hash = ''
  })
  // Test when no user is logged in
  it('shows Login when no user', async () => {
    supabase.auth.getUser.mockResolvedValueOnce({ data: { user: null } })
    render(
      <MemoryRouter>
        <NavBar />
      </MemoryRouter>
    )
    // Check that 'Login ▾' button is displayed
    expect(await screen.findByText(/Login ▾/)).toBeInTheDocument()
    // Links: Gym Tracker and Programs should be visible; auth-only links hidden
    const homeLink = screen.getByRole('link', { name: /gym tracker/i })
    expect(homeLink).toBeInTheDocument()
    expect(homeLink).toHaveAttribute('href', '/')

    const programsLink = screen.getByRole('link', { name: /programs/i })
    expect(programsLink).toBeInTheDocument()
    expect(programsLink).toHaveAttribute('href', '/programs')

    expect(screen.queryByRole('link', { name: /log exercise/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /history/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /progress/i })).not.toBeInTheDocument()
  })

  // Test when a user is logged in
  it('shows user email and handles logout', async () => {
    supabase.auth.getUser.mockResolvedValueOnce({ data: { user: { email: 'user@example.com' } } })
    render(
      <MemoryRouter>
        <NavBar />
      </MemoryRouter>
    )
    // Check that user email is displayed
    expect(await screen.findByText('user@example.com')).toBeInTheDocument()
    // Links visible when authenticated
    expect(screen.getByRole('link', { name: /gym tracker/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /programs/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /log exercise/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /history/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /progress/i })).toBeInTheDocument()
    // Simulate clicking the menu button to open dropdown
    const menuBtn = screen.getByTestId('menu-btn')
    await userEvent.click(menuBtn)
    // Simulate clicking the logout button
    const logoutBtn = await screen.findByTestId('logout-btn')
    await userEvent.click(logoutBtn)
    // Verify signOut was called and redirection occurred
    expect(supabase.auth.signOut).toHaveBeenCalled()
    expect(window.location.hash).toBe('#/')
  })
})
