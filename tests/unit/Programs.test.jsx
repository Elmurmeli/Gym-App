import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

import Programs from '../../src/pages/programs/Programs.jsx'
import { supabase } from '../../src/supabase'

function makeFromMock(data) {
  return vi.fn(() => ({
    select: () => ({
      order: () => ({
        eq: () => Promise.resolve({ data }),
      }),
    }),
  }))
}

describe('Programs page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.location.hash = ''
  })

  it('renders public programs and hides create when logged out', async () => {
    // No user
    supabase.auth.getUser.mockResolvedValueOnce({ data: { user: null } })

    const programs = [
      { id: 'p1', title: 'Public One', description: 'First', visibility: 'public', created_at: new Date().toISOString() },
      { id: 'p2', title: 'Public Two', description: '', visibility: 'public', created_at: new Date().toISOString() },
    ]

    supabase.from = makeFromMock(programs)

    render(
      <MemoryRouter>
        <Programs />
      </MemoryRouter>
    )

    // Wait for program titles to appear
    expect(await screen.findByText('Public One')).toBeInTheDocument()
    expect(screen.getByText('Public Two')).toBeInTheDocument()

    // Create button only shows when user present
    expect(screen.queryByText('+ Create')).not.toBeInTheDocument()

    // Each program has a View link
    expect(screen.getAllByRole('link', { name: /view/i })[0]).toHaveAttribute('href', '/programs/p1')
  })

  it('shows login prompt when switching to My Programs while logged out', async () => {
    supabase.auth.getUser.mockResolvedValue({ data: { user: null } })
    supabase.from = makeFromMock([])

    render(
      <MemoryRouter>
        <Programs />
      </MemoryRouter>
    )

    // Click My Programs tab
    const mineBtn = await screen.findByRole('button', { name: /my programs/i })
    await userEvent.click(mineBtn)

    // Should show message prompting login
    expect(await screen.findByText(/Log in to see your programs/i)).toBeInTheDocument()
  })

  it('shows user programs and create button when logged in', async () => {
    const user = { id: 'u1', email: 'me@x.com' }
    supabase.auth.getUser.mockResolvedValue({ data: { user } })

    const myPrograms = [
      { id: 'm1', title: 'Mine 1', description: 'Mine', visibility: 'private', created_at: new Date().toISOString() },
    ]

    supabase.from = makeFromMock(myPrograms)

    render(
      <MemoryRouter>
        <Programs />
      </MemoryRouter>
    )

    // Click My Programs tab
    const mineBtn = await screen.findByRole('button', { name: /my programs/i })
    await userEvent.click(mineBtn)

    // Create button should be visible
    expect(await screen.findByText('+ Create')).toBeInTheDocument()

    // Program card shows Open Builder and Delete in mine tab
    expect(await screen.findByText('Mine 1')).toBeInTheDocument()
    expect(screen.getByText(/open builder/i)).toBeInTheDocument()
    expect(screen.getByText(/delete/i)).toBeInTheDocument()
  })
})
