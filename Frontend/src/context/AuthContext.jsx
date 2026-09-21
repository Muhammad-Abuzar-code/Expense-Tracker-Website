import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { login as loginApi, register as registerApi, getCurrentUser } from '../api/auth'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sessionExpired, setSessionExpired] = useState(false)

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token')
      if (token) {
        try {
          const { data } = await getCurrentUser()
          setUser(data)
        } catch (error) {
          console.error('Failed to re-validate session:', error)
          localStorage.removeItem('token')
          setUser(null)
        }
      }
      setLoading(false)
    }

    initAuth()
  }, [])

  useEffect(() => {
    const onExpired = () => {
      setUser(current => {
        if (current) setSessionExpired(true)
        return null
      })
    }

    window.addEventListener('auth:expired', onExpired)
    return () => window.removeEventListener('auth:expired', onExpired)
  }, [])

  const login = async (email, password) => {
    const { data } = await loginApi({ email, password })
    localStorage.setItem('token', data.access_token)

    const userRes = await getCurrentUser()
    setUser(userRes.data)
    setSessionExpired(false)
  }

  const register = async (userData) => {
    await registerApi(userData)
    // Automatically log in after registration
    await login(userData.email, userData.password)
  }

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    setUser(null)
    setSessionExpired(false)
  }, [])

  const clearSessionExpired = useCallback(() => setSessionExpired(false), [])

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, sessionExpired, clearSessionExpired }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
