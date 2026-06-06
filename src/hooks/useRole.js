import { useAuth } from './useAuth'
import { ROLES } from '../constants/roles'

/**
 * Hook to check the current user's role.
 * @returns {{ isAdmin: boolean, isManager: boolean, isVendor: boolean, role: string | null }}
 */
export function useRole() {
  const { user } = useAuth()
  return {
    isAdmin: user?.role === ROLES.ADMIN,
    isManager: user?.role === ROLES.MANAGER || user?.role === ROLES.ADMIN,
    isVendor: user?.role === ROLES.VENDOR,
    role: user?.role ?? null,
  }
}
