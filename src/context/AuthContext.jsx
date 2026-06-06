import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { authLogin, authGetProfile, authVerifyOtp } from '../services/auth.service'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('vb_token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('vb_token')
    if (!stored) {
      setLoading(false)
      return
    }

    let cancelled = false
    authGetProfile()
      .then((profile) => {
        if (cancelled) return
        setUser(profile)
        setToken(stored)
      })
      .catch(() => {
        if (cancelled) return
        localStorage.removeItem('vb_token')
        setUser(null)
        setToken(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [])

  const login = useCallback(async (email, password) => {
    const { user: loggedIn, token: jwt } = await authLogin({ email, password })
    localStorage.setItem('vb_token', jwt)
    setUser(loggedIn)
    setToken(jwt)
    return loggedIn
  }, [])

  const loginWithToken = useCallback(async (loggedIn, jwt) => {
    localStorage.setItem('vb_token', jwt)
    setUser(loggedIn)
    setToken(jwt)
    return loggedIn
  }, [])

  const verifyOtpLogin = useCallback(async (email, otp) => {
    const { user: loggedIn, token: jwt } = await authVerifyOtp({ email, otp, purpose: 'login' })
    return loginWithToken(loggedIn, jwt)
  }, [loginWithToken])

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
      loginWithToken,
      verifyOtpLogin,
      logout,
      isAuthenticated: !!user && !!token,
      loading,
    }),
    [user, token, login, loginWithToken, verifyOtpLogin, logout, loading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
