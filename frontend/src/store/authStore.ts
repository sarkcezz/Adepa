import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types'

interface AuthState {
  user: User | null
  token: string | null
  forcePasswordChange: boolean
  setAuth: (user: User, token: string, forcePasswordChange?: boolean) => void
  setUser: (user: User) => void
  clear: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      forcePasswordChange: false,
      setAuth: (user, token, forcePasswordChange = false) =>
        set({ user, token, forcePasswordChange }),
      setUser: (user) => set({ user }),
      clear: () => set({ user: null, token: null, forcePasswordChange: false }),
    }),
    { name: 'adepa-auth' },
  ),
)
