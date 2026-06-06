import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { useRole } from './hooks/useRole'

/**
 * Wraps protected routes — redirects unauthenticated users to /login.
 * @param {{ fallback?: string }} props
 */
export function ProtectedRoute({ fallback = '/login' }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return null
  return isAuthenticated ? <Outlet /> : <Navigate to={fallback} replace />
}

/**
 * Redirects vendors away from restricted pages.
 * @param {{ allowVendor?: boolean }} props
 */
export function RoleGuard({ allowVendor = false }) {
  const { isVendor } = useRole()
  if (!allowVendor && isVendor) return <Navigate to="/dashboard" replace />
  return <Outlet />
}
