import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Shared mock for `src/supabase.js` — tests can import `{ supabase }` and
// adjust `supabase.auth.getUser` with `mockResolvedValueOnce` when needed.
const unsubscribe = vi.fn()

const getUser = vi.fn(async () => ({ data: { user: null } }))
const onAuthStateChange = vi.fn(() => ({ data: { subscription: { unsubscribe } } }))
const signOut = vi.fn(async () => ({}))

vi.mock('../src/supabase', () => ({
	supabase: {
		auth: {
			getUser,
			onAuthStateChange,
			signOut,
		},
	},
}))

// Optionally expose helpers for tests via global so tests can update defaults.
global.__SUPABASE_MOCKS__ = { getUser, onAuthStateChange, signOut, unsubscribe }
