import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { useRole } from './hooks/useRole'

/**
 * Redirects unauthenticated users to /login.
 */
export function ProtectedRoute({ fallback = '/login' }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return null
  return isAuthenticated ? <Outlet /> : <Navigate to={fallback} replace />
}

/**
 * Guards a route to a specific set of allowed roles.
 * Redirects to /dashboard if the current user's role is not in the allowed list.
 * @param {{ roles: string[] }} props
 */
export function RoleGuard({ roles = [] }) {
  const { role } = useRole()
  if (roles.length > 0 && !roles.includes(role)) {
    return <Navigate to="/dashboard" replace />
  }
  return <Outlet />
}
