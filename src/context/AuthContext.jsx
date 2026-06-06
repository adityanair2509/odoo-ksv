import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { authLogin } from '../services/auth.service'

/** @type {React.Context<import('../types').AuthContextValue>} */
export const AuthContext = createContext(null)

/**
 * Provides authentication state and actions to the component tree.
 * @param {{ children: React.ReactNode }} props
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('vb_token'))
  const [loading, setLoading] = useState(true)

  // Rehydrate user from stored token on mount
  useEffect(() => {
    const stored = localStorage.getItem('vb_token')
    if (stored) {
      // Parse user from token (mock: extract from token string)
      const mockUsers = {
        'mock-jwt-token-u1': { id: 'u1', name: 'Admin User', email: 'admin@vendorbridge.in', role: 'admin' },
        'mock-jwt-token-u2': { id: 'u2', name: 'Priya Mehta', email: 'procurement@vendorbridge.in', role: 'procurement_officer' },
        'mock-jwt-token-u3': { id: 'u3', name: 'Rohit Agarwal', email: 'manager@vendorbridge.in', role: 'manager' },
        'mock-jwt-token-u4': { id: 'u4', name: 'Vendor Partner', email: 'vendor@vendorbridge.in', role: 'vendor' },
      }
      const rehydrated = mockUsers[stored]
      if (rehydrated) {
        setUser(rehydrated)
        setToken(stored)
      } else {
        localStorage.removeItem('vb_token')
        setToken(null)
      }
    }
    setLoading(false)
  }, [])

  /**
   * Log in with email and password.
   * @param {string} email
   * @param {string} password
   */
  const login = useCallback(async (email, password) => {
    const { user: loggedIn, token: jwt } = await authLogin({ email, password })
    localStorage.setItem('vb_token', jwt)
    setUser(loggedIn)
    setToken(jwt)
    return loggedIn
  }, [])

  /** Log out and clear stored state. */
  const logout = useCallback(() => {
    localStorage.removeItem('vb_token')
    setUser(null)
    setToken(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      token,
      login,
      logout,
      isAuthenticated: !!user && !!token,
      loading,
    }),
    [user, token, login, logout, loading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
