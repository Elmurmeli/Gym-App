import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

// Stub child components to keep test focused
vi.mock('../../src/components/programs/WorkoutSessionModal', () => ({ default: () => null }))
vi.mock('../../src/components/programs/WorkoutHistoryList', () => ({ default: () => null }))
vi.mock('../../src/components/programs/WorkoutSessionViewModal', () => ({ default: () => null }))
vi.mock('../../src/components/programs/WorkoutSessionsModal', () => ({ default: () => null }))

import ProgramView from '../../src/pages/programs/ProgramView.jsx'
import { supabase } from '../../src/supabase'

function makeFromMock(map) {
  return vi.fn((table) => ({
    select: () => ({
      eq: (col, val) => ({
        single: () => Promise.resolve({ data: map[table] && map[table][0] }),
        order: () => Promise.resolve({ data: map[table] || [] }),
      }),
      in: (col, ids) => ({
        order: () => Promise.resolve({ data: map['program_exercises'] || [] }),
      }),
    }),
  }))
}

describe('ProgramView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.location.hash = ''
  })

  it('renders program title, description and workouts for owner', async () => {
    const program = { id: 'prog1', title: 'Test Program', description: 'Desc', visibility: 'private', owner_id: 'u1' }
    const workouts = [{ id: 'w1', order_index: 1, day_label: 'Day 1', notes: 'notes' }]
    const exercises = [{ id: 'e1', workout_id: 'w1', exercise_name: 'Squat', sets: 3 }]

    supabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
    supabase.from = makeFromMock({ programs: [program], program_workouts: workouts, program_exercises: exercises })

    render(
      <MemoryRouter initialEntries={["/programs/prog1"]}>
        <ProgramView />
      </MemoryRouter>
    )

    expect(await screen.findByText('Test Program')).toBeInTheDocument()
    expect(screen.getByText('Desc')).toBeInTheDocument()
    // shows count of workouts
    expect(screen.getByText(/1 day/)).toBeInTheDocument()
    // Edit Program link should appear for owner
    expect(await screen.findByText(/Edit Program/i)).toBeInTheDocument()
    // Workout day label should appear
    expect(await screen.findByText('Day 1')).toBeInTheDocument()
    // Exercise name shows inside expanded content when open; the component opens first workout automatically
    const squatMatches = await screen.findAllByText('Squat')
    expect(squatMatches.length).toBeGreaterThanOrEqual(1)
  })

  it('shows access denied for private program when not owner', async () => {
    const program = { id: 'prog2', title: 'Private', description: '', visibility: 'private', owner_id: 'owner2' }
    supabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'someone' } } })
    supabase.from = makeFromMock({ programs: [program], program_workouts: [], program_exercises: [] })

    render(
      <MemoryRouter initialEntries={["/programs/prog2"]}>
        <ProgramView />
      </MemoryRouter>
    )

    expect(await screen.findByText('Private')).toBeInTheDocument()
    expect(await screen.findByText(/You don’t have access to this private program/i)).toBeInTheDocument()
  })
})
