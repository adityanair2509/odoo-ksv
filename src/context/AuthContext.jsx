import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { authLogin, authGetProfile } from '../services/auth.service'

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

  // Rehydrate user from stored token on mount.
  // Real JWTs are validated by calling /auth/me; mock tokens (used in
  // VITE_USE_MOCK=true mode) are decoded locally.
  useEffect(() => {
    const stored = localStorage.getItem('vb_token')
    if (!stored) {
      setLoading(false)
      return
    }

    // Mock-token short-circuit: when running with VITE_USE_MOCK=true, the
    // auth service returns synthetic tokens like 'mock-jwt-token-u2'. Decode
    // them locally so the navbar role badge works without hitting the API.
    if (stored.startsWith('mock-jwt-token-')) {
      const mockUsers = {
        'mock-jwt-token-u1': { id: 'u1', name: 'Admin User', email: 'admin@vendorbridge.in', role: 'admin' },
        'mock-jwt-token-u2': { id: 'u2', name: 'Priya Mehta', email: 'priya@vendorbridge.in', role: 'procurement_officer' },
        'mock-jwt-token-u3': { id: 'u3', name: 'Rohit Agarwal', email: 'rohit@vendorbridge.in', role: 'manager' },
        'mock-jwt-token-v1': { id: 'v1', name: 'Rajesh Kumar', email: 'rajesh@infrasupplies.in', role: 'vendor' },
        'mock-jwt-token-u4': { id: 'v1', name: 'Rajesh Kumar', email: 'rajesh@infrasupplies.in', role: 'vendor' },
      }
      const rehydrated = mockUsers[stored]
      if (rehydrated) {
        setUser(rehydrated)
        setToken(stored)
      } else {
        localStorage.removeItem('vb_token')
        setToken(null)
      }
      setLoading(false)
      return
    }

    // Real JWT: ask the backend who this token belongs to.
    let cancelled = false
    authGetProfile()
      .then((profile) => {
        if (cancelled) return
        setUser(profile)
        setToken(stored)
      })
      .catch(() => {
        if (cancelled) return
        // Token rejected (expired, tampered, user deleted, etc.) — clear it
        // so the user is redirected to /login by <ProtectedRoute />.
        localStorage.removeItem('vb_token')
        setUser(null)
        setToken(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
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
