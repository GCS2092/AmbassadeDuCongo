/**
 * Authentication Store using Zustand
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: number
  email: string
  first_name: string
  last_name: string
  role: string
  is_verified: boolean
  is_active?: boolean
  profile?: any
}

interface AuthState {
  user: User | null
  token: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  
  setAuth: (user: User, token: string, refreshToken: string) => void
  logout: () => void
  updateUser: (user: User) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      
      setAuth: (user, token, refreshToken) => {
        set({ user, token, refreshToken, isAuthenticated: true })
      },
      
      logout: () => {
        set({ user: null, token: null, refreshToken: null, isAuthenticated: false })
        setTimeout(() => {
          localStorage.removeItem('embassy-auth')
        }, 100)
      },
      
      updateUser: (user) => {
        set({ user })
      },
    }),
    {
      name: 'embassy-auth',
      storage: {
        getItem: (name) => {
          try {
            const value = localStorage.getItem(name)
            if (!value) return null
            return JSON.parse(value)
          } catch {
            return null
          }
        },
        setItem: (name, value) => {
          try {
            localStorage.setItem(name, JSON.stringify(value))
          } catch {}
        },
        removeItem: (name) => {
          try {
            localStorage.removeItem(name)
          } catch {}
        },
      },
      // Configuration pour mobile
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

