import { useContext } from 'react'
import { AuthContext } from '../context/AuthContext'

/**
 * Hook to access auth context values.
 * @returns {import('../types').AuthContextValue}
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
