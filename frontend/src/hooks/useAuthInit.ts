/**
 * Hook d'initialisation de l'authentification
 */
import { useEffect, useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { api } from '../lib/api'

export function useAuthInit() {
  const [isInitialized, setIsInitialized] = useState(false)
  const { user, token, isAuthenticated, setAuth, logout } = useAuthStore()

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Vérifier si on a un token en localStorage
        const authData = localStorage.getItem('embassy-auth')
        if (!authData) {
          console.log('🔐 No auth data in localStorage')
          setIsInitialized(true)
          return
        }

        const parsed = JSON.parse(authData)
        const storedToken = parsed?.state?.token
        const storedUser = parsed?.state?.user

        if (!storedToken || !storedUser) {
          console.log('🔐 No valid token or user in localStorage')
          setIsInitialized(true)
          return
        }

        console.log('🔐 Found stored auth data:', { 
          user: storedUser.email, 
          role: storedUser.role,
          hasToken: !!storedToken 
        })

        // Vérifier si le token est encore valide
        try {
          const response = await api.get('/auth/user-info/')
          if (response.status === 200) {
            console.log('🔐 Token is valid, user is authenticated')
            // Le token est valide, on peut rester connecté
            setAuth(storedUser, storedToken, parsed?.state?.refreshToken || '')
          } else {
            console.log('🔐 Token is invalid, logging out')
            logout()
          }
        } catch (error) {
          console.log('🔐 Token validation failed:', error)
          // Le token n'est plus valide
          logout()
        }
      } catch (error) {
        console.error('🔐 Auth init error:', error)
        logout()
      } finally {
        setIsInitialized(true)
      }
    }

    initAuth()
  }, [setAuth, logout])

  return { isInitialized, isAuthenticated, user }
}
